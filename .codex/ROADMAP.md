# KKPD-KP V1.5 — Engineering Roadmap

**Document Status:** FINAL
**Version:** V1.5
**Purpose:** Define the implementation order, dependencies, priorities, and acceptance criteria for KKPD-KP V1.5.

---

# 1. Roadmap Objective

The purpose of this roadmap is to provide a controlled implementation sequence for KKPD-KP V1.5.

The roadmap is designed around four principles:

```text
Preserve Existing Business Logic
        ↓
Build a Clean V1.5 Foundation
        ↓
Implement Domain Workflows
        ↓
Integrate Public Experience
```

The project must not be developed as an uncontrolled collection of independent UI changes.

Every phase should produce a usable and testable result.

---

# 2. Primary Development Strategy

The implementation strategy is:

```text
ANALYZE
   ↓
FOUNDATION
   ↓
DATA / DOMAIN
   ↓
ADMIN
   ↓
PUBLIC INTEGRATION
   ↓
ANALYTICS
   ↓
UX POLISH
   ↓
VALIDATION
```

The Admin/domain system is developed before extensive public-site polishing because the public experience depends on reliable CMS/domain data.

---

# 3. Priority System

Each roadmap item has a priority.

```text
P0 = Must be completed
P1 = Important for V1.5
P2 = Refactor / quality improvement
P3 = Optional if time remains
```

Priority does not mean importance to the final product only.

It also represents implementation dependency.

---

# 4. Development Rule

Codex must work in roadmap order unless there is a clear dependency reason to temporarily move an item.

Do not skip foundational work simply because a later UI feature appears easier to implement.

---

# 5. Phase 0 — Repository and Baseline Audit

**Priority:** P0

## Objective

Understand the existing repository before modifying behavior.

---

## Tasks

Inspect:

```text
app/
components/
lib/
repositories/
services/
types/
hooks/
public/
middleware / proxy
configuration
Firebase integration
authentication
Firestore access
Storage
API routes
Server Actions
```

Identify:

* existing routes
* existing admin routes
* existing public routes
* existing repositories
* existing Firebase services
* scoring logic
* form logic
* response logic
* article logic
* settings logic
* gallery logic
* partnership logic
* authentication logic
* authorization logic
* duplicated types
* dead code
* hardcoded content
* legacy assumptions

---

## Critical Requirement

Before changing scoring behavior, identify the exact existing scoring implementation.

The existing scoring implementation is treated as a validated baseline.

---

## Deliverables

Create an internal implementation map:

```text
Existing Route
Existing Component
Existing Service
Existing Repository
Existing Type
Existing Firebase Collection
Existing Business Logic
V1.5 Replacement / Reuse
```

---

## Definition of Done

Phase 0 is complete when:

* the major application domains are identified
* Firebase access points are identified
* scoring logic is identified
* form data flow is understood
* response data flow is understood
* authentication flow is understood
* no major domain is unknown

---

# 6. Phase 1 — V1.5 Foundation

**Priority:** P0

## Objective

Establish a clean technical foundation without changing business behavior.

---

## Tasks

Create or standardize:

```text
types/
repositories/
services/
lib/firebase/
authorization/
validation/
constants/
```

Establish canonical domain types for:

```text
User
Role
Partnership
Cadre
Article
Form
FormVersion
Question
Distribution
Collaborator
Response
Activity
Metric
```

---

## Firebase

Verify:

```text
Firebase Client SDK
Firebase Admin SDK
Firestore
Storage
Authentication
Environment Variables
```

---

## Environment

Confirm:

```text
Development
Preview
Production
```

use the intended V1.5 Firebase project.

---

## Definition of Done

* application connects to KKPD-V1
* Admin SDK works server-side
* client SDK works client-side
* no legacy Firebase dependency remains unintentionally
* canonical types exist
* domain layers can be introduced without breaking current routes

---

# 7. Phase 2 — Authentication and Authorization Foundation

**Priority:** P0

## Objective

Establish reliable identity and access control before building deeper admin workflows.

---

## Access Model

