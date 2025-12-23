#!/usr/bin/env bash
set -euo pipefail

echo "This will DELETE ALL DATA in the LOCAL D1 database used by dev:api (aura-db-dev)."
read -p "Type 'LOCAL' to continue: " CONFIRM

if [ "$CONFIRM" != "LOCAL" ]; then
  echo "Aborted."
  exit 0
fi

# Always run Wrangler from the API app directory so it can find wrangler.toml
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$SCRIPT_DIR/../apps/api"

cd "$API_DIR"

wrangler d1 execute aura-db-dev --local --command "
  DELETE FROM verifications;
  DELETE FROM sessions;
  DELETE FROM accounts;
  DELETE FROM tabs;
  DELETE FROM collections;
  DELETE FROM workspaces;
  DELETE FROM users;
"

echo "Done. All rows in auth + app tables have been deleted."
