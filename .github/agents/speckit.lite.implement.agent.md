---
description: Lightweight implementation — works from plan.md and spec.md, optionally picks up tasks.md if present. Conditional Jira progress tracking. No checklists, no Playwright browser testing. Best for single-story tickets or well-understood features.
model: GPT-5.4
tools:
  [
    "vscode",
    "execute",
    "read",
    "edit",
    "search",
    "todo",
    "agent",
    "atlassian/atlassian-mcp-server/*",
    "sequentialthinking/*",
    "playwright/*",
    "context7/*",
  ]
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## MCP Integration - Jira Progress Tracking

### Task Status Updates

If tasks were created in Jira, update their status:

1. **Before Starting Task**:
   - If task has Jira ID (e.g., `[PLAT-12345]` in tasks.md)
   - Update status to "In Progress"
   - Add comment: "Starting implementation: {task description}"

2. **After Completing Task**:
   - Update Jira status to "Ready for Review"
   - Log work time if tracking enabled
   - Add implementation notes as comment
   - Link any created files or commits

3. **On Task Failure**:
   - Update Jira with blocker information
   - Add error details as comment
   - Set status to "On Hold" if cannot proceed

### Progress Reporting

```markdown
Task Progress Update:

- Jira: PLAT-12345
- Status: In Progress → Done
- Time: 30 minutes
- Notes: Implemented following project patterns
```

## Outline

1. Run `.ai/specify/scripts/bash/check-prerequisites.sh --json --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g `'I'\''m Groot'` (or double-quote if possible: `"I'm Groot"`).
   - Note: `--require-tasks` is intentionally omitted — tasks.md is optional. The implement agent works in two modes depending on whether tasks.md exists.

2. Load and analyze the implementation context:
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **REQUIRED**: Read spec.md for acceptance criteria as definition of done
   - **IF EXISTS**: Read tasks.md for pre-defined task list and execution plan
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **Determine execution mode**:
     - **Tasks mode** (tasks.md exists): Use the pre-defined task breakdown — proceed to step 4
     - **Plan mode** (no tasks.md): Derive implementation approach from plan.md — proceed to step 3
   - **Load instruction files for implementation context**:
     - Always load `.github/copilot-instructions.md` for core project patterns
     - List `.github/instructions/` to discover available instruction files
     - For each implementation phase, identify the file paths being modified or created
     - Load instruction files whose `applyTo` glob pattern matches those file paths
     - If no instruction files exist, rely on `copilot-instructions.md` alone
     - **Limit**: Load max 3-4 instruction files per phase to preserve context
     - **Strategy**: Load incrementally per phase — not all at once upfront
     - **Reload**: If a later phase touches a different code area, discover and load the relevant file then

3. **Derive implementation approach** (plan mode only — skip if tasks.md exists):
   - Extract acceptance criteria from spec.md as the definition of done
   - Extract project structure, file paths, and architecture from plan.md
   - Extract entities from data-model.md (if exists), endpoints from contracts/ (if exists)
   - Build a lightweight execution order:
     1. **Foundation**: DB schema, models, base classes (from plan.md project structure)
     2. **Core implementation**: Services, controllers, business logic — ordered by dependency
     3. **UI/Client**: Frontend components, views (if applicable)
     4. **Integration**: Wiring, configuration, middleware
     5. **Validation**: Tests, acceptance criteria verification
   - Use this derived order for steps 5-6 instead of tasks.md phases
   - **No tasks.md file is created** — the agent works directly from plan artifacts

4. Parse tasks.md structure and extract (tasks mode only — skip if no tasks.md):
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

5. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding

6. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: Write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Tests, documentation

7. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** If tasks.md exists, mark completed tasks as [X] in the tasks file.
   - **REVIEW BEFORE CHECKPOINT COMMIT**: After completing each logical milestone, present the changed files and ask the user to review them.
   - Require explicit acceptance before creating the checkpoint commit: `Please review the completed checkpoint changes. Reply accept to commit them, or tell me what to change.`
   - If the user requests edits, make them and repeat the review step.
   - If the user does not explicitly accept, stop after reporting the checkpoint is ready for review; do not commit.
   - **COMMIT PER MILESTONE**: After explicit acceptance, commit using the IQGeo commit message format:
     `<TICKET>: <component>: Implement <description>`
     Use the appropriate component (`server`, `client`, `db`, `test`, etc.) for the primary files changed.
   - Do NOT push during implementation — pushing happens only in `speckit.pr`.

8. Completion validation:
   - Verify all acceptance criteria from spec.md are met
   - If tasks.md exists, verify all required tasks are completed
   - Validate that tests pass
   - Confirm the implementation follows the plan
   - Report final status with summary of completed work

Note: This command works in two modes:

- **With tasks.md**: Follows pre-defined task breakdown (if tasks were generated before calling lite.implement)
- **Without tasks.md**: Derives implementation steps from plan.md + spec.md (the typical lite workflow — plan → implement). Suitable for single-story tickets or well-specified features where task decomposition adds overhead without value.

## Key rules

- Use absolute paths
- No checklist validation — proceed straight to implementation
- Jira tracking is conditional — only update Jira if task IDs (e.g., `[PLAT-12345]`) are present in tasks.md or spec.md
