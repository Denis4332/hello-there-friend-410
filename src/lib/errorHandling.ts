import { toast } from 'sonner';

/**
 * Standardized error handling utility
 * Logs errors to console and shows user-friendly toast messages
 */
export const handleError = (error: unknown, context: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
  
  console.error(`[${context}]`, {
    message: errorMessage,
    error,
    timestamp: new Date().toISOString(),
  });
  
  toast.error(`Fehler: ${errorMessage}`);
};

/**
 * Handle async operations with consistent error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  successMessage?: string
): Promise<T | null> => {
  try {
    const result = await operation();
    if (successMessage) {
      toast.success(successMessage);
    }
    return result;
  } catch (error) {
    handleError(error, context);
    return null;
  }
};