```text
Admin
Partnership
Cadre
Public
```

---

## Tasks

Implement/standardize:

* authenticated user identity
* role resolution
* user profile lookup
* role guards
* server authorization
* Firestore security rules
* ownership checks
* partnership scope checks
* public access rules

---

## Important

UI role checks are not considered sufficient authorization.

Authorization must exist in trusted backend/security layers.

---

## Definition of Done

Test all major access combinations:

```text
Admin → global access
Partnership → own partnership scope
Cadre → own resources
Cadre → unauthorized other-cadre resources
Public → published public resources
Public → private resources
```

---

# 8. Phase 3 — Settings and CMS Foundation

**Priority:** P0

## Objective

Connect the CMS settings system to real V1.5 Firestore data.

---

## Tasks

Implement:

* settings repository
* settings service
* settings validation
* admin settings UI
* public settings consumption
* safe defaults
* loading state
* error state

---

## Remove

Remove dummy settings data that was only used for development.

---

## Definition of Done

Changing a setting in Admin:

```text
Admin
 ↓
Save
 ↓
Firestore
 ↓
Public Application
```

must produce the expected public result.

---

# 9. Phase 4 — Partnership Management

**Priority:** P0

## Objective

Implement the generic organizational model.

---

## Core Entity

```text
Partnership
```

---

## Partnership Types

The architecture must support types such as:

```text
school
kelurahan
community
institution
other
```

The exact set may be configurable.

---

## Tasks

Implement:

* partnership list
* partnership detail
* create partnership
* edit partnership
* deactivate/archive partnership
* partnership metadata
* partnership type
* contact information
* public visibility where applicable
* associated cadres

---

## Important

Do not create a school-specific architecture.

School is a partnership type.

---

## Definition of Done

Admin can:

```text
Create
View
Edit
Archive
```

a partnership.

A partnership can have associated cadres.

---

# 10. Phase 5 — Cadre Management

**Priority:** P0

## Objective

Implement the cadre account and ownership system.

---

## Decisions

There is:

```text
No cadre level
No cadre leader
No cadre hierarchy
```

All cadres have the same primary role.

---

## Tasks

Implement:

* cadre account creation
* cadre profile
* cadre authentication
* cadre-partnership association
* cadre activation/deactivation
* cadre article ownership
* cadre distribution ownership
* cadre activity attribution

---

## Definition of Done

A cadre can:

```text
Login
View own profile
View own resources
Create permitted content
Manage own resources
Participate in collaboration
```

A cadre cannot automatically manage another cadre's private resources.

---

# 11. Phase 6 — Article CMS

**Priority:** P0

## Objective

Create a reliable article/content management workflow.

---

## Article Lifecycle

```text
Draft
  ↓
Published
  ↓
Archived / Unpublished
```

Additional review states may be introduced only when required.

---

## Tasks

Implement:

* article list
* article creation
* article editing
* article ownership
* author attribution
* partnership attribution
* publication
* unpublication
* archive
* public rendering
* article metadata
* article search/filtering

---

## Cadre Attribution

Published articles must preserve:

```text
Author
Cadre
Partnership
Published At
```

where applicable.

---

## Definition of Done

A cadre-created article can flow:

```text
Draft
 ↓
Save
 ↓
Publish
 ↓
Public Article
```

without manual hardcoding.

---

# 12. Phase 7 — Form Domain Foundation

**Priority:** P0

## Objective

Build the new V1.5 form architecture without breaking existing scoring behavior.

---

## Core Model

```text
Form
 ↓
Form Version
 ↓
Question
 ↓
Answer Configuration
```

---

## Required Question Identity

Every question must have:

```text
questionId
```

The question ID must not depend on array position.

---

## Form Metadata

Support appropriate metadata such as:

```text
title
description
category
target audience
assessment type
status
owner
creator
createdAt
updatedAt
```

---

## Form Types

The architecture must support concepts such as:

```text
Official
User-created
```

and assessment roles such as:

```text
Pre-test
Post-test
General Assessment
```

where required.

---

## Definition of Done

