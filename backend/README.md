# IT Ticketing Backend (Flask)

Lightweight, secure Flask backend using `mysql.connector` and `werkzeug.security` for user login, registration, and user management (`EMPLOYEE`, `TECHNICIAN`, `ADMIN`).

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

#### 1. Check Server & Database Health
```bash
curl http://localhost:5001/health
```

#### 2. Test User Registration
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

#### 3. Test Successful Login
```bash
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@company.com",
    "password": "SecurePassword123!"
  }'
```

#### 4. List All Users
```bash
curl http://localhost:5001/users
```

#### 5. Get User by ID
```bash
curl http://localhost:5001/user/1
```

#### 6. Delete User by ID
```bash
curl -X DELETE http://localhost:5001/user/4
```
**Expected Response (200 OK):**
```json
{
  "message": "User 4 (jane@company.com) deleted successfully"
}
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
| `DELETE` | `/user/<id>` (or `/api/users/<id>`) | Delete a user account by ID |
