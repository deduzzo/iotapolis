#!/bin/bash
#
# IOTA Free Forum — Release Script
#
# Workflow:
#   1. Chiede il tipo di incremento (patch/minor/major)
#   2. Aggiorna la versione in package.json e desktop/package.json
#   3. Builda il frontend
#   4. Committa e tagga
#   5. Pusha tag e commit
#   6. Builda Electron per tutte le piattaforme
#   7. Crea GitHub Release con gli artifacts
#
# Usage:
#   ./scripts/release.sh
#   ./scripts/release.sh --patch   (auto, no prompt)
#   ./scripts/release.sh --minor
#   ./scripts/release.sh --major

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  IOTA Free Forum — Release Script${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"

# ── 1. Check prerequisites ───────────────────────────────────────────
echo -e "\n${YELLOW}[1/7] Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}node not found${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm not found${NC}"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo -e "${RED}gh CLI not found (install: brew install gh)${NC}"; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}git not found${NC}"; exit 1; }

# Check clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}Working tree not clean. Staging all changes...${NC}"
  git add -A
  git commit -m "chore: pre-release cleanup" || true
fi

# ── 2. Version bump ─────────────────────────────────────────────────
echo -e "\n${YELLOW}[2/7] Version bump...${NC}"

CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
echo -e "  Current version: ${GREEN}${CURRENT_VERSION}${NC}"

# Parse current version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Determine bump type
BUMP_TYPE=""
if [ "$1" = "--patch" ]; then
  BUMP_TYPE="patch"
elif [ "$1" = "--minor" ]; then
  BUMP_TYPE="minor"
elif [ "$1" = "--major" ]; then
  BUMP_TYPE="major"
else
  echo ""
  echo "  Scegli il tipo di incremento:"
  echo -e "    ${GREEN}1) patch${NC}  → $MAJOR.$MINOR.$((PATCH+1))  (bug fixes)"
  echo -e "    ${YELLOW}2) minor${NC}  → $MAJOR.$((MINOR+1)).0  (new features)"
  echo -e "    ${RED}3) major${NC}  → $((MAJOR+1)).0.0  (breaking changes)"
  echo ""
  read -p "  Scelta [1/2/3]: " choice
  case "$choice" in
    1) BUMP_TYPE="patch" ;;
    2) BUMP_TYPE="minor" ;;
    3) BUMP_TYPE="major" ;;
    *) echo -e "${RED}Scelta non valida${NC}"; exit 1 ;;
  esac
fi

# Calculate new version
case "$BUMP_TYPE" in
  patch) NEW_VERSION="$MAJOR.$MINOR.$((PATCH+1))" ;;
  minor) NEW_VERSION="$MAJOR.$((MINOR+1)).0" ;;
  major) NEW_VERSION="$((MAJOR+1)).0.0" ;;
esac

echo -e "  New version: ${GREEN}${NEW_VERSION}${NC} (${BUMP_TYPE})"

# Update version in package.json files
node -e "
  const fs = require('fs');
  for (const file of ['package.json', 'desktop/package.json']) {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    pkg.version = '${NEW_VERSION}';
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
    console.log('  Updated', file, '→', pkg.version);
  }
"

# ── 3. Build frontend ───────────────────────────────────────────────
echo -e "\n${YELLOW}[3/7] Building frontend...${NC}"
cd frontend
npm run build
cd "$ROOT_DIR"
echo -e "  ${GREEN}Frontend built → .tmp/public/${NC}"

# ── 4. Install desktop dependencies ─────────────────────────────────
echo -e "\n${YELLOW}[4/7] Installing desktop dependencies...${NC}"
cd desktop
npm install 2>/dev/null
cd "$ROOT_DIR"
echo -e "  ${GREEN}Desktop deps installed${NC}"

# ── 5. Commit, tag, push ────────────────────────────────────────────
echo -e "\n${YELLOW}[5/7] Committing and tagging...${NC}"
git add -A
git commit -m "release: v${NEW_VERSION}

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
git push
git push --tags
echo -e "  ${GREEN}Pushed v${NEW_VERSION}${NC}"

# ── 6. Build Electron for all platforms ──────────────────────────────
echo -e "\n${YELLOW}[6/7] Building Electron apps...${NC}"
cd desktop

# Build for current platform first, then others
echo -e "  Building for current platform..."
npx electron-builder --publish never 2>&1 | tail -5

# Note: Cross-platform builds require:
# - macOS: can build .dmg natively
# - Windows: needs Wine on macOS/Linux, or use CI
# - Linux: can build AppImage natively
echo -e "  ${GREEN}Electron build complete${NC}"
echo -e "  Artifacts in: desktop/dist/"
ls -la dist/ 2>/dev/null | grep -E "\.dmg|\.exe|\.AppImage|\.yml" || echo "  (check dist/ for outputs)"

cd "$ROOT_DIR"

# ── 7. Create GitHub Release ────────────────────────────────────────
echo -e "\n${YELLOW}[7/7] Creating GitHub Release...${NC}"

# Collect and rename release artifacts (spaces → hyphens to match latest-mac.yml)
ARTIFACTS=()
for f in desktop/dist/*"${NEW_VERSION}"*.dmg desktop/dist/*"${NEW_VERSION}"*.exe desktop/dist/*"${NEW_VERSION}"*.AppImage desktop/dist/latest*.yml; do
  if [ -f "$f" ]; then
    # Rename spaces to hyphens so GitHub URL matches latest-mac.yml
    newname=$(echo "$f" | sed 's/ /-/g')
    if [ "$f" != "$newname" ]; then
      mv "$f" "$newname"
      echo -e "  Renamed: $(basename "$f") → $(basename "$newname")"
    fi
    ARTIFACTS+=("$newname")
  fi
done

# Generate changelog from git log
PREV_TAG=$(git tag --sort=-version:refname | head -2 | tail -1)
if [ -z "$PREV_TAG" ] || [ "$PREV_TAG" = "v${NEW_VERSION}" ]; then
  CHANGELOG="Initial release"
else
  CHANGELOG=$(git log --oneline "${PREV_TAG}..HEAD" --no-merges | head -20)
fi

# Create release
if [ ${#ARTIFACTS[@]} -gt 0 ]; then
  echo -e "  Uploading ${#ARTIFACTS[@]} artifacts..."
  gh release create "v${NEW_VERSION}" "${ARTIFACTS[@]}" \
    --title "IOTA Free Forum v${NEW_VERSION}" \
    --notes "## What's Changed

${CHANGELOG}

## Downloads

| Platform | File |
|----------|------|
| macOS | \`.dmg\` |
| Windows | \`.exe\` |
| Linux | \`.AppImage\` |

### Auto-update
Existing desktop app users will be notified automatically.

### Web / Self-hosted
\`\`\`bash
git pull
npm install
cd frontend && npm install && cd ..
npm run build
npm start
\`\`\`
"
else
  echo -e "  ${YELLOW}No desktop artifacts found — creating source-only release${NC}"
  gh release create "v${NEW_VERSION}" \
    --title "IOTA Free Forum v${NEW_VERSION}" \
    --notes "## What's Changed

${CHANGELOG}

### Install / Update
\`\`\`bash
git pull
npm install
cd frontend && npm install && cd ..
npm run build
npm start
\`\`\`
"
fi

echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Release v${NEW_VERSION} published!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "  GitHub: https://github.com/deduzzo/iota-free-forum/releases/tag/v${NEW_VERSION}"
