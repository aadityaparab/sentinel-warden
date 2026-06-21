#!/usr/bin/env bash
# Warden one-shot publisher. Run from the sentinel-warden project root:  bash scripts/publish.sh
set -euo pipefail

REPO_OWNER="aadityaparab"
PKG_NAME="sentinel-warden"

say(){ printf "\n\033[1;35m> %s\033[0m\n" "$1"; }
die(){ printf "\n\033[1;31mx %s\033[0m\n" "$1"; exit 1; }

say "Checking environment"
command -v node >/dev/null || die "node not found"
command -v npm  >/dev/null || die "npm not found"
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || die "Node >=18 required (have $(node -v))"
[ -f package.json ] || die "No package.json here. cd into the sentinel-warden project root first."
NAME="$(node -p "require('./package.json').name")"
[ "$NAME" = "$PKG_NAME" ] || die "package.json name is '$NAME', expected '$PKG_NAME'. Wrong folder?"
VERSION="$(node -p "require('./package.json').version")"
echo "Node $(node -v) | $NAME@$VERSION"

say "Checking npm auth"
npm whoami >/dev/null 2>&1 || die "Not logged into npm. Run: npm login   then re-run."
echo "npm user: $(npm whoami)"

say "Checking npm name availability"
if npm view "$PKG_NAME" version >/dev/null 2>&1; then
  die "'$PKG_NAME' is already on npm (v$(npm view "$PKG_NAME" version)). Use a scope (@$REPO_OWNER/$PKG_NAME) or new name, then update package.json + README."
fi
echo "'$PKG_NAME' is available"

HAVE_GH=0
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then HAVE_GH=1; echo "gh: authenticated"; else echo "gh: not available/authed (will use manual remote)"; fi

say "Installing deps"; npm install
say "Building";        npm run build
say "Running tests";   npm test
say "Smoke test (expect 'verdict: BLOCK')"; node dist/cli.js scan examples/malicious-skill
say "Regenerating demo image"; node scripts/render-demo.mjs || true

say "Preparing git"
[ -d .git ] || git init -q
git add -A
git commit -q -m "Warden v$VERSION - supply-chain firewall for AI agent skills, MCP servers, and rules files" || echo "(nothing new to commit)"
git branch -M main

if [ "$HAVE_GH" = "1" ]; then
  if gh repo view "$REPO_OWNER/$PKG_NAME" >/dev/null 2>&1; then
    say "Repo exists - pushing"
    git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO_OWNER/$PKG_NAME.git"
    git push -u origin main
  else
    say "Creating GitHub repo + pushing"
    gh repo create "$REPO_OWNER/$PKG_NAME" --public --source=. --remote=origin --push \
      --description "Supply-chain firewall for AI agent skills, MCP servers, and rules files."
  fi
  gh repo edit "$REPO_OWNER/$PKG_NAME" --add-topic ai-security,mcp,prompt-injection,llm-security,agent-security,dlp,supply-chain,claude,cursor,sarif || true
else
  say "No gh CLI. Create an EMPTY public repo named '$PKG_NAME' at https://github.com/new (no README/license), then press Enter."
  read -r _
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$REPO_OWNER/$PKG_NAME.git"
  git push -u origin main
fi

say "PUBLISHING to npm (Ctrl+C now to abort)"; sleep 2
npm publish --access public
echo "Verifying published package..."; sleep 3
npx --yes "$PKG_NAME@latest" --version || true

say "Tagging release v$VERSION"
git tag "v$VERSION" 2>/dev/null || true
git push origin "v$VERSION" || true
[ "$HAVE_GH" = "1" ] && gh release create "v$VERSION" --title "Warden v$VERSION" --notes "First public release. Static supply-chain firewall for AI agent skills, MCP servers, and rules files. MIT." || true

say "Done"
echo "Repo: https://github.com/$REPO_OWNER/$PKG_NAME"
echo "npm:  https://www.npmjs.com/package/$PKG_NAME"
echo "Try:  npx $PKG_NAME scan ."
echo "Next: paste the hub README into the sentinel-stack repo, then post launch/LAUNCH.md."
