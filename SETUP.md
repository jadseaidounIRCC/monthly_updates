# Monthly Updates - Setup Guide

## Prerequisites
- Node.js 16+ (recommended: Node.js 18 LTS)
- MySQL 8.0 or higher
- Git

## Directory Structure
```
monthly_updates/
├── frontend/          # React TypeScript frontend
├── server/            # Node.js Express backend
└── SETUP.md          # This file
```

## Setup Instructions

### 1. Database Setup
1. Install MySQL 8.0+ if not already installed
2. Create a new database called `monthly_updates`
3. Create a MySQL user with full privileges on this database

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

#### For Windows:
If you encounter SSL certificate issues with corporate proxy, use:
```bash
npm config set strict-ssl false
npm install
```

Or if that doesn't work, try:
```bash
npm config set registry http://registry.npmjs.org/
npm install
```

#### For Mac/Linux:
```bash
npm install
```

#### Environment Configuration:
Create a `.env` file in the `server` directory with the following content:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=monthly_updates
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_DIALECT=mysql

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

#### Database Migration:
```bash
npm run migrate
```

#### Start the Backend Server:
```bash
npm run dev
```

The backend should now be running on http://localhost:3001

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

#### Install Dependencies:
```bash
npm install
```

#### Environment Configuration:
Create a `.env` file in the `frontend` directory:
```env
REACT_APP_API_URL=http://localhost:3001/api
PORT=4200
```

#### For Windows Users:
If the start script fails with "PORT is not recognized", use:
```bash
npm run start:windows
```

#### For Mac/Linux Users:
```bash
npm start
```

The frontend should now be running on http://localhost:4200

## Troubleshooting

### Windows-Specific Issues

#### bcrypt Installation Error:
If you get SSL certificate errors when installing bcrypt:
```bash
# Option 1: Disable strict SSL
npm config set strict-ssl false
npm install

# Option 2: Use HTTP registry
npm config set registry http://registry.npmjs.org/
npm install

# Option 3: Use alternative bcrypt implementation
npm uninstall bcrypt
npm install bcryptjs
```

#### PORT Environment Variable Error:
Windows Command Prompt doesn't recognize `PORT=4200` syntax. Use the Windows-specific npm script:
```bash
npm run start:windows
```

### Database Connection Issues:
1. Ensure MySQL is running
2. Verify database credentials in `.env`
3. Check if the `monthly_updates` database exists
4. Ensure MySQL user has proper privileges

### Port Already in Use:
- Backend (3001): Change `PORT` in `server/.env`
- Frontend (4200): Change `PORT` in `frontend/.env` or use a different port

## Default Access
- Frontend: http://localhost:4200
- Backend API: http://localhost:3001/api
- API Health Check: http://localhost:3001/api/health

## Development Notes
- The backend uses nodemon for hot reloading
- The frontend uses React's development server with hot reloading
- All API requests from frontend are proxied to the backend
- Database migrations are handled via Sequelize CLI