---
description: Create or update the feature specification from a natural language feature description, integrating with Jira tickets when available.
model: Claude Opus 4.6
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

## MCP Integration - Jira Context

### Check for Jira Context

Before running the create-new-feature script, check if the user input contains a Jira ticket ID (format: PLAT-12345, etc.):

1. **If Jira ticket ID found**:
   - Extract the ticket number (e.g., PLAT-12345) from the user input
   - Use `mcp__atlassian__getJiraIssue` to fetch the ticket details
   - Extract: summary, description, acceptance criteria, priority, story points, labels
   - Check for linked issues (blocked by, blocks, relates to)
   - **Determine branch name for script**:
   - Check the project instruction files (e.g. `.github/instructions/` or `.github/copilot-instructions.md`) for the branch naming convention.
   - If user provided additional description text after the ticket: slugify it for the short-description.
   - Otherwise: slugify the Jira summary for the short-description.
   - Construct the full branch name, e.g. `enh/PLAT-12345-add-spatial-filtering`.
   - Pass to create-new-feature.sh as the **single positional argument** (the complete branch name).
   - Example: If ticket PLAT-12345 has summary "Add spatial filtering feature":
     - Script call: `.ai/specify/scripts/bash/create-new-feature.sh --json "enh/PLAT-12345-add-spatial-filtering"`
     - Creates branch: `enh/PLAT-12345-add-spatial-filtering`
   - Pre-populate spec with Jira information:
     - Use Jira ticket ID and summary as feature title
     - Parse Jira description for requirements
     - Convert acceptance criteria to success criteria
     - Note dependencies from linked issues

2. **If no Jira ticket ID found**:
   - Ask user to provide a ticket number in format `PROJECT-NUMBER` (e.g., PLAT-12345)
   - Optionally offer to search for related tickets using keywords:
   - Use `mcp__atlassian__searchJiraIssuesUsingJql` with appropriate JQL
   - Example: `project = "PLAT" AND summary ~ "feature_keyword" AND status != Done`

3. **Reference in Spec Metadata**:
   - Add Jira ticket reference in spec header
   - Include ticket URL for traceability
   - Note ticket status and assignee

### Example Jira Integration

```markdown
# Feature Specification: [JIRA_SUMMARY]

**Jira Ticket**: [PLAT-123](https://iqgeo.atlassian.net/browse/PLAT-123)
**Priority**: P2
**Story Points**: 5
**Status**: In Progress
```

## IQGeo-Specific Patterns

All IQGeo naming, security, spatial, and testing conventions are defined in `copilot_instructions.md`.
Apply those standards automatically when generating specifications.
Only extend or override them here if this feature introduces unique requirements.

## Outline

The text the user typed after `/speckit.specify` in the triggering message **is** the feature description, possibly including a Jira ticket reference. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description (and optional Jira context), do this:

1. **Parse the user input to extract ticket number and optional description**:
   - Expected formats:
     - `PLAT-12345` (ticket only - will fetch description from Jira)
     - `PLAT-12345 <additional description>` (ticket + custom description)
     - `<feature description>` (description only - will prompt for ticket)
   - If ticket number found (format: `PROJECT-NUMBER`):
     - Fetch Jira issue details using `mcp__atlassian__getJiraIssue`
     - If user provided additional description, use it; otherwise use Jira summary
   - If no ticket number found, ask user to provide one in format `PROJECT-NUMBER` (e.g., PLAT-12345)
2. Check the project instruction files for the branch naming convention and construct the branch name accordingly.
   - Pass the complete branch name as the **only positional argument** to the script.
3. Run the script `.ai/specify/scripts/bash/create-new-feature.sh --json "<branch-name>"` from repo root and parse its JSON output for BRANCH_NAME, FEATURE_DIR, SPEC_FILE, FEATURE_NUM, and TICKET_NUMBER. All file paths must be absolute.
   - Example: `.ai/specify/scripts/bash/create-new-feature.sh --json "enh/PLAT-12345-add-new-spatial"`
   - The ticket number (PLAT-12345) and feature name are extracted from the branch automatically.
   - This will create branch: `enh/PLAT-12345-add-new-spatial`
   - **IMPORTANT** You must only ever run this script once. The JSON is provided in the terminal as output - always refer to it to get the actual content you're looking for. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **CRITICAL**: Ask the user if they want to update the Jira issue status to "DEV IN PROGRESS". **If they confirm YES, you MUST immediately call the Atlassian MCP tool** (e.g., `mcp__atlassian__transitionJiraIssue` with the ticket number and appropriate transition ID/name) to actually update the status. **DO NOT skip this step if the user confirms.**
