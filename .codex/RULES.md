# KKPD-KP V1.5 — Engineering Rules

**Document Status:** Mandatory
**Version:** V1.5
**Applies To:** All source code, database operations, Firebase configuration, UI/UX, backend, API, security rules, and refactoring work.

---

# 1. Purpose

This document defines the mandatory engineering rules for the KKPD-KP V1.5 platform.

These rules exist to ensure that development remains:

* safe
* incremental
* maintainable
* scalable
* secure
* backward-compatible with validated business logic
* aligned with the V1.5 architecture
* suitable for future V2 expansion

These rules are mandatory.

Codex MUST follow these rules when:

* creating code
* modifying code
* deleting code
* refactoring code
* changing database structures
* modifying Firebase rules
* modifying authentication
* modifying authorization
* modifying scoring
* modifying public visibility
* creating new features
* fixing bugs
* optimizing performance

If a requested implementation conflicts with these rules, Codex MUST NOT silently choose a workaround.

Codex must identify the conflict and explain the implications before proceeding with a materially different architectural decision.

---

# 2. Authority Hierarchy

When multiple instructions appear to conflict, use this priority:

```text
1. Explicit user instruction
2. RULES.md
3. ARCHITECTURE.md
4. DECISIONS.md
5. ROADMAP.md
6. Existing implementation
7. Codex assumptions
```

Existing code is NOT automatically considered authoritative.

Existing code may contain:

* legacy behavior
* temporary workarounds
* duplicated logic
* incorrect architecture
* incomplete features
* technical debt

However, existing validated business logic must be preserved unless explicitly approved for change.

---

# 3. No Big-Bang Rewrite

V1.5 MUST be developed incrementally.

Codex MUST NOT:

* rewrite the entire repository
* replace the entire frontend framework
* replace the entire Firebase architecture
* rewrite working business logic without justification
* perform unrelated refactoring while implementing a feature
* delete large portions of the repository merely because they are inconvenient

Preferred approach:

```text
Understand
   ↓
Isolate
   ↓
Refactor
   ↓
Validate
   ↓
Extend
```

Not:

```text
Delete Everything
   ↓
Rewrite Everything
```

---

# 4. Protect the Legacy System

The legacy Firebase project/database is a baseline.

The V1.5 application uses the new Firebase project.

The legacy system MUST be treated as read-only unless the user explicitly instructs otherwise.

Codex MUST NOT:

* write to the legacy Firestore
* delete legacy Firestore data
* modify legacy documents
* modify legacy Firebase Security Rules
* modify legacy Storage data
* migrate data automatically
* overwrite legacy collections
* silently connect V1.5 production code to the legacy database

Migration is a separate controlled operation.

---

# 5. No Automatic Migration

Codex MUST NOT automatically migrate legacy data simply because a new schema exists.

Migration requires:

1. finalized V1.5 schema
2. mapping between old and new fields
3. compatibility analysis
4. migration script
5. validation
6. explicit approval

The default workflow is:

```text
Legacy Data
    │
    │  READ / ANALYZE
    ▼
Migration Mapping
    │
    ▼
V1.5 Schema
    │
    ▼
Controlled Migration
```

Never:

```text
Old Data
   ↓
Automatic Conversion
```

---

# 6. Existing Scoring Logic Is Protected

The existing scoring engine is considered validated business logic.

This is one of the highest-priority rules.

Codex MUST NOT silently change:

* scoring formulas
* scoring semantics
* score interpretation
* answer-key interpretation
* category calculation
* score ranges
* pass/fail meaning
* weighting
* existing scoring behavior

The scoring implementation may be:

* wrapped
* isolated
* moved into a service
* adapted through an adapter
* given stronger typing
* covered by tests

but its business behavior MUST remain unchanged.

Preferred architecture:

```text
Response
   ↓
Validation
   ↓
Scoring Service
   ↓
Existing Scoring Logic
   ↓
Score Result
```

---

# 7. Scoring Changes Require Explicit Approval

If Codex determines that the existing scoring implementation is incompatible with V1.5, Codex MUST NOT rewrite it immediately.

It must first report:

```text
Problem:
Why compatibility fails:

Affected:
- files
- data
- forms
- historical responses

Proposed solution:

Risk:

Alternative:
```

Only after explicit approval may scoring semantics be changed.

---

# 8. Preserve Historical Scores

Historical responses and scores are immutable records of what happened at submission time unless an explicit correction workflow exists.

A later change to:

* form questions
* answer keys
* scoring rules
* form metadata

MUST NOT silently change historical scores.

Preferred model:

```text
Form
 │
 ├── Version 1
 │      └── Responses
 │
 └── Version 2
        └── New Responses
```

Historical responses MUST remain associated with the form version used during submission.

---

# 9. Form Versioning Is Mandatory for Historical Integrity

If a form has been used to collect responses, destructive modifications to its assessment meaning are prohibited.

Changes that may require a new version include:

* adding/removing questions
* changing question identity
* changing answer keys
* changing scoring configuration
* changing scoring semantics
* changing assessment meaning

A new version is preferred over mutating historical configuration.

---

# 10. Stable Question Identity

Every form question MUST have a stable `questionId`.

Codex MUST NOT use:

* array index
* display order
* question text
* arbitrary UI position

as the permanent identity of a question.

Example:

```text
questionId: "q_001"
```

Responses MUST reference questions through `questionId`.

Analytics MUST use `questionId` where question-level analysis is required.

---

# 11. Do Not Use Array Position as Data Identity

This is prohibited:

```text
answers[0]
answers[1]
answers[2]
```

as the only relationship between answers and questions.

Question ordering may change.

Question identity must remain stable.

Preferred:

```text
{
  questionId: "q_001",
  answer: "A"
}
```

---

# 12. Official Form Integrity

Official BPOM forms are controlled resources.

An official form MUST NOT be treated as an ordinary user-owned form.

Cadres and authorized users may use an official form through a distribution.

They MUST NOT mutate the official form through the distribution.

Preferred:

```text
Official Form
     │
     ▼
Distribution
     │
     ▼
Respondents
```

Not:

```text
Official Form
     ↓
Copy
     ↓
Cadre edits copy
```

unless a future explicitly approved cloning feature exists.

---

# 13. Official Forms Must Remain Centrally Governed

V1.5 prioritizes centralized official-form governance.

Official forms are managed by:

* BPOM
* authorized Admin users

The system should support:

```text
Draft
   ↓
Review
   ↓
Approved
   ↓
Published
   ↓
Archived
```

where applicable.

V1.5 does not need to implement decentralized form approval if doing so creates unnecessary complexity.

---

# 14. Future Form Request Workflow Must Not Pollute V1.5

The architecture should leave room for:

```text
Cadre / Partnership
       ↓
Form Request
       ↓
BPOM Review
       ↓
Approve / Reject
```

However, Codex MUST NOT introduce a complex form-request workflow into V1.5 unless explicitly instructed.

Do not build V2 complexity prematurely.

---

# 15. Distribution Is Separate From Form Ownership

A distribution is not the form itself.

These concepts MUST remain separate:

```text
Official Form
Form Version
Distribution
Response
```

A distribution represents a particular use of a form.

Multiple distributions may reference the same official form/version.

---

# 16. Distribution Attribution Is Mandatory

Every response submitted through a distribution MUST be traceable to that distribution.

Preferred relationship:

```text
Response
   ↓
Distribution
   ↓
Primary Owner
   ↓
Partnership
```

Where collaboration exists:

```text
Distribution
├── Primary Owner
└── Collaborators
```

This attribution is required for metrics and accountability.

---

# 17. Primary Owner and Collaborators

Every distribution may have:

* one primary owner
* zero or more collaborators

A collaborator does NOT automatically become the owner.

Collaboration MUST NOT grant unrelated permissions.

A collaborator may only access the resources explicitly allowed by the collaboration model.

---

# 18. Do Not Fake Attribution

Codex MUST NOT determine attribution from:

* current logged-in user alone
* URL text alone
* manually entered cadre name
* respondent-provided cadre name
* client-generated ownership fields

Attribution should be resolved from trusted distribution data.

Preferred:

```text
Distribution ID
      ↓
Stored Distribution
      ↓
Primary Owner
      ↓
Partnership
```

---

# 19. Public Respondents Do Not Require Accounts by Default

V1.5 public respondents generally do not need authentication.

Do not introduce mandatory respondent accounts unless explicitly required.

Preferred:

```text
Public Link / Code
       ↓
Published Form
       ↓
Respondent
       ↓
Submit
```

This is particularly important for school/student participation.

---

# 20. Never Expose Answer Keys to Public Users

Answer keys are private administrative/scoring data.

The public form payload MUST NOT expose:

* correct answers
* scoring keys
* hidden score rules
* internal scoring configuration
* moderation information

Public clients should receive only the information necessary to render and submit the form.

Preferred:

```text
PUBLIC
Question
Options
Required
Presentation

PRIVATE
Answer Key
Score Rules
Scoring Configuration
```

---

# 21. Score on Trusted Infrastructure

Scoring should occur in a trusted environment whenever practical.

Do not rely solely on client-calculated scores.

The client may provide answers.

The trusted backend/service calculates and persists the authoritative score.

Preferred:

```text
Client Answers
      ↓
Server Validation
      ↓
Scoring Service
      ↓
Persist Score
```

---

# 22. Persist the Score

For scoreable forms, the authoritative score SHOULD be persisted with the response.

A historical response should contain enough information to understand:

* what form was used
* what version was used
* which distribution was used
* what answers were submitted
* what score was produced
* when it was submitted

Do not depend exclusively on recalculating historical scores every time a dashboard is opened.

---

# 23. Generic Partnership Architecture

The system MUST remain generic.

Never hardcode assumptions such as:

```text
if partnershipType === "school"
```

throughout the application.

School-specific behavior should be isolated behind:

* metadata
* configuration
* optional modules
* type-specific presentation

The core system must remain:

```text
Partnership
```

rather than:

```text
School
```

---

# 24. School Is Not the Root Domain

A school is a partnership type.

It is NOT the fundamental root entity of the application.

Incorrect:

```text
School
 └── Cadres
```

Preferred:

```text
Partnership
 └── Cadres
```

with:

```text
partnershipType = "school"
```

---

# 25. Do Not Hardcode Future Kelurahan Hierarchy

The architecture must allow future organizational structures such as:

```text
Kelurahan
   ↓
RW
   ↓
RT
```

but V1.5 MUST NOT implement unnecessary RT/RW complexity unless explicitly requested.

The system should remain extensible without prematurely implementing V2.

---

# 26. Cadre Hierarchy Is Prohibited

V1.5 has no cadre hierarchy.

Do not create:

* cadre levels
* cadre ranks
* cadre leader role
* cadre chairman role
* level 2 cadre
* level 3 cadre

All cadres use the same cadre role.

Monitoring belongs to:

* Admin
* Partnership

unless future requirements explicitly change this architecture.

---

# 27. Cadre Ownership

Cadres may manage their own permitted resources.

