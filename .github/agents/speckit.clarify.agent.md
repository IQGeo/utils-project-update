---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec, leveraging Jira context when available.
model: Claude Sonnet 4.6
tools:
  [
    "vscode",
    "execute",
    "read",
    "edit",
    "search",
    "web",
    "agent",
    "atlassian/atlassian-mcp-server/*",
    "todo",
  ]
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## MCP Integration - Jira Context

### Gather Additional Context from Jira

Before identifying ambiguities, check for Jira context:

1. **Check for Jira Ticket**:
   - If spec references a Jira ticket, fetch it
   - Use `mcp__atlassian__getJiraIssue` for details
   - Review comments for clarifications already provided
   - Check linked issues for additional context

2. **Search Related Issues**:
   - Use `mcp__atlassian__searchJiraIssuesUsingJql` to find:
   - Similar features: `summary ~ "feature_keyword"`
   - Related bugs: `type = Bug AND relates to TICKET-ID`
   - Previous implementations for patterns

3. **Extract Clarifications**:
   - Parse Jira comments for Q&A
   - Review acceptance criteria updates
   - Note decisions recorded in ticket

### Update Jira with Clarifications

After clarification session:

- Add clarification Q&A as Jira comment
- Update acceptance criteria if changed
- Link to updated spec document

## IQGeo-Specific Clarification Areas

### Module Clarifications

- Is this a core feature or customer module?
- Which customer modules need this feature?
- Should this support module overrides?

### Spatial Clarifications

- What coordinate system (SRID)?
- What proximity distance for spatial queries?
- Real-time or batch spatial processing?

### Security Clarifications

- What permission levels required?
- Which user roles can access?
- Data visibility restrictions?

### Testing Clarifications

- Which test suite base class?
- Reference result comparison needed?
- Performance benchmarks required?

## Outline

Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

Note: This clarification workflow is expected to run (and be completed) BEFORE invoking `/speckit.plan`. If the user explicitly states they are skipping clarification (e.g., exploratory spike), you may proceed, but must warn that downstream rework risk increases.

Execution steps:

1. Run `.ai/specify/scripts/bash/check-prerequisites.sh --json --paths-only` from repo root **once** (combined `--json --paths-only` mode / `-Json -PathsOnly`). Parse minimal JSON payload fields:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Optionally capture `IMPL_PLAN`, `TASKS` for future chained flows.)
   - If JSON parsing fails, abort and instruct user to re-run `/speckit.specify` or verify feature branch environment.
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. Load the current spec file. Perform a structured ambiguity & coverage scan using this taxonomy. For each category, mark status: Clear / Partial / Missing. Produce an internal coverage map used for prioritization (do not output raw map unless no questions will be asked).

   Functional Scope & Behavior:
   - Core user goals & success criteria
   - Explicit out-of-scope declarations
   - User roles / personas differentiation

   Domain & Data Model:
   - Entities, attributes, relationships
   - Identity & uniqueness rules
   - Lifecycle/state transitions
   - Data volume / scale assumptions

   Interaction & UX Flow:
   - Critical user journeys / sequences
   - Error/empty/loading states
   - Accessibility or localization notes

   Non-Functional Quality Attributes:
   - Performance (latency, throughput targets)
   - Scalability (horizontal/vertical, limits)
   - Reliability & availability (uptime, recovery expectations)
   - Observability (logging, metrics, tracing signals)
   - Security & privacy (authN/Z, data protection, threat assumptions)
   - Compliance / regulatory constraints (if any)

   Integration & External Dependencies:
   - External services/APIs and failure modes
   - Data import/export formats
   - Protocol/versioning assumptions

   Edge Cases & Failure Handling:
   - Negative scenarios
   - Rate limiting / throttling
   - Conflict resolution (e.g., concurrent edits)

   Constraints & Tradeoffs:
   - Technical constraints (language, storage, hosting)
   - Explicit tradeoffs or rejected alternatives

   Terminology & Consistency:
   - Canonical glossary terms
   - Avoided synonyms / deprecated terms

   Completion Signals:
   - Acceptance criteria testability
   - Measurable Definition of Done style indicators

   Misc / Placeholders:
   - TODO markers / unresolved decisions
   - Ambiguous adjectives ("robust", "intuitive") lacking quantification

   For each category with Partial or Missing status, add a candidate question opportunity unless:
   - Clarification would not materially change implementation or validation strategy
   - Information is better deferred to planning phase (note internally)

3. Generate (internally) a prioritized queue of candidate clarification questions (maximum 5). Do NOT output them all at once. Apply these constraints:
   - Maximum of 10 total questions across the whole session.
   - Each question must be answerable with EITHER:
     - A short multiple‑choice selection (2–5 distinct, mutually exclusive options), OR
     - A one-word / short‑phrase answer (explicitly constrain: "Answer in <=5 words").
   - Only include questions whose answers materially impact architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, or compliance validation.
   - Ensure category coverage balance: attempt to cover the highest impact unresolved categories first; avoid asking two low-impact questions when a single high-impact area (e.g., security posture) is unresolved.
   - Exclude questions already answered, trivial stylistic preferences, or plan-level execution details (unless blocking correctness).
   - Favor clarifications that reduce downstream rework risk or prevent misaligned acceptance tests.
   - If more than 5 categories remain unresolved, select the top 5 by (Impact \* Uncertainty) heuristic.