4. Load `.ai/specify/templates/spec-template.md` to understand required sections.

5. Follow this execution flow:
   1. Parse user description from Input
      If empty: ERROR "No feature description provided"
   2. Extract key concepts from description
      Identify: actors, actions, data, constraints
   3. For unclear aspects:
      - Make informed guesses based on context and industry standards
      - Only mark with [NEEDS CLARIFICATION: specific question] if:
        - The choice significantly impacts feature scope or user experience
        - Multiple reasonable interpretations exist with different implications
        - No reasonable default exists
      - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
      - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
   4. Fill User Scenarios & Testing section
      If no clear user flow: ERROR "Cannot determine user scenarios"
   5. Generate Functional Requirements
      Each requirement must be testable
      Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
   6. Define Success Criteria
      Create measurable, technology-agnostic outcomes
      Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
      Each criterion must be verifiable without implementation details
   7. Identify Key Entities (if data involved)
   8. Return: SUCCESS (spec ready for planning)

6. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.

7. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist**: Generate a checklist file at `FEATURE_DIR/checklists/requirements.md` using the checklist template structure with these validation items:

   ```markdown
   # Specification Quality Checklist: [FEATURE NAME]

   **Purpose**: Validate specification completeness and quality before proceeding to planning
   **Created**: [DATE]
   **Feature**: [Link to spec.md]

   ## Content Quality

   - [ ] No implementation details (languages, frameworks, APIs)
   - [ ] Focused on user value and business needs
   - [ ] Written for non-technical stakeholders
   - [ ] All mandatory sections completed

   ## Requirement Completeness

   - [ ] No [NEEDS CLARIFICATION] markers remain
   - [ ] Requirements are testable and unambiguous
   - [ ] Success criteria are measurable
   - [ ] Success criteria are technology-agnostic (no implementation details)
   - [ ] All acceptance scenarios are defined
   - [ ] Edge cases are identified
   - [ ] Scope is clearly bounded
   - [ ] Dependencies and assumptions identified

   ## Feature Readiness

   - [ ] All functional requirements have clear acceptance criteria
   - [ ] User scenarios cover primary flows
   - [ ] Feature meets measurable outcomes defined in Success Criteria
   - [ ] No implementation details leak into specification

   ## Notes

   - Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`
   ```

   b. **Run Validation Check**: Review the spec against each checklist item:
   - For each item, determine if it passes or fails
   - Document specific issues found (quote relevant spec sections)

   c. **Handle Validation Results**:
   - **If all items pass**: Mark checklist complete and proceed to step 6

   - **If items fail (excluding [NEEDS CLARIFICATION])**:
     1. List the failing items and specific issues
     2. Update the spec to address each issue
     3. Re-run validation until all items pass (max 3 iterations)
     4. If still failing after 3 iterations, document remaining issues in checklist notes and warn user

   - **If [NEEDS CLARIFICATION] markers remain**:
     1. Extract all [NEEDS CLARIFICATION: ...] markers from the spec
     2. **LIMIT CHECK**: If more than 3 markers exist, keep only the 3 most critical (by scope/security/UX impact) and make informed guesses for the rest
     3. For each clarification needed (max 3), present options to user in this format:

        ```markdown
        ## Question [N]: [Topic]

        **Context**: [Quote relevant spec section]

        **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]

        **Suggested Answers**:

        | Option | Answer                    | Implications                          |
        | ------ | ------------------------- | ------------------------------------- |
        | A      | [First suggested answer]  | [What this means for the feature]     |
        | B      | [Second suggested answer] | [What this means for the feature]     |
        | C      | [Third suggested answer]  | [What this means for the feature]     |
        | Custom | Provide your own answer   | [Explain how to provide custom input] |

        **Your choice**: _[Wait for user response]_
        ```

     4. **CRITICAL - Table Formatting**: Ensure markdown tables are properly formatted:
        - Use consistent spacing with pipes aligned
        - Each cell should have spaces around content: `| Content |` not `|Content|`
        - Header separator must have at least 3 dashes: `|--------|`
        - Test that the table renders correctly in markdown preview
     5. Number questions sequentially (Q1, Q2, Q3 - max 3 total)
     6. Present all questions together before waiting for responses
     7. Wait for user to respond with their choices for all questions (e.g., "Q1: A, Q2: Custom - [details], Q3: B")
     8. Update the spec by replacing each [NEEDS CLARIFICATION] marker with the user's selected or provided answer
     9. Re-run validation after all clarifications are resolved

   d. **Update Checklist**: After each validation iteration, update the checklist file with current pass/fail status

8. **Update Jira Issue** (if ticket was provided):
   - Add the label `ai-assisted` to the Jira issue using `mcp__atlassian__editJiraIssue`
   - This indicates AI tooling was used in specification generation
   - If the Confluence page was created/linked in a previous step, ensure that link is preserved

9. **Prompt for review and acceptance before commit** (always):
   - Present the generated `FEATURE_DIR/spec.md` and `FEATURE_DIR/checklists/` to the user with file paths and a short summary of what changed.
   - Explicitly instruct the user to review the generated markdown files before they are committed. The user may edit the files directly in their editor before accepting.
   - Ask for explicit acceptance using clear wording such as: `Please review the generated spec artifacts. You can edit the files directly or ask me to make changes. Reply accept when ready to commit.`
   - If the user requests edits, update the files, re-run validation, refresh the checklist status, and repeat this review step.
   - If the user does not explicitly accept, stop after reporting the files are ready for review; do not commit or push.

10. **Commit and push after explicit acceptance only**:
    - Stage and commit `FEATURE_DIR/spec.md` and `FEATURE_DIR/checklists/` using the IQGeo commit message format:
      `<TICKET>: ai: Add spec.md for <feature slug>`
      If no Jira ticket: `ai: Add spec.md for <feature slug>`
    - Push the branch to origin: `git push -u origin <BRANCH_NAME>`
    - Construct the GitHub URL for spec.md on this branch (derive from `git remote get-url origin` — convert SSH to HTTPS if needed):
      `https://github.com/<org>/<repo>/blob/<BRANCH_NAME>/.ai/specs/<feature-dir>/spec.md`