Examples:

```text
Cadre A
 ├── Article A
 └── Distribution A
```

Cadre A MUST NOT modify:

```text
Article B
Distribution B
```

unless:

* the resource is explicitly collaborative
* the user has explicit permission
* the user is Admin

---

# 28. Partnership Scope

A partnership may monitor resources belonging to its scope.

A partnership MUST NOT access another partnership's private data.

Example:

```text
School A
 ├── Cadre A
 ├── Articles
 ├── Distributions
 └── Metrics

School B
 ├── Cadre B
 ├── Articles
 ├── Distributions
 └── Metrics
```

School A must not automatically access School B's private records.

---

# 29. Admin Has Global Scope

Admin is the central management role.

Admin may manage:

* all partnerships
* all cadres
* all articles
* official forms
* distributions
* responses
* metrics
* CMS
* settings

Admin authorization should still be explicitly implemented and audited.

Do not assume a UI path is security.

---

# 30. Client-Side Authorization Is Not Security

These are NOT security mechanisms:

```text
if (role === "admin")
```

```text
if (!isAdmin) hideButton()
```

```text
disabled={!canEdit}
```

They are UX mechanisms only.

Security MUST be enforced through trusted server-side logic and/or Firebase Security Rules.

---

# 31. Never Trust Client Ownership Fields

Never trust:

```text
ownerId
createdBy
partnershipId
role
userId
```

when supplied by an untrusted client.

For protected operations, ownership should be resolved from:

* authenticated identity
* server-side context
* trusted database records
* Firebase Security Rules

---

# 32. Authentication and Authorization Must Remain Separate

Authentication answers:

> Who are you?

Authorization answers:

> What may you do?

Do not encode authorization solely into frontend authentication state.

Preferred:

```text
Firebase Auth
     ↓
Authenticated UID
     ↓
Application User
     ↓
Role + Scope
     ↓
Authorization
```

---

# 33. Server-Only Credentials

Private Firebase Admin credentials MUST remain server-side.

Never expose:

* service account credentials
* private keys
* Admin SDK credentials
* server secrets

through:

```text
NEXT_PUBLIC_*
```

Never place service-account JSON into client bundles.

Never commit private keys to Git.

---

# 34. Environment Variables

Environment variables must be categorized appropriately.

Public Firebase configuration may use:

```text
NEXT_PUBLIC_*
```

Server credentials must NOT.

Private values must remain server-side.

Codex must inspect environment-variable usage before moving Firebase code between client and server contexts.

---

# 35. Firebase Client and Admin SDK Separation

Client Firebase SDK and Firebase Admin SDK have different responsibilities.

Client:

```text
Authentication
Firestore client operations where permitted
Storage client operations where permitted
```

Server:

```text
Admin Authentication
Trusted Firestore operations
Trusted Storage operations
Server-side workflows
```

Do not import Firebase Admin SDK into client components.

Do not expose Admin SDK functionality through unsafe client imports.

---

# 36. Repository Pattern

Database access SHOULD be centralized through repositories.

Preferred:

```text
UI
 ↓
Service
 ↓
Repository
 ↓
Firebase
```

Do not scatter raw Firestore operations across dozens of components.

Avoid:

```text
Component A → Firestore
Component B → Firestore
Component C → Firestore
Component D → Firestore
```

Prefer:

```text
Components
     ↓
Services
     ↓
Repositories
     ↓
Firestore
```

---

# 37. Service Layer

Business workflows belong in services rather than UI components.

Examples:

```text
formService
distributionService
responseService
articleService
partnershipService
cadreService
scoringService
metricsService
```

Services should coordinate:

* validation
* authorization
* repository operations
* business rules
* event/activity generation
* related domain updates

---

# 38. UI Components Must Not Own Business Logic

React components should primarily handle:

* presentation
* interaction
* local UI state
* loading
* error presentation
* form input

Avoid embedding complex:

* scoring logic
* authorization logic
* Firestore workflows
* ownership resolution
* metric calculations

inside React components.

---

# 39. Centralize Validation

Validation rules should be centralized.

Preferred:

```text
Input
 ↓
Schema Validation
 ↓
Business Validation
 ↓
Authorization
 ↓
Operation
```

Do not duplicate important validation logic across:

* frontend
* API
* server action
* repository

Frontend validation may exist for UX.

Backend validation remains authoritative.

---

# 40. Centralize Constants

Repeated values should not be scattered throughout the application.

Centralize:

* roles
* statuses
* partnership types
* form types
* assessment types
* activity types
* publication statuses

Avoid:

```text
"admin"
"Admin"
"ADMIN"
```

being independently used throughout the codebase.

Use one canonical representation.

---

# 41. Status Values Must Be Controlled

Do not create arbitrary status strings throughout the application.

Examples:

```text
draft
pending_review
approved
published
archived
rejected
```

should have a canonical definition.

Status transitions should be explicit.

---

# 42. No Magic Strings for Domain Logic

Avoid domain logic based on repeated raw strings.

Bad:

```text
if (status === "published")
```

everywhere without a canonical definition.

Prefer centralized domain constants/types.

---

# 43. Article Ownership and Attribution

Every cadre-created article should preserve:

* creator
* owner
* partnership context
* publication status
* publication timestamp
* relevant attribution

The public article may display:

```text
Published by:
Cadre Name
Partnership Name
```

when configured to be public.

---

# 44. Article Deletion

Article deletion must respect ownership.

Cadres may delete only their own permitted articles.

Admin may manage all articles.

Deletion should be carefully considered if an article already has:

* associated metrics
* public references
* form associations
* activity history

Prefer soft deletion/archive where historical integrity matters.

---

# 45. Public Renderer Must Not Have Its Own Business Model

Public pages should render data from the same underlying CMS/domain model.

Do not create separate hardcoded public content that duplicates admin-managed data.

Preferred:

```text
Admin CMS
    ↓
Firestore
    ↓
Public Renderer
```

---

# 46. Admin Preview Must Match Public Renderer

Admin preview and public rendering should use the same rendering logic wherever practical.

Do not create:

```text
Admin Preview Renderer
```

and:

```text
Public Renderer
```

with unrelated implementations.

The preview should approximate what the public user will actually see.

---

# 47. CMS Must Remain No-Code for Ordinary Operations

Admin should be able to manage ordinary public content without modifying source code.

Examples:

* landing page content
* article content
* gallery
* partnership public information
* site settings
* public sections

Do not hardcode content that has already been designated as CMS-managed.

---

# 48. Settings Must Have a Single Source of Truth

Configurable public settings should be stored centrally.

Avoid:

```text
Component A → hardcoded setting
Component B → another setting
Component C → Firestore
```

Prefer:

```text
Firestore Settings
       ↓
Settings Repository
       ↓
Settings Service
       ↓
Application
```

---

# 49. Gallery Architecture

Gallery metadata and media storage are separate concerns.

Media:

```text
Cloud Storage
```

Metadata:

```text
Firestore
```

Do not store large binary files directly inside Firestore documents.

---

# 50. Public Data Must Be Explicit

Data is NOT public simply because it exists in Firestore.

A resource must be explicitly eligible for public exposure.

Examples:

```text
public = true
status = published
```

or equivalent controlled logic.

Private data must remain private by default.

---

# 51. Never Expose Private Respondent Data

Public pages MUST NOT expose:

* respondent names
* individual responses
* scores
* personal identifiers
* private participation records

unless explicitly intended and authorized.

Aggregated public metrics may be exposed when approved.

---

# 52. Metrics Must Be Derived From Source Data

Metrics should generally be derived from:

* articles
* distributions
* responses
* activities
* partnerships
* cadres

Do not manually increment metrics when the source data can be queried or derived reliably.

Avoid fragile patterns such as:

```text
articleCount++
```

without ensuring consistency.

---

# 53. Metrics Must Not Become the Sole Source of Truth

A metric document must not replace the underlying records.

For example:

```text
totalResponses = 153
```

is not sufficient as the only record of responses.

The actual response records remain the source of truth.

Metrics are derived/aggregated representations.

---

# 54. Activity Records Must Represent Real Events

Activities should represent meaningful domain events.

Good:

```text
article_published
form_distributed
response_submitted
assessment_completed
collaborator_added
```

Avoid creating meaningless activity records for every trivial UI action.

Do not log:

```text
modal_opened
button_hovered
tab_clicked
```

unless explicitly required for analytics.

---

# 55. Activity Attribution

Activities should identify:

* actor
* actor role where appropriate
* partnership
* resource type
* resource ID
* activity type
* timestamp

The system should be able to answer:

> Who did what, to which resource, and when?

---

# 56. Metrics and Activities Must Respect Scope

Cadre metrics:

```text
Own contributions
```

Partnership metrics:

```text
Partnership contributions
```

Admin metrics:

```text
Platform-wide
```

Do not mix scopes unintentionally.

---

# 57. No Manual Respondent Attribution

If a distribution already determines:

```text
Cadre
Partnership
Campaign
```

do not ask respondents to manually enter the same information unless there is a specific business reason.

The system already knows the attribution.

---

# 58. Avoid Duplicate Data Entry

If information is already known by the system, do not ask users to enter it again.

Examples:

If a cadre owns a distribution:

```text
Do not ask:
"Who is distributing this form?"
```

If the distribution belongs to a partnership:

```text
Do not ask:
"Which partnership is this?"
```

unless the user legitimately has multiple scopes and must select one.

---

# 59. Form UX

The form builder must prioritize:

* clarity
* speed
* visibility
* responsive design
* low cognitive load

The admin should be able to understand the whole form without opening every question individually.

The answer key should be accessible from a dedicated overview.

---

# 60. Avoid Excessive Modal Usage

Do not build workflows requiring:

```text
Modal
  ↓
Modal
  ↓
Modal
  ↓
Form
```

Prefer:

* dedicated pages
* side panels
* inline editing
* tabs
* expandable sections

Use modals only when the interaction genuinely benefits from them.

---

# 61. No Browser `alert()`

Do not use:

```text
alert()
confirm()
prompt()
```

for normal application UX.

Use application-level:

* toast
* confirmation dialog
* inline validation
* status message
* error state

Critical destructive operations should require clear confirmation.

---

# 62. Responsive Design Is Mandatory

Every major interface must support:

* desktop
* tablet
* mobile

Do not treat mobile as an afterthought.

Important admin interfaces should remain usable at narrow widths.

Tables should use appropriate responsive patterns such as:

* horizontal scrolling
* responsive cards
* column prioritization
* detail drawers

rather than simply overflowing the viewport.

---

# 63. Form Builder Mobile Behavior

The Form Builder may use a desktop-optimized layout where necessary, but it must remain usable on mobile.

On mobile:

* question editing should remain accessible
* controls should not overflow
* buttons should remain reachable
* answer-key management should remain usable
* preview should remain readable

---

# 64. Loading States

Every asynchronous operation should provide appropriate feedback.

Examples:

```text
Loading
Saving
Publishing
Deleting
Submitting
Fetching
```

Avoid interfaces that appear frozen.

