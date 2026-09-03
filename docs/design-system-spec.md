# RazorRecover AI – Design System Specification

## 1. Design language

The product should feel premium, intelligent, trustworthy, enterprise-grade, minimal, and operationally precise.

### Design intent

- premium without ostentation
- intelligent without gimmick
- trust-first in every decision surface
- minimal layout with strong signal hierarchy
- enterprise clarity for high-risk operations
- no fake AI visual noise or decorative motion

### Visual priorities

1. Revenue Rescued
2. Revenue at Risk
3. Critical Alerts
4. Approvals
5. AI Recommendations
6. Incidents
7. Kill Switch

---

## 2. Core visual system

### 2.1 Color system

#### Brand palette

- Navy 950: #0B1220
- Navy 900: #101B2C
- Slate 800: #1E2A3A
- Slate 700: #2A3A4E
- Slate 600: #42526A
- Slate 500: #5D6C82
- Slate 300: #A7B4C5

#### Accent palette

- Brand teal: #12B5A5
- Brand teal dark: #0E8E88
- Brand cyan: #3BA9FF
- Brand violet: #7C6AE6

#### Success palette

- Success 700: #1B8E63
- Success 100: #E8F8F1

#### Warning palette

- Warning 700: #C57A00
- Warning 100: #FFF3D9

#### Danger palette

- Danger 700: #C73A3A
- Danger 100: #FDE9E9

#### Critical palette

- Critical 900: #7A1F1F
- Critical 700: #C73A3A
- Critical 100: #FDE5E5

#### Neutral palette

- White: #FFFFFF
- Gray 50: #F7F9FC
- Gray 100: #EEF2F7
- Gray 200: #E3E8EF
- Gray 300: #D7DFEA
- Gray 400: #B4C1CF

#### Semantic usage

- background surfaces: Gray 50 / White
- primary navigation: Navy 950
- data surfaces: White / Gray 50
- primary actions: Brand teal / Navy 900
- AI accent: Brand cyan / violet
- risk state: Danger / Warning / Success
- financial summary: Slate 900 / White with understated contrast

### 2.2 Typography

#### Font families

- Primary: Inter, ui-sans-serif, system-ui, sans-serif
- Mono: JetBrains Mono, SFMono-Regular, monospace

#### Type scale

- Display: 40 / 48, semibold
- H1: 32 / 40, semibold
- H2: 24 / 32, semibold
- H3: 20 / 28, semibold
- H4: 16 / 24, semibold
- Body L: 16 / 24, regular
- Body M: 14 / 20, regular
- Body S: 12 / 16, regular
- Label: 12 / 16, medium, uppercase tracking 0.08em where needed

#### Weight system

- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

#### Usage direction

- dashboards: concise microcopy, dense but readable
- risk and approval flows: strong hierarchy and concise labels
- AI recommendation summaries: plain, reasoned, trusted language

### 2.3 Spacing scale

Use an 8px spacing rhythm.

- 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

### 2.4 Grid

- 12-column desktop grid
- 4-column mobile grid
- gutters: 24px desktop, 16px tablet, 12px mobile
- max content width: 1440px

### 2.5 Border radius

- xs: 6px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px
- pill: 999px

### 2.6 Shadows

Use low-contrast utility shadows; avoid heavy gradients.

- xs: 0 1px 2px rgba(11,18,32,0.04)
- sm: 0 4px 12px rgba(11,18,32,0.08)
- md: 0 8px 24px rgba(11,18,32,0.12)
- lg: 0 16px 36px rgba(11,18,32,0.16)

---

## 3. Core components

### 3.1 Icons

- Use a consistent outline icon style
- Prefer a minimal fintech set:
  - shield
  - alert triangle
  - check circle
  - dollar
  - arrow up/down
  - clock
  - brain
  - lightning
  - lock
  - eye
  - webhook
  - user
  - bell
  - funnel
  - search
  - filter
  - settings
  - play
  - pause
  - stop
- Icons must be functional, not decorative

### 3.2 Buttons

#### Button variants

- Primary: solid teal / navy
- Secondary: neutral surface with border
- Tertiary: text action
- Destructive: danger state
- Ghost: subtle action without emphasis
- Confirmation: approve state
- Pause / kill switch: high-visibility danger or neutral emergency mode

#### Button sizes

- sm: 32px height
- md: 40px height
- lg: 48px height

#### Button states

- default
- hover
- active
- disabled
- focus-visible
- loading

#### Accessibility rules

- minimum 44x44px touch target on mobile
- explicit focus ring and contrast compliance

### 3.3 Inputs

- default neutral background
- border 1px solid Gray 300
- radius md
- labels above field
- helper text and error text clearly separated
- focus ring using accent blue / teal

### 3.4 Selects

- same styling as inputs
- clear dropdown chevron
- default option state and disabled option state
- support keyboard navigation and screen-reader labels

### 3.5 Tables

- dense but readable
- sticky headers where needed
- row hover with low contrast
- strong column alignment for financial values
- status badges integrated in cells
- support sorting

### 3.6 Cards

- white background
- border 1px solid Gray 200
- radius lg
- subtle shadow xs
- header and action area clear
- consistent spacing and section hierarchy

### 3.7 Charts

