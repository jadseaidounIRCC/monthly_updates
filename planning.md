# Monthly Updates System - Implementation Plan

## Current State Analysis

### Strengths Identified
- ✅ **Well-architected frontend**: Class-based structure with proper separation of concerns
- ✅ **Reporting period logic**: Already implemented (15th to 15th monthly periods)
- ✅ **Comprehensive data model**: Projects, benefits tracking, next steps, risks, updates
- ✅ **Validation & error handling**: Proper data validation throughout
- ✅ **Import/export functionality**: JSON-based data portability
- ✅ **Theme system**: Dark/light mode support

### Current Architecture
- `MonthlyUpdatesApp` (main controller)
- `DataManager` (data operations)
- `Project` & `NextStep` (data models)
- `Storage` (localStorage wrapper)
- `ProjectManager` (project-specific operations)

### Technology Stack (Current)
- **Frontend**: Vanilla JavaScript (ES6 classes)
- **Storage**: localStorage
- **UI**: Custom CSS with Lucide icons
- **Architecture**: Component-based with clear separation

## Requirements Analysis

### Core Requirements
1. **MySQL Database Integration**: Migrate from localStorage to `monthly_updates` MySQL database
2. **Comments System**: Sticky note icons next to each field opening comment threads
3. **Comment Features**: Text, author name, date tracking, delete functionality
4. **Historical Data Preservation**: Immutable reporting periods after 15th of each month
5. **Month/Year Filtering**: View historical reporting periods
6. **Summary View**: Cross-project overview dashboard

### Additional Requirements (From User Instructions)
- Proper audit logging via `auditService.logActivity()`
- Replace `console.log` with structured logging via `logger.[level]()`
- Redis/Valkey GLIDE caching for database operations
- Multi-tenant isolation (future-proofing)
- Subscription enforcement checks
- Modularized code architecture
- No hardcoded values or mock data

## Technology Stack Decisions

### Backend Framework
**Choice**: Node.js with Express.js
**Rationale**: 
- Aligns with existing JavaScript knowledge
- Mature ecosystem with extensive middleware
- Excellent MySQL integration options
- Easy deployment to Azure

### Database & Caching
- **Primary Database**: MySQL 8.0+ (`monthly_updates` database)
- **Cache Layer**: Redis/Valkey GLIDE
- **ORM**: Sequelize (migration support, MySQL compatibility)

### Authentication & Security
- **Authentication**: JWT-based tokens
- **Authorization**: Role-based access control (RBAC)
- **Security**: Helmet.js, CORS, rate limiting

### Additional Technologies
- **Logging**: Winston with structured logging
- **Validation**: Joi for request validation
- **Testing**: Jest for unit tests, Supertest for API testing
- **Documentation**: OpenAPI/Swagger

## Database Schema Design

### Core Tables

