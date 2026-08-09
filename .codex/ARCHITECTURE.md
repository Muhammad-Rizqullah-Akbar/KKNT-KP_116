# KKPD-KP V1.5 — System Architecture

**Document Status:** Draft for Implementation
**Version:** V1.5
**Purpose:** Authoritative architecture reference for the V1.5 rebuild of the KKPD-KP platform.

---

# 1. System Overview

KKPD-KP V1.5 is a generic digital platform for supporting BPOM-partnered food safety cadre programs, content management, form distribution, assessment, response collection, and program measurement.

The system is designed to support BPOM as the central platform manager while allowing BPOM to work with different types of partner organizations.

The initial implementation may primarily target schools, but the architecture MUST NOT assume that all partnerships are schools.

Examples of possible partnership types:

* School
* Kelurahan
* Community
* Institution
* Organization
* Other BPOM partner entities

The platform therefore follows a generic hierarchy:

```text
BPOM / Platform Administration
            │
            ▼
      PARTNERSHIP
            │
     ┌──────┴──────┐
     │             │
  Metadata       Members
                   │
                   ▼
                 CADRES
                   │
          ┌────────┼────────┐
          │        │        │
       Articles  Forms   Activities
                   │
                   ▼
              Distribution
                   │
                   ▼
              Respondents
                   │
                   ▼
               Responses
                   │
             ┌─────┴─────┐
             ▼           ▼
          Scoring      Metrics
```

The architecture separates:

1. Platform administration
2. Partnership management
3. Cadre management
4. Content management
5. Form management
6. Form distribution
7. Response collection
8. Scoring
9. Metrics and activities
10. Public-facing content and forms

---

# 2. Architectural Principles

The V1.5 architecture follows these principles.

## 2.1 Generic Partnership Model

The system MUST treat a partnership as a generic organization.

The system MUST NOT hardcode:

```text
School → Student → Cadre
```

as the only hierarchy.

Instead:

```text
Partnership
    │
    └── Members / Cadres
```

A school is one possible partnership type.

Future partnership types may include:

```text
School
Kelurahan
Community
Institution
Organization
Other
```

If a future partnership requires additional hierarchy such as:

```text
Kelurahan
    ├── RW
    │    ├── RT
    │    └── RT
    └── RW
```

that hierarchy should be introduced through an extension of the partnership model rather than by rewriting the core platform.

---

## 2.2 Cadres Have Equal Status

V1.5 does NOT use cadre levels or cadre hierarchy.

There is no:

```text
Level 1
Level 2
Level 3
Ketua Kader
```

All cadre accounts have the same cadre role.

Monitoring is performed by:

* Admin
* Partnership account

A cadre may manage their own permitted resources according to ownership rules.

---

## 2.3 Admin Is the Central Platform Manager

Admin is responsible for the centralized management of the platform.

Admin can manage:

* Partnerships
* Partnership metadata
* Partnership members/cadres
* Articles
* Official forms
* Form approval/publishing
* Form distributions
* Responses
* Metrics
* Activities
* Platform settings
* Public CMS content

Admin represents the central management layer and should not be restricted by a cadre's ownership scope.

---

## 2.4 Public Is a Consumer of Published Data

Public-facing pages should consume published platform data.

Public users should not need an account for ordinary content consumption or form participation unless a future feature explicitly requires authentication.

The public system should not maintain a separate content model from the admin CMS.

Preferred architecture:

```text
Admin CMS
    │
    ▼
Published Data
    │
    ▼
Public Renderer
```

Admin Preview and Public Renderer SHOULD use the same rendering logic wherever practical.

---

## 2.5 Existing Scoring Logic Is Protected

The existing scoring implementation is considered validated business logic and serves as the baseline for V1.5.

The V1.5 system MUST preserve:

* Existing scoring semantics
* Existing score interpretation
* Existing answer-key interpretation
* Existing scoring behavior

The scoring implementation may be wrapped, isolated, or adapted to a new data model, but the underlying business meaning MUST NOT be silently changed.

---

## 2.6 Legacy Database Is a Baseline

The old Firebase project/database is treated as a legacy baseline.

V1.5 uses a new Firebase project.

The legacy database MUST NOT be modified by the V1.5 application.

Legacy data migration is a separate controlled activity and must not happen automatically during normal development.

---

# 3. System Actors

V1.5 contains four primary actors.

```text
                    ┌──────────────┐
                    │    ADMIN     │
                    └──────┬───────┘
                           │
                 Full platform control
                           │
             ┌─────────────┴─────────────┐
             │                           │
       ┌─────▼─────┐               ┌─────▼─────┐
       │PARTNERSHIP│               │  CONTENT  │
       └─────┬─────┘               └───────────┘
             │
             ▼
        ┌──────────┐
        │  CADRE   │
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │  PUBLIC  │
        │RESPONDENT│
        └──────────┘
```

---

# 4. Role Definitions

## 4.1 Admin

Admin is the central platform administrator.

Admin has broad management access across the platform.

Admin can:

* Create partnerships
* Update partnerships
* Archive/deactivate partnerships
* Manage partnership types
* Manage partnership metadata
* Create/manage cadre accounts
* View cadre records
* Manage articles
* Manage official forms
* Review form submissions/requests when applicable
* Publish or unpublish controlled forms
* Create and manage official forms
* Use official forms in distributions
* View distributions
* View responses
* View platform-wide metrics
* View activities
* Manage platform settings
* Manage CMS content
* Manage public-facing configuration

