# Multi-Agent AI Architecture

RazorRecover AI agents produce untrusted, structured recommendations. They do not execute financial actions.

## Registered agents

1. Detection Agent: finds payment failure, abandonment, subscription, and high-value signals.
2. Diagnosis Agent: explains likely causes from supplied evidence.
3. Recovery Agent: recommends only allowlisted recovery actions.
4. Risk Agent: produces scored assessments and advisory gate decisions.
5. Finance Agent: summarizes verified financial context without ledger writes.
6. Escalation Agent: identifies cases requiring human review.
7. Learning Agent: extracts bounded merchant-scoped observations after outcomes.
8. Merchant Copilot: answers questions with citations and safe navigation suggestions.
9. Agent Orchestrator: coordinates the workflow and enforces control stages.

Each definition in `definitions.ts` specifies responsibility, inputs, outputs, tools, permissions, context, memory access, failure behavior, safety limits, minimum confidence, prompt version, schema, and fallback.

## Control chain

The orchestrator never bypasses:

```text
Policy Engine -> Risk Gate -> Approval -> Deterministic Execution
```

Its returned execution state is always `BLOCKED`. Financial execution belongs to deterministic services only.

## Output safety

- Zod schemas validate every agent output server-side.
- Unknown agents and arbitrary command-shaped output are rejected.
- Low-confidence or failed agents use a safe fallback.
- Tools are allowlisted and permission-labelled.
- Context and memory are merchant-scoped.
- Prompt versions are recorded with every run.
- Structured run logging and evaluation metadata are emitted.
- No agent can call Razorpay, write the revenue ledger, alter policies, or approve its own action.

The orchestration API is `POST /api/agents/orchestrate`. This foundation uses a safe fallback runner until an approved model provider is connected.
