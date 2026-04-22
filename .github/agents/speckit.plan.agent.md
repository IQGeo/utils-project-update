---
description: Execute the implementation planning workflow using the plan template to generate design artifacts, leveraging Context7 for technical research and best practices.
model: Claude Sonnet 4.6
tools:
  [
    "vscode",
    "execute",
    "read",
    "edit",
    "search",
    "web",
    "context7/*",
    "agent",
    "atlassian/atlassian-mcp-server/*",
    "sequentialthinking/*",
    "todo",
  ]
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## MCP Integration - Context7 Research

### Technical Stack Research

When planning implementation, use Context7 to research best practices for the technologies identified in the spec or arguments:

1. **Library Documentation Lookup**:
   - For each framework or library involved in the planned feature:
     - `mcp__context7__resolve-library-id` to find the library
     - `mcp__context7__get-library-docs` to retrieve relevant documentation
   - Focus on: integration patterns, security best practices, testing approaches, and performance considerations

2. **Integration Patterns**:
   - Research patterns for any external service or library integrations planned
   - Look up testing patterns for the chosen stack
   - Find security best practices relevant to the feature domain

### Test Framework Selection

Before making any test framework decisions:

1. **Discover**: List `.github/instructions/` for a testing-related instruction file (look for a file with "test" in the name or a first heading referencing test suites or test frameworks).
2. **If found**: Read it fully — it defines the project's test framework, test locations, and required patterns. Follow it precisely. Do not assume framework or file paths; use exactly what the file specifies.
3. **If not found**: You cannot assume a test framework or test location. Ask the user:
   - What test framework is used?
   - Where should tests be located?
   - What test types are required (unit/integration/e2e/etc.)?

   Document the decision in `research.md`.

**CRITICAL RULES**:

- **NEVER** proceed with test planning without knowing the exact test location and framework
- **ALWAYS** look for a testing instruction file before asking the user — it may already have the answers
- **Document** the framework decision and exact test file paths in `research.md`

## Outline

1. **Setup**: Run `.ai/specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g `'I'\''m Groot'` (or double-quote if possible: `"I'm Groot"`).

2. **Load context**:
   - Read FEATURE_SPEC and `.github/copilot-instructions.md` for project patterns
   - Load IMPL_PLAN template (already copied)
   - **Discover and load relevant instruction files**:
     - List `.github/instructions/` to find all available instruction files
     - Read only the frontmatter (`applyTo`) and first heading of each — this is a lightweight scan to understand what each file covers
     - Read FEATURE_SPEC to identify the feature's domains (e.g., server API, UI components, database schema, auth, testing)
     - Load the full content of instruction files whose domain matches the feature — use the spec as the selection guide, not assumed code paths
     - When in doubt, include the file — a missed constraint during planning is more costly than extra context
     - If no instruction files exist, note the gap in `research.md` and rely on `copilot-instructions.md` alone
   - Keep loaded instructions in context for all Phase 1 design decisions

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Patterns Check section from discovered instruction files
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Patterns Check post-design

4. **Prompt for review and acceptance before commit** (always, after Phase 1 completes):
   - Present all generated planning artifacts with file paths and a concise summary of each artifact's purpose.
   - Explicitly instruct the user to review the generated markdown and contract files before they are committed. The user may edit the files directly in their editor before accepting.
   - Ask for explicit acceptance using clear wording such as: `Please review the planning artifacts. You can edit the files directly or ask me to make changes. Reply accept when ready to commit.`
   - If the user requests edits, update the artifacts and repeat this review step.
   - If the user does not explicitly accept, stop after reporting the artifacts are ready for review; do not commit.

5. **Commit plan artifacts after explicit acceptance only**:
   - Stage and commit all generated files using the IQGeo commit message format:
     `<TICKET>: ai: Add plan artifacts for <feature slug>`
     If no Jira ticket: `ai: Add plan artifacts for <feature slug>`
   - Files to commit: `plan.md`, `research.md`, `data-model.md` (if created), `contracts/` (if created), `quickstart.md` (if created)
   - Do NOT push — pushing happens only in `speckit.specify` and `speckit.pr`.

6. **Stop and report**: Command ends after Phase 1 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task
   - **Test framework decision** → follow Test Framework Selection process above

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   For test framework (if not resolved by instruction file):
     Task: "Evaluate test framework options for this project"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]
   - **Test Framework**: [framework and location] — [justification if instruction file was absent]

**Output**: research.md with all NEEDS CLARIFICATION resolved, including test framework and location

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.ai/specify/scripts/bash/update-agent-context.sh copilot`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/\*, quickstart.md, agent-specific file

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