Admin is not restricted by ownership boundaries.

---

## 4.2 Partnership

A Partnership represents an organization collaborating with BPOM.

Examples:

* School
* Kelurahan
* Community
* Institution
* Organization

A partnership may have its own account or account(s) for monitoring and management.

A partnership can:

* View its own partnership profile
* View its associated cadres
* Monitor cadre activities
* Monitor relevant articles
* Monitor relevant form distributions
* Monitor responses within its authorized scope
* Monitor program metrics
* Monitor participant/respondent metrics within its scope

A partnership MUST NOT access unrelated partnership data.

---

## 4.3 Cadre

A cadre is an individual member associated with a partnership.

All cadres have the same cadre role in V1.5.

A cadre can:

* Manage their own profile within allowed fields
* Create articles
* Update their own articles
* Delete their own articles
* Publish permitted articles
* Create permitted form distributions
* Use official forms
* View their own distributions
* View responses attributable to their distributions
* View relevant activities and metrics
* Participate in collaboration when explicitly assigned

A cadre MUST NOT modify another cadre's resources unless the resource explicitly grants collaboration access or the user is an Admin.

---

## 4.4 Public Respondent

A public respondent is an end user who fills a publicly accessible form.

A respondent generally does not require an account.

A respondent can:

* Open published forms
* Access forms through distribution links
* Access forms through distribution codes where enabled
* Submit responses
* Receive appropriate submission feedback
* Provide respondent identity information required by the form
* Participate in assessments

A respondent MUST NOT access:

* Admin dashboards
* Cadre dashboards
* Partnership dashboards
* Other respondents' responses
* Private platform data

---

# 5. Partnership Architecture

Partnership is a first-class domain entity.

```text
Partnership
│
├── Identity
│   ├── Name
│   ├── Type
│   ├── Description
│   └── Status
│
├── Contact
│   ├── Address
│   ├── Contact information
│   └── Other metadata
│
├── Members
│   └── Cadres
│
├── Content
│   └── Articles
│
├── Activities
│   └── Aggregated activity
│
└── Metrics
    └── Program metrics
```

The partnership type determines presentation and optional metadata, not the fundamental architecture.

---

# 6. Partnership Type Model

A partnership type should be represented as data rather than hardcoded assumptions.

Example:

```text
partnershipType:
    school
    kelurahan
    community
    institution
    organization
    other
```

The system should be capable of displaying different metadata based on partnership type.

For example:

### School

Possible metadata:

* School name
* School code
* Address
* Principal/contact
* Other relevant school information

### Kelurahan

Possible future metadata:

* Kelurahan name
* Kecamatan
* Administrative information
* Contact
* Optional RT/RW hierarchy

The initial V1.5 implementation should not overbuild RT/RW-specific structures unless required.

---

# 7. Cadre Architecture

Cadres belong to a partnership.

```text
Partnership
     │
     ├── Cadre A
     ├── Cadre B
     ├── Cadre C
     └── Cadre D
```

There is no cadre hierarchy.

A cadre record should conceptually contain:

```text
Cadre
├── Identity
├── Account reference
├── Partnership reference
├── Profile
├── Status
├── Created timestamp
└── Activity references / derived metrics
```

The account identity and profile data should be separated conceptually so authentication credentials are not unnecessarily duplicated across application records.

---

# 8. Authentication Architecture

Authentication is handled separately from authorization.

```text
Firebase Authentication
          │
          ▼
       User UID
          │
          ▼
Application User Profile
          │
          ▼
        Role
          │
   ┌──────┼────────┐
   ▼      ▼        ▼
 Admin Partnership Cadre
```

The application MUST NOT rely only on frontend role checks.

Authentication determines:

> Who is the user?

Authorization determines:

> What is the user allowed to do?

---

# 9. Authorization Model

Authorization is scope-based.

## Admin

```text
Scope:
Global
```

## Partnership

```text
Scope:
Own partnership
```

## Cadre

```text
Scope:
Own resources
+
Explicitly shared/collaborated resources
```

## Public

```text
Scope:
Published public resources only
```

The system should use ownership references such as:

```text
ownerId
partnershipId
createdBy
```

where appropriate.

---

# 10. Article CMS Architecture

Articles are first-class CMS resources.

```text
Article
│
├── Content
│   ├── Title
│   ├── Body
│   ├── Cover image
│   └── Media
│
├── Publication
│   ├── Status
│   ├── Published timestamp
│   └── Updated timestamp
│
├── Ownership
│   ├── Created by
│   ├── Owner cadre
│   └── Partnership
│
└── Attribution
    └── Publishing cadre
```

The article should visibly identify the cadre responsible for the publication when appropriate.

This enables the platform to support:

```text
Article
   ↓
Published by Cadre X
   ↓
Belongs to Partnership Y
```

This attribution can contribute to cadre milestones and partnership achievements.

---

# 11. Article Permissions

## Admin

Admin can:

* Create
* Read
* Update
* Delete
* Publish
* Unpublish
* Manage all articles

## Cadre

Cadre can:

* Create own article
* Read permitted articles
* Update own article
* Delete own article
* Publish permitted article

Cadre cannot modify another cadre's article unless explicitly granted collaboration access.

## Partnership

Partnership can:

* View relevant articles
* Monitor article activity
* Access metrics within partnership scope

