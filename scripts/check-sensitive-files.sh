#!/bin/sh
set -eu

mode=staged
if [ "${1:-}" = "--tracked" ]; then
  mode=tracked
fi

if [ "$mode" = "tracked" ]; then
  files=$(git ls-files)
else
  files=$(git diff --cached --name-only --diff-filter=ACMR)
fi

status=0

for file in $files; do
  case "$file" in
    .env | */.env | credentials.json | */credentials.json | *id_rsa* | *id_ed25519*)
      echo "Sensitive file refused: $file"
      status=1
      ;;
    *.pem | *.jks | *.p12 | *.p8 | *.key | *.mobileprovision | *.sqlite | *.sqlite3)
      echo "Sensitive file refused: $file"
      status=1
      ;;
    *.env.*)
      case "$file" in
        .env.example | */.env.example) ;;
        *)
          echo "Sensitive file refused: $file"
          status=1
          ;;
      esac
      ;;
  esac
done

exit "$status"
