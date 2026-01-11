from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

issue_labels = Table(
    'issue_labels',
    Base.metadata,
    Column('issue_id', Integer, ForeignKey('issues.id', ondelete='CASCADE'), primary_key=True),
    Column('label_id', Integer, ForeignKey('labels.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    issues_created = relationship('Issue', foreign_keys='Issue.creator_id', back_populates='creator')
    issues_assigned = relationship('Issue', foreign_keys='Issue.assignee_id', back_populates='assignee')
    comments = relationship('Comment', back_populates='author')

class Label(Base):
    __tablename__ = 'labels'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    color = Column(String(7), default='#gray')
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    issues = relationship('Issue', secondary=issue_labels, back_populates='labels')

class Issue(Base):
    __tablename__ = 'issues'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    status = Column(String(50), nullable=False, default='open', index=True)
    priority = Column(String(50), default='medium', index=True)
    version = Column(Integer, default=1, nullable=False)
    
    creator_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), index=True)
    assignee_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), index=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    creator = relationship('User', foreign_keys=[creator_id], back_populates='issues_created')
    assignee = relationship('User', foreign_keys=[assignee_id], back_populates='issues_assigned')
    comments = relationship('Comment', back_populates='issue', cascade='all, delete-orphan')
    labels = relationship('Label', secondary=issue_labels, back_populates='issues')
    history = relationship('IssueHistory', back_populates='issue', cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('idx_status_priority', 'status', 'priority'),
        Index('idx_assignee_status', 'assignee_id', 'status'),
    )

class Comment(Base):
    __tablename__ = 'comments'
    
    id = Column(Integer, primary_key=True, index=True)
    body = Column(Text, nullable=False)
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    issue = relationship('Issue', back_populates='comments')
    author = relationship('User', back_populates='comments')

class IssueHistory(Base):
    __tablename__ = 'issue_history'
    
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey('issues.id', ondelete='CASCADE'), nullable=False, index=True)
    changed_by_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'))
    change_type = Column(String(50), nullable=False)
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    issue = relationship('Issue', back_populates='history')
    changed_by = relationship('User')