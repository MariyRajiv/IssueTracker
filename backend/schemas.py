from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class LabelCreate(BaseModel):
    name: str
    color: Optional[str] = '#6b7280'

class Label(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    body: str
    
    @field_validator('body')
    def body_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Comment body cannot be empty')
        return v

class Comment(BaseModel):
    id: int
    body: str
    author: Optional[User] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = 'open'
    priority: str = 'medium'
    assignee_id: Optional[int] = None
    label_ids: Optional[List[int]] = []
    
    @field_validator('title')
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v
    
    @field_validator('status')
    def validate_status(cls, v):
        valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of {valid_statuses}')
        return v
    
    @field_validator('priority')
    def validate_priority(cls, v):
        valid_priorities = ['low', 'medium', 'high', 'critical']
        if v not in valid_priorities:
            raise ValueError(f'Priority must be one of {valid_priorities}')
        return v

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    version: int
    
    @field_validator('status')
    def validate_status(cls, v):
        if v is not None:
            valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
            if v not in valid_statuses:
                raise ValueError(f'Status must be one of {valid_statuses}')
        return v
    
    @field_validator('priority')
    def validate_priority(cls, v):
        if v is not None:
            valid_priorities = ['low', 'medium', 'high', 'critical']
            if v not in valid_priorities:
                raise ValueError(f'Priority must be one of {valid_priorities}')
        return v

class Issue(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    version: int
    creator: Optional[User] = None
    assignee: Optional[User] = None
    labels: List[Label] = []
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class IssueDetail(Issue):
    comments: List[Comment] = []

class BulkStatusUpdate(BaseModel):
    issue_ids: List[int]
    status: str
    
    @field_validator('status')
    def validate_status(cls, v):
        valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of {valid_statuses}')
        return v

class IssueHistoryItem(BaseModel):
    id: int
    change_type: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: Optional[User] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class CSVImportResult(BaseModel):
    total_rows: int
    successful: int
    failed: int
    errors: List[dict]

class TopAssignee(BaseModel):
    assignee: Optional[User] = None
    issue_count: int
    by_status: dict

class ResolutionStats(BaseModel):
    total_resolved: int
    average_resolution_hours: float
    by_priority: dict