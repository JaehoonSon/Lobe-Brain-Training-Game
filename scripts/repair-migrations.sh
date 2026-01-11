#!/bin/bash

# Array of migration versions that need to be marked as applied
# These are taken from the 'db:push' output which indicates they are missing from history
# but clearly exist in the DB (since we got 'relation already exists' errors).

VERSIONS=(
  "20260105160000"
  "20260105212526"
  "20260106022209"
  "20260106022300"
  "20260107003116"
  "20260107041047"
  "20260107041714"
  "20260107155707"
  "20260107200903"
  "20260107202858"
  "20260107212137"
  "20260107212438"
  "20260107220000"
  "20260108023622"
  "20260108024000"
  "20260108170513"
  "20260108173000"
  "20260109200417"
  "20260109210000"
  "20260109215943"
  "20260109223000"
  "20260109224100"
  "20260110020018"
  "20260110041340"
  "20260110045042"
  "20260110211735"
  "20260111011047"
  "20260111190201"
  "20260111190202"
  "20260111190203"
  "20260111222748"
)

echo "Repairing migration history..."

# Join assertions with spaces
VERSION_STRING="${VERSIONS[*]}"

# Run the repair command
npx supabase migration repair --status applied $VERSION_STRING

echo "Done. Try running 'npm run db:push' (or just verify) now."
