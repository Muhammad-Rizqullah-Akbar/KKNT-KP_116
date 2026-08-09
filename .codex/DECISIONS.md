# KKPD-KP V1.5 — Engineering Decisions

**Document Status:** FINAL
**Version:** V1.5
**Purpose:** Record of approved architectural and product decisions
**Authority:** Decisions recorded here are considered approved unless explicitly superseded.

---

# 1. Purpose

This document records the major decisions that have already been made for the KKPD-KP V1.5 platform.

The purpose is to prevent Codex or future developers from repeatedly reconsidering settled architectural decisions.

These decisions should be treated as:

```text
APPROVED
    ↓
IMPLEMENT
    ↓
DO NOT REINTERPRET
```

unless an explicit new decision is added.

---

# 2. Decision Authority

When interpreting this document:

1. Explicit current user instruction may supersede a decision.
2. A newer approved decision supersedes an older decision.
3. `RULES.md` defines mandatory engineering constraints.
4. `ARCHITECTURE.md` defines the structural architecture.
5. This document defines finalized decisions.
6. `ROADMAP.md` defines implementation sequence.

Codex MUST NOT change these decisions merely because another implementation appears easier.

If a decision becomes technically impossible or materially harmful, Codex must identify the conflict and propose a new decision rather than silently changing the architecture.

---

# 3. Product Direction

## Decision

KKPD-KP V1.5 is a centralized digital platform for managing:

* partnerships
* cadres
* educational/public content
* official forms
* form distributions
* respondent submissions
* scoring
* monitoring
* metrics
* public-facing information

The platform is not designed as a generic SaaS builder.

It is a domain-specific platform with a generic internal architecture.

---

# 4. V1.5 Is an Incremental Refactor

## Decision

V1.5 will be developed incrementally from the existing repository.

We will NOT perform a full destructive rewrite.

The implementation strategy is:

```text
Existing Repository
        ↓
Analyze
        ↓
Preserve Validated Logic
        ↓
Refactor Architecture
        ↓
Implement V1.5 Domains
        ↓
Validate
        ↓
Expand
```

---

# 5. Legacy Firebase Is Not the V1.5 Database

## Decision

The existing/legacy Firebase project is treated as a baseline/reference system.

V1.5 uses the dedicated V1.5 Firebase project:

```text
Project:
KKPD-V1
```

The V1.5 application must not silently depend on the legacy Firebase project.

---

# 6. Legacy Data Is Read-Only by Default

## Decision

Legacy data may be inspected and analyzed.

Legacy data must not be modified by normal V1.5 application code.

No automatic:

* update
* delete
* migration
* synchronization
* overwrite

will occur against the legacy system.

---

# 7. Migration Is a Separate Process

## Decision

Legacy-to-V1.5 migration is not part of normal application runtime.

Migration will be performed through a controlled migration process after:

* V1.5 schema is finalized
* field mapping is understood
* historical semantics are verified
* migration logic is tested

---

# 8. Firebase Is the Primary Backend

## Decision

V1.5 will continue using Firebase as the primary backend infrastructure.

Primary services include:

```text
Firebase Authentication
Cloud Firestore
Cloud Storage
Firebase Security Rules
Firebase Admin SDK
```

Additional infrastructure may be introduced later only when justified.

---

# 9. Firebase Authentication

## Decision

Firebase Authentication remains the primary authentication system.

The application identity flow is:

```text
Firebase Auth
      ↓
Authenticated UID
      ↓
Application User
      ↓
Role
      ↓
Scope
      ↓
Authorization
```

---

# 10. Authentication Does Not Define Authorization

## Decision

Authentication and authorization remain separate concepts.

Firebase Authentication answers:

> Who is the user?

Application authorization answers:

> What may this user access or modify?

---

# 11. Primary Roles

## Decision

V1.5 uses four conceptual access categories:

```text
Admin
Partnership
Cadre
Public
```

These roles are not interchangeable.

---

# 12. No Cadre Hierarchy

## Decision

There is no cadre hierarchy in V1.5.

There will be no:

* cadre level
* cadre rank
* cadre tier
* cadre leader
* cadre grade

All cadres operate under the same primary role.

Differences in access come from ownership, partnership scope, and explicit collaboration.

---

# 13. Admin Scope

## Decision

Admin has global management scope.

Admin may manage:

* partnerships
* cadres
* articles
* official forms
* form versions
* distributions
* responses
* metrics
* activities
* CMS content
* system configuration

---

# 14. Partnership Scope

## Decision

A Partnership user operates within its partnership scope.

A partnership may monitor/manage resources belonging to its partnership according to the permission model.

A partnership must not automatically access another partnership's private resources.

---

# 15. Cadre Scope

## Decision

A Cadre primarily operates on resources they own.

Cadres may access additional resources only when explicit collaboration/permission exists.

Same role does not mean same ownership.

```text
Same Role
    ≠
Same Data Scope
```

