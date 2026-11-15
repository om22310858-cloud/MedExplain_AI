export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    let errorDetails = '';
    if (error instanceof Error) {
      errorDetails = `\n  Error: ${error.message}\n  Stack: ${error.stack}`;
    } else if (error) {
      errorDetails = `\n  Details: ${JSON.stringify(error)}`;
    }
    console.error(`[${timestamp}] [ERROR] ${message}${errorDetails}`);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
};
