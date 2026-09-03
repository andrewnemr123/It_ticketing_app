#!/usr/bin/env bash
set -e

COMPOSE_FILE="compose.prod.yml"

show_help() {
  echo "Usage: ./deploy.sh [command]"
  echo ""
  echo "Commands:"
  echo "  up         Build and start the production stack in the background"
  echo "  down       Stop all production containers"
  echo "  restart    Restart all production services"
  echo "  logs       View live container logs"
  echo "  seed       Seed initial demo accounts and tickets"
  echo "  backup     Create an immediate MySQL database backup"
  echo "  status     Check container status"
  echo ""
}

case "$1" in
  up)
    echo "==> Building and starting production containers..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    echo "==> Production stack is up and running!"
    ;;
  down)
    echo "==> Stopping production containers..."
    docker compose -f "$COMPOSE_FILE" down
    ;;
  restart)
    echo "==> Restarting production services..."
    docker compose -f "$COMPOSE_FILE" restart
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f
    ;;
  seed)
    echo "==> Seeding database demo accounts..."
    docker compose -f "$COMPOSE_FILE" exec backend node dist/scripts/seed.js
    ;;
  backup)
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "==> Creating backup: $BACKUP_FILE..."
    docker compose -f "$COMPOSE_FILE" exec mysql mysqldump -u docker -pdocker it_ticketing > "$BACKUP_FILE"
    echo "==> Backup saved successfully to $BACKUP_FILE"
    ;;
  status)
    docker compose -f "$COMPOSE_FILE" ps
    ;;
  test)
    echo "========================================="
    echo "  Running Production Stack Self-Check"
    echo "========================================="
    echo ""
    echo "1. Checking Containers..."
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "2. Testing API Health..."
    HEALTH=$(curl -s http://localhost/api/health || echo "FAILED")
    echo "Response: $HEALTH"
    echo ""
    echo "3. Testing Login (admin@company.com)..."
    LOGIN_RESP=$(curl -s -X POST http://localhost/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@company.com","password":"Password123"}' || echo "FAILED")
    echo "Response: $LOGIN_RESP"
    echo ""
    if echo "$LOGIN_RESP" | grep -q "Login successful"; then
      echo "==> ALL CHECKS PASSED! Your backend and database are working perfectly."
    else
      echo "==> LOGIN FAILED! Showing recent backend error logs:"
      echo "----------------------------------------------------"
      docker compose -f "$COMPOSE_FILE" logs --tail=25 backend
      echo "----------------------------------------------------"
    fi
    ;;
  *)
    show_help
    ;;
esac


