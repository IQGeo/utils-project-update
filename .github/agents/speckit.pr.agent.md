---
description: Create commits following IQGeo conventions and generate a pull request with proper template
model: Claude Sonnet 4.6
tools:
  [
    "vscode",
    "execute",
    "read",
    "edit",
    "search",
    "web",
    "azure-mcp/search",
    "context7/*",
    "agent",
    "atlassian/atlassian-mcp-server/*",
    "github/*",
    "todo",
  ]
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Overview

This command automates the pull request creation workflow:

1. Create commits following IQGeo commit message conventions
2. Push branch to remote
3. Generate PR description from spec
4. Create GitHub pull request with template
5. Update Jira ticket status

## IQGeo Commit Message Convention

**REQUIRED Format**: `<Issue Number>: <component>: <description>`

All commits **MUST** follow this exact pattern:

- **Issue Number**: Jira issue (e.g., PLAT-11223, PROJ-5678) - REQUIRED
- **Component**: One of: `server`, `client`, `test`, `config`, `db`, `docs`, `native`, `tools`, `ai` - REQUIRED
- **Description**: Short single-line description of the change - REQUIRED

**Pattern Validation**:

- Format: `^[A-Z]+-\d+: (server|client|test|config|db|docs|native|tools|ai): .+$`
- Issue and component are separated by `: ` (colon space)
- Component and description are separated by `: ` (colon space)
- Description should be concise (typically under 72 characters)

**Valid Examples**:

```
PLAT-12345: server: Add MywDamageController with authorization
PLAT-12345: db: Add damage_assessments table with spatial index
PLAT-12345: client: Add damage assessment form component
PLAT-12345: test: Add controller tests for damage assessment
PROJ-5678: config: Update layer configuration for damage workflow
```

**Invalid Examples**:

```
❌ PLAT-12345 Add damage controller (missing component)
❌ PLAT-12345: Add damage controller (missing component)
❌ Add damage controller (missing issue number)
❌ PLAT-12345: Server: Add controller (component must be lowercase)
```

## Pull Request Requirements

- Must follow `.github/pull_request_template.md`
- Must reference Jira issue
- Must provide summary of what the PR is about
- Must have "Changes Made" section
- If not all checklist boxes can be checked, set PR as **draft**
- Developer should check off as many boxes as possible

## Outline

### 1. Load Specification Context

Run `.ai/specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS. All paths must be absolute.

Read required files:

- `spec.md` - For feature description and Jira ticket
- `tasks.md` - For list of completed work
- `plan.md` - For technical changes overview

### 2. Check Current Git Status

Run `git status --porcelain` to determine:

- Are there uncommitted changes?
- Are there unpushed commits?
- What is the current branch name?

**State Detection**:

- **State A**: Uncommitted changes exist → Need to create commits
- **State B**: Commits exist but not pushed → Need to push branch
- **State C**: Branch pushed → Need to create PR
- **State D**: PR already exists → Show PR URL and exit

### 3. Extract Jira Issue Number

From `spec.md`, extract the Jira issue number (format: `PLAT-12345`, `BUG-5678`, etc.)

If no Jira issue found, ask user:

```
No Jira issue found in spec.md. Please provide Jira issue number (or press Enter to skip):
```

### 4. State A: Create Commits (if uncommitted changes exist)

**Validate Commit Messages**:

Before showing the user, validate that ALL proposed commit messages follow the required pattern:

- Pattern: `^[A-Z]+-\d+: (server|client|test|config|db|docs|native|tools): .+$`
- If any commit doesn't match, regenerate it to conform
- Ensure component is lowercase
- Ensure proper spacing with `: ` separators

**STOP and ask user**:

```markdown
## Ready to Create Commits

I will create commits following IQGeo REQUIRED conventions:

- **REQUIRED Format**: `<ISSUE>: <component>: <description>`
- Grouped by component (server, client, test, db, etc.)
- All commits validated against pattern

Modified files:
[list files from git status]

Proposed commits:

1. PLAT-12345: db: Add damage_assessments schema with spatial index
   - WebApps/myworldapp/core/server/models/myw_damage_model.py
   - WebApps/myworldapp/db_schema/tables/damage_assessments.sql

