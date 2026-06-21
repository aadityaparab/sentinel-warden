#!/usr/bin/env bash
# Warden 30-second demo. Run from the repo root: bash scripts/demo.sh
#
# To record a GIF for social/README:
#   asciinema rec demo.cast -c "bash scripts/demo.sh"
#   agg demo.cast assets/demo.gif        # https://github.com/asciinema/agg
set -e

echo "$ npx sentinel-warden scan examples/clean-skill"
node dist/cli.js scan examples/clean-skill
echo
sleep 1
echo "$ npx sentinel-warden scan examples/malicious-skill"
node dist/cli.js scan examples/malicious-skill || true
