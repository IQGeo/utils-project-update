---
description: Update GitHub Copilot instruction files to reflect project patterns and development guidelines.
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

## Outline

You are updating GitHub Copilot instruction files to reflect project-specific patterns and best practices.

Follow this execution flow:

1. **Discover the instruction landscape**:
   - Read `.github/copilot-instructions.md` to understand the project's core patterns, naming conventions, and non-negotiable rules.
   - List all files in `.github/instructions/` to discover what domain-specific instruction files exist for this project.
   - For each file found, read its `applyTo` frontmatter and first heading to understand its domain and scope.
   - **Detect workspace type**: Check whether `WebApps/` exists at the workspace root.
     - **`WebApps/` present** → **Core workspace**: instruction files update `core_` or `platform_` prefixes.
     - **`WebApps/` absent** → **Module workspace**: instruction files update `{module}_` prefixes (where `{module}` is the module name, e.g. `comms_`, `gas_`).

2. **Identify target instruction file(s)**:
   - Based on user input, match domain keywords to discovered file names and headings.
   - If user specifies a file type or domain (e.g., "Python", "React", "security"), select the most relevant discovered file(s).
   - If user requests general pattern updates, target `copilot-instructions.md`.
   - If no existing file covers the requested domain, a new instruction file may need to be created (see Important Notes).

3. **Ask domain-specific setup questions before applying changes**:
   - **If the user's request relates to application access, URLs, or the dev environment**:
     - Ask: "What URL is the application accessed at in your development environment? (default: `http://localhost`)"
     - Ask: "Are there any other services to list? Provide name and URL for each (e.g., pgAdmin, Keycloak, Portainer)."
     - Use the confirmed answers to populate or update the discovered environment instruction file.
     - If the user confirms the defaults are correct, proceed with the existing values.

   - For all other domains, proceed directly to step 4.

4. **Read current instruction file(s)**:
   - Load the target instruction file(s) in full.
   - Note the `applyTo` pattern which defines which source files this instruction applies to.
   - Identify sections that need updates based on user input.

5. **Apply requested changes**:
   - Add new patterns, guidelines, or best practices as specified.
   - Update existing patterns if they conflict or need clarification.
   - Ensure changes align with the project's core patterns from `copilot-instructions.md`.
   - Maintain the instruction file structure and formatting.

6. **Validate consistency across instruction files**:
   - Check if the change affects multiple instruction files (e.g., a security pattern may affect both server and client files).
   - Ensure no contradictions between different instruction files.
   - Verify that domain-specific files align with core patterns in `copilot-instructions.md`.

7. **Update related templates if needed**:
   - Check if changes affect `.ai/specify/templates/` files (spec, plan, tasks, checklist).
   - Update template guidance if instruction changes introduce new requirements or remove old ones.

8. **Write updated instruction file(s)**:
   - Save changes to the appropriate instruction file(s).
   - Preserve the `---` front matter and `applyTo` scope.
   - Maintain Markdown formatting and code examples.

9. **Output summary**:
   - List which instruction file(s) were updated.
   - Summarize the changes made.
   - Note any related files that may need manual review.
   - Suggest commit message (e.g., `PLAT-12345: ai: update server instruction file for new controller patterns`).

## Important Notes

- Instruction files use YAML front matter with `applyTo` glob patterns to define scope.
- If creating a new instruction file, follow the naming convention already used in `.github/instructions/` and set an appropriate `applyTo` glob pattern.
- Changes should be specific and actionable (avoid vague guidance like "use best practices").
- Include code examples where helpful to illustrate patterns.
- Keep instruction files concise — focus on project-specific patterns, not general programming advice.
- If updating security or authorization patterns, check all discovered instruction files for related content to avoid contradictions.

## Workspace-Aware Instruction File Rules

The naming convention and edit permissions for instruction files depend on the workspace type:

### Core Workspace (`WebApps/` present at root)

- Instruction files use `core_` or `platform_` prefixes (e.g. `core_testing.instructions.md`, `platform_server.instructions.md`).
- You may create or edit `core_*` and `platform_*` instruction files.

### Module Workspace (`WebApps/` absent)

- Instruction files MUST use `{module}_` prefix where `{module}` is the module name (e.g. `comms_server.instructions.md`, `gas_testing.instructions.md`).
- **NEVER modify `platform_*` instruction files.** These are provided by the platform and must not be altered in module workspaces.
- Module instruction files take priority over platform instruction files when both apply (see `copilot-instructions.md` for the full priority order).
- When creating a new module instruction file, mirror the domain of an existing `platform_*` file if appropriate (e.g. `{module}_server.instructions.md` mirrors `platform_server.instructions.md`), but use the `{module}_` prefix.
