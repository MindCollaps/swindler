#!/usr/bin/env bash

# Exit if .env already exists
if [ -f .env ]; then
  echo ".env file already exists. Skipping generation."
  exit 0
fi

# enerate random alphanumeric strings (32 chars)
generate_secret() {
  # tr: delete everything NOT in the set A-Z, a-z, 0-9
  # head: take the first 32 characters
  tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32
}

echo "Generating new .env file with random secrets..."

POSTGRES_USER="swindler"
POSTGRES_DB="swindler"
POSTGRES_PASSWORD=$(generate_secret)
REDIS_PASSWORD=$(generate_secret)
ADMIN_USERNAME=system
ADMIN_PASSWORD=$(generate_secret)
ADMIN_EMAIL=john.smith@example.com

cat > .env <<EOF
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
EOF

echo ".env file created successfully."
