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
    docker compose -f "$COMPOSE_FILE" exec mysql mysqldump -u root -proot --no-tablespaces it_ticketing > "$BACKUP_FILE"
    echo "==> Backup saved successfully to $BACKUP_FILE"
    ;;
  status)
    docker compose -f "$COMPOSE_FILE" ps
    ;;
  *)
    show_help
    ;;
esac