---

# 65. Error Handling

Errors must be:

* understandable
* contextual
* actionable

Avoid exposing raw errors such as:

```text
FirebaseError: PERMISSION_DENIED
```

directly to ordinary users.

Technical errors should be logged appropriately while users receive understandable messages.

---

# 66. Do Not Swallow Errors

Avoid:

```text
try {
  ...
} catch {
}
```

without handling the error.

Every caught error must be:

* handled
* transformed into a meaningful application error
* logged when appropriate
* rethrown when necessary

---

# 67. Do Not Hide Backend Failures

A successful UI state must not be shown when the backend operation failed.

For example:

```text
Publish clicked
    ↓
Firestore failed
```

must NOT result in:

```text
"Published successfully"
```

---

# 68. Optimistic Updates Must Be Safe

Optimistic UI may be used for low-risk interactions.

For critical operations such as:

* publishing
* deleting
* submitting responses
* changing permissions
* changing answer keys

the UI must correctly reconcile with backend results.

---

# 69. Destructive Operations

Destructive operations require:

* clear action labels
* confirmation when appropriate
* authorization
* backend enforcement
* proper error handling

Examples:

* delete article
* archive form
* remove cadre
* delete partnership
* remove collaborator

Never rely solely on a hidden button to prevent destructive actions.

---

# 70. Prefer Archive Over Destructive Delete

For resources with historical significance, prefer:

```text
Active
 ↓
Archived
```

over:

```text
Active
 ↓
Deleted forever
```

when appropriate.

This is especially important for:

* forms
* form versions
* responses
* articles
* activities
* partnership records

---

# 71. Do Not Delete Historical Response Context

Never delete or mutate information required to interpret a historical response.

A historical response must retain enough context to understand:

* form
* form version
* distribution
* answers
* score
* timestamp

---

# 72. Firestore Query Discipline

Avoid unnecessarily broad queries.

Prefer:

```text
where(...)
orderBy(...)
limit(...)
```

where appropriate.

Do not retrieve an entire collection merely to filter it in the browser when the query can safely be performed server-side.

---

# 73. Pagination

Large datasets should support pagination or bounded loading.

Potential candidates:

* responses
* activities
* articles
* cadres
* partnerships
* distributions

Do not assume datasets will remain small.

---

# 74. Avoid N+1 Queries

Do not implement:

```text
Fetch 100 cadres
   ↓
Fetch partnership for each cadre
   ↓
Fetch metrics for each cadre
```

without considering query efficiency.

Use:

* denormalized references where appropriate
* batched queries
* aggregation
* precomputed metrics where justified

while preserving source-of-truth integrity.

---

# 75. Avoid Unnecessary Denormalization

Denormalized data may improve performance, but duplication introduces consistency risk.

Before duplicating data, identify:

* source of truth
* update strategy
* synchronization strategy
* failure behavior

Do not duplicate domain data simply because it is convenient for a component.

---

# 76. Database Schema Changes

Before changing the V1.5 schema, identify:

1. affected collections
2. affected fields
3. existing documents
4. readers
5. writers
6. security rules
7. queries
8. indexes
9. migration implications

Never rename or remove a widely used field blindly.

---

# 77. Backward Compatibility Within V1.5

When practical, prefer additive schema changes.

Preferred:

```text
Existing fields
+
New optional fields
```

rather than:

```text
Delete old field
Rename field
Rewrite everything
```

Compatibility may be removed later through a controlled migration.

---

# 78. TypeScript Strictness

Use strong typing for domain models.

Avoid:

```text
any
```

unless there is a documented reason.

Prefer:

* interfaces
* types
* discriminated unions
* schema validation
* explicit return types for critical services

Do not use type assertions to hide real type problems.

---

# 79. Duplicate Types Are Prohibited

Do not define the same domain model independently in multiple locations.

For example, avoid:

```text
User type in component A
User type in component B
User type in service C
```

Use canonical domain types.

---

# 80. Domain Types Must Reflect Architecture

Types should represent the actual domain.

For example, do not encode:

```text
cadre.level
```

if V1.5 has no cadre hierarchy.

Do not create fields that imply unsupported business rules.

---

# 81. Avoid Dead Code

Do not leave large amounts of abandoned code after refactoring.

After replacement:

* remove obsolete imports
* remove unreachable code
* remove duplicate components
* remove dead utilities
* remove obsolete types

Do not delete potentially required code without verifying usage.

---

# 82. Do Not Refactor Unrelated Code

While implementing:

```text
Partnership Management
```

do not simultaneously rewrite:

```text
Gallery
Scoring
Authentication
Public Renderer
```

unless the dependency is real.

Keep changes scoped.

---

# 83. Do Not Mix Feature and Cosmetic Refactors Without Reason

A feature change should not automatically trigger broad formatting or architectural changes.

Avoid giant commits containing:

```text
Feature
+
Formatting
+
File renaming
+
Unrelated refactor
+
Dependency upgrade
```

Prefer focused changes.

---

# 84. Dependency Changes Require Justification

Do not add a package simply because it makes a small task easier.

Before adding a dependency, consider:

* whether the functionality already exists
* bundle impact
* security implications
* maintenance
* compatibility with Next.js
* compatibility with Firebase
* necessity for V1.5

---

# 85. Do Not Upgrade Dependencies Unnecessarily

Do not upgrade:

* Next.js
* React
* Firebase
* TypeScript
* Tailwind
* major packages

during unrelated feature development unless required.

Dependency upgrades are separate changes unless required to unblock implementation.

---

# 86. Next.js Architecture

Respect the existing Next.js App Router architecture.

Client components should only be used where client-side behavior is necessary.

Prefer server-side execution for:

* sensitive operations
* privileged database operations
* server-side validation
* scoring
* authorization-sensitive workflows

Do not make an entire route client-side merely because one component needs interactivity.

---

# 87. Firebase Admin SDK Must Remain Server-Side

Any Firebase Admin SDK usage must remain in trusted server execution contexts.

Do not import Admin SDK into:

```text
"use client"
```

components.

Do not expose Admin SDK objects through client props.

---

# 88. Public Form Rendering Must Be Safe

The public form renderer must receive only public-safe data.

The server must determine:

* whether form is published
* which version is active
* whether distribution is valid
* whether submission is allowed

Do not trust the client to declare:

```text
isPublished = true
```

---

# 89. Submission Must Be Server-Validated

A submitted response must be validated against the actual stored form version.

Do not trust the client to send:

```text
score
formVersion
ownerId
partnershipId
```

as authoritative values.

The server should resolve authoritative metadata.

---

# 90. Client Score Must Not Become Authoritative

If the client calculates a score for display, that score is provisional.

The authoritative score must be calculated through the trusted scoring path.

---

# 91. Response Integrity

A response should preserve:

```text
formId
formVersionId
distributionId
respondent
answers
score
submittedAt
```

and attribution information where applicable.

Do not allow a client to rewrite historical attribution after submission.

---

# 92. Prevent Duplicate Submission Where Required

If a form requires duplicate protection, implement it using server-side rules and an explicit identity strategy.

Do not assume:

```text
name === unique identity
```

is sufficient unless the business requirement explicitly accepts that limitation.

---

# 93. Student Data Scope

V1.5 should not require deep integration with school student databases.

The platform may collect respondent identity through the form.

Do not build external student-data synchronization unless explicitly requested.

---

# 94. Privacy by Default

Collect only data needed for the program.

Do not create fields merely because they may be useful later.

Avoid unnecessary personal data.

Private respondent information must not become public metrics.

---

# 95. Public Metrics Must Be Aggregated

When displaying public metrics, prefer aggregate values.

Example:

```text
1,245 participants reached
```

rather than:

```text
Student A
Student B
Student C
```

unless explicit public publication is intended.

---

# 96. No Hidden Business Logic in URL Parameters

Do not trust URL parameters for authorization.

For example:

```text
/admin/cadre?id=ABC
```

does not grant access to cadre ABC.

The backend must verify the authenticated user's scope.

---

# 97. No Security Through Obscurity

These are not security controls:

* obscure URLs
* random IDs
* hidden buttons
* hidden menus
* secret frontend routes
* distribution codes alone

They may contribute to usability, but authorization must still be enforced.

---

# 98. Distribution Codes Are Identifiers, Not Authorization

A distribution code identifies a distribution.

It must not automatically grant administrative access.

Public respondents may use the code to access the associated published form.

Administrative access remains controlled by authentication and authorization.

---

# 99. Collaboration Does Not Override Ownership

Adding a collaborator to a distribution does not transfer ownership.

The system must preserve:

```text
primaryOwnerId
collaboratorIds
```

and apply permissions accordingly.

---

# 100. CMS Publication Rules

A resource must not appear publicly simply because it exists.

The publication state must be explicit.

Preferred:

```text
draft
    ↓
published
```

and:

```text
published
    ↓
archived/unpublished
```

---

# 101. Preview Must Not Publish

Admin preview must not accidentally change publication state.

Preview operations should be read/render operations unless explicitly saving.

---

# 102. Draft Data Must Not Leak Publicly

Draft articles, forms, settings, and other unpublished content must not be publicly accessible through normal public endpoints.

Security rules and backend queries must enforce this.

---

# 103. Form Publishing Validation

A form should not be publishable if required structural information is invalid.

Examples:

* missing title
* invalid questions
* missing required question identifiers
* invalid answer key for scoreable question
* invalid scoring configuration
* malformed options
* unsupported question type

The exact validation rules belong to the form domain.

---

# 104. Form Builder Must Have a Clear Save State

The user must be able to understand whether changes are:

```text
Saved
Saving
Unsaved
Failed to save
```

Do not silently discard edits.

---

# 105. Answer Key UX

Answer keys must be manageable without opening every question individually.

The Form Builder should provide an overview such as:

```text
Question 1 | Correct Answer | Score
Question 2 | Correct Answer | Score
Question 3 | Correct Answer | Score
```

This is a required UX principle for V1.5.

---

# 106. Form Preview

Form Preview should represent the actual public form renderer as closely as possible.

Do not create a preview that behaves fundamentally differently from the public form.

Preferred:

```text
Form Definition
      ↓
Public Renderer
      ↑
Admin Preview
```

---

# 107. No Separate Form Rendering Logic Unless Necessary

Avoid:

```text
Admin Form Renderer
Public Form Renderer
Mobile Form Renderer
```

with three separate implementations.

Prefer a shared renderer with controlled context differences.

---

# 108. Responsive Form Rendering

Public forms must be optimized for mobile.

The target respondent may be using:

* mobile phone
* tablet
* desktop

The form must remain easy to:

* read
* navigate
* answer
* submit

---

# 109. Article UX

Article management should make ownership visible.

Admin should be able to identify:

```text
Created by
Published by
Partnership
Status
```

Cadres should clearly understand whether an article is:

```text
Draft
Published
Archived
```

---

# 110. Partnership UX

Partnership management should prioritize:

```text
Partnership
    ↓
Cadres
    ↓
Activity
    ↓
Metrics
```

