/**
 * Structured Logger for ERU Cinema
 * Provides consistent logging with levels, context, and correlation IDs
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] ?? LOG_LEVELS.INFO
  : LOG_LEVELS.INFO;

class Logger {
  constructor(context = 'app') {
    this.context = context;
    this.correlationId = null;
  }

  setCorrelationId(id) {
    this.correlationId = id;
    return this;
  }

  child(context) {
    const child = new Logger(`${this.context}:${context}`);
    child.correlationId = this.correlationId;
    return child;
  }

  _log(level, message, meta = {}) {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      correlationId: this.correlationId,
      message,
      ...meta,
    };

    // Pretty print in development
    if (process.env.NODE_ENV === 'development') {
      const color = level === 'ERROR' ? '\x1b[31m' :
                    level === 'WARN' ? '\x1b[33m' :
                    level === 'INFO' ? '\x1b[36m' : '\x1b[90m';
      const reset = '\x1b[0m';
      console[level === 'DEBUG' ? 'log' : level.toLowerCase()](
        `${color}[${entry.timestamp}]${reset} ${entry.context}${entry.correlationId ? ` [${entry.correlationId}]` : ''}: ${message}`,
        Object.keys(meta).length ? meta : ''
      );
    } else {
      // JSON output for production
      console.log(JSON.stringify(entry));
    }
  }

  debug(message, meta) { this._log('DEBUG', message, meta); }
  info(message, meta) { this._log('INFO', message, meta); }
  warn(message, meta) { this._log('WARN', message, meta); }
  error(message, meta) { this._log('ERROR', message, meta); }
}

// Main logger instance
export const logger = new Logger('eru');

// IPC logger (for main process)
export const ipcLogger = logger.child('ipc');

// TMDB logger
export const tmdbLogger = logger.child('tmdb');

// Vidy logger
export const vidyLogger = logger.child('vidy');

// Window logger
export const windowLogger = logger.child('window');

export default logger;