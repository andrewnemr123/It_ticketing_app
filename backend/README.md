# IT Ticketing Backend (Flask)

Simple and lightweight Flask backend using `mysql.connector` and `bcrypt` for user login and registration.

---

## 🚀 Getting Started

### 1. Create and Activate Virtual Environment
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
Copy `.env.example` to `.env` (or configure DB credentials in `.env`):
```bash
cp .env.example .env
```

Ensure MySQL is running and import your schema:
```bash
mysql -u root -p < schema.sql
```

### 4. Run the Flask App
```bash
python app.py
```

---

## 🔐 Available Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/login` | Authenticate with email & password |
| `POST` | `/register` | Create a new user account |
| `GET` | `/users` | List all users |
| `GET` | `/user/<id>` | Get user by ID |
| `GET` | `/health` | Health & DB connection check |