Avoid forcing administrators to navigate through unrelated pages to understand a partnership.

---

# 111. Cadre UX

Cadre dashboards should focus on contribution.

Important information includes:

* own articles
* own distributions
* participants reached
* responses
* activities
* milestones
* profile

Do not overload the cadre interface with global administrative data.

---

# 112. Admin UX

Admin interfaces may expose more information, but should still prioritize:

* overview
* search
* filtering
* actionable status
* clear ownership
* clear scope
* efficient bulk management where appropriate

Do not build dashboards that show every possible metric simultaneously.

---

# 113. Search and Filtering

Large administrative lists should support appropriate:

* search
* filtering
* sorting
* pagination

Examples:

* partnerships
* cadres
* articles
* forms
* distributions
* responses
* activities

---

# 114. Mobile Admin UX

Admin functionality should remain usable on mobile even if desktop is the primary workflow.

Avoid requiring:

* hover-only interactions
* tiny click targets
* inaccessible horizontal layouts
* fixed-width desktop-only modals

---

# 115. Accessibility

UI should follow basic accessibility practices.

At minimum:

* semantic controls
* keyboard accessibility
* visible focus states
* labels for inputs
* sufficient contrast
* descriptive buttons
* accessible error messages

Do not rely solely on color to communicate status.

---

# 116. Forms Must Be Accessible

Form inputs must have:

* labels
* meaningful error messages
* required indication
* appropriate input types
* keyboard accessibility

Validation errors should identify the affected field.

---

# 117. No Silent Data Loss

Never:

* overwrite unsaved form state silently
* discard edits after navigation
* delete data without confirmation when destructive
* replace server data with stale client state without warning

---

# 118. Logging

Logging should be useful for diagnosing:

* authentication errors
* authorization failures
* database errors
* form submission errors
* scoring errors
* publication failures

Do not log sensitive respondent information unnecessarily.

Never log:

* private keys
* service account credentials
* passwords
* authentication secrets

---

# 119. Error Boundaries

Important application sections should have appropriate error handling so a failure in one domain does not unnecessarily crash the entire application.

Examples:

```text
Admin Dashboard
Articles
Forms
Metrics
```

should fail gracefully where possible.

---

# 120. Testing Requirements

Meaningful domain behavior should have tests where practical.

Priority testing areas:

1. Authentication
2. Authorization
3. Form validation
4. Question identity
5. Answer-key handling
6. Scoring
7. Response submission
8. Distribution attribution
9. Ownership
10. Historical versioning
11. Public/private visibility

---

# 121. Scoring Regression Tests

The existing scoring behavior should have regression tests before major refactoring.

Tests should verify known baseline cases.

The purpose is:

```text
Old Validated Behavior
        ↓
Regression Tests
        ↓
V1.5 Refactor
        ↓
Same Results
```

---

# 122. Security Rule Testing

Firestore Security Rules should be tested for at least:

```text
Admin
Partnership
Cadre
Public
Unauthorized User
```

Tests should include attempts to access:

* own data
* another user's data
* another partnership's data
* unpublished content
* responses outside scope
* unauthorized writes

---

# 123. Build Validation

Before a phase is considered complete, the relevant project validation should be run.

At minimum where applicable:

```text
Typecheck
Lint
Build
Tests
```

Do not declare success solely because the development server starts.

---

# 124. Do Not Ignore Build Warnings Blindly

Warnings should be classified as:

* harmless
* known
* actionable
* blocking

Do not hide warnings simply to produce clean output.

If a warning indicates deprecated architecture or future incompatibility, document it.

---

# 125. Next.js Configuration

Do not preserve obsolete configuration merely because it existed in the legacy project.

If a Next.js configuration option is deprecated or unsupported, it should be evaluated and corrected as part of relevant maintenance.

Do not make unrelated configuration changes without necessity.

---

# 126. Deprecated Framework Conventions

If the current Next.js version deprecates an existing convention, the replacement should be evaluated.

However, do not perform broad framework migrations during unrelated feature work.

---

# 127. Feature Boundaries

Every feature should have a clear domain boundary.

Examples:

```text
Partnership
Cadre
Article
Form
Distribution
Response
Metrics
```

Do not let one module become a dumping ground for unrelated functionality.

---

# 128. Avoid God Components

Avoid giant components containing:

* data fetching
* authorization
* business logic
* form state
* scoring
* database mutations
* rendering

all in one file.

Split by responsibility.

---

# 129. Avoid God Services

Services should also remain focused.

Do not create:

```text
everythingService
```

containing the entire application.

Prefer domain-oriented services.

---

# 130. Avoid Premature Abstraction

Do not create generic abstractions merely because two pieces of code look superficially similar.

Abstract when:

* behavior is genuinely shared
* responsibilities are stable
* abstraction reduces duplication
* abstraction remains understandable

Do not build an elaborate framework inside the application.

---

# 131. Avoid Premature V2 Development

Do not implement V2 features merely because the architecture can support them.

V2 candidates include:

* form request workflows
* advanced RT/RW hierarchy
* external student database integration
* advanced milestone engine
* advanced statistical analytics
* complex collaboration
* external system integrations

V1.5 must remain focused.

---

# 132. Feature Completeness

A feature is not complete merely because its UI exists.

A feature is complete only when appropriate layers are integrated:

```text
UI
 ↓
Validation
 ↓
Authorization
 ↓
Service
 ↓
Repository
 ↓
Database
 ↓
Security
 ↓
Feedback
```

For public features:

```text
Admin/CMS
 ↓
Published Data
 ↓
Public Renderer
```

---

# 133. No Fake Features

Do not implement UI controls that do not actually work.

Avoid buttons such as:

```text
Publish
Delete
Export
Approve
Collaborate
```

that only modify local state without performing the real operation.

If a feature is intentionally unavailable, mark it appropriately rather than pretending it works.

---

# 134. No Hardcoded Production Data

Do not hardcode real production-like content into components when the architecture specifies Firestore/CMS as the source of truth.

Mock data may be used for:

* tests
* development
* previews

but must not accidentally become production behavior.

---

# 135. Seed Data

Seed data must be clearly separated from real data.

Never mix:

```text
demo data
```

with:

```text
production data
```

without explicit configuration.

---

# 136. Environment Separation

The application should distinguish:

```text
development
production
test
```

where appropriate.

Development tools such as Firebase Emulator must not accidentally connect to production.

Production must not accidentally use emulator configuration.

---

# 137. Firebase Emulator Safety

If emulator mode exists:

```text
USE_EMULATOR=true
```

must be explicitly controlled.

Production should default to real Firebase services.

Do not automatically enable emulators merely because the application is running locally if that could cause confusion about which data is being used.

---

# 138. No Production Secrets in Repository

Never commit:

* `.env`
* service account JSON
* private keys
* tokens
* API secrets
* credentials

Use environment configuration.

---

# 139. Git Discipline

Changes should be logically grouped.

Preferred commit structure:

```text
feat: add partnership repository
feat: add partnership admin UI
fix: enforce partnership ownership
refactor: extract form service
test: add scoring regression tests
```

Avoid giant commits that mix unrelated work.

---

# 140. Branch Discipline

V1.5 development should be isolated from the legacy production implementation.

Preferred:

```text
Legacy Repository / Branch
        │
        └── untouched

V1.5
        │
        └── independent development
```

The V1.5 deployment should not destabilize the existing deployment.

---

# 141. Deployment Safety

Before deploying:

* build locally
* verify environment variables
* verify Firebase project
* verify Firestore rules
* verify Storage rules
* verify authentication
* verify public routes
* verify admin routes
* verify form submission

Do not deploy blindly after major architectural changes.

---

# 142. Database Environment Verification

The application must make it clear which Firebase project it is connected to during development/debugging.

A developer should be able to verify:

```text
Project ID
Environment
Emulator / Production
```

without exposing secrets.

---

# 143. Migration Scripts Must Be Explicit

Any future migration script must clearly state:

```text
SOURCE
TARGET
FIELDS
TRANSFORMATION
ASSUMPTIONS
```

Migration scripts must be idempotent or carefully protected against accidental repeated execution where practical.

---

# 144. Data Deletion Must Be Deliberate

Before deleting a collection/document structure, determine whether it is referenced by:

* articles
* forms
* distributions
* responses
* activities
* metrics

Do not delete a parent record without considering dependent historical records.

---

# 145. Referential Integrity

Where relationships exist, the application should preserve logical referential integrity.

For example:

```text
Response
 → Distribution
 → Form Version
 → Form
```

A response should not become impossible to interpret because the referenced form was permanently deleted.

---

# 146. Public Visibility Must Be Reversible

Publishing and unpublishing should be explicit.

Preferred:

```text
Draft
 ↓
Published
 ↓
Unpublished / Archived
```

Do not require deleting a document to remove it from the public website.

---

# 147. Article Publication Attribution

Published articles should retain attribution even if:

* cadre account changes status
* partnership changes metadata
* article is later edited by Admin

Historical publication attribution should not disappear merely because the current owner profile changed.

---

# 148. Account Deactivation

Deactivating a user should not automatically delete all historical contributions.

For example:

```text
Cadre deactivated
```

does not mean:

```text
Delete articles
Delete responses
Delete activities
Delete historical metrics
```

Historical records should remain interpretable.

---

# 149. Partnership Deactivation

Similarly, deactivating a partnership should not automatically destroy historical program data.

Prefer:

```text
Active
 ↓
Inactive / Archived
```

while preserving historical records.

---

# 150. Account Deletion and Data Retention

If deletion is ever required, it must distinguish:

```text
Authentication account
```

from:

```text
Historical domain records
```

Do not automatically delete historical records unless explicitly required.

---

# 151. Metrics Must Survive Account Status Changes

If a cadre becomes inactive, historical contribution metrics should remain meaningful.

Example:

```text
Cadre A
Published 12 articles
Reached 500 respondents

Cadre A → Inactive
```

The historical contribution should remain.

---

# 152. No Manual Metric Inflation

Users must not be able to manipulate metrics by sending arbitrary:

```text
count
score
reach
views
responses
```

from the client.

Metrics must derive from trusted events/data.

---

# 153. Activity Records Must Not Be User-Controlled

The client should not be able to freely submit:

```text
activityType = "article_published"
```

and create a fake publication activity.

Activities should be generated by authorized domain operations.

---

# 154. Auditability

Important operations should be traceable where appropriate.

Especially:

* publishing
* unpublishing
* deleting
* changing answer keys
* changing permissions
* adding collaborators
* form approval
* form archival

The system should preserve enough information to determine who performed important actions.

---

# 155. Form Answer-Key Changes Are Sensitive

Changing an answer key may affect future scoring.

It MUST NOT retroactively modify historical responses.

If the change affects assessment semantics, create a new form version.

---

# 156. Form Distribution Must Pin the Intended Version

A distribution should identify which form version it uses.

Do not assume:

```text
distribution → latest form version
```

if that could change the meaning of an existing distribution.

Preferred:

```text
Distribution
    ↓
Form Version 3
```

This ensures stable behavior.

---

# 157. Existing Distributions Must Not Change Meaning Silently

If an official form is updated, existing distributions should not unexpectedly switch to the new assessment version unless that behavior is explicitly designed and approved.

Historical and active distributions should have deterministic version behavior.

---

# 158. Response Submission Must Be Atomic Where Practical

A successful submission should not leave the system in an inconsistent state such as:

```text
Response exists
but score missing
```

or:

```text
Response exists
but attribution missing
```

where those fields are required.

Use appropriate transactional/batched operations where practical.

---

# 159. Partial Failure Must Be Handled

If a multi-step operation fails, the system should either:

* roll back where supported
* retry safely
* record a recoverable state
* report the failure clearly

Do not leave silent partial state.

---

# 160. Idempotency for Critical Operations

Operations such as:

* response submission
* publishing
* migration
* metric aggregation

should be considered for duplicate execution.

Do not create duplicate responses simply because a client retries a request.

---

# 161. Public Form Submission Must Handle Network Problems

Respondents may use unstable mobile connections.

The system should provide:

* clear submission state
* prevention of accidental double submission
* retry strategy where appropriate
* clear success/failure feedback

Do not falsely indicate success when submission has not been confirmed.

---

# 162. Performance

Performance optimizations should prioritize:

1. public form loading
2. public article loading
3. admin lists
4. dashboard queries
5. response tables
6. image/media loading

Avoid premature micro-optimization.

---

# 163. Image Handling

Images should be:

* appropriately sized
* optimized where possible
* lazy-loaded where appropriate
* stored in Storage rather than Firestore

Do not upload unnecessarily huge files.

---

# 164. Mobile Network Awareness

Public respondent flows should avoid unnecessary large downloads.

Especially avoid loading:

* admin data
* hidden scoring data
* unrelated CMS data
* unnecessary JavaScript

---

# 165. Data Fetching Scope

Fetch only what the current screen requires.

Do not load:

```text
all partnerships
all cadres
all articles
all responses
all metrics
```

just to render a small component.

---

# 166. No Circular Domain Dependencies

Avoid architecture such as:

```text
Article Service
 → Form Service
 → Article Service
 → Metrics Service
 → Article Service
```

Services should have clear responsibilities.

If a workflow requires multiple domains, a higher-level orchestration layer may coordinate them.

---

# 167. Domain Events

Where useful, meaningful domain events may trigger:

```text
Activity
Metrics
Notifications
```

Example:

```text
Article Published
       ↓
Activity Created
       ↓
Metrics Updated/Derived
```

Do not duplicate the publication operation inside three unrelated components.

---

# 168. Metrics Should Not Block Core Transactions Unnecessarily

A response submission should not fail solely because an optional analytics aggregation failed, unless the metric is part of the required transaction.

Core operation:

```text
Submit Response
```

must remain reliable.

Secondary:

```text
Update Dashboard Aggregation
```

may be handled separately where appropriate.

---

# 169. Notifications

Notifications are secondary features unless explicitly required.

Do not introduce a complex notification architecture merely to support basic V1.5 workflows.

---

# 170. Feature Flags and Progressive Rollout

If a feature is risky or incomplete, use a controlled feature flag or keep it behind an appropriate route rather than exposing broken functionality publicly.

Do not expose experimental V2 features accidentally.

---

# 171. No Hidden Legacy Dependencies

V1.5 should not secretly depend on the legacy application's:

* Firestore
* Storage
* authentication
* environment variables
* APIs
* hardcoded IDs

All V1.5 dependencies should be explicit.

---

# 172. Legacy Code Reuse

Legacy code may be reused if it is:

* correct
* understandable
* compatible
* secure
* aligned with V1.5

Do not copy legacy code blindly.

Before reuse, inspect:

* dependencies
* data assumptions
* authentication assumptions
* Firestore paths
* ownership model
* hardcoded IDs

---

# 173. Existing Working Features

A working feature does not automatically need to be rewritten.

Use this decision:

```text
Does it work?
      │
      ├── Yes
      │    ↓
      │  Is architecture acceptable?
      │       │
      │       ├── Yes → Reuse
      │       └── No  → Refactor incrementally
      │
      └── No → Fix / replace
```

---

# 174. Do Not Preserve Broken Architecture Blindly

"Do not rewrite" does not mean:

> Never improve anything.

If an existing implementation conflicts with V1.5 architecture, refactor it incrementally.

The objective is:

```text
Preserve behavior
+
Improve architecture
```

where possible.

---

# 175. Refactoring Must Preserve Behavior

Before refactoring an important feature, identify its current behavior.

For critical domains:

* scoring
* authentication
* form submission
* article publishing
* Firebase access

write or identify regression tests where practical.

---

# 176. Code Comments

Comments should explain:

* why
* constraints
* non-obvious business rules
* security requirements

Do not write comments that merely restate the code.

Bad:

```text
// Set loading to true
setLoading(true)
```

Good:

```text
// Keep the form version pinned so historical distributions
// cannot silently switch to a newer scoring configuration.
```

---

# 177. Documentation

When implementation introduces a significant architectural decision, update the appropriate documentation.

Do not bury important decisions only inside code.

---

# 178. Architecture Drift

If implementation begins to diverge from `ARCHITECTURE.md`, Codex MUST identify the divergence.

Do not silently create a second architecture.

The options are:

```text
Implement according to architecture
```

or:

```text
Propose architecture update
```

---

# 179. Do Not Modify Architecture Documents to Justify Code

Codex MUST NOT change `ARCHITECTURE.md` merely to make an already-written implementation appear compliant.

Architecture changes must be intentional.

---

# 180. Roadmap Discipline

Codex should follow the roadmap sequentially.

Do not jump to a later phase while an earlier phase has unresolved foundational problems.

For example:

```text
Foundation incomplete
      ↓
Do not build complex Metrics
```

unless there is a clearly justified dependency.

---

# 181. Phase Completion

A roadmap phase is complete only when:

* implementation exists
* relevant backend exists
* authorization exists
* validation exists
* UI exists where applicable
* database integration works
* error handling exists
* tests/validation pass
* no known critical regression remains

---

# 182. Do Not Mark Partial Work Complete

If only the frontend exists:

```text
Status: NOT COMPLETE
```

If only Firestore exists:

```text
Status: NOT COMPLETE
```

A feature should be considered complete only when the required vertical slice works.

---

# 183. Vertical Slice Development

Prefer implementing complete vertical slices.

Example:

```text
Partnership
 ↓
Schema
 ↓
Repository
 ↓
Service
 ↓
Authorization
 ↓
Admin UI
 ↓
Testing
```

Then move to the next domain.

Avoid creating:

```text
20 UI pages
```

before implementing their backend.

---

# 184. Feature Dependency Order

Respect domain dependencies.

Preferred high-level order:

```text
Foundation
   ↓
Authentication / RBAC
   ↓
Partnership
   ↓
Cadre
   ↓
Forms
   ↓
Distribution
   ↓
Articles
   ↓
Responses
   ↓
Metrics
   ↓
Public / Polish
```

Individual implementation order may vary when technically necessary.

---

# 185. Public Before Backend Is Prohibited for Core Features

Do not build public UI against fictional data structures when the domain model is not established.

Public renderer should consume actual published domain data.

---

# 186. Mock Data Must Be Clearly Identified

Development mock data must not be mistaken for production data.

Use explicit:

```text
mock
demo
fixture
seed
```

boundaries.

---

# 187. API Contracts

API/server actions should have explicit input and output expectations.

Do not allow arbitrary objects to flow through the application without validation.

---

# 188. API Must Enforce Authorization

An API endpoint that updates a resource must verify:

```text
Who?
What resource?
What scope?
What operation?
```

before modifying data.

---

# 189. API Must Resolve Ownership

The API should derive ownership from trusted context where possible.

Do not accept:

```text
ownerId: clientValue
```

as authoritative.

---

# 190. API Error Contracts

Backend errors should be consistent enough for the UI to distinguish:

```text
Validation Error
Authentication Error
Authorization Error
Not Found
Conflict
Server Error
```

Avoid returning arbitrary error shapes from every endpoint.

---

# 191. Concurrency

Important resources such as forms and articles may be edited by multiple users.

The system should consider stale updates.

Do not blindly overwrite newer server data with an older client copy.

---

# 192. Form Editing Concurrency

If multiple admins can edit a form, the system should eventually support detection of stale versions.

V1.5 may use a simpler last-write strategy if necessary, but it must not silently corrupt version/history semantics.

---

# 193. Admin Bulk Actions

Bulk actions may be introduced for efficiency, but must have:

* authorization
* confirmation where destructive
* clear result reporting
* safe failure handling

Do not build bulk operations that can silently modify unrelated partnerships.

---

# 194. Search Scope

Search results must respect authorization scope.

A cadre searching should not discover private articles or respondents belonging to another partnership merely because a keyword matches.

---

# 195. Export Scope

If export functionality exists, exported data must respect the same authorization as the dashboard.

Do not allow:

```text
Dashboard cannot view
but Export can retrieve
```

---

# 196. Metrics Export

Metrics export should contain only data the requesting actor is authorized to access.

Sensitive respondent-level data should not be included in aggregate exports unless explicitly authorized.

---

# 197. Data Privacy in Logs and Analytics

Do not send respondent personal data to:

* console logs
* analytics systems
* public URLs
* client-side tracking
* third-party services

unless explicitly required and authorized.

---

# 198. URL Design

URLs should identify resources without exposing unnecessary sensitive information.

Do not place:

* names
* personal information
* scores
* private response data

into URLs.

---

# 199. Public Distribution URLs

Distribution URLs may contain non-sensitive identifiers.

Do not encode answer keys or private metadata into URLs.

---

# 200. No Security Through Frontend Routes

A route being under:

```text
/admin
```

does not make it secure.

Server-side authorization remains mandatory.

---

# 201. Firestore Rules Must Match Application Authorization

The application authorization model and Firestore Security Rules must not contradict each other.

If the application says:

```text
Cadre can update own article
```

the database rules must enforce the same boundary.

---

# 202. Rules Must Be Least Privilege

Do not create broad rules such as:

```text
allow read, write: if request.auth != null;
```

for sensitive collections unless explicitly justified.

Prefer precise authorization conditions.

---

# 203. Public Firestore Access

Do not make entire collections publicly readable merely because one field is public.

Public access should be restricted to appropriate published resources.

---

# 204. Admin Firestore Access

Admin access must be explicit.

Do not assume that all authenticated users are admins.

---

# 205. Partnership Firestore Access

Partnership access must verify the partnership relationship.

Do not trust:

```text
request.resource.data.partnershipId
```

alone.

---

# 206. Cadre Firestore Access

Cadre access must verify ownership or explicit collaboration.

Do not authorize based solely on:

```text
request.auth.uid != null
```

---

# 207. Response Security Rules

Responses are sensitive.

Rules must prevent:

```text
Cadre A → Response of Cadre B
Partnership A → Response of Partnership B
Public → Response collection
```

unless explicitly authorized.

---

# 208. Answer-Key Security Rules

Answer keys must not be publicly readable.

They must be protected at the database/API layer, not merely hidden from UI.

---

# 209. Storage Rules

Storage access must respect:

* public/private status
* ownership
* partnership scope
* authenticated role

Do not make the entire bucket publicly writable.

---

# 210. File Upload Validation

Uploads should validate where appropriate:

* file type
* size
* extension
* destination
* authorization

Do not trust client MIME type alone for security-sensitive processing.

---

# 211. Media Ownership

Uploaded media should have a clear owner or resource relationship.

Example:

```text
Article
   ↓
Media
   ↓
Owner / Partnership
```

Do not create orphaned uploads unnecessarily.

---

# 212. Orphan Cleanup

When resources are deleted or replaced, associated media should be considered for cleanup where appropriate.

Do not automatically delete media if historical references still depend on it.

---

# 213. No Unbounded Listener Usage

Do not create Firestore real-time listeners everywhere by default.

Use real-time listeners only when the UX genuinely benefits from them.

---

# 214. Avoid Excessive Client Fetching

Prefer server-side fetching for sensitive or large datasets when appropriate.

Do not load entire collections into client memory.

---

# 215. Cache Carefully

Caching must respect:

* authorization
* publication state
* form version
* ownership
* data freshness

Do not cache private data in a way that could expose it to another user.

---

# 216. Public Cache Safety

Publicly cacheable data must contain only public information.

Do not cache private responses or administrative records as public content.

---

# 217. Authentication State

Authentication state should be resolved consistently.

Avoid multiple independent auth listeners across unrelated components when a centralized provider/context can safely provide the state.

---

# 218. Role Resolution

Role resolution should have a canonical source.

Do not allow:

```text
localStorage.role = "admin"
```

to become authoritative authorization.

Client role state may improve UX but cannot define security.

---

# 219. Profile Data

User profile data and authentication credentials should remain conceptually separate.

Do not duplicate sensitive authentication information into application profile documents unnecessarily.

---

# 220. Account Status

Roles and account status should be distinct concepts.

Example:

```text
role = cadre
status = active
```

Do not encode:

```text
inactive_cadre
```

as a separate role unless there is a strong reason.

---

# 221. No Role Explosion

Do not create new roles for minor permission differences.

Prefer:

```text
Role
+
Permission / Scope
```

when appropriate.

V1.5 primary roles remain:

```text
Admin
Partnership
Cadre
Public
```

---

# 222. No Cadre Level Explosion

Do not reintroduce cadre levels indirectly through:

```text
cadreRank
cadreLevel
cadreTier
cadreGrade
```

unless the architecture is explicitly changed.

---

# 223. Partnership Account Scope

If a partnership has an account, it should be associated explicitly with a partnership.

Do not infer partnership ownership from:

* email domain
* school name
* user-entered text

---

# 224. Email Is Not Authorization

Do not authorize a school simply because:

```text
email.endsWith("@school.com")
```

Authorization must use trusted application relationships.

---

# 225. No Hidden Admin Backdoors

Do not implement special administrative access through:

* secret URLs
* hardcoded email addresses
* magic passwords
* query parameters
* environment-independent bypasses

---

# 226. No Hardcoded Superuser

Do not create:

```text
if (email === "admin@example.com")
```

as a production authorization mechanism.

---

# 227. Configuration Over Hardcoding

When behavior is intended to be configurable, use configuration/data.

Examples:

* partnership types
* article categories
* assessment types
* publication status
* public section visibility

But do not over-configure stable business rules.

---

# 228. Avoid Configuration Chaos

Not every constant needs to become a Firestore setting.

Keep stable engineering constants in code.

Use Firestore for actual business/admin-managed configuration.

---

# 229. No Feature Duplication

If a feature already exists in a reusable domain module, extend it instead of creating a second competing implementation.

Avoid:

```text
oldFormService
newFormService
```

both performing the same operation without a migration plan.

---

# 230. Naming Consistency

Use consistent naming across:

* TypeScript
* Firestore
* API
* UI
* documentation

Avoid multiple names for the same concept.

For example, do not alternate randomly between:

```text
cadre
kader
member
agent
```

in domain code.

The canonical domain concept is:

```text
Cadre
```

while UI language may be localized separately.

---

# 231. Domain Language

Use these canonical concepts:

```text
Admin
Partnership
Cadre
Article
Form
Form Version
Distribution
Collaborator
Response
Activity
Metric
Respondent
```

Avoid inventing competing domain concepts unless required.

---

# 232. Localization

UI labels may use Indonesian language.

Domain code should remain consistent and readable.

Example:

```text
Code:
partnership
cadre
distribution
response

UI:
Mitra
Kader
Distribusi
Respon
```

Do not rename code concepts merely to match UI language.

---

# 233. No Business Logic in Labels

Do not derive permissions or behavior from displayed text.

Bad:

```text
if (buttonLabel === "Admin")
```

Use canonical role/status values.

---

# 234. Form Question Types

Question types must be centrally defined.

Do not create arbitrary question-type strings in individual components.

The renderer and builder must share the same question-type contract.

---

# 235. Unsupported Question Types

If a question type is not implemented, the system must fail safely.

Do not silently render it as another type.

---

# 236. Question Configuration

Question configuration should be validated according to its type.

For example:

```text
multiple_choice
```

requires appropriate options.

Do not allow malformed question definitions into published forms.

---

# 237. Published Form Immutability

Published forms should be treated as controlled instruments.

If a change affects assessment meaning, create a new version rather than mutating the published version.

Minor metadata changes may be handled according to the finalized versioning strategy.

---

# 238. Draft Form Freedom

Draft forms may be edited more freely.

However, even drafts must maintain valid internal structure before publication.

---

# 239. Publishing Is a Controlled Operation

Publishing a form or article should:

1. validate
2. authorize
3. persist
4. update publication state
5. generate appropriate activity
6. return clear result

---

# 240. Unpublishing Is a Controlled Operation

Unpublishing should not delete the resource.

It should change visibility/status while preserving historical information.

---

# 241. Form Library UX

The official form library should make it easy to distinguish:

```text
Official
Personal
Draft
Published
Archived
```

when these states exist.

Do not make official forms indistinguishable from user-created content.

---

# 242. Use Official Form UX

When a cadre selects:

```text
Use Official Form
```

the system should clearly communicate:

* form owner/provider
* form title
* version
* purpose
* what can/cannot be changed
* distribution ownership

---

# 243. Do Not Let Distribution Editing Modify Official Form

Editing:

```text
Distribution
```

must not modify:

```text
Official Form
```

except for explicitly allowed distribution metadata such as:

* owner
* collaborator
* distribution settings
* attribution

---

# 244. Collaboration Scope

Collaboration should be explicit and revocable.

Removing a collaborator should remove future access according to the authorization model.

Historical attribution should remain.

---

# 245. Historical Attribution Must Survive Collaboration Changes

If Cadre B collaborated on a distribution and is later removed:

```text
Historical activity:
Cadre B participated
```

should remain meaningful.

Do not rewrite history simply because current permissions changed.

---

# 246. Metrics Should Distinguish Reach From Response Count

Where possible, do not treat:

```text
responses
```

and:

```text
participants reached
```

as automatically identical.

The metric definitions should be explicit.

---

# 247. Metric Definitions Must Be Documented

Every important metric should have a clear definition.

Example:

```text
Participants Reached
=
Unique respondents attributable to the relevant scope
```

The exact definition must be finalized before implementing complex analytics.

Do not invent metric semantics silently.

---

# 248. Avoid Misleading Dashboards

Do not show a number without making its meaning clear.

Example:

```text
1,000 Reach
```

should have enough context to understand:

* time period
* scope
* definition

when necessary.

---

# 249. Analytics Must Respect Time

Metrics may eventually support:

* all time
* monthly
* weekly
* campaign
* article
* form
* distribution

Do not hardcode one time range into the architecture.

---

# 250. No Premature Advanced Analytics

V1.5 should prioritize reliable basic metrics.

Do not build advanced statistical analytics before:

* response data is correct
* attribution is correct
* scoring is correct
* question IDs are stable
* historical versions are correct

---

# 251. Pre-Test/Post-Test Integrity

If a form is designated:

```text
pre_test
```

or:

```text
post_test
```

that metadata must be stored with the relevant assessment context.

Do not infer assessment type solely from article placement.

---

# 252. Article–Form Relationship Must Be Explicit

If a form belongs to an article, store an explicit relationship.

Do not infer the relationship from:

* matching titles
* URL
* creation date
* UI navigation

---

# 253. Forms Can Exist Independently

Do not force every form to belong to an article.

Valid:

```text
Form
```

without:

```text
Article
```

must remain possible.

---

# 254. Articles Can Exist Without Forms

Likewise, not every article needs:

* pre-test
* post-test
* assessment

Forms are optional relationships.

---

# 255. No Forced Student Account System

V1.5 should not require student accounts merely to collect participation data.

Do not introduce:

```text
Student Login
```

unless explicitly requested.

---

# 256. Student Name Uniqueness

Do not assume a person's full name is globally unique.

If a business rule requires uniqueness, define:

* scope
* time period
* partnership
* form/distribution
* duplicate handling

before implementing it.

---

# 257. Privacy vs Metrics

The system should support aggregate metrics without exposing individual respondent identities unnecessarily.

Preferred:

```text
Raw Responses
   ↓
Authorized Internal Analytics
   ↓
Aggregated Metrics
   ↓
Public/Partnership Display
```

---

# 258. Public Profile Attribution

Cadre public profiles may display achievements when explicitly configured.

Do not automatically expose:

* email
* private account information
* respondent data
* internal activity details

---

# 259. Achievement Data

Achievements should be derived from actual contribution data.

Do not allow users to manually claim:

```text
10 articles published
```

if the system can calculate it.

---

# 260. Milestone Integrity

Milestones must be triggered by verified metrics/events.

Do not allow client requests to directly grant achievements.

---

# 261. No Artificial Gamification in V1.5

Milestones should remain informative and meaningful.

Do not add unnecessary:

* points
* leaderboards
* badges
* rankings

unless explicitly required.

The platform should emphasize program participation and impact rather than competition.

---

# 262. Partnership Recognition

Partnership achievements may be derived from:

* cadre activity
* participant reach
* article publication
* form distribution
* assessment participation

but must respect defined metric semantics.

---

# 263. No Public Ranking by Default

Do not rank:

```text
Cadre A > Cadre B
School A > School B
```

unless explicitly requested.

Metrics are primarily for monitoring and recognition.

---

# 264. Data Model Before UI

Before creating a significant UI feature, Codex should understand the corresponding domain model.

Do not design a UI that requires data relationships the backend does not support.

---

# 265. UI Before Backend Is Not a Complete Feature

A polished interface with fake/local state does not count as feature completion.

---

# 266. Backend Before Public Integration

Public integrations should consume real backend data.

