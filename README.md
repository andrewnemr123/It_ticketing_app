# IT Ticketing App

Full-stack IT ticketing management application built with Express, React (Vite + Tailwind CSS), and MySQL.

---

## Quick Start with Docker

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 2. Environment Files
The project uses environment files for each service. Sample configuration files are provided:
- `database/.env.docker.example` -> `database/.env.docker`
- `backend/.env.docker.example` -> `backend/.env.docker`
- `frontend/.env.example` -> `frontend/.env`

If you haven't created them yet, copy the examples:
```bash
cp database/.env.docker.example database/.env.docker
cp backend/.env.docker.example backend/.env.docker
cp frontend/.env.example frontend/.env
```

### 3. Start the Application
Run Docker Compose to build and start the database, backend, and frontend containers:

```bash
docker compose up -d --build
```

### 4. Seed Demo Data (First-time setup)
To populate the database with default demo accounts and initial tickets:

```bash
docker compose exec backend npm run seed
```

### 5. Access the Application
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
- **API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
- **Grafana Dashboards**: [http://localhost:3000](http://localhost:3000) (Login: `admin` / `admin`)


---

## Demo Accounts

All demo accounts use the password: **`Password123`**

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `Password123` | Manage tickets, assign tickets, manage users, view reports |
| **Employee** | `sarah@company.com` | `Password123` | Create tickets, view & update own tickets |
| **Employee** | `mike@company.com` | `Password123` | Create tickets, view & update own tickets |

---

## Useful Docker Commands

- **View Logs**:
  ```bash
  docker compose logs -f
  ```
- **Stop Containers**:
  ```bash
  docker compose down
  ```
- **Stop Containers and Reset Database Volume**:
  ```bash
  docker compose down -v
  ```
- **Create a New Admin via CLI**:
  ```bash
  docker compose exec -it backend npm run create-admin
  ```

---

## Note on macOS Port Allocation
On macOS (macOS Monterey, Ventura, Sonoma, Sequoia), port `5000` is reserved by default for macOS AirPlay Receiver (`ControlCenter`). This project maps the backend API to host port **`5001`** (`5001:5000`) so it runs cleanly on macOS without requiring users to disable AirPlay Receiver.