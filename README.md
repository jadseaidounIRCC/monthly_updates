# Monthly Updates System

A comprehensive monthly reporting system for project management with database backend and comment threading capabilities.

## Overview

This system manages monthly project reports with a 15th-to-15th reporting period cycle. It includes features for project tracking, benefits analysis, risk management, and collaborative commenting.

## Architecture

- **Frontend**: Vanilla JavaScript with existing localStorage functionality
- **Backend**: Node.js with Express.js API server  
- **Database**: MySQL with Azure support
- **Deployment**: Azure-ready configuration


## API Documentation

### Health Check
```
GET /api/health
```

### Projects
```
GET    /api/projects              # List all projects
POST   /api/projects              # Create new project
GET    /api/projects/:id          # Get project by ID
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project
GET    /api/projects/:id/summary  # Get project summary
```

### Migration
```
POST   /api/projects/migrate      # Migrate from localStorage
```

### Users
```
GET    /api/users                 # List all users
POST   /api/users                 # Create new user
GET    /api/users/:id             # Get user by ID
PUT    /api/users/:id             # Update user
DELETE /api/users/:id             # Delete user
POST   /api/users/bulk            # Create multiple users
GET    /api/users/summary         # Get user statistics
POST   /api/users/:id/activate    # Activate user
POST   /api/users/:id/deactivate  # Deactivate user
```

### Reporting Periods
```
GET    /api/periods/project/:id   # Get project periods
GET    /api/periods/current/:id   # Get current period
POST   /api/periods/:id/lock      # Lock period
GET    /api/periods/calculate     # Calculate period dates
```

### Comments
```
GET    /api/comments/field/:projectId/:periodId/:field  # Get field comments
POST   /api/comments              # Create comment
PUT    /api/comments/:id          # Update comment
DELETE /api/comments/:id          # Delete comment
GET    /api/comments/unresolved   # Get unresolved comments
```

## Reporting Periods

The system uses a **15th-to-15th monthly cycle**:
- July 15 - August 15 = "August 2025" reporting period
- Periods automatically lock and become immutable after the end date
- New periods inherit data from the previous period

## Development Workflow

1. **Database Changes**: Update models in `server/src/models/`
2. **API Changes**: Update routes in `server/src/routes/`
3. **Frontend Changes**: Update components in `js/components/`
4. **Testing**: Use built-in health checks and API validation



### Local Testing
```bash
# Start server
cd server && npm run dev

# Test API
curl http://localhost:3002/api/health
```