The form can be created and represented through the canonical V1.5 schema.

---

# 13. Phase 8 — Form Builder V2

**Priority:** P0

## Objective

Replace the difficult legacy form-building experience with a cleaner V1.5 Form Builder without destroying the legacy system.

---

## Strategy

The new builder is developed as a separate implementation.

Preferred concept:

```text
Legacy Form Builder
        │
        │ preserved
        ▼
Existing System


V1.5 Form Builder
        │
        ▼
New Form Schema
```

---

## UX Requirements

The builder should support:

* clear question list
* drag/reorder where practical
* question editing
* answer configuration
* answer key visibility for authorized users
* scoring configuration
* question duplication
* question deletion
* question ordering
* form metadata
* save draft
* preview
* validation
* publish workflow

---

## Answer-Key Management

Admin should be able to see answer keys from a centralized management experience.

The system should not require opening every question modal merely to inspect answer keys.

---

## Important

Answer keys must remain private from public respondents.

---

## Definition of Done

Admin can manage a complete form without repeatedly opening nested dialogs for basic configuration.

---

# 14. Phase 9 — Validation Engine

**Priority:** P0

## Objective

Centralize form validation.

---

## Validation Layers

```text
UI Validation
      ↓
Schema Validation
      ↓
Server Validation
```

---

## Validate

Examples:

* required questions
* valid answer configuration
* valid question types
* valid option configuration
* valid scoring configuration
* valid answer key
* valid metadata
* valid publication state

---

## Definition of Done

The same validation rules are not duplicated across unrelated components.

---

# 15. Phase 10 — Scoring Engine Integration

**Priority:** P0

## Objective

Integrate the existing validated scoring logic into the new V1.5 architecture without changing its semantics.

---

## Flow

```text
Submitted Answers
       ↓
Validation
       ↓
Existing Scoring Logic
       ↓
Score
       ↓
Response Persistence
```

---

## Required

Persist:

```text
score
```

on the response when applicable.

---

## Critical Rule

Do not rewrite scoring merely for architectural cleanliness.

Refactoring is allowed.

Behavioral changes require explicit validation.

---

## Definition of Done

A known baseline submission produces the same expected score as the existing implementation.

---

# 16. Phase 11 — Form Versioning

**Priority:** P0

## Objective

Protect historical assessment meaning.

---

## Model

```text
Form
 ├── Version 1
 ├── Version 2
 └── Version N
```

---

## Rules

Once a form version has been used for responses, changes that alter assessment meaning should result in a new version.

Examples:

* question change
* answer key change
* scoring change
* question identity change

---

## Definition of Done

Existing responses remain tied to the correct form version.

Changing the current form does not silently rewrite historical results.

---

# 17. Phase 12 — Official Form Workflow

**Priority:** P0

## Objective

Implement the official-form governance model.

---

## Core Flow

```text
Admin / BPOM
      ↓
Create Official Form
      ↓
Draft
      ↓
Review
      ↓
Approved
      ↓
Published
      ↓
Available for Use
```

---

## Official Form Reuse

Cadres can:

```text
Use Official Form
```

without becoming owners of the official form itself.

---

## Definition of Done

Admin can distinguish:

```text
Official Form
User-Created Form
Draft
Approved
Published
Archived
```

where applicable.

---

# 18. Phase 13 — Form Distribution

**Priority:** P0

## Objective

Allow forms to be distributed while preserving attribution.

---

## Flow

```text
Form Version
      ↓
Distribution
      ↓
Primary Owner
      ↓
Collaborators
      ↓
Distribution Link / Code
      ↓
Respondents
```

---

## Distribution Data

A distribution should preserve:

```text
formId
formVersionId
primaryOwnerId
partnershipId
collaborators
distributionCode
public URL information
status
timestamps
```

as applicable.

---

## Important

Distribution is not ownership transfer.

---

## Definition of Done

A cadre can use an approved form through a distribution and identify its participation source.

---

# 19. Phase 14 — Collaboration

**Priority:** P1

## Objective

Allow controlled collaboration around form distributions.

---

## Model

