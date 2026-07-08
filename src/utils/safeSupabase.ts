import { logError } from './logger';

/**
 * Executes a Supabase promise (or any thenable) and returns a unified result.
 * Logs any error using the central logger and returns { error }.
 * Unpacks the Supabase `{ data, error }` response automatically.
 *
 * @param promise The Supabase promise/thenable (e.g., supabase.from(...).select(...))
 */
export async function safeSupabaseCall(promise: PromiseLike<any> | any): Promise<{ data?: any; error?: any }> {
  try {
    const response = await promise;
    
    // Detect if the resolved value is a Supabase response containing an "error" property.
    if (response && typeof response === 'object' && 'error' in response) {
      const err = response.error;
      if (err) {
        logError('SupabaseCall', { error: { message: err.message, code: err.code, status: err.status } });
        return { error: err };
      }
      // If it's a standard Supabase response, unpack the inner "data"
      if ('data' in response) {
        return { data: response.data };
      }
    }
    
    // Otherwise, return the response directly
    return { data: response };
  } catch (error) {
    logError('SupabaseCall', { error: error instanceof Error ? { message: error.message } : error });
    return { error };
  }
}
