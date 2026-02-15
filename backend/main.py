from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
import bcrypt
import json
import os
import shutil

from database import engine, get_db, Base
import models
import schemas

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VVIT TR Club API")

# Password hashing functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Create uploads directory for PDFs
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "VVIT TR Club API is running!"}

# ============= USER ENDPOINTS =============
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create user with hashed password
    db_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role=models.UserRole.ADMIN if user.role == "admin" else models.UserRole.USER
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login/", response_model=schemas.User)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # Find user by username
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return user

@app.get("/users/", response_model=List[schemas.User])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============= COHORT ENDPOINTS =============
@app.post("/cohorts/", response_model=schemas.Cohort)
def create_cohort(cohort: schemas.CohortCreate, db: Session = Depends(get_db)):
    # Check if user is admin
    user = db.query(models.User).filter(models.User.id == cohort.created_by).first()
    if not user or user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create cohorts")
    
    db_cohort = models.Cohort(**cohort.dict())
    db.add(db_cohort)
    db.commit()
    db.refresh(db_cohort)
    return db_cohort

@app.get("/cohorts/", response_model=List[schemas.Cohort])
def get_cohorts(db: Session = Depends(get_db)):
    cohorts = db.query(models.Cohort).filter(models.Cohort.is_active == True).all()
    return cohorts

@app.get("/cohorts/{cohort_id}", response_model=schemas.Cohort)
def get_cohort(cohort_id: int, db: Session = Depends(get_db)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    return cohort

@app.post("/cohorts/{cohort_id}/upload-pdf")
async def upload_cohort_pdf(
    cohort_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify cohort exists
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"cohort_{cohort_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update cohort with PDF info
    cohort.pdf_filename = file.filename
    cohort.pdf_path = file_path
    db.commit()
    
    return {"filename": file.filename, "path": f"/uploads/cohort_{cohort_id}_{file.filename}"}

# ============= COHORT MEMBER ENDPOINTS =============
@app.post("/cohort-members/", response_model=schemas.CohortMember)
def add_cohort_member(member: schemas.CohortMemberCreate, db: Session = Depends(get_db)):
    # Check if already a member
    existing = db.query(models.CohortMember).filter(
        models.CohortMember.user_id == member.user_id,
        models.CohortMember.cohort_id == member.cohort_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this cohort")
    
    db_member = models.CohortMember(**member.dict())
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@app.get("/cohort-members/user/{user_id}")
def get_user_cohorts(user_id: int, db: Session = Depends(get_db)):
    memberships = db.query(models.CohortMember).filter(
        models.CohortMember.user_id == user_id
    ).all()
    
    cohort_ids = [m.cohort_id for m in memberships]
    cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
    return cohorts

@app.get("/cohort-members/cohort/{cohort_id}")
def get_cohort_members(cohort_id: int, db: Session = Depends(get_db)):
    memberships = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).all()
    
    user_ids = [m.user_id for m in memberships]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()
    return users

# ============= PRIVATE NOTES ENDPOINTS =============
@app.post("/private-notes/", response_model=schemas.PrivateNote)
def create_private_note(note: schemas.PrivateNoteCreate, db: Session = Depends(get_db)):
    db_note = models.PrivateNote(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.get("/private-notes/user/{user_id}/cohort/{cohort_id}", response_model=List[schemas.PrivateNote])
def get_private_notes(user_id: int, cohort_id: int, db: Session = Depends(get_db)):
    notes = db.query(models.PrivateNote).filter(
        models.PrivateNote.user_id == user_id,
        models.PrivateNote.cohort_id == cohort_id
    ).all()
    return notes

# ============= PUBLIC NOTES ENDPOINTS =============
@app.post("/public-notes/", response_model=schemas.PublicNote)
def create_public_note(note: schemas.PublicNoteCreate, db: Session = Depends(get_db)):
    db_note = models.PublicNote(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.get("/public-notes/cohort/{cohort_id}", response_model=List[schemas.PublicNote])
def get_public_notes(cohort_id: int, db: Session = Depends(get_db)):
    notes = db.query(models.PublicNote).filter(
        models.PublicNote.cohort_id == cohort_id
    ).all()
    return notes

# ============= CHAT MESSAGES ENDPOINTS =============
@app.post("/chat-messages/", response_model=schemas.ChatMessage)
def create_chat_message(message: schemas.ChatMessageCreate, db: Session = Depends(get_db)):
    db_message = models.ChatMessage(**message.dict())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@app.get("/chat-messages/cohort/{cohort_id}", response_model=List[schemas.ChatMessage])
def get_chat_messages(cohort_id: int, db: Session = Depends(get_db)):
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.cohort_id == cohort_id
    ).all()
    return messages

# ============= ADMIN ENDPOINTS =============
@app.get("/admin/stats")
def get_admin_stats(user_id: int, db: Session = Depends(get_db)):
    # Verify admin
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "total_users": db.query(models.User).count(),
        "total_cohorts": db.query(models.Cohort).count(),
        "total_notes": db.query(models.PrivateNote).count() + db.query(models.PublicNote).count(),
        "total_messages": db.query(models.ChatMessage).count(),
    }

@app.get("/admin/cohorts/{cohort_id}/activity")
def get_cohort_activity(cohort_id: int, user_id: int, db: Session = Depends(get_db)):
    # Verify admin
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    members = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id
    ).count()
    
    notes = db.query(models.PublicNote).filter(
        models.PublicNote.cohort_id == cohort_id
    ).count()
    
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.cohort_id == cohort_id
    ).count()
    
    return {
        "cohort_id": cohort_id,
        "members": members,
        "notes": notes,
        "messages": messages
    }

# WebSocket endpoint
@app.websocket("/ws/chat/{cohort_id}")
async def websocket_chat(websocket: WebSocket, cohort_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            await manager.broadcast(json.dumps({
                "user_id": message_data["user_id"],
                "message": message_data["message"],
                "cohort_id": cohort_id
            }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)