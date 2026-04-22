#!/usr/bin/env bash

set -e

# Branch naming is flexible - any format can be used.
# Common examples:
#   - enh/<TICKET>-<short-description> (e.g., enh/PLAT-12345-add-damage-assessment)
#   - feature/<description> (e.g., feature/my-new-feature)
# If a ticket number in PROJECT-NUMBER format is present, it will be extracted.

JSON_MODE=false
ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_MODE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--json] <branch-name>"
            echo ""
            echo "  <branch-name>  The complete Git branch name for the feature."
            echo "                 Example: enh/PLAT-12345-add-damage-assessment"
            echo "                 Example: feature/my-new-feature"
            echo ""
            echo "  If the branch name contains a ticket number (PROJECT-NUMBER format),"
            echo "  it will be extracted automatically."
            exit 0
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Single argument: the complete branch name
BRANCH_NAME="${ARGS[0]}"

if [ -z "$BRANCH_NAME" ]; then
    echo "Usage: $0 [--json] <branch-name>" >&2
    echo "Example: $0 enh/PLAT-12345-add-damage-assessment" >&2
    echo "Example: $0 feature/my-new-feature" >&2
    exit 1
fi

# Derive the feature name from the branch leaf (everything after the last '/')
FEATURE_NAME="${BRANCH_NAME##*/}"

if [[ -z "$FEATURE_NAME" ]]; then
    echo "Error: Could not derive feature name from branch '$BRANCH_NAME'" >&2
    exit 1
fi

# Validate BRANCH_NAME as a legal git ref when git is available
if command -v git >/dev/null 2>&1; then
    if ! git check-ref-format --branch "$BRANCH_NAME" >/dev/null 2>&1; then
        echo "Error: '$BRANCH_NAME' is not a valid branch name" >&2
        exit 1
    fi
fi

# Validate FEATURE_NAME: only allow alphanumerics, hyphens, underscores, and dots (no path traversal)
if [[ ! "$FEATURE_NAME" =~ ^[A-Za-z0-9._-]+$ ]]; then
    echo "Error: Feature name '$FEATURE_NAME' contains invalid characters. Only alphanumerics, hyphens, underscores, and dots are allowed." >&2
    exit 1
fi

# Extract ticket number from the feature name (e.g., PLAT-12345 from PLAT-12345-add-damage-assessment)
# This is optional - not all branch names will have a ticket number
TICKET_NUMBER=$(echo "$FEATURE_NAME" | grep -oE '^[A-Z]+-[0-9]+' || true)

# Extract feature number from ticket if available (e.g., 12345 from PLAT-12345)
if [ -n "$TICKET_NUMBER" ]; then
    FEATURE_NUM=$(echo "$TICKET_NUMBER" | grep -o '[0-9]\+$')
else
    FEATURE_NUM=""
fi

# Function to find the repository root by searching for existing project markers
find_repo_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.git" ] || [ -d "$dir/.ai" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# Resolve repository root. Prefer git information when available, but fall back
# to searching for repository markers so the workflow still functions in repositories that
# were initialised with --no-git.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    HAS_GIT=true
else
    REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
    if [ -z "$REPO_ROOT" ]; then
        echo "Error: Could not determine repository root. Please run this script from within the repository." >&2
        exit 1
    fi
    HAS_GIT=false
fi

cd "$REPO_ROOT"

SPECS_DIR="$REPO_ROOT/.ai/specs"
mkdir -p "$SPECS_DIR"

if [ "$HAS_GIT" = true ]; then
    git checkout -b "$BRANCH_NAME"
else
    >&2 echo "[specify] Warning: Git repository not detected; skipped branch creation for $BRANCH_NAME"
fi

# Use the branch leaf name for the feature directory so the agent can control
# naming based on repository instructions.
FEATURE_DIR="$SPECS_DIR/$FEATURE_NAME"
mkdir -p "$FEATURE_DIR"

TEMPLATE="$REPO_ROOT/.ai/specify/templates/spec-template.md"
SPEC_FILE="$FEATURE_DIR/spec.md"
if [ -f "$TEMPLATE" ]; then cp "$TEMPLATE" "$SPEC_FILE"; else touch "$SPEC_FILE"; fi

# Set the SPECIFY_FEATURE environment variable for the current session
export SPECIFY_FEATURE="$FEATURE_NAME"

if $JSON_MODE; then
    if [ -n "$TICKET_NUMBER" ]; then
        printf '{"BRANCH_NAME":"%s","FEATURE_DIR":"%s","SPEC_FILE":"%s","FEATURE_NUM":"%s","TICKET_NUMBER":"%s"}\n' "$BRANCH_NAME" "$FEATURE_DIR" "$SPEC_FILE" "$FEATURE_NUM" "$TICKET_NUMBER"
    else
        printf '{"BRANCH_NAME":"%s","FEATURE_DIR":"%s","SPEC_FILE":"%s"}\n' "$BRANCH_NAME" "$FEATURE_DIR" "$SPEC_FILE"
    fi
else
    echo "BRANCH_NAME: $BRANCH_NAME"
    echo "FEATURE_DIR: $FEATURE_DIR"
    echo "SPEC_FILE: $SPEC_FILE"
    if [ -n "$TICKET_NUMBER" ]; then
        echo "FEATURE_NUM: $FEATURE_NUM"
        echo "TICKET_NUMBER: $TICKET_NUMBER"
    fi
    echo "SPECIFY_FEATURE environment variable set to: $FEATURE_NAME"
fi