Partnership permissions for direct editing should be explicitly defined if required later.

---

# 12. Form System Overview

Forms are one of the core platform domains.

The architecture distinguishes:

1. Form definition
2. Form version
3. Answer key
4. Scoring configuration
5. Distribution
6. Response
7. Attribution
8. Metrics

The conceptual flow is:

```text
FORM DEFINITION
       │
       ▼
FORM VERSION
       │
 ┌─────┼──────────────┐
 ▼     ▼              ▼
Questions Answer Keys Scoring
       │
       ▼
Distribution
       │
 ┌─────┴─────────┐
 ▼               ▼
Primary Owner Collaborators
       │
       ▼
Distribution Link / Code
       │
       ▼
Respondents
       │
       ▼
Responses
       │
 ┌─────┴───────┐
 ▼             ▼
Scoring      Metrics
       │
       ▼
Attribution
```

---

# 13. Official Forms

Official forms are controlled forms provided by BPOM or authorized platform administrators.

An official form can be made available for reuse.

Conceptually:

```text
BPOM
 │
 ▼
OFFICIAL FORM
 │
 └── "Use Official Form"
          │
          ▼
      Distribution
```

Using an official form MUST NOT create an uncontrolled duplicate of the official instrument.

Instead, a distribution references the official form/version.

This allows BPOM to maintain controlled instruments while cadres and partnerships can distribute them.

---

# 14. Form Ownership

A form should distinguish between:

* Form owner
* Form creator
* Official provider
* Distribution owner

For official forms:

```text
Official Provider:
BPOM / Authorized Admin
```

For a distribution:

```text
Primary Owner:
Cadre / Authorized user

Collaborators:
Explicitly assigned users
```

This distinction is important because the person distributing a form is not necessarily the person who owns the underlying official instrument.

---

# 15. Form Creation and Approval

The intended workflow is:

```text
Create Form
    │
    ▼
Draft
    │
    ▼
Submit for Review
    │
    ▼
Review
    │
 ┌──┴──────┐
 ▼         ▼
Approve   Reject
 │
 ▼
Publish
```

However, V1.5 may centralize official form creation and approval under Admin/BPOM to reduce implementation complexity.

The architecture must remain capable of supporting future form creation requests from other users.

### Future V2 capability

```text
Cadre / Partnership
       │
       ▼
Request Form Creation
       │
       ▼
BPOM Review
       │
 ┌─────┴─────┐
 ▼           ▼
Approve     Reject
```

This is a future extension and should not unnecessarily complicate the initial V1.5 implementation.

---

# 16. Form Draft / Publish States

A form should conceptually support lifecycle states such as:

```text
DRAFT
   ↓
PENDING_REVIEW
   ↓
APPROVED
   ↓
PUBLISHED
   ↓
ARCHIVED
```

Rejected forms may return to:

```text
DRAFT
```

A form that has already received historical responses should not be destructively modified in a way that changes the meaning of those responses.

---

# 17. Form Builder Architecture

The V1.5 Form Builder should prioritize ease of use.

The builder should allow administrators/authorized users to manage:

* Form title
* Description
* Instructions
* Questions
* Question types
* Required status
* Options
* Answer keys
* Scoring configuration
* Metadata
* Target audience/scope where required
* Publication status

The builder should provide an overview of questions and answers without requiring the user to open every question modal individually.

---

# 18. Answer Key Management

Answer keys must be visible and manageable at the form level.

The system should allow an authorized user to inspect:

```text
Question 1 → Correct answer
Question 2 → Correct answer
Question 3 → Correct answer
...
```

without opening each question individually.

This is important because answer keys are part of the assessment configuration and may need to be reviewed or corrected efficiently.

Changing an answer key on an already-used form MUST consider versioning and historical response integrity.

---

# 19. Form Versioning

Forms should conceptually support versioning.

Example:

```text
Form: Food Safety Pre-Test

Version 1
   ↓
Published
   ↓
Responses collected

Version 2
   ↓
Updated answer key/questions
   ↓
Published
```

Historical responses should remain associated with the version used at submission.

This prevents a later answer-key modification from silently changing historical scores.

---

# 20. Question Identity

Every question should have a stable identifier.

Conceptually:

```text
questionId
```

Responses should reference the question through `questionId`.

Example:

```text
Response
├── formId
├── formVersionId
├── distributionId
└── answers
      ├── questionId
      ├── answer
      └── score
```

Analytics must use `questionId` rather than relying on question array position or display order.

---

# 21. Form Distribution

A form distribution represents a specific instance of a form being distributed to respondents.

```text
Official Form
      │
      ▼
Distribution
      │
      ├── Primary Owner
      ├── Collaborators
      ├── Distribution Code
      ├── Distribution Link
      ├── Status
      └── Attribution
```

The same official form can have multiple distributions.

Example:

```text
Official Form A
│
├── Distribution A
│    └── Cadre 1
│
├── Distribution B
│    └── Cadre 2
│
└── Distribution C
     └── Partnership X
```

This allows the platform to measure which person or partnership distributed a form.

---

# 22. Primary Owner and Collaborators

Each distribution can have:

### Primary Owner

The primary account responsible for the distribution.

### Collaborators

Other authorized accounts explicitly associated with the distribution.

Conceptually:

```text
Distribution
│
├── Primary Owner
│      └── Cadre A
│
└── Collaborators
       ├── Cadre B
       └── Cadre C
```

