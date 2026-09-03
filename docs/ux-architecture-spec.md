# RazorRecover AI – UX Architecture Specification

## 1. Design principles

This UX is designed for an enterprise fintech operating environment. It must feel premium, trustworthy, minimal, fast, and operationally clear.

Core UX principles:
- help users act decisively on revenue risk
- emphasize signal over noise
- keep AI recommendations explainable
- make policy and approval states visible
- separate demo, test, and production states clearly
- avoid decorative or fake AI interactions
- ensure every major action performs a real function
- prioritize data integrity and audit clarity

---

## 2. Product UX goals

The user experience should allow a merchant operations team to:
- identify revenue loss quickly
- understand the reason behind the loss
- determine which recovery options are safe
- simulate likely outcomes
- request approval when required
- execute only safe actions
- verify the effect in the ledger and on the payment flow

---

## 3. Sitemap

### Primary sitemap
- Landing Page
- Authentication
- Onboarding
- Command Center
  - Overview
  - Revenue Risk
  - Incidents
  - Recovery Opportunities
  - Revenue War Room
- Recovery Center
  - Active recovery queue
  - Recovery detail
  - Strategy simulation
  - Approval workflows
- Customers
  - Customer profile
  - Customer Recovery DNA
- AI Copilot
  - Conversation workspace
  - Incident analysis
  - Recommendation panel
- Forecast
- Analytics
- Experiments
- Human Review
- Audit Ledger
- Policies
- AI Memory
- Integrations
- Developer Mode
  - Webhook inspection
  - Event replay simulation
  - Test mode diagnostics
- Notifications
- Settings
- Security

### Information hierarchy
- Top-level operational surfaces: Command Center, Recovery Center, Customers, AI Copilot, Forecast, Analytics, Incidents, War Room
- Admin and governance surfaces: Policies, Audit Ledger, Security, Settings, Integrations
- Engineering and diagnostics surfaces: Developer Mode, Webhook inspection, Event replay

---

## 4. Navigation architecture

### Global navigation
- Brand / product name
- Search / global lookup
- Notifications
- Context indicator (Demo / Test / Production)
- Quick actions
  - Open Recovery Queue
  - Review pending approvals
  - Inspect incidents
  - Open AI Copilot
  - View revenue ledger
- User profile / logout

### Left navigation (desktop)
- Command Center
- Revenue Risk
- Recovery Center
- Customers
- Incidents
- AI Copilot
- Forecast
- Analytics
- Experiments
- Human Review
- Audit Ledger
- Policies
- Integrations
- Developer Mode
- Settings

### Mobile navigation
- Bottom navigation with 4-5 core destinations
  - Home
  - Risk
  - Recovery
  - Incidents
  - More
- Secondary drawer for governance and admin functions

### Navigation behavior rules
- Users must never be more than 2 clicks away from a high-priority risk or open approval
- All major screens must show mode status and security context
- High-risk flows display immediate approval or block indicators
- Recovery actions should be visible but gated until policy and approval state allow them

---

## 5. Desktop information architecture

### Desktop shell
- Header bar with notifications, mode status, search, actions, profile
- Left rail for workspaces and operational modules
- Main content area with contextual panels
- Right rail for decision support where applicable
  - cases under review
  - AI explanation panel
  - policy result panel
  - approval summary

### Desktop layout patterns
#### 1. Command Center dashboard
- Top summary cards
  - Revenue at risk
  - Revenue rescued
  - Recovery rate
  - Payment success rate
  - Active incidents
- Risk table
- Opportunity list
- Incident stream
- Approval queue

#### 2. Recovery Center page
- Left: queue and filters
- Center: selected case detail
- Right: simulation, policy, and approval panel

#### 3. Human Review page
- Task list on left
- Details on center
- Decision controls on right

#### 4. AI Copilot surface
- Prompt composer at top
- Recommendation summary panel
- Evidence panel
- Visualized risk context
- Actionable next steps

### Desktop UX requirements
- High-density operational views for experts
- Strong prioritization and filtering
- Clear multi-column decision surfaces
- Maintain readable hierarchy without clutter

---

## 6. Mobile information architecture

### Mobile pattern
- Simplified dashboard with top triage cards
- Single-column flows for issue assessment and review
- Anchor actions to bottom or floating CTAs for approval and recovery actions
- Keep the core loop visible: risk → policy → action → verification

