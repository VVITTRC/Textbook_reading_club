from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Cohort Schemas
class CohortBase(BaseModel):
    name: str
    description: Optional[str] = None

class CohortCreate(CohortBase):
    created_by: int

class Cohort(CohortBase):
    id: int
    pdf_filename: Optional[str] = None
    pdf_path: Optional[str] = None
    created_by: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Cohort Member Schemas
class CohortMemberCreate(BaseModel):
    user_id: int
    cohort_id: int

class CohortMember(BaseModel):
    id: int
    user_id: int
    cohort_id: int
    joined_at: datetime
    
    class Config:
        from_attributes = True

# Private Note Schemas
class PrivateNoteBase(BaseModel):
    cohort_id: int
    document_id: str
    content: str
    highlight_data: Optional[str] = None
    page_number: int

class PrivateNoteCreate(PrivateNoteBase):
    user_id: int

class PrivateNote(PrivateNoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Public Note Schemas
class PublicNoteBase(BaseModel):
    cohort_id: int
    document_id: str
    content: str
    highlight_data: Optional[str] = None
    page_number: int

class PublicNoteCreate(PublicNoteBase):
    user_id: int

class PublicNote(PublicNoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Chat Message Schemas
class ChatMessageBase(BaseModel):
    cohort_id: int
    document_id: str
    message: str

class ChatMessageCreate(ChatMessageBase):
    user_id: int

class ChatMessage(ChatMessageBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True