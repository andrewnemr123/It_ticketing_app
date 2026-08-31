# IT Ticketing Backend (Flask)

Lightweight, secure Flask backend using `mysql.connector` and `werkzeug.security` for user login, registration, and role-based accounts (`EMPLOYEE`, `TECHNICIAN`, `ADMIN`).

---

## 🚀 Getting Started

### 1. Setup Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setup Database & Environment
Copy `.env.example` to `.env` and verify your MySQL connection settings:
```bash
cp .env.example .env
```

Ensure MySQL is running on port `3306` and import your schema:
```bash
mysql -u root -p -h 127.0.0.1 -P 3306 < schema.sql
```
*(Or open and execute `schema.sql` in MySQL Workbench on your `Local instance 3306`)*

### 4. Run the Flask Server
```bash
python app.py
```
Server starts on **`http://localhost:5001`**.

---

## 🧪 Testing the Backend

### Automated Test Suite
Run the built-in test script:
```bash
python test_app.py
```

---

### 📡 cURL Tests

You can copy and run these commands directly in a new terminal tab while the server is running:

#### 1. Check Server & Database Health
```bash
curl http://localhost:5001/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

#### 2. Test User Registration (with secure password hashing)
```bash
curl -X POST http://localhost:5001/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Developer",
    "email": "jane@company.com",
    "password": "SecurePassword123!",
    "role": "EMPLOYEE"
  }'
```
**Expected Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 4,
    "name": "Jane Developer",
    "email": "jane@company.com",
    "role": "EMPLOYEE"
  }
}
```

---

#### 3. Test Successful Login (Valid Credentials)
```bash
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@company.com",
    "password": "SecurePassword123!"
  }'
```
**Expected Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 4,
    "name": "Jane Developer",
    "email": "jane@company.com",
    "role": "EMPLOYEE"
  }
}
```

---

#### 4. Test Failed Login (Wrong Password)
```bash
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@company.com",
    "password": "WrongPassword!"
  }'
```
**Expected Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

#### 5. Test Failed Login (Non-existent Email)
```bash
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@company.com",
    "password": "AnyPassword"
  }'
```
**Expected Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

#### 6. List All Registered Users
```bash
curl http://localhost:5001/users
```
**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "System Admin",
    "email": "admin@company.com",
    "role": "ADMIN",
    "created_at": "..."
  },
  {
    "id": 2,
    "name": "Alex Rivers (IT Support)",
    "email": "tech@company.com",
    "role": "TECHNICIAN",
    "created_at": "..."
  }
]
```

---

#### 7. Get User by ID
```bash
curl http://localhost:5001/user/1
```

---

## 🔐 API Endpoints Summary

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Server and MySQL database health check |
| `POST` | `/login` (or `/api/auth/login`) | User authentication and role retrieval |
| `POST` | `/register` (or `/api/auth/register`) | Create new user account with hashed password |
| `GET` | `/users` | List all users |
| `GET` | `/user/<id>` | Fetch single user by ID |
