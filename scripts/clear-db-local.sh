#!/usr/bin/env bash
set -euo pipefail

echo "This will DELETE ALL DATA in the LOCAL D1 database (aura-db)."
read -p "Type 'LOCAL' to continue: " CONFIRM

if [ "$CONFIRM" != "LOCAL" ]; then
  echo "Aborted."
  exit 0
fi

wrangler d1 execute aura-db --env production --local --command "
  DELETE FROM verifications;
  DELETE FROM sessions;
  DELETE FROM accounts;
  DELETE FROM tabs;
  DELETE FROM collections;
  DELETE FROM workspaces;
  DELETE FROM users;
"

echo "Done. All rows in auth + app tables have been deleted."