---

# 16. Public Scope

## Decision

Public users do not require accounts for ordinary public participation.

Public users may access:

* published public content
* published forms
* valid public distributions

Public users cannot access private administrative resources.

---

# 17. Generic Partnership Model

## Decision

The fundamental organizational entity is:

```text
Partnership
```

not:

```text
School
```

A school is one possible partnership type.

Example:

```text
partnershipType = "school"
```

The architecture must remain capable of supporting future partnership types.

---

# 18. No Hardcoded School Architecture

## Decision

The core application must not be structurally dependent on schools.

Avoid architecture such as:

```text
SchoolService
SchoolRepository
SchoolDashboard
```

when the underlying concept is actually a generic partnership.

School-specific functionality should exist as configuration or an isolated module where necessary.

---

# 19. Future RT/RW Hierarchy Is Not V1.5

## Decision

The architecture may support future structures such as:

```text
Kelurahan
  ↓
RW
  ↓
RT
```

but V1.5 will not implement this complexity unless explicitly required.

---

# 20. Official Forms Are Centrally Governed

## Decision

Official forms are controlled resources.

They are centrally managed by authorized Admin/BPOM users.

Cadres do not own official forms.

---

# 21. Official Forms Are Not Ordinary User Forms

## Decision

Official forms must be distinguishable from user-created forms.

The UI and data model should preserve:

```text
Official
Personal/User-Created
Draft
Published
Archived
```

where applicable.

---

# 22. Official Form Distribution

## Decision

Cadres may use official forms through a distribution.

The conceptual flow is:

```text
Official Form
      ↓
Form Version
      ↓
Distribution
      ↓
Respondents
```

The distribution does not transfer ownership of the official form.

---

# 23. Distribution Is a Separate Domain Entity

## Decision

A distribution is not equivalent to a form.

The system treats these as separate entities:

```text
Form
Form Version
Distribution
Response
```

A distribution identifies a specific usage of a particular form version.

---

# 24. Distribution Pins a Form Version

## Decision

A distribution must identify the form version it uses.

Preferred:

```text
Distribution
    ↓
Form Version 3
```

rather than:

```text
Distribution
    ↓
Latest Form
```

This protects historical meaning.

---

# 25. Existing Distribution Meaning Must Not Change Silently

## Decision

When a new form version is created, existing distributions must not silently switch to the new version.

A distribution remains associated with its intended version unless an explicit workflow changes it.

---

# 26. Form Versioning

## Decision

Forms that have been used for responses require version-aware historical integrity.

Conceptually:

```text
Form
 ├── Version 1
 │     └── Responses
 │
 └── Version 2
       └── Responses
```

---

# 27. Published Assessment Meaning Is Controlled

## Decision

Changes affecting assessment meaning should generally create a new form version.

Examples:

* question changes
* answer-key changes
* scoring changes
* question identity changes
* assessment semantics changes

---

# 28. Historical Scores Are Immutable

## Decision

Historical scores must not change merely because the current form configuration changes.

A response retains the score generated under its relevant form version.

---

# 29. Existing Scoring Logic Is Validated

## Decision

The existing scoring logic is considered validated business logic.

V1.5 must preserve its business behavior.

It may be:

* extracted
* isolated
* wrapped
* typed
* tested
* moved into a service

but its semantics must remain unchanged unless explicitly approved.

---

# 30. Scoring Is a Dedicated Domain Service

## Decision

Scoring belongs in a dedicated service/domain layer.

Preferred:

```text
Response
   ↓
Validation
   ↓
Scoring Service
   ↓
Existing Scoring Logic
   ↓
Score
```

Scoring must not be embedded directly into React components.

---

# 31. Client Score Is Not Authoritative

## Decision

The client may display a provisional score if needed.

The authoritative score is calculated through the trusted backend/scoring path.

The client cannot submit:

```text
score = 100
```

and make that authoritative.

---

# 32. Answer Keys Are Private

## Decision

Answer keys are administrative/scoring data.

They must not be exposed to public respondents.

The public form payload must contain only information required to render and submit the form.

---

# 33. Public Respondents Do Not Receive Scoring Configuration

## Decision

Public clients must not receive:

* answer keys
* hidden score rules
* internal scoring configuration
* moderation data
* administrative metadata

---

# 34. Stable Question Identity

## Decision

Every form question has a stable:

```text
questionId
```

Question identity is independent from display order.

---

# 35. Question Index Is Not Identity

## Decision

The application must not use:

```text
questions[0]
questions[1]
questions[2]
```

as the permanent identity of questions.

Question order may change.

`questionId` must remain stable.

---

# 36. Question-Level Analytics Use questionId

## Decision

Question-level analytics must identify questions using:

```text
questionId
```

not array position or question text.

---

# 37. Form Builder and Renderer Share One Schema

## Decision

The Form Builder and Form Renderer use the same canonical form schema.

Preferred:

