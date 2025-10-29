#!/usr/bin/env bash
set -euo pipefail

# Script helper para crear un database user en MongoDB Atlas usando la Atlas REST API.
# NO incluye claves en el script: pásalas como variables de entorno al ejecutar.
# Uso:
# ATLAS_PUBLIC_KEY=xtmgptos ATLAS_PRIVATE_KEY=... PROJECT_ID=<projectId> \
#   DB_USER=reviceavi_user DB_PASS='S3guraP@ssw0rd' ./scripts/atlas_create_dbuser.sh

if [ -z "${ATLAS_PUBLIC_KEY:-}" ] || [ -z "${ATLAS_PRIVATE_KEY:-}" ] || [ -z "${PROJECT_ID:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASS:-}" ]; then
  cat <<EOF
Usage: ATLAS_PUBLIC_KEY=... ATLAS_PRIVATE_KEY=... PROJECT_ID=... DB_USER=... DB_PASS=... $0

This script calls the Atlas API to create a database user with readWrite on the 'reviceavi' database.
It will not store your keys; run it locally and protect your environment.
EOF
  exit 1
fi

echo "Creating DB user '$DB_USER' in project $PROJECT_ID..."

curl -s -u "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" \
  -H "Content-Type: application/json" \
  -X POST "https://cloud.mongodb.com/api/atlas/v1.0/groups/${PROJECT_ID}/databaseUsers" \
  -d @- <<JSON
{
  "databaseName": "admin",
  "username": "${DB_USER}",
  "password": "${DB_PASS}",
  "roles": [ { "roleName": "readWrite", "databaseName": "reviceavi" } ]
}
JSON

echo "\nDone. If the user was created, use the provided username/password to build your MONGODB_URI."