### Mobile modules
- Home: prioritized issue summary
- Risk: list of current payment-risk events
- Recovery: open opportunity list and action summary
- Incidents: live issue feed
- More: settings, approvals, audit, integrations

### Mobile UX requirements
- Immediate identification of critical problems
- One-hand operation for approval and review actions
- Clean hierarchy and minimal steps for decision making
- Security states visible without requiring deep navigation

---

## 7. Onboarding flow

### Purpose
Guide merchant and team users into the platform with clear context and setup requirements.

### User
- Merchant admin
- Finance lead
- Operations manager
- Developer / integrator

### Entry point
- First-time sign-in
- Invitation link
- Workspace creation flow

### Main actions
- Create merchant workspace
- Choose operating mode: Demo / Test / Production
- Connect payment environment
- Configure risk policies
- Set approval thresholds
- Invite stakeholders
- Review security settings
- Complete onboarding checklist

### Data required
- Merchant name and business profile
- Payment environment selection
- Team members and roles
- Risk tolerance and approval thresholds
- Integration preferences

### Success state
- Workspace is ready
- Merchant dashboard loads with clear baseline data and safety settings

### Error state
- Invalid environment selection
- Missing required integration config
- Missing approval configuration
- Permission mismatch

### Empty state
- No merchants configured yet
- No users or workflows connected
- No risk policies created

### Loading state
- Setup wizard steps with progress indicator
- Validation of environment and credentials

### Permission requirements
- Merchant admin access required for onboarding
- Integration settings require admin or developer role

---

## 8. Failed-payment recovery flow

### Purpose
Handle a failed payment or revenue-threatening transaction through diagnosis, safe strategy selection, and controlled execution.

### User
- Revenue analyst
- Merchant operator
- Risk manager

### Entry point
- Revenue Risk list
- Command Center alert
- Recovery Opportunities queue
- Incident card

### Main actions
- View failed transaction summary
- Inspect payment event details
- Review the failure reason and risk diagnosis
- Select or simulate recovery strategy
- Check policy eligibility
- Escalate or approve
- Execute safe recovery action in Demo/Test mode
- Verify result in ledger

### Data required
- Transaction ID
- payment status and error code
- customer profile
- risk metrics
- available recovery strategies
- policy result
- approval state
- ledger and webhook context

### Success state
- Recovery strategy is accepted and executed
- Payment status is updated or a recovery action is recorded
- Financial value outcome is visible in ledger

### Error state
- Payment event is malformed
- Recovery is blocked by policy
- Approval missing for high-risk case
- Execution fails or is duplicate

### Empty state
- No failed payment opportunities for selected merchant or timeframe

### Loading state
- Payment lookup and diagnosis in progress
- Strategy generation and simulation state

### Permission requirements
- Analyst can review and simulate
- Approver needed for high-risk actions
- Developer role required for test webhook or integration inspection

---

## 9. Revenue incident flow

### Purpose
Provide a coordinated response to a major revenue-impacting incident.

### User
- Merchant operator
- Incident commander
- Finance manager
- Risk manager

### Entry point
- Incident alert banner
- Command Center incident panel
- Linked revenue alert

### Main actions
- Open incident timeline
- Assess blast radius
- View impacted customers / transactions
- Review proposed actions
- Assign owner
- Escalate to war room
- Approve and execute safe recovery plan

### Data required
- Incident type and severity
- impacted merchants / customers
- revenue at risk
- affected payment channels
- team ownership
- evidence trail

### Success state
- Incident is triaged
- Recovery actions are underway or approved
- Operational owners are assigned

### Error state
- Incident is unresolved due to missing data
- Insufficient permissions to act
- Signature mismatch or invalid event source

### Empty state
- No active incidents

### Loading state
- Event aggregation and deduplication in progress
- Incident correlation analysis loading

### Permission requirements
- Read access for operations teams
- Write and escalation access for incident owners
- Approval access for risk manager or finance lead

---

## 10. Human-review flow

### Purpose
Ensure high-risk or policy-sensitive decisions receive explicit human oversight.

### User
- Risk manager
- Finance lead
- Operations approver

### Entry point
- Approval queue
- Risk gate escalation
- Recovery detail page

### Main actions
- Review reason, impact, and policy result
- Confirm or reject action
- Add approver note
- Request more information
- Escalate to senior approver