Do not permanently build public pages around mock data.

---

# 267. No Duplicate Public/Admin Models

Admin and public should share domain concepts.

Do not create:

```text
AdminArticle
PublicArticle
```

as independent models unless there is a documented reason.

---

# 268. Admin Preview Uses Public Renderer

Where practical:

```text
Admin Preview
      ↓
Same Renderer
      ↓
Public
```

Differences should come from preview context, not duplicated rendering logic.

---

# 269. Form Renderer Must Be Schema-Driven

The form renderer should render from the form definition.

Avoid hardcoding individual questions into the page.

---

# 270. Form Builder Must Produce Renderer-Compatible Data

The builder and renderer must share the same canonical form schema.

Preferred:

```text
Form Builder
     ↓
Form Schema
     ↓
Form Renderer
```

---

# 271. Form Schema Validation

Before persistence and especially before publishing:

```text
Form Data
 ↓
Schema Validation
 ↓
Business Validation
```

must be performed.

---

# 272. No UI-Only Required Fields

A field required by business logic must be validated server-side.

The frontend required attribute is not sufficient.

---

# 273. No Trust in Hidden Form Fields

Hidden fields may be manipulated by clients.

Never trust hidden inputs for:

* ownership
* score
* role
* partnership
* publication status
* authorization

---

# 274. Security Through Server Resolution

Where possible, resolve authoritative data from server context.

Example:

```text
Authenticated UID
       ↓
Cadre Record
       ↓
Partnership
```

rather than trusting:

```text
client.partnershipId
```

---

# 275. Database Writes Must Be Intentional

Every write should have a clear reason.

Do not write unnecessary duplicate documents merely to simplify a component.

---

# 276. Firestore Document Size

Avoid placing large arrays or unbounded historical records into a single Firestore document.

Examples that should generally not become unbounded document arrays:

* all responses
* all activities
* all articles
* all cadres

Prefer separate documents/subcollections where appropriate.

---

# 277. Relationship Strategy

Use references/IDs for relationships that can grow.

Avoid embedding entire mutable objects repeatedly.

Example:

```text
article.ownerId
```

is generally preferable to embedding the entire cadre profile into every article.

---

# 278. Snapshot Data

Some historical snapshot data may be intentionally stored.

For example:

```text
publishedByName
```

may be appropriate if preserving historical display is required.

If snapshot data is used, it must be intentional and documented.

---

# 279. Do Not Over-Normalize

Firestore is not a relational database.

Avoid creating excessively fragmented structures that require dozens of reads for a simple screen.

Balance:

```text
Consistency
Query efficiency
Security
Historical integrity
```

---

# 280. Do Not Over-Denormalize

Likewise, do not duplicate entire objects everywhere.

Use a deliberate data access strategy.

---

# 281. Query Design Before Collection Design

Before finalizing a collection structure, identify important queries.

Examples:

```text
All cadres in partnership
Articles by cadre
Distributions by cadre
Responses by distribution
Responses by partnership
Published articles
Published forms
```

The schema should support these queries efficiently.

---

# 282. Index Awareness

If a query requires a Firestore composite index, document or create the appropriate index rather than weakening the query architecture.

---

# 283. Pagination Cursor Safety

Where pagination is used, prefer stable cursors rather than unreliable client-side offsets for large datasets.

---

# 284. Date and Time

Store timestamps consistently.

Prefer Firebase/server timestamps for authoritative events.

Do not trust client clocks for important historical timestamps.

---

# 285. Server Timestamp for Important Events

Use trusted server-side timestamps for:

* response submission
* publication
* activity creation
* form creation
* account creation
* important state transitions

where appropriate.

---

# 286. Timezone Presentation

Store timestamps consistently and convert them for display.

Do not permanently encode presentation timezone into stored timestamps.

---

# 287. Date-Based Metrics

Metrics based on dates must use explicit timezone rules.

Do not mix:

```text
browser local time
server time
Firestore timestamp
```

without a clear conversion strategy.

---

# 288. Audit Important State Changes

Important changes should be traceable where practical.

Examples:

```text
form published
answer key changed
article published
collaborator added
partnership archived
cadre deactivated
```

---

# 289. No Silent Permission Escalation

A user must never gain broader permissions simply by:

* editing a document
* modifying a URL
* changing local storage
* changing a client-side role
* submitting a different partnership ID

---

# 290. Permission Changes Are Sensitive

Changing a user's:

* role
* partnership
* account status

requires explicit authorization.

---

# 291. Role Changes Must Not Rewrite History

Changing:

```text
cadre → inactive
```

does not erase historical cadre contributions.

---

# 292. Partnership Changes Must Be Carefully Handled

If a cadre moves from Partnership A to Partnership B, historical records should remain interpretable.

Do not blindly rewrite historical ownership unless explicitly required.

Consider:

```text
current partnership
```

versus:

```text
historical partnership at event time
```

where necessary.

---

# 293. Historical Scope

Metrics should be able to distinguish current scope from historical attribution where required.

Do not retroactively rewrite history merely because current account metadata changed.

---

# 294. Public Article Attribution

If an article was published by Cadre A under Partnership A, later changes to Cadre A's current partnership should not automatically rewrite the historical publication attribution.

---

# 295. Form Distribution Attribution

Likewise, distribution ownership should remain historically meaningful.

Do not automatically transfer old distributions merely because the cadre's current partnership changed.

---

# 296. Account Deactivation Must Be Non-Destructive

Deactivating an account should normally:

```text
disable access
```

rather than:

```text
delete historical data
```

---

# 297. Admin Override Must Be Auditable

Admin may have broad permissions, but important overrides should be traceable.

Do not use broad admin access as justification for undocumented destructive behavior.

---

# 298. No Implicit Cross-Partnership Access

A user belonging to one partnership must not automatically gain access to:

```text
all partnerships
```

---

# 299. Collaboration Must Be Explicit

If a resource is shared across cadres, that sharing must be represented explicitly.

Do not infer collaboration merely because:

* cadres belong to the same partnership
* cadres know each other
* cadres have similar roles

---

# 300. Same Role Does Not Mean Same Ownership

All cadres have equal roles, but they do not own each other's resources.

This distinction is fundamental:

```text
Same Role
≠
Same Ownership
```

---

# 301. Admin vs Partnership vs Cadre Scope

The authorization model should remain conceptually:

```text
Admin
  → Global

Partnership
  → Own Partnership

Cadre
  → Own Resources
  → Explicit Collaboration

Public
  → Published Public Resources
```

---

# 302. No Scope Bypass Through Aggregation

A dashboard metric must not reveal information from unauthorized scopes merely because the metric is aggregated.

Aggregation still requires authorization.

---

# 303. Export and Analytics Follow Same Authorization

The same scope rules apply to:

* dashboard
* API
* exports
* analytics
* reports

There must not be a weaker security path through reporting.

---

# 304. Security Rules Are Part of the Feature

A feature is not complete until its database/storage security is considered.

Do not leave security rules as a final cleanup task for all features.

---

# 305. Every New Collection Requires Security Analysis

Before creating a new Firestore collection, determine:

* who can read
* who can create
* who can update
* who can delete
* whether public access exists
* what ownership means

---

# 306. Every New Storage Path Requires Security Analysis

Before creating a new Storage path, determine:

* owner
* public/private state
* upload permissions
* read permissions
* deletion permissions

---

# 307. No Universal Authenticated Read

Avoid rules equivalent to:

```text
allow read: if request.auth != null;
```

for sensitive domain data.

---

# 308. No Universal Authenticated Write

Avoid:

```text
allow write: if request.auth != null;
```

for domain resources.

Authorization must reflect actual roles and ownership.

---

# 309. Public Read Must Be Intentional

Public read access should only apply to resources intentionally published.

---

# 310. Write Validation in Security Rules

Security rules should validate critical invariants where feasible.

Examples:

* immutable owner
* valid role
* correct partnership scope
* publication restrictions

Application validation is not a substitute for database security rules.

---

# 311. Never Trust Client-Provided Role

A client cannot promote itself by sending:

```text
role = "admin"
```

Firestore rules and trusted backend logic must prevent this.

---

# 312. Never Trust Client-Provided Score

A client cannot set:

```text
score = 100
```

and make it authoritative.

---

# 313. Never Trust Client-Provided Publication Status

A client cannot simply submit:

```text
status = "published"
```

to bypass workflow.

---

# 314. Never Trust Client-Provided Attribution

A client cannot submit:

```text
cadreId = anotherCadre
```

to claim another cadre's metrics.

---

# 315. Never Trust Client-Provided Partnership

A client cannot submit:

```text
partnershipId = anotherPartnership
```

to move resources into another scope.

---

# 316. Validation Order

For sensitive operations, preferred order is:

```text
Authenticate
    ↓
Resolve Identity
    ↓
Resolve Scope
    ↓
Validate Input
    ↓
Authorize
    ↓
Execute
    ↓
Record Activity
```

Exact implementation may vary, but authorization must happen before sensitive mutation.

---

# 317. Read Operations Also Require Authorization

Security is not only about writes.

A user must not read data outside their scope.

---

# 318. Delete Operations Require Strong Authorization

Delete should require:

* authenticated actor
* authorized scope
* resource existence
* appropriate confirmation
* safe handling of dependencies

---

# 319. Avoid Cascading Deletes by Default

Deleting a parent entity should not automatically delete all related historical data unless explicitly designed.

Prefer archive/deactivation when historical records matter.

---

# 320. Referential Safety Before Delete

Before deleting:

```text
Partnership
Cadre
Form
Distribution
Article
```

inspect dependent resources.

---

# 321. Form Deletion

Forms with historical responses should generally be archived rather than permanently deleted.

---

# 322. Response Deletion

Response deletion should be highly controlled.

Do not provide casual delete operations for historical assessment records.

---

# 323. Activity Deletion

Activity records should generally be treated as historical records.

Do not allow ordinary users to delete activity history.

---

# 324. Metrics Deletion

Metrics derived from source data should generally be regenerated rather than manually deleted.

---

# 325. No Manual Historical Rewriting

Do not rewrite historical:

* scores
* attribution
* activity
* publication
* response

simply because current configuration changed.

---

# 326. Correction Workflow

If historical data is wrong, use an explicit correction mechanism rather than silently overwriting it.

---

# 327. Data Corrections Must Be Traceable

Important corrections should record:

* what changed
* who changed it
* when
* why, where appropriate

---

# 328. No Silent Schema Migration

If a field changes semantics, Codex must not silently reuse the old field for the new meaning.

Add a new field or perform a controlled migration.

---

# 329. Additive Changes Preferred

When possible:

```text
Old field
+
New field
```

until migration is complete.

---

# 330. No Mixed Schema Without Compatibility

Do not create a system where:

```text
some documents use old structure
some use new structure
```

without an explicit compatibility layer.

---

# 331. Compatibility Layers Must Be Temporary

If a compatibility layer is introduced, document:

* purpose
* supported legacy structure
* migration plan
* removal criteria

---