- use minimal, high-contrast lines and bars
- avoid excessive color mixing
- charting palette: teal, cyan, navy, slate, danger, warning
- use labels and tooltips for clarity
- all financial data must be legible and not visually overloaded

### 3.8 Modals

- max width based on task complexity
- clear title, subtext, and action stack
- destructive actions separated visually from safe actions
- focus trap and keyboard support

### 3.9 Drawers

- used for details and review flows
- slide-in from right on desktop; bottom sheet on mobile
- preserve context and show sticky footer actions

### 3.10 Alerts

- informational: blue or neutral
- warning: amber
- danger: red
- success: green
- should be concise with one primary action when needed

### 3.11 Toasts

- position top-right on desktop, bottom-center on mobile
- short-lived, low-noise, action-oriented
- status color-coded

### 3.12 Status indicators

- dot + text for state e.g. Healthy, Risk, Approved, Blocked, Escalated
- use consistent semantics across all widgets

---

## 4. Fintech-specific visualization types

### 4.1 AI components

- AI recommendation cards with a subtle intelligence accent
- show evidence, rationale, and confidence
- include policy and safety tag
- avoid “magic AI” aesthetics

### 4.2 Risk indicators

- risk meter with severity labeling: Low, Medium, High, Critical
- numeric risk score with clear thresholds
- use specific finance-safe semantics: blocked, escalated, approved

### 4.3 Financial metrics

- currency values align right
- legends use muted labels and strong value emphasis
- KPIs must have a clear label, delta, and timestamp

### 4.4 Timeline components

- horizontal or vertical event lists
- support incident timelines, action progression, and audit events
- colors match status semantics

### 4.5 Approval components

- approval panel with summary and rationale
- show risk score, policy result, impact estimate
- require approver note and one-click decision

### 4.6 Agent activity components

- show AI or system action logs with small icons and timestamps
- keep entries short and explainable
- include source, confidence, and status

### 4.7 Incident components

- high-visibility incident cards
- severity-stamped labels
- attached recovery actions or owners
- operational status clearly label-driven

### 4.8 Mobile components

- compact cards and stackable forms
- sticky action bar for approval or recovery operations
- bottom-sheet drawers for detail inspection

---

## 5. Visual hierarchy for enterprise priorities

### Revenue Rescued

- strongest summary KPI style
- green accent with clear label and delta
- positioned at top of operational pages

### Revenue at Risk

- large neutral or warning metric
- immediate visibility with risk banding
- segmented by merchant, account, or channel

### Critical Alerts

- red or warning banners with minimal text and clear CTA
- always visible at the top of the relevant context

### Approvals

- visually distinct approval queue block with strong action controls
- show required actions and approver states

### AI Recommendations

- subtle intelligence accent but always explainable and evidence-backed
- summary and rationale should be clear without requiring expert interpretation

### Incidents

- severity-coded cards with ownership and status
- timeline integration for operational triage

### Kill Switch

- maximum clarity, high-contrast control component
- explicit confirmation pattern and controlled emergency semantics

---

## 6. Accessibility states

### Core requirements

- all text contrast meets WCAG AA / AAA where feasible
- focus ring visible on interactive controls
- forms include labels and helper/error text
- keyboard navigation works for all flows
- status color must not be the only signal; include text and icons
- modals and drawers must trap focus and restore focus on close
- reduce motion for users with motion sensitivity
- maintain readable spacing and proportions on small screens

### Emergency / kill switch accessibility

- clear labels and confirmation steps
- no ambiguous action labels
- explicit secondary confirmation required

---

## 7. Design tokens

### Primitive tokens

- color tokens as above
- spacing tokens as above
- radius tokens as above
- shadow tokens as above
- font sizes and weights as above

### Semantic tokens

- bg.canvas
- bg.surface
- bg.subtle
- border.default
- text.primary
- text.secondary
- text.muted
- success.foreground
- warning.foreground
- danger.foreground
- critical.foreground
- brand.primary
- brand.accent
- ai.accent
- approval.pending
- approval.approved
- approval.rejected
- danger.strong

---

## 8. UI component foundation to build

The implementation phase should create reusable UI primitives in a design system package.

### Required foundation components

- AppShell
- TopNav
- SidebarNav
- PageHeader
- MetricCard
- KPITrend
- SectionHeader
- DataTable
- DataRow
- FilterBar
- SearchInput
- MetricBadge
- StatusBadge
- AlertBanner
- InfoCard
- EmptyState
- LoadingState
- Button
- Input
- Select
- Checkbox
- RadioGroup
- Textarea
- Modal
- Drawer
- Sheet
- Toast
- Tooltip
- Tabs
- Breadcrumbs
- Timeline
- ApprovalCard
- AIRecommendationCard
- RiskBadge
- IncidentCard
- AgentActivityFeed
- KillSwitchPanel
- ModeIndicator

---

## 9. Production-quality expectations

Components should be:

- reusable across modules
- responsive across desktop and mobile
- accessible and keyboard-operable
- minimal but expressive
- easy to compose into dashboards and review flows
- free of fake or decorative behavior
- aligned to enterprise fintech operations and finance safety requirements

No excessive gradients. No unnecessary motion. No decorative AI “sparkles.” Use precision, trust, and clarity instead.