2. PLAT-12345: server: Implement damage assessment controller
   - WebApps/myworldapp/core/server/controllers/myw_damage_controller.py

3. PLAT-12345: client: Add damage assessment form
   - WebApps/myworldapp/core/client/components/DamageForm.jsx

4. PLAT-12345: test: Add damage assessment tests
   - WebApps/myworldapp/core/tests/test_damage_controller.py

Proceed with creating these commits? (yes/no/customize)
```

If user says "yes":

- Create commits as proposed
- Group related files by component
- Use descriptive but concise messages

If user says "customize":

- Ask user to provide custom commit structure
- Follow user's grouping preferences
- **CRITICAL**: Validate ALL custom commit messages against required pattern
- If any message doesn't match pattern, show error and ask user to fix:

  ```
  ❌ Invalid commit message format: "<user's message>"

  Required format: <ISSUE>: <component>: <description>
  Example: PLAT-12345: server: Add damage controller

  Please provide a valid commit message.
  ```

If user says "no":

- Exit and let user create commits manually

**Commit Grouping Logic**:

- **db**: Files in `db_schema/`, `*_model.py`, `*_models.py`, `migrations/`
- **server**: Files in `server/` (controllers, services, utilities)
- **client**: Files in `client/` (JavaScript, JSX, React components)
- **config**: Files in `config/`
- **test**: Files in `tests/`, `*_test.py`, `*_test.js`
- **docs**: Files in `Doc/`, `*.md`
- **native**: Files in `native/`

**Creating Commits**:

```bash
# For each commit group:
# 1. Validate message format
# Pattern: ^[A-Z]+-\d+: (server|client|test|config|db|docs|native|tools): .+$
# Example: PLAT-12345: server: Add damage controller

# 2. Add files and commit
git add <files for this component>
git commit -m "<ISSUE>: <component>: <description>"

# 3. Verify commit message was created correctly
git log -1 --pretty=%B
```

**Validation Rules**:

- Issue number must be uppercase with format: `[A-Z]+-\d+`
- Component must be lowercase: `server`, `client`, `test`, `config`, `db`, `docs`, `native`, or `tools`
- Use `: ` (colon space) as separator between parts
- Description should be imperative mood ("Add", "Fix", "Update", not "Added", "Fixed")
- If validation fails, regenerate commit message and try again

### 5. State B: Push Branch (if commits exist but not pushed)

**STOP and ask user**:

```markdown
## Ready to Push Branch

Branch: <branch-name>
Commits to push: <count>

Recent commits:

- <commit 1 message>
- <commit 2 message>
- <commit 3 message>

Push to origin? (yes/no)
```

If user says "yes":

```bash
# Verify all commit messages follow pattern before pushing
for commit in $(git log origin/master..HEAD --format=%H); do
  msg=$(git log -1 --pretty=%B $commit)
  # Validate format: <ISSUE>: <component>: <description>
  # If invalid, stop and report error
done

git push -u origin <branch-name>
```

**Pre-push Validation**:

- Check all commits in the branch follow the required pattern
- Pattern: `^[A-Z]+-\d+: (server|client|test|config|db|docs|native|tools): .+$`
- If any commit fails validation, STOP and show error:

  ```
  ❌ Cannot push: Invalid commit message found

  Commit: <hash>
  Message: "<invalid message>"

  Required format: <ISSUE>: <component>: <description>

  Please fix commit messages with: git rebase -i origin/master
  ```

If user says "no":

- Exit and let user push manually

### 6. State C: Create Pull Request

**Generate PR Description** from spec:

**Title**:

- Use format: `<Issue>: <Short description from spec>`
- Example: `PLAT-12345: Add damage assessment workflow`

**Description**:

1. Read the PR template from `.github/pull_request_template.md`
2. Populate template sections:

**## Description**

- Use summary from `spec.md` (the "why")

**## Related Issue**

- Link to Jira ticket: `https://iqgeo.atlassian.net/browse/<ISSUE>`
- If no Jira issue, state: `N/A - Internal improvement`

**## Changes Made**

- Generate from `tasks.md` completed tasks (the "what")
- Format as bulleted list
- Group by component if helpful
- Example:
  ```
  - Added database schema for damage assessments with PostGIS support
  - Implemented MywDamageController with authorization checks
  - Created React form component for damage entry
  - Added comprehensive test coverage
  ```