Collaboration allows attribution and monitoring without transferring ownership.

---

# 23. Distribution Attribution

Every response should be attributable to the distribution through which the respondent accessed the form.

Conceptually:

```text
Respondent
    ↓
Distribution Link / Code
    ↓
Distribution
    ↓
Primary Owner
    ↓
Collaborators
    ↓
Partnership
```

This enables metrics such as:

* Responses generated by a cadre
* Responses generated by a partnership
* Form usage
* Distribution reach
* Participation rate
* Assessment results

The respondent should not need to manually select the cadre or partnership if the distribution already provides that information.

---

# 24. Distribution Link and Distribution Code

A distribution may provide:

```text
Public Link
```

and/or:

```text
Distribution Code
```

The distribution identifier must be sufficient to determine attribution.

Example:

```text
/public/form/ABC123
```

or a human-friendly code:

```text
KKPD-2026-001
```

The exact URL/code format is an implementation detail.

The important architectural requirement is:

```text
Distribution Identifier
        ↓
Distribution
        ↓
Owner / Collaborators / Partnership
```

---

# 25. Respondent Architecture

Respondents generally do not need authentication.

The respondent flow is:

```text
Open Link / Enter Code
        ↓
Resolve Distribution
        ↓
Load Published Form Version
        ↓
Fill Form
        ↓
Validate
        ↓
Submit
        ↓
Calculate Score
        ↓
Persist Response
        ↓
Generate Metrics
```

The respondent should not be exposed to administrative information unless intentionally included in the public form.

---

# 26. Respondent Identity

V1.5 should avoid requiring account creation for ordinary student/respondent participation.

Identity can be collected through form fields.

For school-based participation, a respondent may provide:

* Full name
* Other relevant identification fields
* Partnership context when necessary

The system may use validation to reduce duplicate submissions.

However, uniqueness rules should not rely solely on a person's name if reliable identity verification is not available.

The architecture should therefore allow future stronger identity mechanisms without requiring login in V1.5.

---

# 27. Pre-Test and Post-Test

Forms may be associated with an article, program, activity, or learning milestone.

Example:

```text
Article / Learning Content
        │
        ├── Pre-Test
        │
        └── Post-Test
```

A future implementation may compare:

```text
Pre-Test Score
      ↓
Learning / Article / Activity
      ↓
Post-Test Score
```

This allows measurement of knowledge improvement.

The form architecture should therefore support metadata such as:

```text
assessmentType:
    pre_test
    post_test
    survey
    evaluation
    other
```

---

# 28. Article–Form Relationship

Articles may reference associated forms.

Example:

```text
Article
│
├── Pre-Test
│     └── Form Distribution
│
├── Content
│
└── Post-Test
      └── Form Distribution
```

This relationship allows the platform to represent learning or campaign flows.

Forms should not necessarily be embedded directly into article content.

Instead, the article may reference the form/distribution.

---

# 29. Form Eligibility and Targeting

Forms may have metadata describing their intended audience.

Examples:

```text
Target:
- Cadre
- Student
- Public
- Partnership
- Other
```

Targeting should be represented as metadata rather than by hardcoding a single school-specific workflow.

A future system may support additional targeting rules based on:

* Partnership
* Program
* Article
* Campaign
* Participant category

---

# 30. Scoring Architecture

Scoring is separated from:

* UI
* Form rendering
* Response storage
* Analytics

Preferred flow:

```text
Response
   │
   ▼
Validation
   │
   ▼
Scoring Engine
   │
   ▼
Score Result
   │
   ▼
Persist Response + Score
```

The existing scoring logic remains the baseline.

The V1.5 architecture may wrap the existing implementation through a dedicated service:

```text
services/scoring
```

without changing its semantics.

---

# 31. Persisted Score

Score should be persisted as part of the response result when the form is scoreable.

A response should conceptually contain:

```text
Response
├── formId
├── formVersionId
├── distributionId
├── respondent
├── answers
├── score
├── scoringResult
└── submittedAt
```

This prevents the system from having to recompute historical scores every time metrics are viewed.

The stored score must correspond to the form version and scoring configuration used during submission.

---

# 32. Response Lifecycle

Responses should have a controlled lifecycle.

Conceptually:

```text
STARTED
   ↓
IN_PROGRESS
   ↓
SUBMITTED
   ↓
SCORED
   ↓
RECORDED
```

The exact lifecycle may be simplified for V1.5.

At minimum, the system must distinguish:

* Draft/incomplete state where applicable
* Submitted response
* Valid/invalid response
* Score result where applicable

Historical submitted responses should not be silently overwritten by later form configuration changes.

---

# 33. Response Ownership and Visibility

Response visibility depends on attribution and authorization.

### Admin

Can access platform-wide responses.

### Partnership

Can access responses attributable to its partnership scope.

### Cadre

Can access responses attributable to their authorized distributions.

### Public respondent

Can access only their own submission result when the system explicitly provides it.

No user should be able to enumerate unrelated responses by manipulating an ID in the URL or client request.

---

# 34. Activities Architecture

Activities represent meaningful system activity and program participation.

Activities are not simply page views.

Examples:

* Article published
* Article updated
* Form distributed
* Form completed
* Form response submitted
* Assessment completed
* Form used
* Collaboration added
* Program milestone achieved

Activities may be used to generate summaries and dashboards.

---

