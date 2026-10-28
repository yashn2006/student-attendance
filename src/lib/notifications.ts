import { supabase } from './supabase';

async function extractErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json();
        if (payload && typeof payload.message === 'string' && payload.message) {
          return payload.message;
        }
      } catch {
        // fall through to a generic message
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Failed to send notification';
}

export async function sendClassNotification(
  classId: string,
  title: string,
  body: string
): Promise<{ data: { status: string; notificationId: string } | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('teacher-send-notification', {
    body: { classId, title, body },
  });

  if (error) {
    return { data: null, error: await extractErrorMessage(error) };
  }

  return { data, error: null };
}