```text
Form Builder
      ↓
Form Schema
      ↓
Form Renderer
```

The builder should not generate a private structure that only the builder understands.

---

# 38. Public Renderer Is the Canonical Renderer

## Decision

The public form renderer is the canonical representation of a form.

Admin Preview should reuse the same renderer or share its rendering implementation wherever practical.

---

# 39. Admin Preview Does Not Publish

## Decision

Previewing a form must not modify publication state.

Preview is a rendering operation.

Publishing is a separate controlled operation.

---

# 40. Forms Can Exist Without Articles

## Decision

A form does not require an article.

Valid:

```text
Form
```

without:

```text
Article
```

---

# 41. Articles Can Exist Without Forms

## Decision

An article does not require a form.

Forms are optional relationships.

---

# 42. Article–Form Relationships Are Explicit

## Decision

When an article is associated with a form, the relationship must be explicitly represented.

Do not infer the relationship from:

* title
* URL
* creation date
* UI navigation
* matching text

---

# 43. Pre-Test and Post-Test Are Explicit Concepts

## Decision

If forms are used as:

```text
pre_test
post_test
```

their assessment role must be explicitly represented.

Do not infer assessment type from article position or URL.

---

# 44. Distribution Attribution

## Decision

Every response must be traceable to the distribution through which it was submitted.

Preferred:

```text
Response
   ↓
Distribution
   ↓
Primary Owner
   ↓
Partnership
```

---

# 45. Primary Owner

## Decision

A distribution has one primary owner.

The primary owner is responsible for the distribution according to the authorization model.

---

# 46. Collaborators

## Decision

A distribution may have zero or more collaborators.

Collaboration does not transfer ownership.

Collaboration must grant only the explicitly permitted access.

---

# 47. Historical Collaboration

## Decision

Removing a collaborator does not erase historical attribution.

Historical activities and contributions remain meaningful.

---

# 48. No Manual Attribution by Respondents

## Decision

Respondents should not manually enter cadre or partnership attribution when the distribution already determines it.

The system derives attribution from trusted distribution data.

---

# 49. Respondent Accounts Are Not Required

## Decision

Ordinary public respondents do not need to create accounts.

The default flow is:

```text
Public Link / Distribution Code
       ↓
Published Form
       ↓
Respondent
       ↓
Submission
```

---

# 50. Student Accounts Are Not Required

## Decision

V1.5 does not implement a mandatory student account system.

Student participation may be collected through public form flows.

---

# 51. External Student Database Integration Is Deferred

## Decision

V1.5 does not require integration with external school/student databases.

Such integration is a future expansion.

---

# 52. Response Data Is Sensitive

## Decision

Responses are treated as sensitive domain data.

Public users must not access response collections.

Cadre and Partnership users may access only authorized responses.

Admin may access responses globally according to policy.

---

# 53. Historical Response Context

## Decision

A response must preserve enough information to interpret the submission historically.

The conceptual structure includes:

```text
formId
formVersionId
distributionId
answers
score
submittedAt
attribution
```

where applicable.

---

# 54. Response Source of Truth

## Decision

Raw response records are the source of truth for assessment participation.

Metrics and analytics are derived representations.

---

# 55. Metrics Are Not the Source of Truth

## Decision

A metric such as:

```text
totalResponses = 153
```

must not replace the underlying response records.

Metrics may be regenerated.

---

# 56. Activities Are Historical Events

## Decision

Activity records represent meaningful domain events.

Examples:

```text
article_published
form_distributed
response_submitted
assessment_completed
collaborator_added
```

Activities are not intended to log every UI interaction.

---

# 57. Activity Attribution

## Decision

Important activity records should preserve enough information to answer:

> Who did what, to which resource, and when?

---

# 58. Metrics Are Scope-Aware

## Decision

Metrics must distinguish their scope.

Possible scopes include:

```text
Platform
Partnership
Cadre
Distribution
Article
Form
```

A dashboard must not present ambiguous global-looking totals.

---

# 59. Metric Definitions Must Be Explicit

## Decision

Every important metric must have a defined meaning.

For example:

```text
Participants Reached
```

must have a clear definition before being implemented as a major analytics metric.

Codex must not invent metric semantics.

---

# 60. No Public Ranking by Default

## Decision

V1.5 does not rank:

* cadres
* schools
* partnerships

against each other by default.

Metrics are for monitoring, recognition, and evaluation.

---

# 61. No Artificial Gamification

## Decision

V1.5 does not prioritize:

* leaderboards
* competitive points
* rankings
* excessive badges
* competitive gamification

unless explicitly requested later.

---

# 62. Achievement/Milestone Data Must Be Derived

## Decision

If milestones/achievements are implemented, they must be based on verified system data.

Users cannot manually claim achievement counts.

---

# 63. Article Ownership

## Decision

Cadre-created articles retain:

* creator
* owner
* partnership context
* publication state
* relevant timestamps