**## Checklist**

- Copy checklist items exactly as they appear in `.github/pull_request_template.md`
- DO NOT hardcode checklist items - always read from template
- This ensures changes to template are automatically reflected

**## Additional Notes**

- Add any from spec: caveats, research notes, implementation decisions
- Include any known limitations or future enhancements
- Reference related specs or designs if applicable

**Determine Draft Status**:

Read the checklist from `.github/pull_request_template.md` and analyze which items can be auto-checked based on the spec-kit workflow:

**Typically Auto-checkable** (if applicable):

- Followed coding guidelines (if IQGeo pattern checks passed in `/speckit.analyze`)
- Reviewed changes (AI created them during `/speckit.implement`)
- Written/updated test cases (if tests exist in `tasks.md`)
- Commit messages follow convention (if created by this tool)

**Typically Need Manual Verification**:

- Release notes added
- User messages localized
- Tested changes locally
- Run tests locally
- Anywhere impact considered
- Jira Acceptance Criteria usable
- Documentation task created

**Important**: The actual checklist items come from the template file. This analysis should adapt to whatever items are present in `.github/pull_request_template.md`.

**STOP and ask user**:

```markdown
## Ready to Create Pull Request

Title: PLAT-12345: Add damage assessment workflow

Target branch: master (default)

Based on the checklist, this PR will be created as:
[X] Draft PR (some checklist items need manual verification)
[ ] Ready for Review (all items can be checked)

Checklist status:
✅ Auto-checkable items: 4/11
⚠️ Need manual verification: 7/11

Items requiring your attention:

- Release notes
- Localization
- Local testing
- Test execution
- Anywhere impact
- Jira Acceptance Criteria
- Documentation

Create PR as draft? (yes/no/show-full-description)
```

If user says "show-full-description":

- Display the complete PR description
- Ask again: "Create PR as draft? (yes/no)"

If user says "yes":

- Create PR using GitHub MCP
- Set as draft
- Add labels if appropriate

If user says "no":

- Ask: "Create as ready for review? (yes/no)"
- If yes, create non-draft PR

### 7. Update Jira Status and Post Comment

After PR created successfully, **STOP and ask user**:

```markdown
## Pull Request Created Successfully

PR: <PR URL>

Update Jira ticket PLAT-12345 status?

- Current status: In Progress
- New status: Ready for Review

Update Jira? (yes/no)
```

If user says "yes":

- Update Jira ticket status to "Ready for Review" using `mcp__atlassian__transitionJiraIssue`
- Post a comment to the Jira ticket using `mcp__atlassian__addCommentToJiraIssue` in this exact format:

  ```
  [speckit] PR raised
  PR: <PR URL>
  Plan: <GitHub URL to plan.md on branch>
  Data model: <GitHub URL to data-model.md on branch, if file exists>
  Contracts: <GitHub URL to contracts/ on branch, if directory exists>
  ```

  - Construct GitHub URLs from `git remote get-url origin` — convert SSH to HTTPS if needed
  - Omit lines for files/directories that don't exist in the feature dir

If user says "no":

- Skip Jira update
- Remind user to update manually

### 8. Final Summary

Display:

```markdown
## ✅ Pull Request Workflow Complete

- ✅ Commits created: <count>
- ✅ Branch pushed: <branch-name>
- ✅ PR created: <PR URL>
- ✅ Jira updated: <issue> (if updated)

Next steps:

1. Review PR checklist items in GitHub
2. Mark completed items in PR description
3. Run local tests if not done
4. Convert from draft when ready
5. Request reviewers

PR status: Draft
```

## Error Handling

- **No feature branch**: Error and exit
- **No spec.md**: Error - must run `/speckit.specify` first
- **No tasks.md**: Error - must run `/speckit.tasks` first
- **PR already exists**: Show existing PR URL, ask if user wants to update it
- **Git push fails**: Show error, provide manual push command
- **GitHub API error**: Show error, provide manual PR creation URL

## Notes

- Always ask before performing destructive operations (commits, push, PR)
- Respect user's workflow - allow skipping steps if already done
- Provide clear status updates at each step
- Handle both Jira and non-Jira workflows
- Support customization of commit structure
- Default to draft PR for safety

```

```