# 35. Metrics Architecture

Metrics are derived from actual platform events and persisted domain data.

Examples:

## Cadre Metrics

* Articles published
* Forms distributed
* Responses generated
* Participants reached
* Assessment activities
* Pre-test participation
* Post-test participation
* Total reach

## Partnership Metrics

* Number of cadres
* Total participants reached
* Articles published by cadres
* Forms distributed
* Responses collected
* Assessment participation
* Program activity

## Platform/Admin Metrics

* Total partnerships
* Total cadres
* Total articles
* Total published forms
* Total distributions
* Total responses
* Total respondents reached
* Assessment metrics

Metrics should not be manually entered when they can be derived from source data.

---

# 36. Cadre Attribution and Milestones

The system should allow cadre contributions to be measured.

Conceptually:

```text
Cadre
 │
 ├── Articles
 ├── Form Distributions
 ├── Respondents Reached
 ├── Responses
 └── Activities
        │
        ▼
      Metrics
        │
        ▼
     Milestones
```

Examples of milestones:

* First article published
* First form distributed
* First assessment completed
* 10 respondents reached
* 50 respondents reached
* Multiple articles published

Milestone definitions should be configurable in the future rather than hardcoded into UI components.

---

# 37. Partnership Metrics

Partnerships should be able to monitor their members.

Example:

```text
School A
│
├── Cadre 1
├── Cadre 2
├── Cadre 3
│
└── Metrics
      ├── Total cadre activity
      ├── Participants reached
      ├── Articles
      ├── Forms
      └── Assessments
```

This allows a school or future partnership type to monitor program progress without requiring the partnership account to access unrelated platform data.

---

# 38. Public CMS Architecture

The platform should remain a CMS.

Admin should be able to manage public-facing content without editing code.

CMS-managed resources may include:

* Landing page settings
* Articles
* Gallery
* Partnership information
* Public information
* Program information
* Other configurable sections

Public pages consume published CMS data.

---

# 39. Settings Architecture

Platform settings should be stored in the new Firestore system rather than hardcoded into frontend components when they are intended to be configurable.

Examples:

* Landing page configuration
* Site metadata
* Public section visibility
* Contact information
* General platform settings
* Public CMS configuration

The frontend should read settings through a centralized repository/service rather than directly querying Firestore from multiple components.

---

# 40. Gallery Architecture

Gallery is a CMS-managed public resource.

Conceptual flow:

```text
Admin
  │
  ▼
Gallery Manager
  │
  ▼
Storage
  │
  ▼
Gallery Metadata
  │
  ▼
Published Gallery
  │
  ▼
Public
```

Gallery metadata and media storage should be separated conceptually.

---

# 41. Partnership Public Display

Partnerships may be displayed publicly when enabled.

The public system should be able to display:

```text
Partnership
├── Name
├── Type
├── Location
├── Description
└── Other public metadata
```

The public renderer must not expose private administrative information.

A school is therefore displayed as one partnership type rather than being treated as a separate hardcoded entity.

---

# 42. Admin Preview

Admin Preview should use the same rendering model as the public site wherever practical.

Preferred:

```text
CMS Data
   │
   ├── Admin Preview
   │
   └── Public Renderer
```

Not:

```text
CMS Data
   ├── Admin-specific rendering
   └── Separate public rendering
```

This reduces visual inconsistencies and duplication.

---

# 43. Backend Architecture

The preferred backend dependency direction is:

```text
UI / Route
     │
     ▼
Server Action / API
     │
     ▼
Domain Service
     │
     ▼
Repository
     │
     ▼
Firebase
```

Responsibilities:

### UI

* Presentation
* User interaction
* Client-side validation
* Loading/error states

### API / Server Action

* Request boundary
* Authentication context
* Authorization
* Input validation

### Service

* Business rules
* Domain operations
* Workflow coordination

### Repository

* Database access
* Firebase-specific implementation

### Scoring Service

* Score calculation
* Existing scoring logic integration

---

# 44. Firebase Architecture

V1.5 uses a new Firebase project.

Conceptually:

```text
Next.js
│
├── Firebase Client SDK
│      ├── Authentication
│      ├── Firestore
│      └── Storage
│
└── Firebase Admin SDK
       ├── Authentication administration
       ├── Firestore server operations
       ├── Storage server operations
       └── Messaging where required
```

Firestore is the primary application data store.

Cloud Storage is used for media/assets where appropriate.

Firebase Authentication is used for authenticated users.

---

# 45. Firestore Architecture

The exact collection names are implementation details, but the domain model should conceptually represent:

```text
users
partnerships
cadres
articles
forms
formVersions
distributions
responses
activities
metrics
settings
gallery
```

Some domains may be represented as subcollections where appropriate.

The implementation must prioritize:

* Clear ownership
* Query efficiency
* Security rules
* Historical integrity
* Versioning
* Avoidance of unnecessary duplication

---

# 46. Recommended Domain Relationships

Conceptually:

```text
User
 │
 ├── role
 │
 ├── Partnership Account
 │
 └── Cadre Account
         │
         └── partnershipId


Partnership
 │
 └── cadres[] / cadre references


Cadre
 │
 ├── articles
 ├── distributions
 └── activities


Article
 │
 ├── ownerId
 ├── partnershipId
 └── associated forms


Form
 │
 └── formVersions


FormVersion
 │
 ├── questions
 ├── answerKeys
 └── scoring configuration


Distribution
 │
 ├── formId
 ├── formVersionId
 ├── primaryOwnerId
 ├── collaboratorIds
 └── partnershipId


Response
 │
 ├── formId
 ├── formVersionId
 ├── distributionId
 ├── respondent
 ├── answers
 ├── score
 └── attribution


Activity
 │
 ├── actorId
 ├── partnershipId
 ├── resourceId
 └── activityType
```

