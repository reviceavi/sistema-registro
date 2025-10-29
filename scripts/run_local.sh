#!/usr/bin/env bash
set -euo pipefail

# Script para arrancar el servidor local que expone /api/mongo-admin
# Uso recomendado:
# 1) Copia .env.example a .env y agrega MONGODB_URI (no lo subas a git)
#    cp .env.example .env
#    # editar .env con la URI
# 2) Instala dependencias si no están: npm install
# 3) Ejecuta: node server.js

if [ ! -f .env ]; then
  echo ".env not found. Copying .env.example to .env (edit .env before running)."
  cp .env.example .env || true
  echo "Please edit .env and set MONGODB_URI before running."
fi

echo "Starting local server (server.js). Ensure MONGODB_URI is set in .env or env vars."
node server.js