# 332. Avoid Silent Fallbacks

Do not silently fall back from:

```text
V1.5 data
```

to:

```text
legacy data
```

because a query failed.

A fallback can hide architecture problems.

---

# 333. No Legacy Fallback in Production Without Explicit Approval

The new application should not silently reconnect to the old Firebase project if V1.5 data is unavailable.

---

# 334. Error States Must Be Visible

If Firebase is unavailable:

```text
Show appropriate error
```

Do not silently display stale/fake production data.

---

# 335. Offline Behavior

If offline support exists, clearly distinguish:

```text
saved locally
```

from:

```text
successfully persisted to server
```

Do not claim server persistence while offline.

---

# 336. Authentication Error Handling

Authentication failures should:

* provide understandable feedback
* not expose internal details
* preserve user input where safe
* avoid infinite redirect loops

---

# 337. Authorization Error Handling

When a user lacks permission:

```text
403 / unauthorized state
```

should be presented appropriately.

Do not expose another user's data merely to show a friendly error.

---

# 338. Not Found vs Unauthorized

Do not reveal sensitive resource existence unnecessarily.

Where appropriate, unauthorized resources may appear as unavailable/not found.

---

# 339. Form Submission Error Handling

A failed submission must not clear all respondent answers unless intentional.

Where possible, preserve entered data so the respondent can retry.

---

# 340. Prevent Accidental Double Submit

Disable or otherwise protect the submission action while a submission is being processed.

Backend should still protect against duplicate requests.

---

# 341. No Client-Side Only Success

A response is successful only after the backend confirms persistence.

---

# 342. Public Form Completion

After successful submission, show clear:

* success state
* score/result if allowed
* next step if configured

Do not expose internal scoring configuration.

---

# 343. Form Result Privacy

Whether respondents can see their score should be a deliberate form/configuration decision.

Do not automatically expose scores.

---

# 344. Admin Response Viewer

Admin response viewers should separate:

```text
Respondent Information
Answers
Score
Distribution
Attribution
Timestamp
```

Avoid confusing presentation.

---

# 345. Partnership Response Viewer

Partnership response views must be scoped to its own partnership.

---

# 346. Cadre Response Viewer

Cadre response views must be scoped to authorized distributions.

---

# 347. Response Analytics

Question-level analytics must use stable:

```text
questionId
```

not question order.

---

# 348. Score Analytics

Score analytics must identify:

* form
* version
* assessment type
* relevant distribution/partnership scope
* time period

where appropriate.

---

# 349. No Cross-Version Score Mixing Without Explicit Definition

Do not aggregate scores from different form versions as if they are automatically equivalent.

If versions are analytically compatible, that compatibility must be explicit.

---

# 350. Metrics Must Be Explainable

For every major dashboard number, developers should be able to answer:

> Where did this number come from?

If the answer is unclear, the metric implementation is insufficiently defined.

---

# 351. Activity and Metrics Are Secondary to Source Data

If an activity/metric conflicts with source records, source records take precedence.

Metrics can be recalculated.

Source responses/articles/distributions remain authoritative.

---

# 352. No Manual Dashboard Counters Without Reconciliation

If counters are cached for performance, there must be a strategy to reconcile them with source data.

---

# 353. Dashboard Scope Must Be Explicit

Every dashboard must clearly indicate whether its metrics represent:

```text
Platform
Partnership
Cadre
Distribution
Article
Form
```

---

# 354. No Ambiguous "Total"

Avoid showing:

```text
Total Responses
```

without defining the scope.

Prefer contextual labels such as:

```text
Responses in this partnership
Responses from this distribution
Platform-wide responses
```

where necessary.

---

# 355. Search Results Must Preserve Scope

Search must never bypass authorization.

---

# 356. Filters Must Not Bypass Scope

A malicious filter must not reveal unauthorized data.

---

# 357. Sorting Must Not Bypass Scope

Sorting/filtering/exporting are all subject to authorization.

---

# 358. Pagination Must Not Bypass Scope

Changing pagination cursors must not expose records outside the user's scope.

---

# 359. Bulk Queries Must Preserve Scope

Admin queries may be broad.

Partnership/cadre queries must remain scoped.

---

# 360. No Client-Side Filtering as Sole Security

This is prohibited:

```text
fetch all responses
↓
filter partnershipId in React
```

for sensitive data.

The database/server query must enforce scope.

---

# 361. Avoid Fetch-All-Then-Filter

Especially prohibited for:

* responses
* activities
* users
* cadres
* partnerships

---

# 362. Admin Search May Be Broad

Admin may have broad search capabilities, but still should use efficient server/database queries.

---

# 363. Public Search Must Be Public-Only

Public search should only query explicitly public resources.

---

# 364. No Private Metadata Leakage

Even if the document is public, do not expose unnecessary internal fields.

Prefer a public DTO/view model.

---

# 365. Use DTOs Where Appropriate

For public and sensitive APIs, return only fields required by the consumer.

Do not automatically serialize entire Firestore documents.

---

# 366. Separate Public and Private Representations

Conceptually:

```text
Database Document
      │
 ┌────┴─────┐
 ▼          ▼
Private DTO Public DTO
```

---

# 367. No Sensitive Data in Client State

Do not store answer keys, service credentials, or unnecessary private respondent data in global client state.

---

# 368. Browser Storage

Do not store sensitive authorization data in insecure browser storage unless explicitly justified.

Never store service credentials.

---

# 369. Tokens

Authentication tokens should be handled through the Firebase authentication system.

Do not manually persist or transmit tokens unnecessarily.

---

# 370. No Credential Logging

Never log authentication tokens or credentials.

---

# 371. Security Review for New Dependencies

Any dependency that processes:

* authentication
* uploads
* HTML
* rich text
* forms
* user-generated content

requires additional security consideration.

---

# 372. User-Generated Content

Articles and other rich content must be sanitized appropriately before public rendering if HTML/rich text is supported.

Do not blindly inject untrusted HTML.

---

# 373. XSS Prevention

Never render untrusted HTML directly without sanitization.

---

# 374. File Upload Security

Do not trust uploaded filenames.

Use safe storage naming strategies.

---

# 375. Content Security

Do not introduce arbitrary script execution through CMS content.

---

# 376. Rich Text

If rich text is supported, define allowed content explicitly.

Do not allow arbitrary HTML by default.

---

# 377. Public Article Images

Only approved/public media should be referenced by public articles.

---

# 378. Admin Upload Permissions

Only authorized users may upload media to protected resources.

---

# 379. Partnership Upload Permissions

Partnership users may upload only within authorized resources.

---

# 380. Cadre Upload Permissions

Cadres may upload only to resources they own or explicitly collaborate on.

---

# 381. No Cross-Resource File Access

A user should not be able to replace another user's article image by manipulating a storage path.

---

# 382. Deployment Environment

The deployment should use the V1.5 Firebase project and V1.5 environment variables.

Never accidentally deploy V1.5 using legacy production credentials.

---

# 383. Vercel Environment Variables

Production, preview, and development environments should be intentionally configured.

Do not assume a local `.env` automatically maps to production.

---

# 384. Production Firebase Verification

Before production deployment, verify:

```text
Firebase Project ID
Auth
Firestore
Storage
Security Rules
```

---

# 385. No Accidental Production Writes During Development

Development scripts must clearly identify their target environment.

---

# 386. Seed Scripts Must Require Explicit Environment

Do not allow:

```text
npm run seed
```

to accidentally seed production without explicit safeguards.

---

# 387. Migration Scripts Must Require Explicit Confirmation

Destructive or large migration operations should require deliberate execution.

---

# 388. Backup Before Migration

Before migrating real data, establish a recoverable baseline.

---

# 389. Migration Must Be Testable

Test migration logic against:

* empty data
* normal data
* malformed legacy data
* duplicate data
* missing fields
* historical records

---

# 390. Migration Must Preserve Business Meaning

Do not merely map field names.

Verify:

```text
old meaning
    ↓
new meaning
```

---

# 391. Do Not Migrate Unknown Data Blindly

If legacy data cannot be confidently mapped, flag it for review rather than inventing values.

---

# 392. No Automatic Data Cleanup During Migration

Migration should not silently:

* delete duplicates
* merge users
* change scores
* alter names
* alter attribution

unless explicitly defined.

---

# 393. Testing Existing Baseline

Before changing major scoring/form behavior, establish known baseline examples.

---

# 394. Regression First

For critical legacy functionality:

```text
Baseline
 ↓
Regression Tests
 ↓
Refactor
 ↓
Compare Results
```

---

# 395. Form Regression Testing

Test:

* question rendering
* required fields
* answer keys
* scoring
* response persistence
* distribution attribution

---

# 396. Role Regression Testing

Test all role boundaries.

At minimum:

```text
Admin
Partnership
Cadre
Public
Unauthorized
```

---

# 397. Ownership Regression Testing

Test:

```text
Owner → allowed
Other owner → denied
Collaborator → allowed where defined
Admin → allowed
Public → public only
```

---

# 398. Historical Regression Testing

Verify that:

```text
Form Version 1
```

continues producing/interpreting:

```text
Historical Response
```

correctly after:

```text
Form Version 2
```

is created.

---

# 399. No Silent Regression

If a refactor changes observable behavior, document it.

---

# 400. Completion Rule

A feature may be considered complete only when:

```text
Architecture
    ↓
Data
    ↓
Backend
    ↓
Authorization
    ↓
Security Rules
    ↓
UI
    ↓
UX
    ↓
Validation
    ↓
Testing
```

are sufficiently integrated for that feature's scope.

---

# 401. Final Rule

When uncertain, Codex MUST prefer:

```text
Preserve data
Preserve historical meaning
Preserve validated scoring
Preserve security boundaries
Preserve ownership
Preserve attribution
Prefer additive changes
Prefer incremental refactoring
Prefer explicit decisions
Avoid unnecessary V2 complexity
```

over:

```text
Fast rewrite
Quick workaround
Client-side security
Data deletion
Silent migration
Duplicated business logic
Hardcoded assumptions
```

The primary objective of V1.5 is not merely to produce more features.

The objective is to establish a **stable, generic, secure, maintainable foundation** for the KKPD-KP platform while preserving validated behavior and allowing future expansion.

The final architectural direction is:

```text
                    BPOM / ADMIN
                         │
                         ▼
                    PARTNERSHIP
                         │
                         ▼
                       CADRE
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
           ARTICLES              FORMS
                                      │
                                      ▼
                                DISTRIBUTION
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  PRIMARY OWNER             COLLABORATORS
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                                RESPONDENTS
                                      │
                                      ▼
                                  RESPONSES
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                      SCORING                 ATTRIBUTION
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                                   METRICS
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                       ADMIN     PARTNERSHIP     CADRE
                         │            │            │
                         └────────────┴────────────┘
                                      ▼
                                  EVALUATION
                                      │
                                      ▼
                                  CONTINUITY
```

**This architecture and these rules must be treated as the baseline for V1.5 implementation unless explicitly superseded by an approved architectural decision.**