```text
Primary Owner
      +
Collaborators
```

---

## Rules

Collaborators:

* can access only permitted data
* do not become owners
* cannot automatically manage unrelated resources

Removing collaboration must not erase historical attribution.

---

## Definition of Done

A distribution can be shared with another authorized user while maintaining ownership.

---

# 20. Phase 15 — Public Form Renderer

**Priority:** P0

## Objective

Create the canonical public form rendering experience.

---

## Flow

```text
Distribution
      ↓
Published Form Version
      ↓
Public Renderer
      ↓
Respondent
```

---

## Requirements

The public form must be:

* mobile-first
* responsive
* accessible
* clear
* fast
* resistant to accidental duplicate submission
* resilient to network errors

---

## Security

Public respondents must never receive:

```text
answer keys
private scoring configuration
admin metadata
private collaboration data
```

---

# 21. Phase 16 — Response Lifecycle

**Priority:** P0

## Objective

Create reliable response persistence.

---

## Flow

```text
Respondent
 ↓
Answers
 ↓
Client Validation
 ↓
Server Validation
 ↓
Scoring
 ↓
Persist Response
 ↓
Confirmation
```

---

## Response Must Preserve

At minimum, where applicable:

```text
formId
formVersionId
distributionId
answers
score
submittedAt
attribution
```

---

## Definition of Done

A respondent can submit successfully and the result can be traced back to:

```text
Form
Form Version
Distribution
Owner
Partnership
```

---

# 22. Phase 17 — Pre-Test / Post-Test Integration

**Priority:** P1

## Objective

Allow forms to be attached to learning/content workflows.

---

## Example

```text
Article
   │
   ├── Pre-Test
   │
   ├── Content
   │
   └── Post-Test
```

---

## Important

The relationship must be explicit.

Do not infer it from article ordering or naming.

---

## Definition of Done

Admin can associate approved forms with appropriate article/content workflows.

---

# 23. Phase 18 — Attribution System

**Priority:** P0

## Objective

Ensure participation can be attributed to the correct distribution and organizational context.

---

## Flow

```text
Respondent
      ↓
Distribution
      ↓
Cadre
      ↓
Partnership
```

where applicable.

---

## Important

Respondents should not need to manually enter attribution when it is already determined by the distribution.

---

## Definition of Done

A response submitted through a cadre's distribution can be attributed to that cadre without relying on manually entered fields.

---

# 24. Phase 19 — Activity System

**Priority:** P1

## Objective

Track meaningful platform activities.

---

## Examples

```text
article_created
article_published
form_created
form_published
distribution_created
response_submitted
collaborator_added
assessment_completed
```

---

## Activities Are Not Page Views

Do not record every UI click as an activity.

Activities represent meaningful domain events.

---

## Definition of Done

Important domain events can be attributed to:

```text
Who
What
When
Which Resource
```

---

# 25. Phase 20 — Metrics Engine

**Priority:** P1

## Objective

Build metrics from trusted source records.

---

## Source Hierarchy

```text
Responses
Activities
Articles
Forms
Distributions
Partnerships
Cadres
        ↓
Metrics
```

---

## Metrics Examples

Potential metrics include:

### Platform

* total partnerships
* total cadres
* total published articles
* total official forms
* total responses
* total participants reached

### Partnership

* cadres
* articles
* distributions
* participants
* completed assessments

### Cadre

* articles created
* articles published
* forms distributed
* responses collected
* participants reached
* assessment activity

---

## Important

Metric definitions must be explicit before implementation.

---

# 26. Phase 21 — Admin Dashboard

**Priority:** P1

## Objective

Create the central operational dashboard.

---

## Dashboard Areas

Potential sections:

```text
Overview
Partnerships
Cadres
Articles
Forms
Distributions
Responses
Activities
Metrics
Settings
```

---

## UX Principle

The dashboard should prioritize operational actions over decorative analytics.

---

# 27. Phase 22 — Partnership Dashboard

**Priority:** P1

## Objective

Allow partnership users to monitor their authorized scope.

---

## Potential Views