4. Sequential questioning loop (interactive):
   - Present EXACTLY ONE question at a time.
   - For multiple‑choice questions render options as a Markdown table:

     | Option | Description                                  |
     | ------ | -------------------------------------------- | ------------------------------------------------------ |
     | A      | <Option A description>                       |
     | B      | <Option B description>                       |
     | C      | <Option C description>                       | (add D/E as needed up to 5)                            |
     | Short  | Provide a different short answer (<=5 words) | (Include only if free-form alternative is appropriate) |

   - For short‑answer style (no meaningful discrete options), output a single line after the question: `Format: Short answer (<=5 words)`.
   - After the user answers:
     - Validate the answer maps to one option or fits the <=5 word constraint.
     - If ambiguous, ask for a quick disambiguation (count still belongs to same question; do not advance).
     - Once satisfactory, record it in working memory (do not yet write to disk) and move to the next queued question.
   - Stop asking further questions when:
     - All critical ambiguities resolved early (remaining queued items become unnecessary), OR
     - User signals completion ("done", "good", "no more"), OR
     - You reach 5 asked questions.
   - Never reveal future queued questions in advance.
   - If no valid questions exist at start, immediately report no critical ambiguities.

5. Integration after EACH accepted answer (incremental update approach):
   - Maintain in-memory representation of the spec (loaded once at start) plus the raw file contents.
   - For the first integrated answer in this session:
     - Ensure a `## Clarifications` section exists (create it just after the highest-level contextual/overview section per the spec template if missing).
     - Under it, create (if not present) a `### Session YYYY-MM-DD` subheading for today.
   - Append a bullet line immediately after acceptance: `- Q: <question> → A: <final answer>`.
   - Then immediately apply the clarification to the most appropriate section(s):
     - Functional ambiguity → Update or add a bullet in Functional Requirements.
     - User interaction / actor distinction → Update User Stories or Actors subsection (if present) with clarified role, constraint, or scenario.
     - Data shape / entities → Update Data Model (add fields, types, relationships) preserving ordering; note added constraints succinctly.
     - Non-functional constraint → Add/modify measurable criteria in Non-Functional / Quality Attributes section (convert vague adjective to metric or explicit target).
     - Edge case / negative flow → Add a new bullet under Edge Cases / Error Handling (or create such subsection if template provides placeholder for it).
     - Terminology conflict → Normalize term across spec; retain original only if necessary by adding `(formerly referred to as "X")` once.
   - If the clarification invalidates an earlier ambiguous statement, replace that statement instead of duplicating; leave no obsolete contradictory text.
   - Save the spec file AFTER each integration to minimize risk of context loss (atomic overwrite).
   - Preserve formatting: do not reorder unrelated sections; keep heading hierarchy intact.
   - Keep each inserted clarification minimal and testable (avoid narrative drift).

6. Validation (performed after EACH write plus final pass):
   - Clarifications session contains exactly one bullet per accepted answer (no duplicates).
   - Total asked (accepted) questions ≤ 5.
   - Updated sections contain no lingering vague placeholders the new answer was meant to resolve.
   - No contradictory earlier statement remains (scan for now-invalid alternative choices removed).
   - Markdown structure valid; only allowed new headings: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Terminology consistency: same canonical term used across all updated sections.

7. Write the updated spec back to `FEATURE_SPEC`.

8. **Prompt for review and acceptance before commit** (always):
   - Present the updated `FEATURE_SPEC` to the user with a concise summary of clarified sections.
   - Explicitly instruct the user to review the markdown changes before they are committed.
   - Ask for explicit acceptance using clear wording such as: `Please review the clarified spec. Reply accept to commit it, or tell me what to change.`
   - If the user requests edits, apply them, re-run validation, and repeat this review step.
   - If the user does not explicitly accept, stop after reporting the spec is ready for review; do not commit.

9. **Commit updated spec after explicit acceptance only**:
   - Stage and commit `FEATURE_SPEC` using the IQGeo commit message format:
     `<TICKET>: ai: Update spec.md with clarifications`
     If no Jira ticket: `ai: Update spec.md with clarifications`
   - Do NOT push — pushing happens only in `speckit.specify` and `speckit.pr`.

10. Report completion (after questioning loop ends or early termination):

- Number of questions asked & answered.
- Path to updated spec.
- Sections touched (list names).
- Coverage summary table listing each taxonomy category with Status: Resolved (was Partial/Missing and addressed), Deferred (exceeds question quota or better suited for planning), Clear (already sufficient), Outstanding (still Partial/Missing but low impact).
- If any Outstanding or Deferred remain, recommend whether to proceed to `/speckit.plan` or run `/speckit.clarify` again later post-plan.
- Suggested next command.

11. **Jira Update** (Optional):

- If spec has associated Jira ticket:
- Ask: "Would you like to update the Jira ticket with clarifications? (yes/no)"
- If yes:
  - Add clarification Q&A as formatted comment
  - Update acceptance criteria if changed
  - Note spec update in ticket
  - Report Jira update confirmation

Behavior rules:

- If no meaningful ambiguities found (or all potential questions would be low-impact), respond: "No critical ambiguities detected worth formal clarification." and suggest proceeding.
- If spec file missing, instruct user to run `/speckit.specify` first (do not create a new spec here).
- Never exceed 5 total asked questions (clarification retries for a single question do not count as new questions).
- Avoid speculative tech stack questions unless the absence blocks functional clarity.
- Respect user early termination signals ("stop", "done", "proceed").
- If no questions asked due to full coverage, output a compact coverage summary (all categories Clear) then suggest advancing.
- If quota reached with unresolved high-impact categories remaining, explicitly flag them under Deferred with rationale.

Context for prioritization: $ARGUMENTS
