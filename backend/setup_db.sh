#!/bin/bash

# Create database
psql postgres -c "CREATE DATABASE therabot;"

# Create user and grant privileges
psql postgres -c "CREATE USER postgres WITH PASSWORD 'postgres';"
psql postgres -c "ALTER ROLE postgres SET client_encoding TO 'utf8';"
psql postgres -c "ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';"
psql postgres -c "ALTER ROLE postgres SET timezone TO 'UTC';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE therabot TO postgres;" 