import { z } from 'zod';

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['demo', 'test', 'production']).default('demo'),
  DATABASE_URL: z
    .string()
    .url()
    .startsWith('postgresql://')
    .default('postgresql://placeholder:placeholder@localhost:5432/razorrecover'),
  SESSION_SECRET: z
    .string()
    .min(32)
    .default('default_session_secret_for_build_time_min_32_chars_long'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  RAZORPAY_MODE: z.enum(['test', 'production']).default('test'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(8_000),
  RAZORPAY_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(2),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('RazorRecover AI'),
});

export const serverEnv = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  APP_ENV: process.env.APP_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  LOG_LEVEL: process.env.LOG_LEVEL,
  RAZORPAY_MODE: process.env.RAZORPAY_MODE,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  RAZORPAY_TIMEOUT_MS: process.env.RAZORPAY_TIMEOUT_MS,
  RAZORPAY_MAX_RETRIES: process.env.RAZORPAY_MAX_RETRIES,
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
