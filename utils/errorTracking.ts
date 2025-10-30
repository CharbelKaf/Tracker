/**
 * Error tracking and logging utility
 * Centralized error management for the application
 */

interface ErrorContext {
  [key: string]: any;
}

interface ErrorLog {
  timestamp: Date;
  message: string;
  stack?: string;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// In-memory error log (can be replaced with external service like Sentry)
const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 100;

/**
 * Log an error with context
 */
export function logError(
  error: Error,
  context?: ErrorContext,
  severity: ErrorLog['severity'] = 'medium'
): void {
  const errorLog: ErrorLog = {
    timestamp: new Date(),
    message: error.message,
    stack: error.stack,
    context,
    severity,
  };

  // Add to in-memory log
  errorLogs.push(errorLog);
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.shift(); // Remove oldest log
  }

  // Console log with color coding
  const consoleMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  console[consoleMethod]('[Error Tracking]', {
    message: error.message,
    severity,
    context,
    timestamp: errorLog.timestamp.toISOString(),
  });

  // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
  // Example:
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     level: severity,
  //     extra: context,
  //   });
  // }

  // Store in localStorage for debugging (last 10 errors)
  try {
    const recentErrors = getRecentErrors();
    recentErrors.push({
      ...errorLog,
      timestamp: errorLog.timestamp.toISOString(),
    });
    if (recentErrors.length > 10) {
      recentErrors.shift();
    }
    localStorage.setItem('neemba_recent_errors', JSON.stringify(recentErrors));
  } catch (e) {
    console.warn('Failed to store error in localStorage:', e);
  }
}

/**
 * Get recent errors from memory
 */
export function getErrorLogs(): ReadonlyArray<ErrorLog> {
  return [...errorLogs];
}

/**
 * Get recent errors from localStorage
 */
export function getRecentErrors(): any[] {
  try {
    const stored = localStorage.getItem('neemba_recent_errors');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Clear error logs
 */
export function clearErrorLogs(): void {
  errorLogs.length = 0;
  try {
    localStorage.removeItem('neemba_recent_errors');
  } catch (e) {
    console.warn('Failed to clear errors from localStorage:', e);
  }
}

/**
 * Log a custom message (for non-Error objects)
 */
export function logMessage(
  message: string,
  context?: ErrorContext,
  severity: ErrorLog['severity'] = 'low'
): void {
  const error = new Error(message);
  logError(error, context, severity);
}

/**
 * Create a wrapped function that catches and logs errors
 */
export function withErrorLogging<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          logError(error, { ...context, args }, 'medium');
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      logError(error as Error, { ...context, args }, 'medium');
      throw error;
    }
  }) as T;
}

/**
 * Report error to user (combines logging with user notification)
 */
export function reportError(
  error: Error,
  userMessage?: string,
  context?: ErrorContext
): void {
  logError(error, context, 'high');
  
  // You can integrate with toast notifications here
  if (userMessage) {
    console.info('[User Message]', userMessage);
    // Example: showToast(userMessage, 'error');
  }
}

/**
 * Initialize error tracking with global handlers
 */
export function initErrorTracking(): void {
  // Global unhandled error handler
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'unhandled',
    }, 'high');
  });

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    
    logError(error, {
      type: 'unhandled-promise',
      promise: event.promise,
    }, 'high');
  });

  console.log('[Error Tracking] Initialized');
}