### Data required
- Recovery action summary
- Policy outcome
- Risk score and confidence
- Customer context
- Financial impact estimate
- User identity and approval history

### Success state
- Approved action is marked as authorized
- Execution proceeds only after approval metadata is stored

### Error state
- Approver lacks permissions
- Approval request expired or invalid
- Action no longer matches current state

### Empty state
- No pending approval tasks

### Loading state
- Approval request state is refreshing
- Decision payload is validating

### Permission requirements
- Approver role required
- Manager or finance role for exception approvals

---

## 11. AI Copilot flow

### Purpose
Provide a merchant-facing AI assistant that summarizes risk, explains recovery reasons, and recommends next steps without directly executing money movement.

### User
- Merchant operator
- Revenue analyst
- Risk manager

### Entry point
- Command Center
- Recovery detail
a
- AI Copilot dock

### Main actions
- Ask a question about a failed payment or revenue risk
- Request diagnosis summary
- Ask for recovery strategy options
- Review evidence and policy state
- Accept or reject AI suggestion

### Data required
- Transaction or customer context
- Risk evidence
- Recovery opportunity metadata
- Policy view
- Product mode

### Success state
- Clear AI recommendation with explanation and confidence
- Recommendation is accepted into a workflow or converted to a policy-aware action plan

### Error state
- AI output fails validation
- Missing required context
- Model provider unavailable

### Empty state
- No active session or no context selected

### Loading state
- Context gathering and model response in progress

### Permission requirements
- General user access to AI Copilot for relevant data
- Enhanced access for analysts and managers
- No direct access to secrets or financial execution actions

---

## 12. Recovery simulation flow

### Purpose
Estimate the likely impact and safety of one or more recovery strategies before approval and execution.

### User
- Revenue analyst
- Risk manager
- Merchant operator

### Entry point
- Recovery opportunity detail
- Strategy proposal panel
- AI Copilot recovery suggestion

### Main actions
- Select strategy options
- Configure parameters and assumptions
- Run simulation
- Compare success probability and revenue impact
- Review blocked/allowed status
- Save recommended strategy

### Data required
- Customer and transaction context
- Candidate action options
- Historical performance data
- Policy and risk context
- Estimated value range

### Success state
- A clear recommendation is generated with expected value and risk tradeoff

### Error state
- Simulation fails because required data is missing
- Strategy is blocked by policy
- Output cannot be validated

### Empty state
- No recovery strategies available yet

### Loading state
- Strategy evaluation and scoring in progress

### Permission requirements
- Analyst or operator access to simulate
- Manager to approve final strategy if risk thresholds are exceeded

---

## 13. Autopilot flow

### Purpose
Allow a trusted, fully deterministic automation path for safe, low-risk recovery actions that satisfy policy and approval requirements.

### User
- Merchant operator
- Revenue operations lead

### Entry point
- Recovery Center
- Policy-approved opportunity card
- Autopilot configuration page

### Main actions
- Enable or disable autopilot for a merchant, segment, or scenario
- Review system-managed actions
- Approve autopilot-assigned actions for low-risk cases
- Stop or pause autopilot

### Data required
- Merchant configuration
- Policy thresholds
- Risk score ranges
- Approval mode
- Self-service action permissions

### Success state
- Low-risk actions are automatically processed according to policy

### Error state
- Threshold exceeds rule and autopilot blocks execution
- Non-deterministic state or invalid policy version

### Empty state
- No configured autopilot rules

### Loading state
- Policy evaluation and automation engine checks

### Permission requirements
- Merchant admin or operations admin role
- Risk and policy review for changes to automation settings

---

## 14. Kill-switch flow

### Purpose
Safely halt automated or semi-automated recovery actions when risk, policy, or operational conditions require emergency control.

### User
- Security admin
- Merchant admin
- Risk manager

### Entry point
- Security page
- Risk settings page
- Incident command panel

### Main actions
- Pause all recovery execution
- Pause specific merchant operations
- Pause a policy class or risk threshold
- Resume only after validation

### Data required
- Merchant identity
- Current execution status
- policy impact
- active incidents
- user authorization

### Success state
- Recovery operations are stopped safely with a visible status state

### Error state
- Kill switch action cannot be authorized
- User lacks required permission
- Existing execution cannot be interrupted cleanly

