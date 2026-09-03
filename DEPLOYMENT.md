# Production VPS Deployment Guide

This guide details how to deploy the IT Ticketing application to a production Linux server (AWS EC2, DigitalOcean Droplet, Hetzner, Linode, Ubuntu 22.04 / 24.04).

---

## 1. Server Prerequisites

1. A Linux Server (e.g. Ubuntu 22.04 LTS) with at least 1 GB RAM (2 GB recommended).
2. A registered Domain Name (e.g. `tickets.yourcompany.com`) pointing its **A Record** to your server's public IP address.
3. Open firewall ports:
   - **Port 80** (HTTP)
   - **Port 443** (HTTPS)
   - **Port 22** (SSH)

---

## 2. Server Setup & Docker Installation

SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

Install Docker and Docker Compose:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker using the official automated script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify Docker installation
docker --version
docker compose version
```

---

## 3. Clone Repository & Configure Environment

Clone your project into `/opt/it-ticketing`:
```bash
sudo git clone <YOUR_GIT_REPO_URL> /opt/it-ticketing
cd /opt/it-ticketing
```

Create production `.env` files:
```bash
cp database/.env.docker.example database/.env.docker
cp backend/.env.docker.example backend/.env.docker
cp frontend/.env.example frontend/.env
```

Edit the production settings with your preferred editor (`nano` or `vim`):

1. **`backend/.env.docker`**:
   - Set a strong secret: `JWT_SECRET=$(openssl rand -hex 32)`
   - Set `NODE_ENV=production`
   - Set strong `DB_PASSWORD`

2. **`database/.env.docker`**:
   - Set matching strong `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD`

3. **`frontend/.env`**:
   - In production with Nginx reverse proxy, `VITE_API_URL=/api` works automatically.

---

## 4. Deploy with One Command

Run the deployment script:
```bash
./deploy.sh up
```

*(Alternatively: `docker compose -f compose.prod.yml up -d --build`)*

---

## 5. Seed Initial Data (Optional)

To load initial demo accounts (`admin@company.com`, `sarah@company.com`, password: `Password123`):
```bash
./deploy.sh seed
```

---

## 6. Set Up HTTPS (SSL) with Let's Encrypt / Certbot

To secure your site with HTTPS for free using Certbot:

```bash
# 1. Install Certbot
sudo apt install -y certbot

# 2. Temporarily stop the frontend container to release port 80
./deploy.sh down

# 3. Generate the SSL certificate
sudo certbot certonly --standalone -d tickets.yourcompany.com

# 4. Restart your production containers
./deploy.sh up
```

---

## 7. Database Backups & Data Safety

Because production uses persistent Docker volumes (`mysql_data`), all tickets and users are **permanently saved on the server's disk**.

### Manual Backup:
```bash
./deploy.sh backup
```

### Automated Nightly Backup Cron Job:
Add a nightly cron job to back up the database at 2:00 AM:
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/it-ticketing && ./deploy.sh backup >/dev/null 2>&1") | crontab -
```

---

## 8. Management Commands Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Start / Update Production** | `./deploy.sh up` |
| **Stop Production** | `./deploy.sh down` |
| **Restart Services** | `./deploy.sh restart` |
| **View Live Logs** | `./deploy.sh logs` |
| **Check Container Status** | `./deploy.sh status` |
| **Instant Database Backup** | `./deploy.sh backup` |

