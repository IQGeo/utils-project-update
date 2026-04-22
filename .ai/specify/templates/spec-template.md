# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## Jira Integration *(if applicable)*

**Jira Ticket**: [PROJ-####](https://iqgeo.atlassian.net/browse/PROJ-####)
**Priority**: [P1/P2/P3]
**Story Points**: [#]
**Sprint**: [Sprint Name]
**Related Issues**: [List any blocked by/blocks/relates to tickets]

## IQGeo Context

### Module Considerations
- **Core Feature**: Is this part of core platform or customer module?
- **Target Modules**: [List customer modules if applicable: gas, telecom, water, etc.]
- **Override Requirements**: [What core components need override capability?]

### Security Requirements
- **Authorization Levels**: [What permissions are required?]
- **Data Access**: [Which user roles can view/edit?]
- **Validation Rules**: [Input validation requirements]

### Spatial Requirements *(if applicable)*
- **Geometry Types**: [Point, LineString, Polygon, etc.]
- **Coordinate System**: [SRID - typically 4326]
- **Spatial Operations**: [Proximity, intersection, containment, etc.]
- **Performance Targets**: [Query time expectations]

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create damage assessments"]
- **FR-002**: System MUST validate all inputs using IQGeo validation patterns
- **FR-003**: Users MUST authenticate with `assertAuthorized()` before data access
- **FR-004**: System MUST use `Myw` prefix for all core classes
- **FR-005**: System MUST log all security events to audit trail

*IQGeo-specific requirement examples:*

- **FR-006**: Spatial queries MUST use `ST_DWithin()` for proximity searches within [distance]
- **FR-007**: Module overrides MUST extend base classes and call `super()` methods
- **FR-008**: Tests MUST inherit from appropriate `Myw*TestSuite` base class
- **FR-009**: Geometry operations MUST specify SRID (typically 4326)
- **FR-010**: Controllers MUST extend `MywController` base class

*Example of marking unclear requirements:*

- **FR-011**: Feature available in [NEEDS CLARIFICATION: core only or specific modules?]
- **FR-012**: Spatial search radius of [NEEDS CLARIFICATION: distance and units not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