where applicable.

---

# 64. Article Publication

## Decision

Article publication is a controlled state transition.

Conceptually:

```text
Draft
  ↓
Published
  ↓
Unpublished / Archived
```

Publishing is not equivalent to simply creating an article.

---

# 65. Article Public Visibility

## Decision

An article is publicly visible only when its publication state and visibility configuration permit it.

Existence in Firestore does not imply public visibility.

---

# 66. CMS Is the Source of Public Content

## Decision

Public content that is designated as CMS-managed must be managed through the admin/CMS system.

The public website should consume CMS data rather than duplicate it through hardcoded content.

---

# 67. Admin Preview and Public Rendering

## Decision

Admin Preview should use the same rendering model as the public site wherever practical.

This minimizes differences between:

```text
What Admin Sees
```

and:

```text
What Public Sees
```

---

# 68. Gallery Architecture

## Decision

Gallery/media files and metadata are separate.

```text
Cloud Storage
    ↓
Binary Media

Firestore
    ↓
Media Metadata
```

Large binary files must not be stored directly inside Firestore documents.

---

# 69. Public Data Is Explicit

## Decision

Data is private by default.

A resource becomes public only through explicit publication/visibility rules.

---

# 70. Public Data Uses Safe Representations

## Decision

Public pages should not automatically serialize complete database documents.

Use public-safe representations/DTOs where appropriate.

---

# 71. Private Respondent Data Is Never Public by Default

## Decision

Public pages must not expose:

* respondent names
* individual responses
* individual scores
* private participation records
* internal identifiers

unless explicitly approved.

---

# 72. Aggregate Public Metrics Are Allowed

## Decision

Public metrics may expose aggregated information where appropriate.

Example:

```text
1,245 participants reached
```

rather than individual respondent records.

---

# 73. Firebase Admin SDK Is Server-Only

## Decision

Firebase Admin SDK may only be used in trusted server execution contexts.

It must never be imported into client components.

---

# 74. Service Account Credentials Are Server Secrets

## Decision

Service-account private credentials must remain server-side.

They must never be:

* exposed to browser code
* prefixed with `NEXT_PUBLIC_`
* committed to Git
* returned through an API
* embedded into client bundles

---

# 75. Firebase Client SDK and Admin SDK Have Separate Roles

## Decision

Client SDK is used for appropriate client-side operations.

Admin SDK is used for trusted server-side operations.

Conceptually:

```text
Client SDK
→ Authentication
→ permitted client operations

Admin SDK
→ trusted server operations
→ administrative operations
→ privileged workflows
```

---

# 76. Firebase Security Rules Are Mandatory

## Decision

Firebase Security Rules are part of the application's authorization architecture.

Security cannot depend solely on React/UI logic.

---

# 77. Client-Side Role Checks Are UX Only

## Decision

Code such as:

```text
if (role === "admin")
```

may control UI visibility.

It is not a security mechanism.

---

# 78. Ownership Must Be Server/Rule Verified

## Decision

Client-provided fields such as:

```text
ownerId
createdBy
partnershipId
role
userId
```

are not trusted as authorization claims.

Trusted identity and database/security rules determine actual access.

---

# 79. No Universal Authenticated Access

## Decision

V1.5 will not use broad rules such as:

```text
allow read, write: if request.auth != null;
```

for sensitive domain collections.

Rules must reflect actual role and ownership boundaries.

---

# 80. Public Firestore Access Is Restricted

## Decision

Public read access is granted only to explicitly public resources.

Private collections must not become public simply because the application has public pages.

---

# 81. Admin Access Is Explicit

## Decision

Being authenticated does not make a user an Admin.

Admin authorization must be explicitly represented and enforced.

---

# 82. Partnership Access Is Scoped

## Decision

Partnership users can only access resources within their authorized partnership scope.

---

# 83. Cadre Access Is Ownership-Based

## Decision

Cadres primarily access:

```text
Own Resources
+
Explicitly Shared Resources
```

They do not receive broad partnership-wide access simply by being a cadre.

---

# 84. Distribution Code Is Not Administrative Authorization

## Decision

A distribution code identifies a public distribution.

It does not grant administrative privileges.

---

# 85. Public URLs Do Not Grant Authorization

## Decision

An obscure or random URL does not constitute security.

All protected resources require proper authorization.

---

# 86. Service Account Key Creation Policy

## Decision

The V1.5 architecture prefers secure server authentication mechanisms over unmanaged service-account JSON keys.

If a local/deployment environment requires a service-account key for the current codebase, this must be handled as a controlled infrastructure decision.

Service-account credentials must never be committed to the repository.

---

# 87. Environment Separation

## Decision

The application distinguishes:

```text
Development
Test
Production
```

where appropriate.

Firebase project/environment configuration must be explicit.

---

# 88. Development Must Not Accidentally Use Legacy Production

## Decision

Local development must not silently connect to the legacy production Firebase project.

