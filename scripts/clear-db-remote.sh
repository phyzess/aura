#!/usr/bin/env bash
set -euo pipefail

echo "DANGER: This will DELETE ALL DATA in the REMOTE PRODUCTION D1 database (aura-db)."
echo "Target: wrangler d1 execute aura-db --env production --remote"
echo
read -p "Type 'PROD' to continue: " CONFIRM_1

if [ "$CONFIRM_1" != "PROD" ]; then
	echo "Aborted. First confirmation failed."
	exit 0
fi

read -p "Type the database name 'aura-db' to confirm: " CONFIRM_2

if [ "$CONFIRM_2" != "aura-db" ]; then
	echo "Aborted. Database name mismatch."
	exit 0
fi

read -p "FINAL WARNING: This will TRUNCATE ALL TABLES. Type 'DELETE EVERYTHING' to proceed: " CONFIRM_3

if [ "$CONFIRM_3" != "DELETE EVERYTHING" ]; then
	echo "Aborted. Final confirmation failed."
	exit 0
fi

wrangler d1 execute aura-db --env production --remote --command "
  DELETE FROM verifications;
  DELETE FROM sessions;
  DELETE FROM accounts;
  DELETE FROM tabs;
  DELETE FROM collections;
  DELETE FROM workspaces;
  DELETE FROM users;
"

echo "Done. All rows in auth + app tables have been deleted from REMOTE production."