#### users
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100),
    role ENUM('admin', 'manager', 'contributor') DEFAULT 'contributor',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_department (department),
    INDEX idx_role (role)
);
```

#### projects
```sql
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    business_lead VARCHAR(255),
    initiator VARCHAR(255),
    dev_team_lead VARCHAR(255),
    project_start_date DATE,
    current_project_stage ENUM('prototype', 'poc', 'pilot'),
    current_ai_stage ENUM('planning-design', 'data-collection', 'model-building', 'testing-validation', 'deployment', 'monitoring'),
    target_next_stage_date DATE,
    target_completion_date DATE,
    budget VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
);
```

#### reporting_periods
```sql
CREATE TABLE reporting_periods (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_name VARCHAR(50) NOT NULL, -- "August 2024"
    is_locked BOOLEAN DEFAULT FALSE,
    data_snapshot JSON, -- Immutable snapshot when locked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_period (project_id, period_start),
    INDEX idx_period_dates (period_start, period_end),
    UNIQUE KEY unique_project_period (project_id, period_start, period_end)
);
```

#### project_data
```sql
CREATE TABLE project_data (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    period_id VARCHAR(36) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE,
    INDEX idx_project_data (project_id, period_id, field_name),
    UNIQUE KEY unique_project_field_period (project_id, period_id, field_name)
);
```

#### comments
```sql
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    period_id VARCHAR(36) NOT NULL,
    field_reference VARCHAR(100) NOT NULL, -- e.g., 'description', 'benefits.fteSavings', 'nextSteps.{stepId}'
    parent_comment_id VARCHAR(36) NULL, -- For threaded comments
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_field_comments (project_id, period_id, field_reference),
    INDEX idx_comment_thread (parent_comment_id)
);
```

#### next_steps
```sql
CREATE TABLE next_steps (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    period_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    owner VARCHAR(255) NOT NULL,
    due_date DATE,
    status ENUM('not-started', 'in-progress', 'ongoing', 'blocked', 'completed') DEFAULT 'not-started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (period_id) REFERENCES reporting_periods(id) ON DELETE CASCADE,
    INDEX idx_project_steps (project_id, period_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    changes JSON,
    user_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_action_date (action, created_at),
    INDEX idx_user_audit (user_id, created_at)
);
```

## Implementation Phases

### Phase 1: Backend Foundation & Database Setup
**Timeline**: 3-5 days
**Priority**: Critical

#### Phase 1A: Project Structure & Dependencies
**Deliverables**:
- `/server/package.json` with dependencies
- `/server/src/app.js` - Express application setup
- `/server/src/config/database.js` - MySQL connection
- `/server/src/config/logger.js` - Winston logging setup
- `/server/src/config/redis.js` - Redis/Valkey connection

**Dependencies**:
```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.0",
  "sequelize": "^6.32.1",
  "redis": "^4.6.7",
  "winston": "^3.10.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "joi": "^17.9.2",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.0",
  "express-rate-limit": "^6.10.0"
}
```

#### Phase 1B: Database Models & Migrations
**Deliverables**:
- Sequelize models for all tables (Project, ReportingPeriod, NextStep, Comment, User)
- User model for assignment and tracking (no authentication)
- Database migration scripts (instead of auto-sync)
- Seed data for development
- Connection testing utilities
- Disable auto-sync behavior in production

#### Phase 1C: Basic API Structure
**Deliverables**:
- Project CRUD endpoints
- Request validation middleware
- Error handling middleware
- Basic authentication middleware

**API Endpoints**:
```
GET    /api/projects              # List all projects
POST   /api/projects              # Create new project
GET    /api/projects/:id          # Get project by ID
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project