---

# 47. Data Ownership

Every user-generated resource should have an explicit ownership model.

Typical ownership fields may include:

```text
createdBy
ownerId
partnershipId
```

Ownership should be determined from authenticated server context wherever possible.

The client should not be trusted to declare ownership.

---

# 48. Historical Integrity

Historical data must remain meaningful even after configuration changes.

Examples:

```text
Form Version 1
   ↓
Response A
   ↓
Score A
```

If the form later becomes:

```text
Form Version 2
```

then:

```text
Response A
```

must still reference Version 1.

Changing Version 2 must not silently alter Response A.

The same principle applies to:

* Answer keys
* Scoring configuration
* Distribution attribution
* Article publication records where relevant

---

# 49. Security Architecture

Security must be enforced at multiple layers.

```text
Authentication
      ↓
Authorization
      ↓
Server Validation
      ↓
Firestore Security Rules
      ↓
Data
```

Client-side checks exist for UX but are not considered security boundaries.

Sensitive credentials must never be exposed through:

```text
NEXT_PUBLIC_*
```

Server-only credentials must remain server-side.

---

# 50. Firestore Security Principles

Rules should enforce:

### Admin

Broad authorized access.

### Partnership

Access only to documents belonging to the partnership.

### Cadre

Access only to owned or explicitly shared resources.

### Public

Read only explicitly published public resources.

### Responses

A user must not read responses outside their authorized scope.

### Write operations

Client-provided ownership fields must not override server/security-derived ownership.

---

# 51. Storage Security

Storage follows the same ownership model.

Public media should be explicitly marked/served as public.

Private assets should require authorized access.

Examples:

```text
Public article image
     ↓
Publicly accessible

Private administrative asset
     ↓
Authenticated/authorized access
```

---

# 52. Form Security

Public forms must be accessible without exposing administrative functionality.

A public form request should only resolve:

* Published form
* Published version
* Required public metadata
* Distribution metadata necessary for submission

It must NOT expose:

* Answer keys
* Administrative scoring configuration
* Private owner information
* Internal moderation information
* Other responses

The public renderer may submit answers to the backend, while the answer key remains server-side.

---

# 53. Answer Key Security

Answer keys are administrative data.

They must never be sent to the public browser as part of a public form payload.

The architecture should distinguish:

```text
Public Form Payload
     │
     ├── Question
     ├── Options
     ├── Required
     └── Presentation metadata

Private Scoring Configuration
     │
     ├── Answer key
     ├── Score rules
     └── Internal metadata
```

Scoring should occur in a trusted environment where possible.

---

# 54. Form Builder UX Architecture

The Form Builder should optimize for fast administrative operation.

Important UX principles:

* Question list overview
* Clear question ordering
* Inline or side-panel editing where appropriate
* Visible answer-key summary
* Clear required/optional state
* Preview
* Autosave or explicit save state
* Draft/published distinction
* Validation before publishing
* Clear unsaved-change indication
* Mobile usability where practical

The admin should not have to repeatedly open nested modals to understand the whole form.

---

# 55. Form Builder Information Architecture

A recommended structure:

```text
Form Builder
│
├── General
│   ├── Title
│   ├── Description
│   └── Metadata
│
├── Questions
│   ├── Question list
│   ├── Add question
│   ├── Reorder
│   └── Edit question
│
├── Answer Key
│   ├── Question
│   ├── Correct answer
│   └── Score
│
├── Settings
│   ├── Required fields
│   ├── Target
│   └── Assessment type
│
├── Preview
│   └── Public renderer
│
└── Publish
    ├── Validation
    ├── Review
    └── Publish
```

---

# 56. Article and Form Integration

Articles and forms can work together as learning/assessment units.

Example:

```text
Article
│
├── Pre-Test
│
├── Educational Content
│
└── Post-Test
```

A form may also exist independently.

Therefore:

```text
Article → Form
```

is an optional relationship, not a mandatory one.

---

# 57. Collaboration Model

Collaboration should be explicit.

Example:

```text
Distribution
│
├── Primary Owner: Cadre A
│
└── Collaborators:
      ├── Cadre B
      └── Cadre C
```

Collaboration grants specific access to the distribution.

It should not automatically grant global access to:

* the cadre's account
* all articles
* all forms
* all responses
* all partnership data

---

# 58. Activity and Attribution Model

Activity should preserve the actor and resource context.

Conceptually:

```text
Activity
├── actorId
├── actorRole
├── partnershipId
├── activityType
├── resourceType
├── resourceId
└── timestamp
```

This allows activities to answer:

> Who did what, to which resource, and when?

Activities should be generated by meaningful domain events where practical rather than manually entered by users.

---

# 59. Metrics Calculation

Metrics should preferably be derived from source-of-truth data.

For example:

```text
Articles
      ↓
count published articles
      ↓
Cadre article metric
```

and:

```text
Responses
      ↓
group by distribution
      ↓
distribution owner
      ↓
cadre metric
```

