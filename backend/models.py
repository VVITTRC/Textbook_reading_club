from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    private_notes = relationship("PrivateNote", back_populates="user")
    public_notes = relationship("PublicNote", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
    cohort_memberships = relationship("CohortMember", back_populates="user")

class Cohort(Base):
    __tablename__ = "cohorts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    pdf_filename = Column(String)
    pdf_path = Column(String)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    members = relationship("CohortMember", back_populates="cohort")
    private_notes = relationship("PrivateNote", back_populates="cohort")
    public_notes = relationship("PublicNote", back_populates="cohort")
    chat_messages = relationship("ChatMessage", back_populates="cohort")

class CohortMember(Base):
    __tablename__ = "cohort_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cohort_id = Column(Integer, ForeignKey("cohorts.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="cohort_memberships")
    cohort = relationship("Cohort", back_populates="members")

class PrivateNote(Base):
    __tablename__ = "private_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cohort_id = Column(Integer, ForeignKey("cohorts.id"))
    document_id = Column(String, index=True)
    content = Column(Text)
    highlight_data = Column(Text)
    page_number = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="private_notes")
    cohort = relationship("Cohort", back_populates="private_notes")

class PublicNote(Base):
    __tablename__ = "public_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cohort_id = Column(Integer, ForeignKey("cohorts.id"))
    document_id = Column(String, index=True)
    content = Column(Text)
    highlight_data = Column(Text)
    page_number = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="public_notes")
    cohort = relationship("Cohort", back_populates="public_notes")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cohort_id = Column(Integer, ForeignKey("cohorts.id"))
    document_id = Column(String, index=True)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="chat_messages")
    cohort = relationship("Cohort", back_populates="chat_messages")