### Empty state
- No kill-switch actions currently active

### Loading state
- System is applying suspension to services and policies

### Permission requirements
- Security or merchant admin role required
- Escalation to higher-level security for emergency shutdown

---

## 15. Developer event inspection flow

### Purpose
Allow developers and integrations engineers to validate events, signatures, deduplication, and operational behavior in a safe environment.

### User
- Developer
- Integrations engineer
- QA engineer

### Entry point
- Developer Mode
- Webhook inspection tab
- Test environment diagnostics

### Main actions
- Inspect event payload
- Verify signature status
- Review deduplication result
- Replay event payload
- View webhook state transitions
- Validate demo/test mode behavior

### Data required
- Event payload
- Event ID and timestamp
- webhook signature
- mode label
- event type
- deduplication result

### Success state
- Event status is confirmed as valid, duplicated, rejected, or replayed safely

### Error state
- Signature mismatch
- Missing required fields
- Invalid mode context

### Empty state
- No event records loaded yet

### Loading state
- Event validation and signature processing in progress

### Permission requirements
- Developer or admin access required
- Restricted to environment-specific access

---

## 16. Core recovery flow specification

### Core flow
Payment Failed
→ Detection
→ Diagnosis
→ Strategy
→ Policy
→ Risk
→ Approval
→ Execution
→ Razorpay
→ Webhook
→ Verification
→ Revenue Ledger

### UX responsibilities at each stage
#### 1. Payment Failed
- Show a clear alert with payment status and value-at-risk
- Provide immediate context for merchant and finance users

#### 2. Detection
- Highlight the transaction in the risk feed or dashboard
- Show reason and severity classification

#### 3. Diagnosis
- Explain why the payment failed or why revenue is at risk
- Show supporting evidence and customer signal context

#### 4. Strategy
- List recommended recovery options with estimated impact
- Allow simulation before final selection

#### 5. Policy
- Display whether the strategy is allowed, blocked, or escalated
- Show the rule results behind the decision

#### 6. Risk
- Display the business and operational risk score
- Explain if the action requires approval or is blocked

#### 7. Approval
- Provide a review page for high-risk or out-of-policy cases
- Capture approver identity and rationale

#### 8. Execution
- Run only approved, deterministic backend actions in Demo/Test mode
- Show status, time, and outcome

#### 9. Razorpay
- Display secure external payment-system status
- Keep secrets hidden and outside the client UI

#### 10. Webhook
- Validate event payload and deduplication state
- Surface result clearly for developers and ops teams

#### 11. Verification
- Show whether the recovery action resulted in revenue restored or the event failed
- Include final transaction status and any retries

#### 12. Revenue Ledger
- Show the financial delta and audit linkage
- Keep records immutable and traceable

---

## 17. Screen specification template

Each UI screen should follow the same structure:

### Purpose
What the page is intended to accomplish.

### User
Who uses this page and why.

### Entry point
How the page is reached from the product navigation or other screens.

### Main actions
The core tasks the user can perform.

### Data required
The minimum data required to render and operate the screen.

### Success state
The state after the core workflow has worked as intended.

### Error state
What happens when the workflow fails or data is invalid.

### Empty state
How the screen looks with no data.

### Loading state
How the screen behaves while data or decisions are being prepared.

### Permission requirements
Which roles can access the screen and which actions are allowed.

---

## 18. UX guardrails for enterprise fintech

- Show mode indicators clearly: Demo, Test, Production
- Never show secret keys or internal credentials in the browser
- Show AI explanations as part of the decision, not as black-box output
- Keep risk and approval state visible at all times
- Require explicit approval for exceptions and high-risk actions
- Keep users focused on revenue outcomes, not decorative AI visuals
- Design the reviewer experience with clarity, confidence, and traceability
- Ensure search, filter, and drill-down are fast and reliable

---

## 19. Implementation guidance for the next UI phase

The next UI implementation phase should start with these screens in priority order:
1. Command Center
2. Revenue Risk
3. Recovery Opportunity detail
4. Recovery simulation panel
5. Approval review screen
6. Audit ledger
7. AI Copilot panel
8. Incident detail
9. Revenue War Room
10. Developer webhook inspector

This order prioritizes operational value, policy safety, and the core revenue recovery cycle before broader experience polish.
