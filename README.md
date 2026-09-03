# RazorRecover AI

RazorRecover AI is an AI-native revenue recovery operating system for merchants that helps detect at-risk revenue, diagnose failure patterns, recommend and safely simulate recovery actions, and verify outcomes using deterministic execution and auditable controls.

## Safety and execution model

This project follows a strict financial control pattern:

AI Recommendation -> Policy Engine -> Risk Gate -> Human Approval when required -> Deterministic Execution Service -> Razorpay -> Webhook -> Verification -> Revenue Ledger -> Learning

Important constraints:

- The LLM never directly executes money movement.
- Razorpay secrets remain server-side only.
- All AI responses are validated server-side.
- Recovery actions use idempotent execution.
- Payment and webhook handling must verify signatures and deduplicate events.
- Demo data must never be confused with real or test payment data.

## Repository status

This repository is currently initialized as a clean project foundation for a new implementation. Product features will be added incrementally in future prompts.

## Project structure

- frontend/
- backend/
- database/
- agents/
- ai-prompts/
- policies/
- razorpay/
- webhooks/
- auth/
- authorization/
- analytics/
- experiments/
- tests/
- docs/
- deployment/
- infrastructure/
- config/
- demo-data/

## Immediate next steps

1. Establish the canonical runtime stack.
2. Define the schema and security model.
3. Build the core policy engine and risk gate.
4. Add the Razorpay integration layer in test mode only.
5. Implement the demo data mode and UI content boundaries.
6. Validate with smoke tests before production-oriented features.

## Notes

- This is not a production deployment yet.
- No financial, payment, or customer data is included in the repo.
- Future work must maintain the separation between demo, Razorpay test mode, and future production mode.