Metrics should not be manually edited unless explicitly defined as configurable program metadata.

---

# 60. Public Metrics

Public-facing metrics must be explicitly selected for publication.

Internal metrics must not automatically become public.

For example:

```text
Internal:
- Individual respondent data
- Detailed response
- Private score
- Internal activity records

Public:
- Total cadres
- Total partnerships
- Public achievements
- Published article count
- Approved public program metrics
```

---

# 61. Dashboard Architecture

## Admin Dashboard

Admin dashboard provides platform-wide overview.

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
Gallery
Settings
```

---

## Partnership Dashboard

Partnership dashboard provides scoped monitoring.

Potential sections:

```text
Overview
Cadres
Articles
Forms / Distributions
Responses
Metrics
Activities
Profile
```

---

## Cadre Dashboard

Cadre dashboard focuses on personal contribution.

Potential sections:

```text
Overview
My Articles
My Forms / Distributions
Responses
Activities
Metrics
Profile
```

---

# 62. Dashboard Metrics

Dashboards should prioritize actionable metrics rather than displaying every available number.

Example cadre dashboard:

```text
Articles Published
Forms Distributed
Participants Reached
Responses Collected
Assessment Participation
Milestones
Recent Activities
```

Example partnership dashboard:

```text
Total Cadres
Active Cadres
Total Participants Reached
Articles Published
Forms Distributed
Responses
Assessment Results
Cadre Contributions
```

---

# 63. Admin CMS Workflow

The general CMS workflow is:

```text
Admin Login
     ↓
Dashboard
     ↓
Select CMS Module
     ↓
Create / Edit
     ↓
Validate
     ↓
Preview
     ↓
Publish
     ↓
Public Renderer
```

The CMS should avoid requiring code changes for ordinary content management.

---

# 64. Error and Validation Architecture

Validation should be centralized where possible.

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

Validation should not be duplicated independently across multiple UI components.

User-facing errors should be:

* understandable
* contextual
* actionable

---

# 65. Application State

Application state should be separated into:

### Server/Data State

* Firestore data
* Auth state
* Form records
* Responses
* Articles

### UI State

* Modal open/closed
* Selected question
* Filters
* Tabs
* Temporary form input

The application should avoid duplicating server state unnecessarily in global client state.

---

# 66. Component Architecture

Components should be organized by domain.

Preferred conceptual structure:

```text
components/
├── admin/
├── partnership/
├── cadre/
├── forms/
├── articles/
├── responses/
├── metrics/
├── public/
└── shared/
```

Shared components should contain reusable UI primitives rather than unrelated business logic.

---

# 67. Repository Architecture

Firestore access should be centralized.

Preferred:

```text
UI
 ↓
Service
 ↓
Repository
 ↓
Firestore
```

Example conceptual repositories:

```text
userRepository
partnershipRepository
cadreRepository
articleRepository
formRepository
distributionRepository
responseRepository
activityRepository
settingsRepository
```

The exact implementation may use different naming conventions.

The important requirement is that raw Firestore access should not be scattered throughout UI components.

---

# 68. Service Architecture

Services coordinate business operations.

Examples:

```text
formService
distributionService
articleService
responseService
scoringService
metricsService
partnershipService
cadreService
```

Services should handle workflows that involve multiple repositories or domain rules.

Example:

```text
Submit Response
    ↓
Validate response
    ↓
Resolve form version
    ↓
Resolve distribution
    ↓
Calculate score
    ↓
Persist response
    ↓
Generate activity
    ↓
Update/derive metrics
```

---

# 69. V1.5 Scope

The primary V1.5 scope is:

```text
Firebase Foundation
Authentication
RBAC
Admin CMS
Partnership Management
Cadre Management
Article Management
Official Forms
Form Builder
Answer Key Management
Form Versioning
Form Distribution
Distribution Attribution
Collaborators
Public Form Renderer
Responses
Existing Scoring Integration
Activities
Metrics
Dashboard Monitoring
Public CMS
Responsive UX
```

---

# 70. V1.5 Form Governance

V1.5 should prioritize centralized form governance.

The simplest operational model is:

```text
BPOM / Admin
      │
      ├── Create Official Form
      ├── Review
      ├── Approve
      └── Publish
              │
              ▼
        Official Form Library
              │
              ▼
        Cadre / Authorized User
              │
              ▼
        Use Official Form
              │
              ▼
          Distribution
```

This avoids unnecessary complexity during the initial implementation.

---

# 71. V2 Candidate Features

The following features should be considered future extensions rather than mandatory V1.5 requirements unless implementation remains simple.

## 71.1 Form Creation Request

```text
Cadre / Partnership
       ↓
Request New Form
       ↓
BPOM Review
       ↓
Approve / Reject
```

---

## 71.2 Advanced Partnership Hierarchy

For example:

```text
Kelurahan
   ↓
RW
   ↓
RT
   ↓
Participants
```

---

## 71.3 Advanced Student Identity Integration

Possible future integrations:

* School student database
* Student IDs
* School information systems
* External identity systems

V1.5 should not require these integrations.

---

## 71.4 Advanced Milestone Engine

Future milestones can become configurable:

```text
Metric Condition
      ↓
Milestone
      ↓
Achievement
      ↓
Badge / Recognition
```

---

## 71.5 Advanced Pre/Post Test Analytics

Future analytics may include:

```text
Pre-Test
   ↓
Learning Activity
   ↓