```text
Overview
Cadres
Articles
Activities
Forms / Distributions
Participants
Metrics
```

---

## Important

All information must be scoped to the partnership.

---

# 28. Phase 23 — Cadre Dashboard

**Priority:** P1

## Objective

Give cadres a simple operational workspace.

---

## Potential Areas

```text
My Profile
My Articles
My Forms / Distributions
My Activities
My Metrics
Collaborations
```

---

## UX Principle

The cadre dashboard should not expose unnecessary administrative complexity.

---

# 29. Phase 24 — Public CMS Integration

**Priority:** P0

## Objective

Connect the public website to real V1.5 CMS/domain data.

---

## Integrate

```text
Settings
Articles
Gallery
Partnerships
Forms
Public Metrics
```

where applicable.

---

## Definition of Done

Admin changes propagate to public pages without manual frontend modification.

---

# 30. Phase 25 — Gallery Integration

**Priority:** P0

## Objective

Connect Gallery management to public rendering.

---

## Flow

```text
Admin
 ↓
Upload Media
 ↓
Storage
 ↓
Metadata
 ↓
Firestore
 ↓
Public Gallery
```

---

## Definition of Done

Gallery content created/managed in Admin appears correctly on the public website.

---

# 31. Phase 26 — Public Partnership Integration

**Priority:** P0

## Objective

Allow approved/public partnership information to appear on the public website.

---

## Generic Model

Public pages must not assume every partnership is a school.

Example:

```text
Partnership
 ├── School
 ├── Kelurahan
 ├── Institution
 └── Other
```

---

# 32. Phase 27 — Public Article Attribution

**Priority:** P1

## Objective

Make article ownership and contribution visible where appropriate.

---

## Potential Public Information

```text
Article
Author
Cadre
Partnership
Publication Date
```

---

## Goal

Allow the platform to recognize contributions without creating competitive ranking systems.

---

# 33. Phase 28 — Milestone / Achievement Foundation

**Priority:** P2

## Objective

Create a foundation for future achievement recognition.

---

## Examples

Potential milestones:

```text
First Article Published
First Form Distributed
First Assessment Completed
100 Participants Reached
```

---

## Important

Milestones must be derived from trusted platform data.

Users cannot manually claim them.

---

# 34. Phase 29 — Advanced Analytics

**Priority:** P2

## Objective

Only after source data is reliable, implement advanced analytics.

Potential future analytics:

```text
Pre-test vs Post-test
Question-level performance
Participation trends
Cadre contribution
Partnership reach
Content engagement
Assessment completion
```

---

# 35. Phase 30 — UX Refinement

**Priority:** P1

## Objective

Improve usability after the domain workflows are functional.

---

## Replace

```text
alert()
confirm()
prompt()
```

with application UI.

---

## Improve

* empty states
* loading states
* error states
* success feedback
* dialogs
* forms
* mobile layouts
* table responsiveness
* navigation
* search
* filters
* pagination
* accessibility

---

# 36. Phase 31 — Form Builder UX Refinement

**Priority:** P0

## Objective

Make form creation exceptionally efficient for administrators.

---

## UX Goals

Admin should be able to:

```text
Create Form
 ↓
Define Metadata
 ↓
Add Questions
 ↓
Configure Answers
 ↓
Configure Answer Keys
 ↓
Configure Scoring
 ↓
Preview
 ↓
Validate
 ↓
Save Draft
 ↓
Publish
```

without unnecessary navigation.

---

# 37. Phase 32 — Admin Preview

**Priority:** P0

## Objective

Ensure Admin Preview represents the same form that respondents will see.

---

## Architecture

```text
Canonical Form Schema
        ↓
Public Renderer
        ↑
        │
Admin Preview
```

---

## Definition of Done

A form that looks correct in Preview should render equivalently in public mode.

---

# 38. Phase 33 — Testing

**Priority:** P0

## Objective

Protect the validated business logic during refactoring.

---

## Minimum Testing Areas

### Authentication

* login
* logout
* unauthorized access
* inactive account

### Authorization

