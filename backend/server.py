from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, case
import os
import logging
from pathlib import Path
from datetime import datetime,  timezone
from typing import List, Optional, cast
import csv
import io

from database import engine, get_db, Base
import models
import schemas
from auth import get_password_hash, verify_password, create_access_token, get_current_user

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

Base.metadata.create_all(bind=engine)

app = FastAPI()
api_router = APIRouter(prefix='/api')

@api_router.post('/auth/register', response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    db_username = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail='Username already taken')
    
    hashed_password = get_password_hash(user_in.password)
    db_user = models.User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 🔐 NON-EXPIRING TOKEN
    access_token = create_access_token(
        data={'sub': str(db_user.id)}
    )
    
    return {
        'access_token': access_token,
        'token_type': 'bearer',
        'user': db_user
    }

@api_router.post('/auth/login', response_model=schemas.Token)
async def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not db_user or not verify_password(user_in.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail='Incorrect email or password')
    
    # 🔐 NON-EXPIRING TOKEN
    access_token = create_access_token(
        data={'sub': str(db_user.id)}
    )
    
    return {
        'access_token': access_token,
        'token_type': 'bearer',
        'user': db_user
    }


@api_router.get('/auth/me', response_model=schemas.User)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@api_router.get('/users', response_model=List[schemas.User])
async def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    users = db.query(models.User).all()
    return users

