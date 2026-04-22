---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md with Jira progress tracking
model: GPT-5.4
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
    "playwright/*",
    "todo",
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

1. Run `.ai/specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g `'I'\''m Groot'` (or double-quote if possible: `"I'm Groot"`).

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:
     ```
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```
   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios
   - **Load instruction files for implementation context**:
     - Always load `.github/copilot-instructions.md` for core project patterns
     - List `.github/instructions/` to discover available instruction files
     - For each implementation phase, identify the file paths being modified or created
     - Load instruction files whose `applyTo` glob pattern matches those file paths
     - If no instruction files exist, rely on `copilot-instructions.md` alone
     - **Limit**: Load max 3-4 instruction files per phase to preserve context
     - **Strategy**: Load incrementally per phase — not all at once upfront
     - **Reload**: If a later phase touches a different code area, discover and load the relevant file then

4. Parse tasks.md structure and extract:
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
   - **Polish and validation**: Unit tests, performance optimization, documentation
   - **Browser/GUI testing with Playwright**: Use `playwright/*` MCP tools for any browser-based or UI tests
     - Base URL: `https://dev.local.iqgeo` (or the value of `MYW_EXT_BASE_URL` in the environment)
     - GUI test suites inherit `MywGuiTestSuite` — see `core_testing.instructions.md` for the correct test file location
     - Use Playwright to navigate to pages, interact with UI elements, and assert visual/functional outcomes

7. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.
   - **REVIEW BEFORE CHECKPOINT COMMIT**: After completing each user story phase (checkpoint), present the changed files — especially the updated `tasks.md` and any generated markdown artifacts — and ask the user to review them.
   - Require explicit acceptance before creating the checkpoint commit. Use clear wording such as: `Please review the completed checkpoint changes. Reply accept to commit them, or tell me what to change.`
   - If the user requests edits, make them, re-run any relevant validation, and repeat the review step.
   - If the user does not explicitly accept, stop after reporting the checkpoint is ready for review; do not commit.
   - **COMMIT PER STORY**: After explicit acceptance, commit all code files AND the updated `tasks.md` together using the IQGeo commit message format:
     `<TICKET>: <component>: Implement <user story title> (US<N>)`
     Example: `PLAT-12345: server: Implement network element creation (US1)`
     Use the appropriate component (`server`, `client`, `db`, `test`, etc.) for the primary files changed.
     If multiple components changed, use the dominant one (or split into separate commits per component).
   - Do NOT push during implementation — pushing happens only in `speckit.pr`.

8. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/tasks` first to regenerate the task list.