GET    /api/projects/:id/periods  # Get project reporting periods
POST   /api/projects/:id/periods  # Create new reporting period
GET    /api/periods/:id           # Get specific period data
PUT    /api/periods/:id           # Update period data (if not locked)
```

### Phase 2: Comments System Implementation
**Timeline**: 4-6 days
**Priority**: High

#### Phase 2A: Comments Backend API ✅ **COMPLETED**
**Deliverables**:
- [x] Comments CRUD endpoints ✅
- [x] Thread support for nested comments ✅
- [x] Comment validation and sanitization ✅
- [x] ReportingPeriod model with locking mechanism ✅
- [x] NextStep model with status tracking ✅
- [x] Full model associations and database setup ✅

**API Endpoints**:
```
GET    /api/comments?project_id=X&period_id=Y&field=Z  # Get field comments
POST   /api/comments                                    # Create new comment
PUT    /api/comments/:id                                # Edit comment
DELETE /api/comments/:id                                # Delete comment
GET    /api/comments/:id/thread                         # Get comment thread
```

#### Phase 2B: Comments Frontend Integration
**Deliverables**:
- Sticky note icons next to each form field
- Comment thread modal component
- Real-time comment updates
- Comment management (edit/delete permissions)

**UI Components**:
- `CommentIcon` component (sticky note icon)
- `CommentModal` component (thread display)
- `CommentForm` component (add/edit comments)
- `CommentThread` component (nested comments)

### Phase 3: Historical Data Preservation
**Timeline**: 5-7 days
**Priority**: High

#### Phase 3A: Reporting Period Management
**Deliverables**:
- Automated period lockdown system (runs on 15th)
- Data snapshot creation for immutable periods
- Period transition logic (copy current to new period)
- Cron job scheduler for automated tasks

**Key Features**:
- Period lockdown on 15th of each month at midnight
- Immutable snapshot storage in `data_snapshot` JSON field
- Automatic creation of new period with inherited data
- Email notifications for period transitions

#### Phase 3B: Historical Data Access
**Deliverables**:
- Month/year filtering interface
- Historical period selection dropdown
- Read-only view for locked periods
- Period comparison functionality

**API Endpoints**:
```
GET    /api/periods/available?project_id=X  # Get available periods for project
GET    /api/periods/:id/readonly           # Get locked period data
GET    /api/periods/compare/:id1/:id2      # Compare two periods
```

### Phase 4: Summary Views & Advanced Features
**Timeline**: 3-4 days
**Priority**: Medium

#### Phase 4A: Cross-Project Dashboard
**Deliverables**:
- Summary dashboard with project overview
- Status aggregation and filtering
- Export functionality for summary data
- Performance metrics and reporting

**Dashboard Features**:
- Project status overview (pie charts, progress bars)
- Upcoming deadlines and overdue items
- Benefit tracking across all projects
- Risk assessment aggregation

#### Phase 4B: System Integration & Optimization
**Deliverables**:
- Redis caching implementation
- Structured logging throughout system
- Performance monitoring and metrics
- API documentation (Swagger/OpenAPI)

### Phase 5: Migration & Deployment
**Timeline**: 2-3 days
**Priority**: Critical

#### Phase 5A: Data Migration
**Deliverables**:
- Migration script from localStorage to MySQL
- Data validation and integrity checks
- Rollback capability
- Migration progress reporting

#### Phase 5B: Deployment Preparation
**Deliverables**:
- Azure deployment configuration
- Environment variable setup
- Database connection string configuration
- Health check endpoints

## Risk Assessment & Mitigation

### High Priority Risks

#### Risk: Data Loss During Migration
**Probability**: Medium
**Impact**: Critical
**Mitigation**:
- Complete localStorage backup before migration
- Validation at each migration step
- Rollback capability to restore localStorage data
- Test migration on sample data first

#### Risk: Breaking Existing Functionality
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Progressive enhancement approach
- Frontend continues working with localStorage until migration complete
- Feature flags for gradual rollout
- Comprehensive testing at each phase

#### Risk: Performance Issues with Large Datasets
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- Redis caching for frequently accessed data
- Database indexing strategy
- Pagination for large result sets
- Query optimization and monitoring

### Medium Priority Risks

#### Risk: Real-time Comments System Complexity
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- WebSocket fallback to polling
- Comment threading kept simple initially
- Gradual enhancement of real-time features

#### Risk: Historical Data Storage Growth
**Probability**: High
**Impact**: Low
**Mitigation**:
- JSON compression for snapshots
- Archive old periods to separate storage
- Implement data retention policies

## Testing Strategy

### Unit Testing
- Model validation testing
- API endpoint testing
- Business logic testing
- Utility function testing

### Integration Testing
- Database operations testing
- API integration testing
- Frontend-backend communication testing
- Cache layer testing

### End-to-End Testing
- Complete user workflows
- Data migration testing
- Period transition testing
- Comment system testing

## Deployment Strategy

### Development Environment
- Local MySQL database
- Local Redis instance
- Hot reload for development
- Sample data for testing

### Production Environment (Azure)
- Azure Database for MySQL
- Azure Cache for Redis
- Azure App Service for Node.js
- Azure Application Insights for monitoring

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=monthly_updates
DB_USER=app_user
DB_PASS=secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=secure_jwt_secret
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

## Success Criteria

### Phase 1 Success Criteria
- [ ] Express server running successfully
- [ ] MySQL database connected and accessible
- [ ] Basic project CRUD operations working
- [ ] Data migration script tested and validated
- [ ] Existing frontend continues working during transition

### Phase 2 Success Criteria
- [ ] Comments can be added to any form field
- [ ] Comment threads are properly displayed
- [ ] Real-time updates working (or graceful fallback)
- [ ] Comment deletion working with proper permissions

### Phase 3 Success Criteria
- [ ] Reporting periods automatically lock on 15th
- [ ] Historical data is preserved and accessible
- [ ] Month/year filtering working correctly
- [ ] New periods inherit data from previous periods

### Phase 4 Success Criteria
- [ ] Summary dashboard displays all projects
- [ ] Export functionality working for summary data
- [ ] Performance metrics within acceptable limits
- [ ] System monitoring and alerts configured

### Phase 5 Success Criteria
- [ ] Complete data migration successful
- [ ] Application deployed to Azure
- [ ] All existing functionality preserved
- [ ] Performance equivalent or better than localStorage version

## Next Steps

### Immediate Action Required
**Approval needed for Phase 1A: Backend Foundation Setup**

This phase will:
1. Create Node.js server structure
2. Set up MySQL database connection
3. Implement basic project CRUD API
4. Prepare data migration utilities

**Files to be created**:
- `/server/package.json`
- `/server/src/app.js`
- `/server/src/config/database.js`
- `/server/src/models/Project.js`
- `/server/src/routes/projects.js`
- `/server/src/middleware/validation.js`

**Risk Level**: Low (no modification to existing frontend)
**Time Estimate**: 1-2 days
**Dependencies**: MySQL server access and credentials

### User Confirmation Required
Ready to proceed with Phase 1A implementation? This will establish the backend foundation without modifying any existing frontend functionality.