11. **Post Jira comment** (if ticket was provided):

- Add a comment to the Jira ticket using `mcp__atlassian__addCommentToJiraIssue`:
  ```
  [speckit] Spec ready for review
  Branch: <BRANCH_NAME>
  Spec: <GitHub URL to spec.md>
  ```

11. Report completion with branch name, spec file path, checklist results, and readiness for the next phase (`/speckit.clarify` or `/speckit.plan`).

**NOTE:** The script creates and checks out the new branch and initializes the spec file before writing.

## General Guidelines

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec. That will be a separate command.

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers - use only for critical decisions that:
   - Significantly impact feature scope or user experience
   - Have multiple reasonable interpretations with different implications
   - Lack any reasonable default
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
6. **Common areas needing clarification** (only if no reasonable default exists):
   - Feature scope and boundaries (include/exclude specific use cases)
   - User types and permissions (if multiple conflicting interpretations possible)
   - Security/compliance requirements (when legally/financially significant)

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
- Authentication method: Standard session-based or OAuth2 for web apps
- Integration patterns: RESTful APIs unless specified otherwise

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective, not system internals
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good examples**:

- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"
- "95% of searches return results in under 1 second"
- "Task completion rate improves by 40%"

**Bad examples** (implementation-focused):

- "API response time is under 200ms" (too technical, use "Users see results instantly")
- "Database can handle 1000 TPS" (implementation detail, use user-facing metric)
- "React components render efficiently" (framework-specific)
- "Redis cache hit rate above 80%" (technology-specific)

```

```
