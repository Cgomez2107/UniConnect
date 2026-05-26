#!/bin/bash

# Script para configurar DATABASE_URL en Fly.io
# Uso: ./scripts/set-database-url.sh

set -e

APP_NAME="uniconnect-backend-grupo-2"

# Construir DATABASE_URL desde los secrets existentes
DB_USER=$(flyctl secrets get DB_USER --app $APP_NAME 2>/dev/null | cut -d'=' -f2)
DB_PASSWORD=$(flyctl secrets get DB_PASSWORD --app $APP_NAME 2>/dev/null | cut -d'=' -f2)
DB_HOST=$(flyctl secrets get DB_HOST --app $APP_NAME 2>/dev/null | cut -d'=' -f2)
DB_PORT=$(flyctl secrets get DB_PORT --app $APP_NAME 2>/dev/null | cut -d'=' -f2)
DB_NAME=$(flyctl secrets get DB_NAME --app $APP_NAME 2>/dev/null | cut -d'=' -f2)

if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ]; then
  echo "Error: Missing required secrets (DB_USER, DB_PASSWORD, DB_HOST)"
  exit 1
fi

# Construir connection string
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# Set secret
echo "Setting DATABASE_URL secret..."
flyctl secrets set DATABASE_URL="$DATABASE_URL" --app $APP_NAME

echo "✓ DATABASE_URL configured successfully"
echo ""
echo "To verify, run:"
echo "  flyctl secrets list --app $APP_NAME"