* Admin
* Partnership
* Cadre
* Public

### Forms

* create
* update
* validation
* preview
* publish
* versioning

### Scoring

* known baseline cases
* answer key
* score persistence
* invalid submissions

### Distribution

* create
* attribution
* collaborators
* public access

### Responses

* submission
* duplicate prevention
* persistence
* score
* attribution

### CMS

* article
* gallery
* settings
* public rendering

---

# 39. Phase 34 — Baseline Scoring Regression Test

**Priority:** P0

## Objective

Guarantee that V1.5 does not change the validated scoring behavior unintentionally.

---

## Required

Create a set of known:

```text
Input
Expected Score
```

cases from the existing system.

Run them against the V1.5 scoring engine.

---

## Acceptance

```text
Legacy Expected Score
        ==
V1.5 Expected Score
```

for all approved baseline cases.

---

# 40. Phase 35 — Security Review

**Priority:** P0

## Verify

* Firestore rules
* Storage rules
* Admin SDK isolation
* API authorization
* public data exposure
* answer-key exposure
* response exposure
* role escalation
* ownership bypass
* partnership scope bypass
* distribution-code abuse
* export authorization

---

# 41. Phase 36 — Performance Review

**Priority:** P1

## Review

* Firestore reads
* Firestore writes
* pagination
* N+1 queries
* unnecessary client fetches
* bundle size
* image loading
* public page performance
* dashboard performance

---

# 42. Phase 37 — Repository Cleanup

**Priority:** P2

## Remove

* dead components
* duplicate types
* unused repositories
* obsolete utilities
* unused dependencies
* legacy routes that are no longer required
* duplicated Firebase initialization
* temporary migration code

---

# 43. Phase 38 — TypeScript Strictness

**Priority:** P2

## Objective

Improve long-term maintainability.

---

## Tasks

Reduce:

```text
any
unknown without validation
duplicate interfaces
unsafe casts
implicit domain states
```

---

# 44. Phase 39 — Final Production Validation

**Priority:** P0

Before production deployment verify:

```text
Authentication
Authorization
Firestore
Storage
CMS
Articles
Partnerships
Cadres
Forms
Form Versions
Distributions
Responses
Scoring
Attribution
Metrics
Public Pages
Admin Pages
Mobile UX
Security Rules
Environment Variables
```

---

# 45. Critical Dependency Order

The most important dependency chain is:

```text
Foundation
   ↓
Authentication
   ↓
Authorization
   ↓
Partnership
   ↓
Cadre
   ↓
Article
   ↓
Form Schema
   ↓
Form Builder
   ↓
Validation
   ↓
Scoring
   ↓
Versioning
   ↓
Official Form Workflow
   ↓
Distribution
   ↓
Response
   ↓
Attribution
   ↓
Activities
   ↓
Metrics
   ↓
Dashboards
   ↓
Public Integration
```

---

# 46. Three-Day Emergency Execution Plan

Because V1.5 has a highly constrained development window, implementation should be grouped into three practical work blocks.

---

## DAY 1 — Foundation + Core Admin

### Morning

```text
Repository Audit
Firebase Verification
Environment
Types
Repositories
Services
Authentication
Authorization
```

### Afternoon

```text
Partnership
Cadre
Article CMS
Settings
```

### Evening

```text
Form Schema
Form Version
Question ID
Validation Foundation
```

### Day 1 Goal

By the end of Day 1:

```text
Authentication works
Admin access works
Partnership works
Cadre works
Article CMS works
Settings work
New form schema exists
```

---

# 47. DAY 2 — Form + Assessment Core

### Morning

```text
Form Builder V2
Question Management
Answer Keys
Scoring Configuration
Preview
```

### Afternoon

```text
Validation Engine
Existing Scoring Integration
Form Versioning
Official Form Workflow
```

### Evening

```text
Distribution
Primary Owner
Collaborators
Public Form Renderer
```

### Day 2 Goal

By the end of Day 2:

```text
Admin can create forms
Admin can configure answer keys
Admin can preview forms
Admin can publish approved forms
Cadre can use forms
Public can access distributions
```