Post-Test
   ↓
Knowledge Gain
```

with more sophisticated statistical reporting.

---

# 72. V1.5 vs V2 Boundary

V1.5 prioritizes:

```text
Stable Core
+
Generic Partnership
+
Equal Cadres
+
Official Forms
+
Distribution
+
Attribution
+
Response
+
Scoring
+
Metrics
+
CMS
```

V2 prioritizes:

```text
Advanced Workflow
+
Decentralized Form Requests
+
Advanced Partnership Hierarchy
+
External Student Integration
+
Advanced Milestones
+
Advanced Analytics
+
Expanded Collaboration
```

The V1.5 architecture must leave room for these extensions but should not implement unnecessary complexity prematurely.

---

# 73. End-to-End Platform Flow

The complete intended V1.5 flow is:

```text
                    BPOM / ADMIN
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
       Partnership    Articles     Official Forms
             │                       │
             ▼                       │
          Cadres                      │
             │                        │
       ┌─────┴──────┐                 │
       │            │                 │
       ▼            ▼                 ▼
    Articles    Distribution ←── Use Official Form
                    │
             ┌──────┴───────┐
             │              │
       Primary Owner   Collaborators
             │              │
             └──────┬───────┘
                    │
                    ▼
            Public Link / Code
                    │
                    ▼
               RESPONDENTS
                    │
                    ▼
                 RESPONSE
                    │
             ┌──────┴──────┐
             ▼             ▼
          SCORING       ATTRIBUTION
             │             │
             └──────┬──────┘
                    ▼
                 METRICS
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
        Admin   Partnership  Cadre
       Metrics    Metrics    Metrics
```

---

# 74. Core Data Ownership Flow

The ownership chain should be understandable at every level:

```text
Partnership
    │
    └── Cadre
          │
          ├── Article
          │
          └── Distribution
                  │
                  ├── Primary Owner
                  ├── Collaborators
                  │
                  └── Responses
```

For official forms:

```text
BPOM / Admin
      │
      ▼
Official Form
      │
      ▼
Form Version
      │
      ▼
Distribution
      │
      ▼
Response
```

---

# 75. Source of Truth

The system must maintain clear sources of truth.

| Domain             | Source of Truth                                |
| ------------------ | ---------------------------------------------- |
| Authentication     | Firebase Authentication                        |
| User role/profile  | Application user records + authorization layer |
| Partnership        | Partnership records                            |
| Cadre              | Cadre/user records                             |
| Article            | Article records                                |
| Official Form      | Form records                                   |
| Form configuration | Form Version                                   |
| Answer Key         | Form Version / scoring configuration           |
| Distribution       | Distribution records                           |
| Response           | Response records                               |
| Score              | Persisted response scoring result              |
| Activity           | Activity/event records                         |
| Metrics            | Derived from domain data                       |
| CMS Settings       | Firestore settings                             |
| Media              | Cloud Storage + metadata                       |

---

# 76. Architectural Success Criteria

The V1.5 architecture is considered successful when:

1. Admin can manage the platform without code changes for ordinary CMS operations.
2. Partnerships can be represented generically.
3. Cadres can operate under a partnership without hierarchy.
4. Cadres can create and manage their own permitted content.
5. Official forms can be centrally controlled.
6. Official forms can be distributed by authorized users.
7. Distribution attribution is preserved.
8. Collaborators can participate without ownership being transferred.
9. Respondents can submit forms without requiring accounts.
10. Every response is associated with the correct form, version, and distribution.
11. Existing scoring behavior remains intact.
12. Scores are persisted with responses.
13. Analytics can identify questions through stable `questionId`.
14. Admin can monitor platform-wide metrics.
15. Partnerships can monitor their own cadre/program metrics.
16. Cadres can monitor their own contributions.
17. Public content is driven by CMS data.
18. Admin Preview and Public Renderer remain consistent.
19. Historical responses remain valid after form changes.
20. The system can support future partnership types without architectural rewrites.
21. Security boundaries are enforced server-side and through Firebase rules.
22. The application is usable on desktop and mobile.
23. The old Firebase project remains untouched.
24. V1.5 can evolve into a broader BPOM food-safety cadre platform without requiring a fundamental architectural rewrite.

---

# 77. Final Architectural Principle

The platform should be understood as:

```text
                 PLATFORM
                    │
        ┌───────────┴───────────┐
        │                       │
   MANAGEMENT                PROGRAM
        │                       │
        ▼                       ▼
   Partnerships              Cadres
        │                       │
        └───────────┬───────────┘
                    │
             CONTENT + FORMS
                    │
                    ▼
              DISTRIBUTION
                    │
                    ▼
               RESPONDENTS
                    │
                    ▼
              RESPONSES
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       SCORING             ATTRIBUTION
          │                   │
          └─────────┬─────────┘
                    ▼
                 METRICS
                    │
                    ▼
              EVALUATION
                    │
                    ▼
              CONTINUITY
```

The fundamental purpose of V1.5 is therefore not merely to provide a CMS or form builder.

It establishes a structured digital ecosystem in which:

```text
Partnership
    ↓
Cadre
    ↓
Content / Forms
    ↓
Distribution
    ↓
Community / Respondents
    ↓
Responses
    ↓
Scoring
    ↓
Metrics
    ↓
Program Evaluation
```

can be connected while maintaining ownership, attribution, security, historical integrity, and future scalability.
