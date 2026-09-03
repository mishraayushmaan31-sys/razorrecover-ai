import { serverEnv } from '@/env';

type LogContext = Record<string, string | number | boolean | undefined>;

function write(level: string, message: string, context?: LogContext): void {
  const entry = JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  });

  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    serverEnv.LOG_LEVEL === 'debug' && write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