The configured project must be verifiable.

---

# 89. Production Must Use V1.5 Firebase

## Decision

V1.5 production deployment must use the V1.5 Firebase project:

```text
KKPD-V1
```

---

# 90. Seed Data Is Separate From Production Data

## Decision

Development/demo/seed data must be clearly separated from production data.

Seed scripts must not accidentally populate production.

---

# 91. Migration Scripts Require Explicit Execution

## Decision

Migration scripts are not automatically executed by application startup.

Migration is a deliberate operation.

---

# 92. Repository Pattern

## Decision

Database access should be organized around repositories.

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

---

# 93. Service Layer

## Decision

Business workflows belong in services.

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

---

# 94. UI Does Not Own Business Logic

## Decision

React components should primarily handle:

* presentation
* interaction
* local state
* loading
* error presentation

Complex domain logic belongs in appropriate services/domain modules.

---

# 95. Validation Is Layered

## Decision

Validation occurs at appropriate layers:

```text
Client Validation
       ↓
Server Validation
       ↓
Database/Security Validation
```

Client validation improves UX.

Server and security validation remain authoritative.

---

# 96. Strong TypeScript

## Decision

V1.5 uses strong TypeScript typing.

Avoid `any` unless there is a documented technical reason.

Domain models should have canonical types.

---

# 97. Canonical Domain Types

## Decision

The same domain concept should not have multiple conflicting TypeScript definitions.

Canonical types should be reused.

---

# 98. Stable Domain Vocabulary

## Decision

The following are canonical domain concepts:

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
Respondent
Activity
Metric
```

The codebase should consistently use these concepts.

---

# 99. School Is a Partnership Type

## Decision

The domain vocabulary uses:

```text
Partnership
```

as the root organizational concept.

School is represented through partnership type/metadata.

---

# 100. No Role Explosion

## Decision

Do not create new roles for every minor permission difference.

Prefer:

```text
Role
+
Scope
+
Permission
```

when appropriate.

---

# 101. No Business Logic Based on UI Labels

## Decision

Authorization, status, and business logic must use canonical values.

Do not make logic depend on displayed text.

---

# 102. Statuses Are Controlled

## Decision

Domain statuses use canonical values and explicit transitions.

Examples:

```text
draft
pending_review
approved
published
archived
rejected
```

Only statuses actually required by the finalized domain should be implemented.

---

# 103. Draft vs Published

## Decision

Draft content is private unless explicitly configured otherwise.

Published content is public only when its public visibility conditions are satisfied.

---

# 104. Archive Over Destructive Delete

## Decision

Historical domain entities should generally be archived/deactivated rather than permanently deleted.

Especially:

* forms
* form versions
* articles
* responses
* activities
* partnerships

---

# 105. Historical Data Is Preserved

## Decision

Deactivation of an account, cadre, or partnership does not automatically delete historical contributions.

---

# 106. Account Deactivation

## Decision

Deactivating a user normally means:

```text
Disable Access
```

not:

```text
Delete Historical Contributions
```

---

# 107. Partnership Deactivation

## Decision

Deactivating a partnership normally means:

```text
Inactive / Archived
```

while preserving historical data.

---

# 108. Historical Attribution Survives Current Profile Changes

## Decision

If a cadre's current profile changes, historical contributions should remain interpretable.

Historical attribution must not be rewritten simply because current metadata changed.

---

# 109. Current Scope vs Historical Scope

## Decision

Where necessary, the system distinguishes:

```text
Current User/Partnership State
```

from:

```text
Historical Attribution
```

This prevents historical data from being silently rewritten.

---

# 110. No Automatic Cascade Delete

## Decision

Deleting/deactivating a parent entity does not automatically delete all dependent historical records.

Dependencies must be evaluated.

---

# 111. Response Deletion Is Highly Controlled

## Decision

Historical responses are sensitive records.

Normal users should not casually delete them.

Archival/correction workflows are preferred.

---

# 112. Activity Records Are Historical

## Decision

Activity records should generally be retained.

Ordinary users should not be able to rewrite activity history.

---

# 113. Corrections Are Explicit

## Decision

If historical information is incorrect, corrections should occur through an explicit correction process.

Do not silently rewrite history.

---

# 114. Important Changes Are Auditable

## Decision

Important operations should be traceable where appropriate.

Examples:

```text
publish
unpublish
archive
delete
answer-key change
permission change
collaborator change
form approval
```

---

# 115. No Fake Features

## Decision

A UI control is not considered implemented until the underlying operation works.

Do not expose fake:

* Publish
* Delete
* Export
* Approve
* Collaborate
* Save

actions that only modify local state.

---

# 116. No Hardcoded Production Content

## Decision

Production content managed through CMS/database must not be hardcoded into React components.

Hardcoded content is acceptable only when it is truly static engineering content.

---

# 117. Public Site Consumes Real CMS Data

## Decision

The final public website should consume actual V1.5 CMS/domain data.

Mock data may be used during development but must not become production behavior.

---

# 118. Admin Dashboard Is Built Before Public Polish

## Decision

Development prioritizes the administrative/domain foundation before public-site polish.

The preferred high-level sequence is:

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
Public Integration
   ↓
Polish
```