---

# 48. DAY 3 — Response + Integration + Stabilization

### Morning

```text
Response Persistence
Score Persistence
Attribution
Duplicate Submission Protection
Activities
```

### Afternoon

```text
Metrics
Admin Dashboard
Cadre Dashboard
Partnership Dashboard
Public Article Integration
Public Partnership Integration
Gallery Integration
```

### Evening

```text
Security Review
Regression Test
Mobile UX
Build
Production Validation
```

### Day 3 Goal

By the end of Day 3:

```text
End-to-End Workflow Works
```

from:

```text
Admin
 ↓
Partnership
 ↓
Cadre
 ↓
Article / Form
 ↓
Distribution
 ↓
Respondent
 ↓
Response
 ↓
Score
 ↓
Attribution
 ↓
Metrics
```

---

# 49. P0 Scope

The following are mandatory for the V1.5 core:

```text
1. Repository audit
2. V1.5 Firebase foundation
3. Authentication
4. Authorization
5. Settings integration
6. Partnership management
7. Cadre management
8. Article CMS
9. Form schema
10. Form Builder V2
11. Question IDs
12. Answer-key management
13. Validation
14. Existing scoring integration
15. Score persistence
16. Form versioning
17. Official form workflow
18. Distribution
19. Public renderer
20. Response persistence
21. Attribution
22. Admin Preview
23. Public CMS integration
24. Gallery integration
25. Public partnership integration
26. Security validation
27. Regression testing
```

---

# 50. P1 Scope

After P0:

```text
Collaboration
Pre/Post-test integration
Activities
Metrics
Admin Dashboard refinement
Partnership Dashboard
Cadre Dashboard
Advanced response lifecycle
Access-code UX
Mobile UX refinement
Advanced search/filter
Pagination refinement
```

---

# 51. P2 Scope

After the core system is stable:

```text
Component refactor
Repository cleanup
TypeScript strictness
Duplicate type removal
Dead-code removal
Constant centralization
Enum centralization
Advanced analytics
Milestones
Achievement system
```

---

# 52. V2 Scope

The following should generally remain outside V1.5 unless implementation becomes trivial:

```text
External student database integration
Advanced school system integration
RT/RW hierarchy
Kelurahan-specific hierarchy
Advanced collaboration workflows
Complex form request workflows
Advanced notification system
Advanced gamification
Advanced public ranking
External institutional integrations
```

---

# 53. End-to-End Acceptance Test

The V1.5 core should ultimately pass this scenario:

```text
1. Admin logs in
        ↓
2. Admin creates Partnership
        ↓
3. Admin creates Cadre account
        ↓
4. Cadre logs in
        ↓
5. Cadre creates Article
        ↓
6. Article is published
        ↓
7. Admin creates/approves Official Form
        ↓
8. Cadre selects "Use Official Form"
        ↓
9. Cadre creates Distribution
        ↓
10. Cadre becomes Primary Owner
        ↓
11. Optional Collaborator is added
        ↓
12. Distribution Link is shared
        ↓
13. Respondent opens public link
        ↓
14. Respondent completes form
        ↓
15. Response is validated
        ↓
16. Existing scoring logic calculates score
        ↓
17. Score is persisted
        ↓
18. Response is attributed to Distribution
        ↓
19. Distribution is attributed to Cadre
        ↓
20. Cadre is associated with Partnership
        ↓
21. Activity is recorded
        ↓
22. Metrics update
        ↓
23. Admin can monitor result
        ↓
24. Partnership can monitor authorized scope
        ↓
25. Cadre can monitor own contribution
```

---

# 54. Critical Regression Scenario

The following must remain valid:

```text
Existing Form
      ↓
Existing Answer Data
      ↓
Existing Scoring Logic
      ↓
Existing Expected Score
```

The V1.5 refactor must not silently change the result.

---

# 55. Migration Readiness Gate

Do NOT migrate legacy data until:

```text
[ ] V1.5 schema stable
[ ] Authentication stable
[ ] Authorization stable
[ ] Form schema stable
[ ] Question IDs stable
[ ] Scoring regression passed
[ ] Response schema stable
[ ] Attribution stable
[ ] Form versioning stable
[ ] Security rules validated
[ ] Production workflow tested
```

---

# 56. Migration Strategy

When migration is eventually performed:

```text
Legacy Data
    ↓
Extract
    ↓
Transform
    ↓
Validate
    ↓
Dry Run
    ↓
Compare
    ↓
Approve
    ↓
Import
    ↓
Verify
```

Never perform uncontrolled migration directly into production.

---

# 57. Roadmap Completion Criteria

V1.5 is considered functionally complete when:

### Identity

```text
Authentication works
Authorization works
```

### Organization

```text
Partnership works
Cadre works
```

### CMS

```text
Settings work
Articles work
Gallery works
```

### Assessment

```text
Forms work
Form versions work
Answer keys work
Validation works
Scoring works
```

### Distribution

```text
Distribution works
Ownership works
Collaboration works where implemented
```

### Response

```text
Public submission works
Response persistence works
Score persistence works
Attribution works
```

### Monitoring

```text
Activities work
Metrics work
Dashboards work
```

### Public

```text
Published content is visible
Published forms are usable
Public data is safe
```

### Security

```text
Unauthorized access is blocked
Private data is protected
Admin privileges are protected
```

---

# 58. What Codex Must Not Do During Roadmap Execution

Codex must NOT:

```text
Rewrite the entire repository without necessity.

Replace validated scoring logic with an unverified implementation.

Modify legacy production data automatically.

Migrate data before the migration gate is passed.

Build V2 features before V1.5 core functionality is stable.

Create school-specific architecture where generic partnership architecture is sufficient.

Create cadre hierarchy.

Create unnecessary roles.

Expose answer keys to public clients.

Treat client-side role checks as authorization.

Create fake CMS functionality.

Create fake metrics.

Create fake activities.

Hardcode production CMS content.

Silently change historical form meaning.

Silently change historical scores.

Skip security rules.

Skip regression testing.

Perform unrelated dependency upgrades during feature implementation.
```

---

# 59. Implementation Principle

When choosing between two implementation approaches:

Prefer the approach that provides:

```text
Correctness
    >
Data Safety
    >
Security
    >
Maintainability
    >
Consistency
    >
UX
    >
Performance
    >
Development Speed
```

However, when two approaches are equally safe and correct, choose the simpler implementation.

---

# 60. Final Roadmap Principle

The goal is not to finish the largest number of features.

The goal is to finish the most important **complete vertical workflows**.

The preferred result is:

```text
A smaller number of complete,
secure, maintainable workflows
```

rather than:

```text
A large number of partially connected features.
```

---

# 61. Final V1.5 Workflow

The final target workflow is:

```text
                    ADMIN / BPOM
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        PARTNERSHIP             OFFICIAL FORMS
              │                     │
              ▼                     ▼
           CADRES              FORM VERSION
              │                     │
              ├──────────┐          │
              ▼          ▼          ▼
          ARTICLES   DISTRIBUTION ←─┘
                         │
                  PRIMARY OWNER
                         │
                  COLLABORATORS
                         │
                         ▼
                    RESPONDENTS
                         │
                         ▼
                      RESPONSE
                         │
                 ┌───────┴───────┐
                 ▼               ▼
               SCORE        ATTRIBUTION
                 │               │
                 └───────┬───────┘
                         ▼
                      ACTIVITY
                         │
                         ▼
                       METRIC
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
            ADMIN   PARTNERSHIP   CADRE
                         │
                         ▼
                     EVALUATION
                         │
                         ▼
                    CONTINUOUS
                    DEVELOPMENT
```

---

# 62. Final Status

```text
Document: ROADMAP.md
Version: V1.5
Status: FINAL
Implementation Model: Incremental Vertical-Slice Refactor
Primary Backend: Firebase
Primary Deployment Target: Vercel
Migration: Deferred Until V1.5 Stability Gate
```

**End of ROADMAP.md**
