s# IT Ticket Management System - Backend API

A secure, high-performance RESTful API backend for an IT Ticket Management System built with **Node.js, Express, TypeScript, and MySQL**.

---

## Features

* **Authentication & Authorization:**
  * JWT-based authentication with token signing and validation middleware.
  * Role-Based Access Control (**RBAC**) for `EMPLOYEE` and `ADMIN` roles.
  * **Stateless Password Reset:** 15-minute expiration reset tokens using dynamic cryptographic secrets (`JWT_SECRET + user.password_hash`) guaranteeing immediate single-use invalidation without database migrations.
  * User enumeration prevention on forgot password requests.
* **Ticket Management:**
  * Support for ticket categories (*Hardware, Software, Network, Access / Permissions, Security, Email, Other*).
  * Priorities (*Low, Medium, High, Critical*) and lifecycle statuses (*New, Open, In Progress, Waiting for User, Resolved, Closed*).
  * Automatic sequential ticket number generation (e.g. `TICK-1001`).
  * Scoped ticket visibility: Employees only see their own tickets; Admins see all tickets.
  * Admin assignment and unassignment controls (tickets can only be assigned to Admins).
* **Activity Timeline & Comments:**
  * Public comment threads between employees and support staff.
  * Private, admin-only internal notes hidden from regular employees.
  * Automated audit trail tracking status changes, priority adjustments, and reassignments.
* **File Attachments:**
  * Secure multipart file uploads via Multer.
  * Strict file extension (`.png`, `.jpg`, `.jpeg`, `.pdf`, `.txt`) and MIME type validation.
  * Max file size enforcement (5 MB default) with automatic disk cleanup for failed requests.
* **Admin Dashboard & Analytics:**
  * Aggregated metrics across statuses, priorities (critical tickets), and category distributions.
  * Recent activity feed.
* **Testing Infrastructure:**
  * 85 automated unit and integration tests covering all routes, controllers, middleware, and business logic.

---

## Prerequisites

Ensure you have the following installed on your system:

* **Node.js**: v18.0.0 or later (v20+ / v22+ recommended)
* **npm**: v9.0.0 or later
* **MySQL Server**: v8.0 or later

---

## Quick Start / Setup Instructions

### 1. Clone & Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and configure your database credentials and secret keys:

```env
# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=it_ticketing

# Security & JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=8h

# File Uploads
UPLOAD_DIR=uploads
MAX_UPLOAD_BYTES=5242880
```

### 3. Initialize MySQL Database Schema

Create the database and required tables by executing the provided SQL schema script:

```bash
mysql -u root -p < database/schema.sql
```

*(This creates the `it_ticketing` database and the `user`, `ticket`, `ticket_event`, and `ticket_attachment` tables).*

---

## Running the Server

### Development Mode (with hot reloading)
```bash
npm run dev
```
The server will start listening at `http://localhost:5000`.

### Production Build & Execution
```bash
# Compile TypeScript to dist/
npm run build

# Start the production server
npm start
```

### Type Checking
```bash
npm run typecheck
```

---

## Running Automated Tests

The testing suite contains 85 comprehensive unit and integration tests.

```bash
# Run all tests (unit + integration)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

---

## API Endpoints Reference

### Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check / liveness probe |

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (defaults to `EMPLOYEE`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Public | Request a 15-minute single-use password reset link |
| `POST` | `/api/auth/reset-password` | Public | Reset password using verified token |

### User Management (`/api/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Admin | List all registered users |
| `POST` | `/api/users` | Admin | Create a new user with specified role (`EMPLOYEE` or `ADMIN`) |
| `GET` | `/api/users/:id` | Admin | Get individual user profile |
| `PUT` | `/api/users/:id/role` | Admin | Update user role (prevents self-demotion) |

### Tickets (`/api/tickets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | Authenticated | List tickets (scoped to creator for employees; all tickets for admins) |
| `POST` | `/api/tickets` | Authenticated | Create a new ticket (generates `TICK-100X`) |
| `GET` | `/api/tickets/:id` | Authenticated | Get ticket details (returns 404 for unauthorized employees) |
| `PUT` | `/api/tickets/:id/status` | Admin | Update ticket status (`New`, `Open`, `In Progress`, `Resolved`, etc.) |
| `PUT` | `/api/tickets/:id/priority` | Admin | Update ticket priority (`Low`, `Medium`, `High`, `Critical`) |
| `PUT` | `/api/tickets/:id/assign` | Admin | Assign ticket to an Admin user or unassign (`null`) |

### Ticket Events & Comments (`/api/tickets/:id`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets/:id/events` | Authenticated | Get activity timeline (internal notes hidden from employees) |
| `POST` | `/api/tickets/:id/comments` | Authenticated | Post public comment or admin-only internal note |

### Ticket Attachments (`/api/tickets/:id`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets/:id/attachments` | Authenticated | List files attached to a ticket |
| `POST` | `/api/tickets/:id/attachments` | Authenticated | Upload file attachment (field: `file`) |
| `GET` | `/api/tickets/:id/attachments/:attachmentId/download` | Authenticated | Download ticket attachment |

### Reports & Dashboard (`/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard` | Admin | Get overall statistics, category counts, and recent tickets |

---

## Project Structure

```
├── database/
│   └── schema.sql              # MySQL database table definitions
├── src/
│   ├── app.ts                  # Express application setup, middlewares & routes
│   ├── server.ts               # Server bootstrap & MySQL connection assertion
│   ├── types.ts                # TypeScript interfaces, types & enums
│   ├── config/
│   │   └── db.ts               # MySQL connection pool & connection testing
│   ├── controllers/
│   │   ├── authController.ts   # Auth & password reset logic
│   │   ├── userController.ts   # Admin user management
│   │   ├── ticketController.ts # Ticket CRUD, events & attachments
│   │   └── reportController.ts # Dashboard aggregations
│   ├── middleware/
│   │   ├── authMiddleware.ts   # JWT authentication verification
│   │   ├── roleMiddleware.ts   # Role-based access control (RBAC)
│   │   ├── uploadMiddleware.ts # Multer multipart upload filtering
│   │   └── errorHandler.ts     # Centralized error handler
│   └── utils/
│       ├── ApiError.ts         # Custom HTTP error class
│       └── asyncHandler.ts     # Async route wrapper
├── tests/
│   ├── helpers/                # Mock DB engine, in-memory client & fixtures
│   ├── unit/                   # Unit test suites
│   └── integration/            # Integration test suites
├── tsconfig.json               # TypeScript base configuration
├── tsconfig.build.json         # TypeScript production build configuration
└── package.json                # Project dependencies and npm scripts
```

