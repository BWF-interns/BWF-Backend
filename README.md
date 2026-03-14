# BWF Backend

Backend API for the Student & Staff Management System of [Borderless World Foundation](https://www.borderlessworldfoundation.org/)

## Overview

`bwf-backend` is the core REST API service powering the Borderless World Foundation Management System.

It handles:

- Authentication (JWT-based)
- Role-Based Access Control (RBAC)
- Student Management
- Activity Tracking
- Expense Management
- Warden Administration
- Community Moderation
- Admin Analytics Support
- Offline-first synchronization support

This backend serves:

- Flutter Mobile App (Students & Wardens)
- Web Admin Dashboard

# System Architecture

Client Applications:

- Mobile App (Flutter)
- Web Dashboard

Backend:

- REST API
- JWT Authentication
- Role Middleware
- Database Layer

# User Roles

The system supports **three primary roles**:

## Student

- Manage limited profile fields
- Log activities
- View personal expenses
- Create community posts (approval required)

## Warden

- Create & verify students
- Approve / reject community posts
- Track student activities
- Add student expenses
- Moderate assigned region/hostel

## Admin

- Full system access
- Manage users
- View all expenses
- Assign wardens
- Access dashboard analytics
- Remove inappropriate content

# Authentication Module

Features:

- JWT-based authentication
- Role-based access middleware
- Password hashing using bcrypt
- Token refresh mechanism

### Authentication Flow

User → Login → Backend verifies → JWT issued → Access granted

# Core Modules

## 1. Student Management Module

Stores:

- Personal details
- Guardian information
- Academic performance
- Assigned warden
- Activity records

## 2. Activity Tracker Module

Students can log:

- Study hours
- Skill training
- Physical activities
- Achievements

Wardens can:

- View logs
- Edit entries (if required)
- Add comments

## 3. Expense Tracker Module

### Individual Student Expenses

- Food
- Medical
- Education
- Uniform
- Miscellaneous

### Institutional Expenses

- Infrastructure
- Events
- Salaries
- Supplies

## 4. Community Module (Moderated)

Students can create posts (text + optional image).

Post Status:

- `PENDING`
- `APPROVED`
- `REJECTED`

Approval Flow:

Student creates post
→ Status set to PENDING
→ Warden reviews
→ Approve or Reject
→ If approved → Visible to community

# Offline-First Support

To support mobile offline functionality:

Each record contains:

- `is_synced` (boolean)
- `last_modified_timestamp`

Mobile app maintains:

- Local storage (Hive / SQLite)
- Sync queue
- Background sync process

# Role-Based Access Control (RBAC)

Middleware Functions:

- `verifyToken()`
- `checkRole(["admin"])`

# Running the Backend with Docker

## Prerequisites

Install:

- Docker
- Docker Compose

Verify installation:

```bash
docker --version
docker compose version
```

# Start the Project

From the project root directory run:

```bash
docker compose up --build
```

This will start:

- **Backend API (Node.js)**
- **MongoDB database**

# Run in Background (Optional)

```bash
docker compose up -d
```

# Access Services

Backend API:

```
http://localhost:5000
```

MongoDB:

```
mongodb://localhost:27017
```

The backend connects to MongoDB internally using:

```
mongodb://mongo:27017/mydb
```

# Useful Commands

Stop containers:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f backend
```

# Database Persistence

MongoDB data is stored using a Docker volume:

```
mongo-data
```

This ensures database data is preserved even if containers stop.

### Example Routes

```
/api/admin/getAllStudents        → Admin only
/api/student/post                → Student only
/api/warden/approvePost          → Warden only
```

# Suggested Folder Structure

```
 ├── controllers/
 ├── routes/
 ├── models/
 ├── middleware/
 │     ├── verifyToken.js
 │     └── checkRole.js
 ├── services/
 ├── utils/
 └── config/
```
