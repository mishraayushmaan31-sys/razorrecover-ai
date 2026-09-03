import path from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    resolve: {
      alias: {
        '@/database': path.resolve(__dirname, 'database'),
        '@/auth': path.resolve(__dirname, 'auth'),
        '@/authorization': path.resolve(__dirname, 'authorization'),
        '@/demo-data': path.resolve(__dirname, 'demo-data'),
        '@/razorpay': path.resolve(__dirname, 'razorpay'),
        '@/webhooks': path.resolve(__dirname, 'webhooks'),
        '@/risk-engine': path.resolve(__dirname, 'risk-engine'),
        '@/recovery-engine': path.resolve(__dirname, 'recovery-engine'),
        '@/agents': path.resolve(__dirname, 'agents'),
        '@/policies': path.resolve(__dirname, 'policies'),
        '@/human-review': path.resolve(__dirname, 'human-review'),
        '@': path.resolve(__dirname, 'src'),
      },
    },
    test: {
      environment: 'node',
    },
  };
});
