#!/usr/bin/env bash
set -euo pipefail

# Release script: bumps package.json, pushes tag, creates a GitHub release
# with auto-generated notes. The `publish.yml` workflow takes it from there
# and publishes to npm.

for cmd in gh npm git node; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: required command '$cmd' not found in PATH." >&2
        exit 1
    fi
done

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: working tree is not clean. Commit or stash changes first." >&2
    exit 1
fi

branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$branch" != "main" ]]; then
    read -r -p "You are on '$branch', not main. Continue anyway? [y/N] " confirm
    [[ "$confirm" == "y" || "$confirm" == "Y" ]] || exit 1
fi

echo "Fetching latest from origin..."
git fetch origin --tags --prune

if ! git diff --quiet "HEAD..origin/$branch" 2>/dev/null; then
    echo "Error: local '$branch' is out of sync with 'origin/$branch'. Pull or push first." >&2
    exit 1
fi

current=$(node -p "require('./package.json').version")
echo "Current version: $current"
echo

PS3="Select release type: "
select bump in patch minor major cancel; do
    case "${bump:-}" in
        patch|minor|major) break ;;
        cancel) echo "Cancelled."; exit 0 ;;
        *) echo "Invalid choice." ;;
    esac
done

new_version=$(npm version "$bump" --no-git-tag-version)
tag="$new_version"

echo
echo "About to release $tag (was v$current)."
read -r -p "Proceed? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Reverting version bump."
    git checkout -- package.json package-lock.json 2>/dev/null || git checkout -- package.json
    exit 1
fi

git add package.json package-lock.json 2>/dev/null || git add package.json
git commit -m "Release $tag"
git tag -a "$tag" -m "$tag"

echo "Pushing commit and tag to origin..."
git push origin "$branch"
git push origin "$tag"

echo "Creating GitHub release..."
gh release create "$tag" \
    --title "$tag" \
    --generate-notes \
    --verify-tag

echo
echo "Released $tag. The publish workflow will ship it to npm."
