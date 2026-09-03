import type { AgentTool } from './types';

export const allowedAgentTools: AgentTool[] = [
  {
    name: 'read_payment_attempts',
    description: 'Read merchant-scoped payment attempt evidence.',
    permission: 'payments:read',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_customers',
    description: 'Read merchant-scoped customer context.',
    permission: 'customers:read',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_opportunities',
    description: 'Read merchant-scoped recovery opportunities.',
    permission: 'recovery:recommend',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_risk_assessments',
    description: 'Read deterministic risk assessments.',
    permission: 'risk:read',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_policies',
    description: 'Read policy configuration for context only.',
    permission: 'policy:read',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_ledger',
    description: 'Read verified financial ledger data.',
    permission: 'finance:read',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_payments',
    description: 'Read payment records without mutation.',
    permission: 'finance:read',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_audit_logs',
    description: 'Read merchant audit evidence.',
    permission: 'audit:write',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'read_dashboard',
    description: 'Read dashboard summaries.',
    permission: 'payments:read',
    execute: async (context) => ({ merchantId: context.merchantId, items: [] }),
  },
  {
    name: 'write_merchant_memory',
    description: 'Write bounded merchant-scoped learning observations.',
    permission: 'memory:write',
    execute: async (context) => ({ merchantId: context.merchantId, status: 'accepted' }),
  },
  {
    name: 'run_allowed_agent',
    description: 'Run a registered agent with schema validation.',
    permission: 'policy:read',
    execute: async (_context, input) => ({ agent: input }),
  },
];

export function getAllowedTool(name: string): AgentTool | undefined {
  return allowedAgentTools.find((tool) => tool.name === name);
}
