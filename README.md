# Issue Tracker API

A comprehensive issue tracking system built with FastAPI (Python), PostgreSQL, and React. This application allows teams to manage issues, comments, labels with advanced features like optimistic concurrency control, bulk operations, CSV import, and detailed analytics.

## Features

### Core Functionality
- **Issue Management**: Full CRUD operations with versioning for optimistic concurrency control
- **Comments**: Add comments to issues with author validation
- **Labels**: Unique labels that can be assigned to issues
- **Bulk Operations**: Transactional bulk status updates with automatic rollback on errors
- **CSV Import**: Upload CSV files for bulk issue creation with validation and error reporting
- **Reports**: Analytics dashboard with top assignees and average resolution time metrics
- **Timeline**: Complete issue history tracking all changes

### Technical Highlights
- **Optimistic Concurrency Control**: Version-based conflict detection for issue updates
- **Transaction Safety**: Atomic operations for bulk updates with rollback on failure
- **JWT Authentication**: Secure user authentication with token-based access
- **Database Indexing**: Optimized queries with strategic indexes
- **Professional UI**: Clean, corporate dashboard design following best practices

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Relational database with ACID compliance
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **Python-JOSE**: JWT token handling
- **Passlib**: Password hashing with bcrypt

### Frontend
- **React**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Component library
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **React Router**: Client-side routing

## Setup Instructions

### Prerequisites
- Python 3.9+
- PostgreSQL 15+
- Node.js 18+ and Yarn
- Git

### Backend Setup

1. **Install PostgreSQL** (if not already installed):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

2. **Start PostgreSQL and create database**:
```bash
sudo pg_ctlcluster 15 main start
sudo -u postgres psql -c "CREATE DATABASE issue_tracker;"
sudo -u postgres psql -c "CREATE USER issue_user WITH PASSWORD 'issue_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE issue_tracker TO issue_user;"
```

3. **Install Python dependencies**:
```bash
cd /app/backend
pip install -r requirements.txt
```

4. **Configure environment variables**:
Create or verify `/app/backend/.env`:
```env
DATABASE_URL=postgresql://issue_user:issue_pass@localhost/issue_tracker
SECRET_KEY=your-secret-key-change-in-production-09876543210987654321
ALGORITHM=HS256
CORS_ORIGINS=*
```

5. **Start the backend**:
```bash
uvicorn server:app --host 0.0.0.0 --port 5000 --reload
```

### Frontend Setup

1. **Install dependencies**:
```bash
cd /app/frontend
yarn install
```

2. **Configure environment variables**:
Verify `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

3. **Start the frontend**:
```bash
yarn start
```

The application will be available at `http://localhost:3000`

## Database Schema

### Tables

#### users
- `id`: Primary key
- `email`: Unique, indexed
- `username`: Unique, indexed
- `hashed_password`: Bcrypt hashed
- `full_name`: Optional
- `created_at`: Timestamp with timezone

#### issues
- `id`: Primary key
- `title`: Required (max 500 chars)
- `description`: Text (optional)
- `status`: Enum (open, in_progress, resolved, closed) - indexed
- `priority`: Enum (low, medium, high, critical) - indexed
- `version`: Integer for optimistic locking
- `creator_id`: Foreign key to users
- `assignee_id`: Foreign key to users (indexed)
- `created_at`: Timestamp (indexed)
- `updated_at`: Timestamp
- `resolved_at`: Timestamp (nullable)
- **Composite indexes**: (status, priority), (assignee_id, status)

#### comments
- `id`: Primary key
- `body`: Text, required
- `issue_id`: Foreign key to issues (indexed)
- `author_id`: Foreign key to users (indexed)
- `created_at`: Timestamp
- `updated_at`: Timestamp

#### labels
- `id`: Primary key
- `name`: Unique, indexed
- `color`: Hex color code
- `created_at`: Timestamp

#### issue_labels
- `issue_id`: Foreign key to issues (composite primary key)
- `label_id`: Foreign key to labels (composite primary key)

#### issue_history
- `id`: Primary key
- `issue_id`: Foreign key to issues (indexed)
- `changed_by_id`: Foreign key to users
- `change_type`: String (created, updated, comment_added, etc.)
- `field_name`: String (optional)
- `old_value`: Text (optional)
- `new_value`: Text (optional)
- `created_at`: Timestamp (indexed)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - List all users

