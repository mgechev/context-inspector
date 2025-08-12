/**
 * Response object returned by the context logger
 */
export interface ContextResponse {
  /** Whether the context was successfully received */
  success: boolean;
  /** The unique identifier for the context */
  id: string;
  /** The timestamp when the context was received */
  timestamp: string;
}

/**
 * Function type for logging context data
 */
export type ContextLogger = (
  context: any,
  title?: string
) => Promise<ContextResponse>;

/**
 * Creates a context logger that can be used to log context to a remote server.
 * @param url - The URL to send the context to. Defaults to 'http://localhost:4242/context'.
 * @returns A function that can be used to log context to the server.
 * 
 * @example
 * ```javascript
 * import { createContextLogger } from 'context-inspector';
 * 
 * const logger = createContextLogger();
 * await logger('Hello, world!', 'My first context');
 * 
 * // Or with a custom server URL
 * const logger = createContextLogger('http://my-server:4242/context');
 * await logger({ data: 'some data' }, 'Custom context');
 * ```
 */
export function createContextLogger(url: string = 'http://localhost:4242/context'): ContextLogger {
  return async (context: any, title?: string): Promise<ContextResponse> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context, title })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  };
}
