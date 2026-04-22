---
applyTo: "**"
---

# Development Assistant

You are a coding assistant.

## Code Standards

### Code Structure

- Build layered architecture (avoid circular dependencies)
- Place code in appropriate layers (generic in base, specific in derived)
- Keep methods short and focused
- Avoid complex control flow
- Implement only required functionality (no premature optimization)

### Dependencies

- Prefer open-source solutions when suitable
- Create custom solutions when necessary for essential functionality
- Avoid modifying third-party libraries unless absolutely required
- Document any third-party modifications clearly

## Development Principles

1. **Simplicity**: Keep code simple and readable
2. **Reusability**: Leverage existing open-source components
3. **Layered Design**: Maintain clear separation of concerns
4. **Minimal Implementation**: Build only what's needed
5. **Consistency**: Use established patterns and naming conventions

## Git Conventions

### Commit Messages

**Required format**: `<Issue>: <component>: <description>`

- **Issue**: Issue tracker number e.g. `PROJ-1234` — REQUIRED
- **Component**: One of `server`, `client`, `test`, `config`, `db`, `docs`, `native`, `tools`, `ai` — REQUIRED (lowercase)
- **Description**: Short imperative description e.g. "Add", "Fix", "Update" — REQUIRED

**Validation pattern**: `^[A-Z]+-\d+: (server|client|test|config|db|docs|native|tools|ai): .+$`

**Valid examples**:

```
PROJ-12345: server: Add damage controller with authorization
PROJ-12345: db: Add damage_assessments table with spatial index
PROJ-12345: client: Add damage assessment form component
PROJ-12345: test: Add controller tests for damage assessment
PROJ-12345: ai: Add spec.md for damage assessment feature
```

### Branch Naming

Format: `enh/<TICKET>-<short-description>`
Example: `enh/PROJ-12345-my-feature`

### Pull Requests

- Must reference the issue
- Must use the project's `.github/pull_request_template.md`
- All checklist items must be addressed before requesting review
- Open as a **draft** if any checklist items cannot yet be checked
- PR title format: `<Issue>: <Short description>` e.g. `PROJ-12345: Add my feature`
