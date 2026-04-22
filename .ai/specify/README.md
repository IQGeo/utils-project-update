# Speckit — AI-Powered Development Workflow

Spec-driven planning and implementation workflow for IQGeo development.

## Constitution

The **constitution agent** (`/speckit.constitution`) keeps GitHub Copilot instruction files in sync with your project's patterns and conventions. Run it whenever you introduce new patterns, change naming conventions, or onboard a new domain — it will discover existing instruction files, apply your updates, and validate consistency across the project.

```bash
/speckit.constitution Update server instruction file for new controller patterns
```

You can also invoke it as a prompt via `/speckit.constitution` in chat.

## Prerequisites

- GitHub Copilot extension
- [Context7 MCP extension](https://github.com/upstash/context7) for technical research during planning
- Feature branch (not main) — or let `/speckit.specify` create one from a Jira ticket
- Jira ticket (optional, enables progress tracking)
- MCP services requiring authentication (e.g., Atlassian/Jira) must be started and authenticated before use

## Quick Start

Use spec-kit commands in GitHub Copilot Chat:

```bash
# Full pipeline from Jira ticket
/speckit.specify PLAT-12345
/speckit.clarify (Optional)
/speckit.plan
/speckit.tasks
/speckit.implement
/speckit.pr

# Lite pipeline (2-step: plan + implement, no specify/clarify/tasks)
/speckit.lite.plan PLAT-12345
/speckit.lite.implement

# Or from a description with full pipeline
/speckit.specify Add damage assessment with photo capture
/speckit.plan
/speckit.tasks
/speckit.implement
/speckit.pr
```

## Common Commands

| Command                 | Purpose                      |
| ----------------------- | ---------------------------- |
| `/speckit.constitution` | Update instruction files     |
| `/speckit.specify`      | Create specification         |
| `/speckit.clarify`      | Resolve ambiguities          |
| `/speckit.plan`         | Generate technical plan with research and design artifacts |
| `/speckit.tasks`        | Create task breakdown        |
| `/speckit.implement`    | Execute implementation (works with or without tasks.md) |
| `/speckit.pr`           | Create commits and pull request |
| `/speckit.lite.plan`    | Lightweight plan — bootstraps from Jira, skips research/design artifacts |
| `/speckit.lite.implement` | Lightweight implement — derives work from plan.md, conditional Jira tracking |

## Using with Copilot CLI

Speckit agents also work from the Copilot CLI. Select an agent and pass arguments directly — for example, select `speckit.specify` and enter `PLAT-12345` as the message.

## Tips

- Work on feature branches
- Use Jira tickets when available
- Review plans before implementing
- Each step builds on the previous one

### Avoiding Context Rot

Long-running chat sessions accumulate stale context that can degrade AI output quality — this is **context rot**.

- **Start fresh sessions often.** Open a new chat for each distinct task rather than continuing an old thread.
- **Keep conversations focused.** One feature, one bug, one topic per session.
- **Re-run `/speckit.specify`** if you significantly change direction mid-task — don't let outdated specs linger in context.
- **Close completed chats.** Old sessions with resolved discussions add noise, not value.
- **Prefer prompts over long preambles.** The spec-kit agents already load the right instruction files — you rarely need to paste large blocks of context manually.
