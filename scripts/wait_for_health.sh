#!/bin/sh
set -eu
url="${1:-http://localhost:8000/api/v1/system/health}"
for i in $(seq 1 60); do if curl -fsS "$url" >/dev/null 2>&1; then exit 0; fi; sleep 1; done
exit 1