---

# 119. Vertical Slice Development

## Decision

Features should be developed as vertical slices.

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
UI
 ↓
Testing
```

Do not build all UI first and postpone the backend indefinitely.

---

# 120. V1.5 Is Not V2

## Decision

The architecture intentionally leaves room for future functionality without implementing it prematurely.

Deferred complexity includes:

* advanced form request workflows
* RT/RW hierarchy
* external student databases
* advanced collaboration systems
* advanced analytics
* complex milestone systems
* external integrations

---

# 121. No Premature Advanced Analytics

## Decision

Reliable source data comes before advanced analytics.

Priority:

```text
Correct Responses
        ↓
Correct Attribution
        ↓
Correct Scoring
        ↓
Correct Versions
        ↓
Basic Metrics
        ↓
Advanced Analytics
```

---

# 122. No Premature Notification System

## Decision

Notifications are secondary to core domain functionality.

Do not introduce a complex notification architecture unless required.

---

# 123. No Premature Gamification

## Decision

Gamification is not a V1.5 priority.

---

# 124. No Premature External Integrations

## Decision

External system integrations are deferred unless explicitly required by the V1.5 scope.

---

# 125. No Broad Dependency Upgrades

## Decision

Dependency upgrades are separate technical work unless a dependency is blocking required V1.5 functionality.

Do not upgrade major packages merely while implementing unrelated features.

---

# 126. Next.js App Router

## Decision

V1.5 continues using the Next.js App Router architecture.

Server/client boundaries should be respected.

---

# 127. Server-Side Sensitive Operations

## Decision

Sensitive operations should prefer server-side execution where appropriate.

Examples:

* privileged Firestore writes
* Admin SDK operations
* authorization-sensitive workflows
* trusted scoring
* sensitive aggregation

---

# 128. Client Components Are Not the Default

## Decision

Use client components when client-side interactivity is genuinely required.

Do not convert entire routes to client components unnecessarily.

---

# 129. Public Form Is Mobile-First

## Decision

Public respondent forms prioritize mobile usability.

They must remain usable on:

* mobile
* tablet
* desktop

---

# 130. Form Builder Is Desktop-Optimized but Responsive

## Decision

The Form Builder may prioritize desktop productivity, but it must remain usable on smaller screens.

---

# 131. No Browser alert()

## Decision

Normal application UX must not use:

```text
alert()
confirm()
prompt()
```

Use application-level UI components instead.

---

# 132. Loading States Are Required

## Decision

Asynchronous operations should provide appropriate states:

```text
Loading
Saving
Publishing
Submitting
Deleting
Fetching
```

---

# 133. Error States Must Be Explicit

## Decision

Errors must be visible and understandable.

The application must not silently convert backend failures into successful UI states.

---

# 134. No Silent Data Loss

## Decision

The system must not silently discard:

* unsaved form edits
* respondent answers
* server failures
* historical data

---

# 135. Public Form Submission

## Decision

A response is considered successfully submitted only after trusted backend persistence is confirmed.

Client-side success alone is insufficient.

---

# 136. Duplicate Submission Protection

## Decision

Public form submission should prevent accidental duplicate submissions.

This must be handled at both UX and backend levels where appropriate.

---

# 137. Server Timestamp

## Decision

Important historical events should use trusted server timestamps where appropriate.

Examples:

```text
response submitted
article published
form published
activity created
```

---

# 138. Timezone

## Decision

Timestamps are stored consistently and converted for presentation.

Presentation timezone must not corrupt stored historical timestamps.

---

# 139. Firestore Query Discipline

## Decision

V1.5 should query only the data needed for the current operation.

Avoid fetch-all-then-filter patterns for sensitive or large datasets.

---

# 140. Pagination

## Decision

Potentially large datasets should support bounded loading/pagination.

Important candidates:

* responses
* activities
* articles
* cadres
* partnerships
* distributions

---

# 141. No N+1 Query Architecture

## Decision

The application should avoid fetching related data individually in large loops when efficient alternatives exist.

---

# 142. No Unbounded Firestore Arrays

## Decision

Unbounded historical collections such as:

* all responses
* all activities
* all articles

must not be stored as endlessly growing arrays inside a single Firestore document.

---

# 143. Relationship Data Uses IDs/References

## Decision

Relationships generally use stable IDs/references rather than embedding entire mutable domain objects.

---

# 144. Intentional Snapshot Data Is Allowed

## Decision

Historical snapshots may be stored intentionally when needed to preserve historical meaning.

For example:

```text
publishedByName
```

may be appropriate if historical display must remain stable.

---

# 145. Metrics Are Derived

## Decision

Metrics may be cached/aggregated for performance, but their underlying source remains the domain records.

---

# 146. Metrics Must Be Recomputable

## Decision

Where practical, metric logic should be designed so derived values can be recalculated from source data.

---

# 147. No Manual Metric Inflation

## Decision

Clients cannot directly submit authoritative:

```text
count
reach
responses
views
score
```

values.

---

# 148. Activity Generation Is Server/Domain Controlled

## Decision

Clients cannot freely create fake activities such as:

```text
article_published
```

without performing the actual operation.

---

# 149. Public Metrics Are Aggregate

## Decision

Public metrics should generally be aggregate rather than respondent-level.

---

# 150. Export Follows Authorization

## Decision

If exports are implemented, they must use the same authorization scope as dashboards and APIs.

Export cannot become a security bypass.

---

# 151. Search Follows Authorization

## Decision

Search results must respect the same scope as ordinary reads.

---

# 152. Filtering Follows Authorization

## Decision

Changing filters must never expose records outside the user's authorization scope.

---

# 153. Pagination Follows Authorization

## Decision

Pagination must not become a mechanism for discovering unauthorized records.

---

# 154. Public Search Is Public-Only

## Decision

Public search may query only explicitly public resources.

---

# 155. User-Generated Content Is Sanitized

## Decision

If rich text/HTML is supported, untrusted HTML must be sanitized before public rendering.

---

# 156. File Uploads

## Decision

Uploaded files must be controlled by:

* authorization
* file type validation
* file size limits
* safe storage paths

where appropriate.

---

# 157. Storage Is Not Public by Default

## Decision

Cloud Storage objects are private unless explicitly made public through controlled application logic.

---

# 158. Media Metadata

## Decision

Media metadata belongs in Firestore when required for application management.

Binary files belong in Cloud Storage.

---

# 159. No Secrets in Git

## Decision

The repository must never contain:

* service account JSON
* private keys
* passwords
* authentication secrets
* production `.env` secrets
* API secrets

---

# 160. Environment Variables

## Decision

Public configuration may use appropriate `NEXT_PUBLIC_*` variables.

Private secrets must never use public environment-variable prefixes.

---

# 161. Production Secrets Are Server-Side

## Decision

Server-only secrets must remain in server/deployment environment configuration.

---

# 162. No Credential Logging

## Decision

The application must never log:

* service account credentials
* passwords
* authentication tokens
* private keys

---

# 163. Development Firebase Project Must Be Verifiable

## Decision

Developers should be able to determine which Firebase project/environment the application is using without exposing secrets.

---

# 164. Emulator Use Is Explicit

## Decision

Firebase Emulator usage must be explicit and must not accidentally affect production.

---

# 165. Production Deployment

## Decision

Before production deployment, verify:

```text
Firebase Project
Authentication
Firestore
Storage
Security Rules
Environment Variables
Public Routes
Admin Routes
Form Submission
```

---

# 166. Vercel Environment Separation

## Decision

Vercel development/preview/production environment variables must be configured intentionally.

Local `.env` configuration does not automatically imply correct production configuration.

---

# 167. No Hidden Legacy Dependencies

## Decision

V1.5 must not silently depend on:

* legacy Firestore
* legacy Storage
* legacy environment variables
* legacy APIs
* legacy hardcoded IDs

---

# 168. Legacy Code Reuse Is Allowed

## Decision

Legacy code may be reused if it is:

* correct
* secure
* compatible
* understandable
* architecturally appropriate

Reuse is preferred over rewriting correct code unnecessarily.

---

# 169. Existing Working Features Are Preserved

## Decision

If a feature works and does not conflict with V1.5 architecture, preserve it.

If it conflicts with the new architecture, refactor incrementally.

---

# 170. Refactoring Goal

The goal of refactoring is:

```text
Preserve Behavior
+
Improve Structure
+
Improve Security
+
Improve Maintainability
```

not:

```text
Rewrite Everything
```

---

# 171. Build Validation

## Decision

Relevant changes should be validated through:

```text
Typecheck
Lint
Build
Tests
```

as appropriate.

A development server starting successfully is not sufficient proof of correctness.

---

# 172. Deprecated Configuration

## Decision

Deprecated Next.js configuration should be corrected when relevant.

However, unrelated framework migration should not be mixed into feature development unnecessarily.

---

# 173. Current Next.js Warnings

## Decision

Current warnings such as deprecated configuration or framework conventions should be tracked and addressed deliberately.

They must not be ignored merely because the application still runs.

---

# 174. Feature Completion Definition

## Decision

A feature is complete only when its required vertical slice works.

Conceptually:

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
 ↓
Testing
```

