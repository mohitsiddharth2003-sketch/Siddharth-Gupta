import { auth } from './firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';

// Google Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token cache (never stored in localStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let isSigningIn = false;

// Listeners
type AuthListener = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthListener>();

export const subscribeWorkspaceAuth = (listener: AuthListener) => {
  listeners.add(listener);
  listener(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((fn) => fn(cachedUser, cachedAccessToken));
};

// Initialize auth state listener
onAuthStateChanged(auth, async (user: User | null) => {
  cachedUser = user;
  if (!user && !isSigningIn) {
    cachedAccessToken = null;
  }
  notifyListeners();
});

export class WorkspaceService {
  static getCachedToken(): string | null {
    return cachedAccessToken;
  }

  static getCurrentUser(): User | null {
    return cachedUser;
  }

  static async signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to retrieve OAuth access token for Google Workspace.');
      }
      cachedAccessToken = credential.accessToken;
      cachedUser = result.user;
      notifyListeners();
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      console.error('[WorkspaceService] Sign in failed:', error);
      throw error;
    } finally {
      isSigningIn = false;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    cachedAccessToken = null;
    cachedUser = null;
    notifyListeners();
  }

  // ===================== GMAIL API =====================

  static async listGmailMessages(maxResults = 10, query = ''): Promise<{
    id: string;
    threadId: string;
    snippet: string;
    sender: string;
    subject: string;
    date: string;
  }[]> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`,
      {
        headers: { Authorization: `Bearer ${cachedAccessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gmail API Error: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.messages || !Array.isArray(data.messages)) return [];

    // Fetch message summaries
    const messageDetails = await Promise.all(
      data.messages.slice(0, 8).map(async (msg: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: { Authorization: `Bearer ${cachedAccessToken}` },
            }
          );
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: detail.id,
            threadId: detail.threadId,
            snippet: detail.snippet || '',
            sender: getHeader('From'),
            subject: getHeader('Subject') || '(No Subject)',
            date: getHeader('Date'),
          };
        } catch {
          return null;
        }
      })
    );

    return messageDetails.filter(Boolean) as any[];
  }

  static async sendGmailMessage(to: string, subject: string, bodyText: string): Promise<{ id: string }> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    // Construct RFC 2822 message formatted as base64url
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      bodyText,
    ];
    const message = messageParts.join('\r\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to send email: ${res.statusText}`);
    }

    return await res.json();
  }

  // ===================== GOOGLE TASKS API =====================

  static async getTaskLists(): Promise<{ id: string; title: string }[]> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { Authorization: `Bearer ${cachedAccessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch Google Task lists');
    }

    const data = await res.json();
    return data.items || [];
  }

  static async getTasks(listId = '@default'): Promise<{
    id: string;
    title: string;
    status: 'needsAction' | 'completed';
    due?: string;
    notes?: string;
    updated?: string;
  }[]> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true`, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch tasks');
    }

    const data = await res.json();
    return data.items || [];
  }

  static async createTask(
    listId = '@default',
    task: { title: string; notes?: string; due?: string }
  ): Promise<any> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const payload: any = {
      title: task.title,
      notes: task.notes || '',
    };
    if (task.due) {
      payload.due = new Date(task.due).toISOString();
    }

    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create task');
    }

    return await res.json();
  }

  static async updateTaskStatus(
    listId = '@default',
    taskId: string,
    completed: boolean
  ): Promise<any> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: completed ? 'completed' : 'needsAction',
        completed: completed ? new Date().toISOString() : null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update task status');
    }

    return await res.json();
  }

  static async updateTask(
    listId = '@default',
    taskId: string,
    updates: { title?: string; notes?: string; due?: string }
  ): Promise<any> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.due !== undefined) {
      payload.due = updates.due ? new Date(updates.due).toISOString() : null;
    }

    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update task');
    }

    return await res.json();
  }

  static async deleteTask(listId = '@default', taskId: string): Promise<void> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cachedAccessToken}` },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to delete task');
    }
  }

  // ===================== GOOGLE MEET API =====================

  static async createMeetingSpace(topic = 'Accounting & Tax Consultation'): Promise<{
    meetingUri: string;
    meetingCode: string;
    name: string;
  }> {
    if (!cachedAccessToken) throw new Error('Google Workspace not connected.');

    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          accessType: 'OPEN',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Meet space');
    }

    const data = await res.json();
    return {
      meetingUri: data.meetingUri || `https://meet.google.com/${data.meetingCode || ''}`,
      meetingCode: data.meetingCode || '',
      name: data.name || '',
    };
  }
}