@api_router.post('/labels', response_model=schemas.Label, status_code=status.HTTP_201_CREATED)
async def create_label(label_in: schemas.LabelCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_label = db.query(models.Label).filter(models.Label.name == label_in.name).first()
    if db_label:
        raise HTTPException(status_code=400, detail='Label already exists')
    
    db_label = models.Label(name=label_in.name, color=label_in.color)
    db.add(db_label)
    db.commit()
    db.refresh(db_label)
    return db_label

@api_router.get('/labels', response_model=List[schemas.Label])
async def list_labels(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    labels = db.query(models.Label).all()
    return labels

@api_router.post('/issues', response_model=schemas.Issue, status_code=status.HTTP_201_CREATED)
async def create_issue(issue_in: schemas.IssueCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_issue = models.Issue(
        title=issue_in.title,
        description=issue_in.description,
        status=issue_in.status,
        priority=issue_in.priority,
        creator_id=current_user.id,
        assignee_id=issue_in.assignee_id
    )
    
    if issue_in.label_ids:
        labels = db.query(models.Label).filter(models.Label.id.in_(issue_in.label_ids)).all()
        db_issue.labels = labels
    
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    
    history = models.IssueHistory(
        issue_id=db_issue.id,
        changed_by_id=current_user.id,
        change_type='created',
        new_value='Issue created'
    )
    db.add(history)
    db.commit()
    
    return db_issue

@api_router.get('/issues', response_model=List[schemas.Issue])
async def list_issues(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Issue)
    
    if status:
        query = query.filter(models.Issue.status == status)
    if priority:
        query = query.filter(models.Issue.priority == priority)
    if assignee_id:
        query = query.filter(models.Issue.assignee_id == assignee_id)
    
    issues = query.order_by(models.Issue.created_at.desc()).offset(skip).limit(limit).all()
    return issues

@api_router.get('/issues/{issue_id}', response_model=schemas.IssueDetail)
async def get_issue(issue_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail='Issue not found')
    return db_issue

@api_router.patch('/issues/{issue_id}', response_model=schemas.Issue)
async def update_issue(
    issue_id: int,
    issue_update: schemas.IssueUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail='Issue not found')
    
 

    current_version: Optional[int] = cast(Optional[int], db_issue.version)

    if current_version is not None and current_version != issue_update.version:
        raise HTTPException(
            status_code=409,
            detail=(
                f'Version conflict. Current version is {current_version}, '
                f'but you provided {issue_update.version}'
            )
        )


    
    update_data = issue_update.model_dump(exclude_unset=True, exclude={'version'})
    
    for field, value in update_data.items():
        old_value = getattr(db_issue, field)
        if old_value != value:
            setattr(db_issue, field, value)
            
            history = models.IssueHistory(
                issue_id=db_issue.id,
                changed_by_id=current_user.id,
                change_type='updated',
                field_name=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(value) if value is not None else None
            )
            db.add(history)
    
        resolved_at = db_issue.resolved_at

        if issue_update.status in ('resolved', 'closed') and resolved_at is None:
            setattr(db_issue, 'resolved_at', datetime.now(timezone.utc))

    
    setattr(db_issue, 'version', db_issue.version + 1)
    setattr(db_issue, 'updated_at', datetime.now(timezone.utc))
    db.commit()
    db.refresh(db_issue)
    return db_issue

@api_router.post('/issues/{issue_id}/comments', response_model=schemas.Comment, status_code=status.HTTP_201_CREATED)
async def add_comment(
    issue_id: int,
    comment_in: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail='Issue not found')
    
    db_comment = models.Comment(
        body=comment_in.body,
        issue_id=issue_id,
        author_id=current_user.id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    history = models.IssueHistory(
        issue_id=issue_id,
        changed_by_id=current_user.id,
        change_type='comment_added',
        new_value='Added comment'
    )
    db.add(history)
    db.commit()
    
    return db_comment

@api_router.put('/issues/{issue_id}/labels', response_model=schemas.Issue)
async def replace_labels(
    issue_id: int,
    label_ids: List[int],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail='Issue not found')
    
    old_labels = [label.name for label in db_issue.labels]
    
    labels = db.query(models.Label).filter(models.Label.id.in_(label_ids)).all()
    if len(labels) != len(label_ids):
        raise HTTPException(status_code=400, detail='One or more label IDs are invalid')
    
    db_issue.labels = labels
    db.commit()
    db.refresh(db_issue)
    
    new_labels = [label.name for label in db_issue.labels]
    history = models.IssueHistory(
        issue_id=issue_id,
        changed_by_id=current_user.id,
        change_type='labels_updated',
        field_name='labels',
        old_value=', '.join(old_labels) if old_labels else 'none',
        new_value=', '.join(new_labels) if new_labels else 'none'
    )
    db.add(history)
    db.commit()
    
    return db_issue

@api_router.post('/issues/bulk-status', response_model=dict)
async def bulk_update_status(
    bulk_update: schemas.BulkStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        issues = db.query(models.Issue).filter(models.Issue.id.in_(bulk_update.issue_ids)).all()
        
        if len(issues) != len(bulk_update.issue_ids):
            db.rollback()
            raise HTTPException(status_code=400, detail='One or more issue IDs are invalid')
        
        for issue in issues:
            old_status = issue.status
            setattr(issue, 'status', bulk_update.status)
            setattr(issue, 'version', issue.version + 1)
            setattr(issue, 'updated_at', datetime.now(timezone.utc))
            
            if bulk_update.status in ['resolved', 'closed'] and issue.resolved_at is None:
                setattr(issue, 'resolved_at', datetime.now(timezone.utc))
            
            history = models.IssueHistory(
                issue_id=issue.id,
                changed_by_id=current_user.id,
                change_type='bulk_status_update',
                field_name='status',
                old_value=old_status,
                new_value=bulk_update.status
            )
            db.add(history)
        
        db.commit()
        return {'updated': len(issues), 'status': bulk_update.status}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Bulk update failed: {str(e)}')

@api_router.post('/issues/import', response_model=schemas.CSVImportResult)
async def import_issues_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail='File must be a CSV')
    
    contents = await file.read()
    csv_file = io.StringIO(contents.decode('utf-8'))
    csv_reader = csv.DictReader(csv_file)
    
    total_rows = 0
    successful = 0
    failed = 0
    errors = []
    
    for row_num, row in enumerate(csv_reader, start=2):
        total_rows += 1
        try:
            title = row.get('title', '').strip()
            if not title:
                raise ValueError('Title is required')
            
            description = row.get('description', '').strip()
            status = row.get('status', 'open').strip()
            priority = row.get('priority', 'medium').strip()
            
            valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
            if status not in valid_statuses:
                raise ValueError(f'Invalid status. Must be one of {valid_statuses}')
            
            valid_priorities = ['low', 'medium', 'high', 'critical']
            if priority not in valid_priorities:
                raise ValueError(f'Invalid priority. Must be one of {valid_priorities}')
            
            assignee_id = None
            assignee_email = row.get('assignee_email', '').strip()
            if assignee_email:
                assignee = db.query(models.User).filter(models.User.email == assignee_email).first()
                if assignee:
                    assignee_id = assignee.id
            
            db_issue = models.Issue(
                title=title,
                description=description if description else None,
                status=status,
                priority=priority,
                creator_id=current_user.id,
                assignee_id=assignee_id
            )
            db.add(db_issue)
            db.flush()
            
            history = models.IssueHistory(
                issue_id=db_issue.id,
                changed_by_id=current_user.id,
                change_type='created',
                new_value='Issue created via CSV import'
            )
            db.add(history)
            
            successful += 1
        except Exception as e:
            failed += 1
            errors.append({
                'row': row_num,
                'data': row,
                'error': str(e)
            })
    
    if successful > 0:
        db.commit()
    else:
        db.rollback()
    
    return {
        'total_rows': total_rows,
        'successful': successful,
        'failed': failed,
        'errors': errors
    }

@api_router.get('/issues/{issue_id}/timeline', response_model=List[schemas.IssueHistoryItem])
async def get_issue_timeline(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail='Issue not found')
    
    history = db.query(models.IssueHistory).filter(
        models.IssueHistory.issue_id == issue_id
    ).order_by(models.IssueHistory.created_at.desc()).all()
    
    return history

@api_router.get('/reports/top-assignees', response_model=List[schemas.TopAssignee])
async def get_top_assignees(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = db.query(
        models.Issue.assignee_id,
        func.count(models.Issue.id).label('issue_count'),
        func.sum(case((models.Issue.status == 'open', 1), else_=0)).label('open'),
        func.sum(case((models.Issue.status == 'in_progress', 1), else_=0)).label('in_progress'),
        func.sum(case((models.Issue.status == 'resolved', 1), else_=0)).label('resolved'),
        func.sum(case((models.Issue.status == 'closed', 1), else_=0)).label('closed')
    ).filter(
        models.Issue.assignee_id.isnot(None)
    ).group_by(
        models.Issue.assignee_id
    ).order_by(
        func.count(models.Issue.id).desc()
    ).limit(limit).all()
    
    top_assignees = []
    for result in results:
        assignee = db.query(models.User).filter(models.User.id == result.assignee_id).first()
        top_assignees.append({
            'assignee': assignee,
            'issue_count': result.issue_count,
            'by_status': {
                'open': result.open or 0,
                'in_progress': result.in_progress or 0,
                'resolved': result.resolved or 0,
                'closed': result.closed or 0
            }
        })
    
    return top_assignees

@api_router.get('/reports/resolution-time', response_model=schemas.ResolutionStats)
async def get_resolution_time(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resolved_issues = db.query(models.Issue).filter(
        models.Issue.resolved_at.isnot(None)
    ).all()
    
    if not resolved_issues:
        return {
            'total_resolved': 0,
            'average_resolution_hours': 0,
            'by_priority': {}
        }
    
    total_hours = 0
    priority_stats = {'low': [], 'medium': [], 'high': [], 'critical': []}
    
    for issue in resolved_issues:
        resolution_time = (issue.resolved_at - issue.created_at).total_seconds() / 3600
        total_hours += resolution_time
        priority = str(issue.priority)
        if priority in priority_stats:
            priority_stats[priority].append(resolution_time)
    
    avg_by_priority = {}
    for priority, times in priority_stats.items():
        if times:
            avg_by_priority[priority] = round(sum(times) / len(times), 2)
        else:
            avg_by_priority[priority] = 0
    
    return {
        'total_resolved': len(resolved_issues),
        'average_resolution_hours': round(total_hours / len(resolved_issues), 2),
        'by_priority': avg_by_priority
    }

@api_router.get('/stats/dashboard')
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    total_issues = db.query(func.count(models.Issue.id)).scalar()
    
    status_counts = db.query(
        models.Issue.status,
        func.count(models.Issue.id)
    ).group_by(models.Issue.status).all()
    
    priority_counts = db.query(
        models.Issue.priority,
        func.count(models.Issue.id)
    ).group_by(models.Issue.priority).all()
    
    recent_issues = db.query(models.Issue).order_by(
        models.Issue.created_at.desc()
    ).limit(5).all()
    
    return {
        'total_issues': total_issues,
        'by_status': {status: count for status, count in status_counts},
        'by_priority': {priority: count for priority, count in priority_counts},
        'recent_issues': [schemas.Issue.model_validate(issue) for issue in recent_issues]
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)