---

# 175. Architecture Changes Require New Decisions

## Decision

If implementation requires a fundamental change to the architecture, do not silently modify the architecture.

Create a new decision.

Example:

```text
Decision 176:
Introduce X because Y.
```

The newer decision supersedes the relevant previous decision.

---

# 176. Decision Numbering

Decisions are numbered sequentially.

New decisions should be appended rather than renumbering existing decisions.

This provides historical traceability.

---

# 177. Superseding a Decision

When a decision changes, do not delete the old decision.

Mark it:

```text
SUPERSEDED
```

and record the replacement decision.

Example:

```text
Decision 120
Status: SUPERSEDED
Superseded by: Decision 177
```

This preserves architectural history.

---

# 178. No Silent Decision Changes

Codex must not:

* reinterpret
* weaken
* remove
* bypass

a final decision without an explicit updated decision.

---

# 179. Decision Status

Each decision may be considered:

```text
FINAL
SUPERSEDED
```

V1.5 implementation decisions should normally remain `FINAL`.

---

# 180. Final V1.5 Domain Model

The agreed high-level model is:

```text
                    ADMIN / BPOM
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
                                FORM VERSION
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

---

# 181. Final Access Model

The agreed conceptual authorization model is:

```text
ADMIN
  │
  └── Global Platform Scope

