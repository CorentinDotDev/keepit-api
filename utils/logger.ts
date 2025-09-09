interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug'
} as const;

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    
    if (meta) {
      Object.assign(logEntry, { meta });
    }
    
    return isProduction ? JSON.stringify(logEntry) : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  error(message: string, error?: Error | any): void {
    const meta = error ? {
      stack: error.stack,
      name: error.name,
      message: error.message
    } : undefined;
    
    console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
  }

  info(message: string, meta?: any): void {
    if (!isProduction) {
      console.log(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (isDevelopment) {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  // Pour la compatibilité avec console.log existant
  log(message: string, meta?: any): void {
    this.info(message, meta);
  }
}

export const logger = new Logger();