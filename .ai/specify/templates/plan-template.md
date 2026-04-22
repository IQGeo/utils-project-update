# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/.ai/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.ai/specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## IQGeo Technical Context

**Backend Stack**:

- **Language**: Python 3.10+
- **Framework**: Pyramid 1.x
- **ORM**: SQLAlchemy with GeoAlchemy2
- **Database**: PostgreSQL 14+ with PostGIS 3.2+
- **Cache**: Redis
- **Auth**: Custom `MywAuthEngine` patterns

**Frontend Stack**:

- **Framework**: React 18.2+
- **State Management**: MobX 6
- **UI Library**: Ant Design 5.4+
- **Maps**: OpenLayers 7.2
- **Build**: Webpack 5
- **Legacy**: Backbone.js (being phased out)

**Testing Framework (Optional - needs clarification from user)**:

- **Python**: Custom `Myw*TestSuite` classes
- **JavaScript**: Custom BDD with jsdom
- **Reference Results**: `resources/test_results/`

**Module Configuration**:

- **Type**: [core/module - if module, specify customer]
- **Override Targets**: [Controllers/Models/Views to override]
- **Static Assets**: `/static/modules/{name}/` if applicable

**Performance Requirements**:

- **API Response**: <200ms p95
- **Spatial Queries**: <500ms for 10k features
- **Map Rendering**: 60fps pan/zoom
- **Concurrent Users**: 1000+

**Security Requirements**:

- **Authorization**: `assertAuthorized()` on all data access
- **Input Validation**: SQLAlchemy, pathlib.Path.resolve()
- **CSRF**: Enabled on state-changing routes

## IQGeo Patterns Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Naming Convention Gate

- [ ] All classes use `Myw` prefix?
- [ ] Legacy camelCase preserved where needed?
- [ ] New code uses snake_case methods?

### Security Gate

- [ ] `assertAuthorized()` planned for all controllers?
- [ ] Input validation strategy defined?
- [ ] Path traversal protections included?

### Module Architecture Gate (if applicable)

- [ ] Directory structure matches core exactly?
- [ ] Base class extension planned?
- [ ] Module registration in `__init__.py`?

### Test Framework Gate (if using core provided test framework)

- [ ] Correct `Myw*TestSuite` base classes identified?
- [ ] Reference result pattern planned?
- [ ] Cleanup in tearDown/destroy methods?

### Spatial Standards Gate (if applicable)

- [ ] `ST_DWithin()` for proximity queries?
- [ ] SRID specifications included?
- [ ] GIST indexes planned for geometry columns?

## Project Structure

### Documentation (this feature)

```
.ai/specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code Structure

```
# Option 1: Core Platform Feature
WebApps/myworldapp/core/
├── client/                      # React frontend
│   ├── src/app/components/      # React components
│   ├── src/widgets/             # Reusable UI widgets
│   ├── src/core/                # Core utilities
│   └── tests/                   # JavaScript tests
├── server/                      # Python backend
│   ├── controllers/             # MywController classes
│   ├── models/                  # SQLAlchemy models
│   ├── views/                   # Pyramid views
│   ├── lib/                     # Core libraries
│   └── tests/                   # Python tests
├── native/                      # Mobile app code
│   ├── controllers/             # Offline controllers
│   └── sync/                    # Sync logic
└── config/                      # Configuration UI

# Option 2: Customer Module Feature
modules/{customer_name}/         # e.g., modules/gas/
├── client/                      # Frontend overrides
│   ├── plugins/                 # Customer plugins
│   └── controls/                # UI overrides
├── server/                      # Backend overrides
│   ├── controllers/             # Extended controllers
│   ├── models/                  # Additional models
│   └── auth/                    # Custom auth
├── static/                      # Module assets
│   ├── images/                  # Icons, logos
│   ├── css/                     # Styles
│   └── js/                      # Scripts
└── config.json                  # Module config

# Database Migrations (both options)
db_schema/
└── upgrades/{version}/          # SQL migration files
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

_Fill ONLY if Patterns Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
