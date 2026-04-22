---
description: Lightweight planning — bootstraps from a Jira ticket when no spec exists (since speckit.specify is skipped), produces a plan, done. No Context7 research, no design artifacts (data-model, contracts). Best for single-story tickets or well-understood features.
model: Claude Opus 4.6
tools:
  [
    "vscode",
    "execute",
    "read",
    "edit",
    "search",
    "todo",
    "atlassian/atlassian-mcp-server/*",
    "context7/*",
    "sequentialthinking/*",

  ]
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

0. **Bootstrap from Jira** (conditional — only if no spec.md exists yet):
   - Check if a `spec.md` already exists for the current feature (run `check-prerequisites.sh --json --paths-only` and check if the FEATURE_SPEC file exists)
   - **If spec.md exists**: Skip this step entirely, proceed to Step 1
   - **If spec.md does NOT exist**: Assume we need to bootstrap from Jira
     - Check if user input contains a Jira ticket ID (format: `PROJECT-NUMBER`, e.g., `PLAT-12345`)
     - If no Jira ticket ID in user input: Ask user to provide one and stop
     - If Jira ticket found:
     1. Fetch the Jira issue via `mcp__atlassian__getJiraIssue` using the ticket ID
     2. Extract: summary, description, acceptance criteria, priority, story points, linked issues
     3. Derive branch name per git conventions found in copilot instructions.
        - If user provided additional text after the ticket, use that for the slug instead
        - Slugify: lowercase, replace spaces/special chars with hyphens, max 50 chars
     4. Run `.ai/specify/scripts/bash/create-new-feature.sh --json "<branch name>"` from repo root
     5. Parse JSON output for BRANCH_NAME, FEATURE_DIR, SPEC_FILE
     6. Overwrite the template spec.md with Jira content:

        ```markdown
        # Feature Specification: <Jira Summary>

        **Jira Ticket**: [<TICKET>](https://iqgeo.atlassian.net/browse/<TICKET>)
        **Priority**: <from Jira>
        **Story Points**: <from Jira>
        **Status**: <from Jira>
        **Linked Issues**: <blockers and related tickets>

        ## Description

        <Jira description, cleaned up and formatted>

        ## Acceptance Criteria

        <From Jira, formatted as checklist>

        - [ ] Criterion 1
        - [ ] Criterion 2
        ```

     7. Proceed to Step 1

1. **Setup**: Run `.ai/specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g `'I'\''m Groot'` (or double-quote if possible: `"I'm Groot"`).

2. **Load context**:
   - Read FEATURE_SPEC and `.github/copilot-instructions.md` for project patterns
   - Load IMPL_PLAN template (already copied)
   - **Discover and load relevant instruction files**:
     - List `.github/instructions/` to find all available instruction files
     - Read only the frontmatter (`applyTo`) and first heading of each — lightweight scan
     - Read FEATURE_SPEC to identify the feature's domains (e.g., server API, UI components, database schema, auth, testing)
     - Load the full content of instruction files whose domain matches the feature
     - When in doubt, include the file — a missed constraint during planning is more costly than extra context
     - If no instruction files exist, rely on `copilot-instructions.md` alone
   - Keep loaded instructions in context for all design decisions

3. **Fill in plan.md**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context from the spec and loaded instructions
   - Fill Patterns Check section from discovered instruction files
   - Evaluate gates (ERROR if violations unjustified)
   - Define project structure and file paths
   - Skip Phase 0 (research) and Phase 1 (design artifacts) — go straight to filling the plan

4. **Prompt for review and acceptance before commit**:
   - Present the plan with file path and a concise summary
   - Ask for explicit acceptance: `Please review plan.md. You can edit the file directly or ask me to make changes. Reply accept when ready to commit.`
   - If the user requests edits, update and repeat this review step
   - If the user does not explicitly accept, stop after reporting the plan is ready for review

5. **Commit plan after explicit acceptance only**:
   - Stage and commit using the IQGeo commit message format:
     `<TICKET>: ai: Add plan for <feature slug>`
     If no Jira ticket: `ai: Add plan for <feature slug>`
   - Files to commit: `plan.md` (and `spec.md` if bootstrapped from Jira in Step 0)
   - Push the branch to origin: `git push -u origin <BRANCH>`

6. **Update Jira Issue** (if Jira ticket was provided):
   - Add the label `ai-assisted` to the Jira issue using `mcp__atlassian__editJiraIssue`
   - Transition the issue to "Selected for Development" using `mcp__atlassian__transitionJiraIssue`

7. **Stop and report**: Report branch, plan path, summary, and instruct the user to run `speckit.lite.implement` as the next step.

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
- No research.md, data-model.md, contracts/, or quickstart.md — keep it lean
