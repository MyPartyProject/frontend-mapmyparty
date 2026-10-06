import { apiFetch } from '@/config/api';

// Agent failures must never refresh or sign out the customer/organizer session.
export async function agentFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await apiFetch(`entry-agent/${path}`, {
      ...options, signal: controller.signal, cache: 'no-store',
      skipAuthRefresh: true, suppressAuthFailure: true,
    });
    return response.data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Verify the ticket again before admitting anyone.');
    throw error;
  } finally { window.clearTimeout(timeout); }
}

export const agentDate = value => value ? new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
}).format(new Date(value)) + ' IST' : 'Not scheduled';
