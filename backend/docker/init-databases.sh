#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
SELECT 'CREATE DATABASE agri_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'agri_dev')\gexec
SELECT 'CREATE DATABASE agri_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'agri_test')\gexec
SQL