### Issues
- `POST /api/issues` - Create new issue
- `GET /api/issues` - List issues (with filtering and pagination)
  - Query params: `status`, `priority`, `assignee_id`, `skip`, `limit`
- `GET /api/issues/{id}` - Get issue with comments and labels
- `PATCH /api/issues/{id}` - Update issue (with version check)
- `POST /api/issues/{id}/comments` - Add comment
- `PUT /api/issues/{id}/labels` - Replace labels atomically
- `GET /api/issues/{id}/timeline` - Get issue history

### Bulk Operations
- `POST /api/issues/bulk-status` - Bulk status update (transactional)

### CSV Import
- `POST /api/issues/import` - Upload CSV for issue import

### Reports
- `GET /api/reports/top-assignees` - Get top assignees with issue counts
- `GET /api/reports/resolution-time` - Get average resolution time
- `GET /api/stats/dashboard` - Get dashboard statistics

### Labels
- `POST /api/labels` - Create new label
- `GET /api/labels` - List all labels

## CSV Import Format

The CSV import expects the following columns:

| Column | Required | Valid Values | Description |
|--------|----------|--------------|-------------|
| title | Yes | Any string | Issue title |
| description | No | Any string | Issue description |
| status | No | open, in_progress, resolved, closed | Default: open |
| priority | No | low, medium, high, critical | Default: medium |
| assignee_email | No | Valid user email | Must match existing user |

### Example CSV:
```csv
title,description,status,priority,assignee_email
Fix login bug,Users unable to login with special characters,open,high,john@example.com
Update documentation,API docs need updating,in_progress,low,jane@example.com
Performance issue,Dashboard loading slowly,open,critical,
```

## Key Features Explained

### Optimistic Concurrency Control
Each issue has a `version` field that increments with every update. When updating an issue, the client must provide the current version. If the version doesn't match (someone else updated it), the request fails with a 409 Conflict error.

Example:
```python
# Client reads issue (version: 5)
issue = GET /issues/123  # version: 5

# Client attempts update
PATCH /issues/123
{
  "title": "Updated title",
  "version": 5  # Must match current version
}
```

### Transactional Bulk Updates
Bulk status updates are wrapped in a database transaction. If any issue update fails (e.g., invalid issue ID), the entire operation rolls back, ensuring data consistency.

### CSV Validation
The CSV import validates each row before importing:
- Title is required
- Status must be valid enum value
- Priority must be valid enum value
- Assignee email must match existing user
- Provides detailed error report for failed rows

## Testing

### Backend Testing
```bash
cd /app/backend
pytest
```

### Frontend Testing
```bash
cd /app/frontend
yarn test
```

### Manual Testing with cURL

**Register a user:**
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"testpass123","full_name":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

**Create an issue:**
```bash
curl -X POST http://localhost:8001/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test issue","description":"Test description","status":"open","priority":"high"}'
```

**List issues:**
```bash
curl http://localhost:8001/api/issues \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Production Deployment

### Environment Variables
Update the following for production:
- `SECRET_KEY`: Generate a secure random key
- `DATABASE_URL`: Use production PostgreSQL credentials
- `CORS_ORIGINS`: Restrict to your frontend domain


### Security Considerations
- Change default database password
- Use HTTPS in production
- Enable rate limiting
- Set up database backups
- Use environment-specific configurations
- Enable database connection pooling
- Set up monitoring and logging

### Database Migrations
When making schema changes, use Alembic:
```bash
cd /app/backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Architecture Decisions

### Why PostgreSQL?
- ACID compliance for transaction safety
- Excellent support for complex queries
- Robust indexing capabilities
- Native support for JSON data types
- Well-tested with SQLAlchemy

### Why FastAPI?
- Automatic API documentation (Swagger/OpenAPI)
- Type hints for better code quality
- Excellent performance
- Built-in validation with Pydantic
- Async support

### Why React + Tailwind?
- Component-based architecture
- Large ecosystem
- Tailwind for rapid UI development
- Shadcn/UI for consistent components
- Easy to maintain and extend

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues, questions, or contributions, please open an issue on the repository.
