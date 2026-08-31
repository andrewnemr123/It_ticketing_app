# IT Ticketing Backend (Flask + JWT)

Lightweight, secure Flask backend using `mysql.connector`, `werkzeug.security`, and `PyJWT` for token-based authentication (`EMPLOYEE`, `ADMIN`).

---

## 🚀 Setup Guide for New Machines / Developers

If you or another developer are setting up this backend on a new machine, follow these steps:

### 1. Create and Activate a Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setup Your Local Environment Variables
Copy `.env.example` to create your own local `.env` file (which is gitignored and will not overwrite other developers' settings):
```bash
cp .env.example .env
```
Open `.env` and set your local MySQL credentials:
```ini
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=it_ticketing
```

### 4. Initialize the MySQL Database
Ensure your local MySQL server is running, then import the complete schema and seed accounts:
```bash
mysql -u root -p -h 127.0.0.1 -P 3306 < schema.sql
```
*(Alternatively: Open MySQL Workbench, open `schema.sql`, and click the ⚡ Execute button).*

### 5. Run the Server
```bash
python app.py
```
The server will start on **`http://localhost:5001`**.

---

## 🧪 Testing the Backend

### Automated Test Suite
Run the built-in edge case test script:
```bash
python test.py
```

---

## 📡 cURL Tests

#### 1. Check Health
```bash
curl http://localhost:5001/health
```

#### 2. User Registration (Returns JWT Token)
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

#### 3. User Login (Returns JWT Access Token)
```bash
curl -X POST http://localhost:5001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@company.com",
    "password": "SecurePassword123!"
  }'
```
**Response:**
```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "user": {
    "id": 4,
    "name": "Jane Developer",
    "email": "jane@company.com",
    "role": "EMPLOYEE"
  }
}
```

#### 4. Access Protected Profile (`/me`)
```bash
curl http://localhost:5001/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

#### 5. Update User (`PUT` / `PATCH`)
```bash
curl -X PATCH http://localhost:5001/user/4 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Senior Developer"}'
```

#### 6. Delete User (`DELETE` - Soft Delete)
```bash
curl -X DELETE http://localhost:5001/user/4
```

---

## 🔐 API Endpoints Summary

| Method | Route | Description | Protected |
|---|---|---|---|
| `GET` | `/health` | Server and MySQL database health check | ❌ |
| `POST` | `/login` | Authenticate and receive signed JWT token | ❌ |
| `POST` | `/register` | Create new user and receive signed JWT token | ❌ |
| `GET` | `/me` | Get current logged in user profile via Bearer token | ✅ (`@token_required`) |
| `GET` | `/users` | List all active users | ❌ |
| `GET` | `/user/<id>` | Fetch single user by ID | ❌ |
| `PATCH` | `/user/<id>` | Update user profile / password | ❌ |
| `DELETE` | `/user/<id>` | Soft delete user account | ❌ |
