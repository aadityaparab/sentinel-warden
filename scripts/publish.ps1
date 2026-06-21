# Warden one-shot publisher (Windows). Run from the project root:  powershell -ExecutionPolicy Bypass -File scripts\publish.ps1
$ErrorActionPreference = "Stop"
$RepoOwner = "aadityaparab"
$Pkg = "sentinel-warden"
function Say($m){ Write-Host "`n> $m" -ForegroundColor Magenta }
function Die($m){ Write-Host "`nx $m" -ForegroundColor Red; exit 1 }

Say "Checking environment"
if(-not (Get-Command node -ErrorAction SilentlyContinue)){ Die "node not found" }
if(-not (Get-Command npm  -ErrorAction SilentlyContinue)){ Die "npm not found" }
if([int](node -p "process.versions.node.split('.')[0]") -lt 18){ Die "Node >=18 required (have $(node -v))" }
if(-not (Test-Path package.json)){ Die "No package.json here. cd into the sentinel-warden project root first." }
$name = node -p "require('./package.json').name"
if($name -ne $Pkg){ Die "package.json name is '$name', expected '$Pkg'. Wrong folder?" }
$ver = node -p "require('./package.json').version"
Write-Host "Node $(node -v) | $name@$ver"

Say "Checking npm auth"
$who = (npm whoami 2>$null)
if(-not $who){ Die "Not logged into npm. Run: npm login  then re-run." }
Write-Host "npm user: $who"

Say "Checking npm name availability"
$exists = (npm view $Pkg version 2>$null)
if($exists){ Die "'$Pkg' already on npm (v$exists). Use a scope (@$RepoOwner/$Pkg) or new name, then update package.json + README." }
Write-Host "'$Pkg' is available"

$haveGh = $false
if(Get-Command gh -ErrorAction SilentlyContinue){ gh auth status 2>$null; if($LASTEXITCODE -eq 0){ $haveGh = $true } }
Write-Host ("gh: " + $(if($haveGh){"authenticated"}else{"not available/authed (manual remote)"}))

Say "Installing deps"; npm install
Say "Building";        npm run build
Say "Running tests";   npm test
Say "Smoke test (expect 'verdict: BLOCK')"; node dist/cli.js scan examples/malicious-skill
Say "Regenerating demo image"; node scripts/render-demo.mjs

Say "Preparing git"
if(-not (Test-Path .git)){ git init -q }
git add -A
git commit -q -m "Warden v$ver - supply-chain firewall for AI agent skills, MCP servers, and rules files"
git branch -M main

if($haveGh){
  gh repo view "$RepoOwner/$Pkg" 2>$null
  if($LASTEXITCODE -eq 0){
    Say "Repo exists - pushing"
    git remote add origin "https://github.com/$RepoOwner/$Pkg.git" 2>$null
    git push -u origin main
  } else {
    Say "Creating GitHub repo + pushing"
    gh repo create "$RepoOwner/$Pkg" --public --source=. --remote=origin --push --description "Supply-chain firewall for AI agent skills, MCP servers, and rules files."
  }
  gh repo edit "$RepoOwner/$Pkg" --add-topic ai-security,mcp,prompt-injection,llm-security,agent-security,dlp,supply-chain,claude,cursor,sarif
} else {
  Say "No gh CLI. Create an EMPTY public repo named '$Pkg' at https://github.com/new (no README/license), then press Enter."
  Read-Host | Out-Null
  git remote add origin "https://github.com/$RepoOwner/$Pkg.git" 2>$null
  git push -u origin main
}

Say "PUBLISHING to npm (Ctrl+C now to abort)"; Start-Sleep 2
npm publish --access public
Start-Sleep 3; npx --yes "$Pkg@latest" --version

Say "Tagging release v$ver"
git tag "v$ver" 2>$null
git push origin "v$ver"
if($haveGh){ gh release create "v$ver" --title "Warden v$ver" --notes "First public release. MIT." }

Say "Done"
Write-Host "Repo: https://github.com/$RepoOwner/$Pkg"
Write-Host "npm:  https://www.npmjs.com/package/$Pkg"