PARTNERSHIP
  │
  └── Own Partnership Scope

CADRE
  │
  ├── Own Resources
  └── Explicit Collaborations

PUBLIC
  │
  └── Published Public Resources
```

---

# 182. Final Form Model

The agreed form architecture is:

```text
Official Form
      │
      ├── Form Version 1
      │       └── Distributions
      │              └── Responses
      │
      ├── Form Version 2
      │       └── Distributions
      │              └── Responses
      │
      └── Form Version N
```

Historical responses remain tied to the relevant version.

---

# 183. Final Distribution Model

The agreed distribution model is:

```text
Distribution
│
├── Form
├── Form Version
├── Primary Owner
├── Collaborators
├── Partnership Context
└── Distribution Metadata
```

Responses inherit trusted attribution from the distribution.

---

# 184. Final Response Model

The conceptual response model is:

```text
Response
│
├── Form ID
├── Form Version ID
├── Distribution ID
├── Answers
├── Score
├── Submission Timestamp
└── Attribution
```

The exact Firestore schema may evolve, but these semantic relationships must remain intact.

---

# 185. Final Scoring Model

The agreed scoring flow is:

```text
Respondent
    ↓
Answers
    ↓
Server Validation
    ↓
Existing Scoring Logic
    ↓
Authoritative Score
    ↓
Persisted Response
    ↓
Metrics
```

---

# 186. Final Public Form Model

The public form flow is:

```text
Public Distribution
       ↓
Published Form Version
       ↓
Public Renderer
       ↓
Respondent
       ↓
Answers
       ↓
Trusted Submission
       ↓
Response
```

The public client never receives private scoring configuration.

---

# 187. Final CMS Model

The CMS model is:

```text
Admin
  ↓
CMS
  ↓
Firestore
  ↓
Public Renderer
```

Public content should not be duplicated manually in frontend source code.

---

# 188. Final Architecture Principle

The central architectural principle of V1.5 is:

```text
Generic Core
+
Explicit Ownership
+
Explicit Scope
+
Versioned Forms
+
Immutable Historical Meaning
+
Trusted Scoring
+
Centralized Governance
+
Public/Private Separation
```

---

# 189. Final Development Principle

The central development principle is:

```text
Do not optimize for the fastest rewrite.

Optimize for the safest path from the validated legacy behavior
to a clean V1.5 architecture.
```

---

# 190. Final Codex Instruction

When implementing V1.5, Codex must assume that the following are already decided:

```text
Firebase remains the backend.
KKPD-V1 is the V1.5 Firebase project.
Legacy Firebase is not the V1.5 runtime database.
Authentication uses Firebase Auth.
Authorization is separate from authentication.
Primary roles are Admin, Partnership, Cadre, and Public.
There is no cadre hierarchy.
Partnership is the generic organizational model.
School is a partnership type.
Official forms are centrally governed.
Distributions are separate from forms.
Distributions pin form versions.
Responses preserve historical form context.
Existing scoring behavior must be preserved.
Answer keys are private.
Question IDs are stable.
Public respondents do not require accounts by default.
Responses are sensitive.
Attribution comes from trusted distribution data.
Primary ownership is distinct from collaboration.
Metrics are derived from source records.
Activities represent meaningful domain events.
Historical data is preserved.
Archive is preferred over destructive deletion.
Firebase Security Rules are mandatory.
Admin SDK is server-only.
Service credentials are server-only.
Public content comes from CMS/domain data.
V1.5 is incremental, not a big-bang rewrite.
V2 complexity is deferred.
```

These are not suggestions.

They are the approved V1.5 decisions.

---

# 191. Final Status

```text
Document: DECISIONS.md
Version: V1.5
Status: FINAL
```

Any future architectural change must be recorded as a new decision and must explicitly identify which previous decision it supersedes.

**End of DECISIONS.md**
