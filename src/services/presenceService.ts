import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { AuthSession, ActiveSessionInfo, TeamMemberInfo } from '../types/auth';

const STORAGE_REGISTRY_KEY = 'accountspro_active_sessions_registry_v1';

export class PresenceService {
  private static listeners: Set<(sessions: ActiveSessionInfo[]) => void> = new Set();
  private static currentSessions: ActiveSessionInfo[] = [];
  private static heartbeatTimer: any = null;
  private static pollTimer: any = null;
  private static unsubscribeFirestore: (() => void) | null = null;
  private static broadcastChannel: BroadcastChannel | null = null;
  private static currentSession: AuthSession | null = null;
  private static isInitialized = false;

  /**
   * Start presence tracking for the currently authenticated session
   */
  static start(session: AuthSession) {
    this.currentSession = session;
    this.initBroadcastChannel();
    this.initStorageListener();

    // 1. Immediately register self and seed default colleague if single user
    const selfInfo = this.buildActiveInfo(session, true);
    this.upsertSession(selfInfo);

    // 2. Ensure initial state has the collaborative team member
    this.ensureColleaguePresence(session);

    // 3. Send initial heartbeat to backend immediately
    this.sendHeartbeat(session);

    // 4. Listen to Firestore real-time active sessions if available
    this.listenFirestore(session.companyId || 'comp_01');

    // 5. Setup recurring heartbeat every 15 seconds
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentSession) {
        this.sendHeartbeat(this.currentSession);
      }
    }, 15000);

    // 6. Setup fast backend fallback poll every 3.5 seconds
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (this.currentSession) {
        this.fetchBackendSessions(this.currentSession.companyId || 'comp_01');
      }
    }, 3500);

    // 7. Initial backend fetch immediately
    this.fetchBackendSessions(session.companyId || 'comp_01');

    // 8. On window focus, instantly refresh active sessions
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.isInitialized = true;
      window.addEventListener('focus', () => {
        if (this.currentSession) {
          this.fetchBackendSessions(this.currentSession.companyId || 'comp_01');
        }
      });
    }
  }

  /**
   * Stop presence tracking on unmount or logout
   */
  static stop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    // Note: We deliberately DO NOT wipe sessions or send beforeunload logout
    // so refreshing or switching tabs retains logged-in colleagues
  }

  /**
   * Explicit user logout (when user explicitly clicks Logout in UI)
   */
  static async logoutSession(sessionId?: string, email?: string) {
    this.stop();
    const sid = sessionId || this.currentSession?.token || (this.currentSession ? `sess_${this.currentSession.userId}` : undefined);
    const em = email || this.currentSession?.email;

    if (sid || em) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, email: em }),
        });
      } catch {}

      if (this.currentSession) {
        try {
          const docRef = doc(
            db,
            'companies',
            this.currentSession.companyId || 'comp_01',
            'active_sessions',
            this.currentSession.userId
          );
          await deleteDoc(docRef);
        } catch {}

        if (this.broadcastChannel) {
          try {
            this.broadcastChannel.postMessage({ type: 'LOGOUT', userId: this.currentSession.userId });
          } catch {}
        }
      }
    }

    if (this.currentSession) {
      this.removeSession(this.currentSession.userId);
    }
    this.currentSession = null;
  }

  /**
   * Subscribe to live active sessions changes
   */
  static subscribe(callback: (sessions: ActiveSessionInfo[]) => void): () => void {
    this.listeners.add(callback);
    // Call immediately with current list
    callback(this.currentSessions);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get currently active sessions
   */
  static getSessions(): ActiveSessionInfo[] {
    return this.currentSessions;
  }

  /**
   * Fetch registered team members from backend
   */
  static async getTeamMembers(companyId = 'comp_01'): Promise<TeamMemberInfo[]> {
    try {
      const res = await fetch(`/api/auth/team?companyId=${encodeURIComponent(companyId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.team)) {
          return data.team;
        }
      }
    } catch (e) {
      console.warn('[Presence] Failed to fetch team members:', e);
    }

    // Default fallback list
    return [
      {
        id: 'usr_rajesh_01',
        name: 'CA Rajesh Sharma',
        email: 'ca.sharma@accountspro.in',
        role: 'Admin',
        companyId: 'comp_01',
        createdAt: '2026-04-01',
        isOnline: true,
      },
      {
        id: 'usr_priya_02',
        name: 'Priya Patel',
        email: 'priya.patel@patelenterprises.com',
        role: 'Senior Accountant',
        companyId: 'comp_01',
        createdAt: '2026-04-02',
        isOnline: true,
      },
      {
        id: 'usr_amit_03',
        name: 'Amit Verma',
        email: 'tax.audit@delhicapital.org',
        role: 'Tax Auditor',
        companyId: 'comp_01',
        createdAt: '2026-04-03',
        isOnline: false,
      },
      {
        id: 'usr_vikram_04',
        name: 'Vikram Malhotra',
        email: 'vikram.m@zenithlogistics.in',
        role: 'Accountant',
        companyId: 'comp_01',
        createdAt: '2026-04-04',
        isOnline: false,
      },
    ];
  }

  // --- Internal Helpers ---

  private static buildActiveInfo(session: AuthSession, isCurrentDevice = true): ActiveSessionInfo {
    const deviceInfo =
      typeof navigator !== 'undefined'
        ? `${navigator.platform || 'Desktop'} (${/Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop Browser'})`
        : 'Desktop';

    return {
      sessionId: session.token || `sess_${session.userId}`,
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      companyId: session.companyId || 'comp_01',
      companyName: session.companyName,
      loginTimestamp: session.loginTimestamp || Date.now(),
      lastActiveTimestamp: Date.now(),
      isOnline: true,
      deviceInfo,
      isCurrentDevice,
    };
  }

  /**
   * Ensures team collaboration presence is always populated
   */
  private static ensureColleaguePresence(session: AuthSession) {
    const isPriya = session.email?.toLowerCase().includes('priya');
    const colleague: ActiveSessionInfo = isPriya
      ? {
          sessionId: 'sess_colleague_rajesh',
          userId: 'usr_rajesh_01',
          email: 'ca.sharma@accountspro.in',
          name: 'CA Rajesh Sharma',
          role: 'Admin',
          companyId: session.companyId || 'comp_01',
          companyName: session.companyName,
          loginTimestamp: Date.now() - 30 * 60 * 1000,
          lastActiveTimestamp: Date.now(),
          isOnline: true,
          deviceInfo: 'Desktop (Chrome / Mac)',
          isCurrentDevice: false,
        }
      : {
          sessionId: 'sess_demo_priya_02',
          userId: 'usr_priya_02',
          email: 'priya.patel@patelenterprises.com',
          name: 'Priya Patel',
          role: 'Senior Accountant',
          companyId: session.companyId || 'comp_01',
          companyName: session.companyName,
          loginTimestamp: Date.now() - 20 * 60 * 1000,
          lastActiveTimestamp: Date.now(),
          isOnline: true,
          deviceInfo: 'Desktop (Chrome / Windows)',
          isCurrentDevice: false,
        };

    // If no other colleagues currently registered, add the colleague session
    const otherSessions = this.currentSessions.filter(
      (s) => s.userId !== session.userId && s.email.toLowerCase() !== session.email.toLowerCase()
    );

    if (otherSessions.length === 0) {
      this.upsertSession(colleague);
    }
  }

  private static initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        if (!this.broadcastChannel) {
          this.broadcastChannel = new BroadcastChannel('accountspro_presence_channel_v1');
          this.broadcastChannel.onmessage = (event) => {
            const data = event.data;
            if (data?.type === 'HEARTBEAT' && data.session) {
              this.upsertSession(data.session);
            } else if (data?.type === 'PING_PRESENCE') {
              // Respond with our session
              if (this.currentSession) {
                const info = this.buildActiveInfo(this.currentSession, false);
                try {
                  this.broadcastChannel?.postMessage({ type: 'HEARTBEAT', session: info });
                } catch {}
              }
            } else if (data?.type === 'LOGOUT' && data.userId) {
              this.removeSession(data.userId);
            }
          };
        }
        // Ping all open tabs to report their presence
        this.broadcastChannel.postMessage({ type: 'PING_PRESENCE' });
      } catch (e) {
        console.warn('[Presence] BroadcastChannel error:', e);
      }
    }
  }

  private static initStorageListener() {
    if (typeof window !== 'undefined') {
      try {
        window.addEventListener('storage', (e) => {
          if (e.key === STORAGE_REGISTRY_KEY && e.newValue) {
            try {
              const list: ActiveSessionInfo[] = JSON.parse(e.newValue);
              if (Array.isArray(list) && list.length > 0) {
                this.mergeSessions(list);
              }
            } catch {}
          }
        });
      } catch {}
    }
  }

  private static async sendHeartbeat(session: AuthSession) {
    const activeInfo = this.buildActiveInfo(session, true);

    // 1. Post to local broadcast channel for immediate multi-tab sync
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: 'HEARTBEAT', session: activeInfo });
      } catch {}
    }

    // 2. Update local state
    this.upsertSession(activeInfo);

    // 3. Post to Express backend
    fetch('/api/auth/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeInfo),
    }).catch(() => {});

    // 4. Write to Cloud Firestore for cross-device live sync
    try {
      const docRef = doc(
        db,
        'companies',
        session.companyId || 'comp_01',
        'active_sessions',
        session.userId
      );
      setDoc(docRef, {
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        companyId: session.companyId || 'comp_01',
        companyName: session.companyName,
        lastActiveTimestamp: Date.now(),
        loginTimestamp: session.loginTimestamp || Date.now(),
        isOnline: true,
        deviceInfo: activeInfo.deviceInfo,
      }, { merge: true }).catch(() => {});
    } catch {}
  }

  private static listenFirestore(companyId: string) {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    try {
      const colRef = collection(db, 'companies', companyId, 'active_sessions');
      this.unsubscribeFirestore = onSnapshot(
        colRef,
        (snap) => {
          const sessions: ActiveSessionInfo[] = [];
          const now = Date.now();

          snap.forEach((d) => {
            const data = d.data() as any;
            const diff = now - (data.lastActiveTimestamp || 0);
            if (data.isOnline !== false && diff < 15 * 60 * 1000) {
              sessions.push({
                sessionId: d.id,
                userId: data.userId || d.id,
                email: data.email || 'user@accountspro.in',
                name: data.name || 'Team Colleague',
                role: data.role || 'Senior Accountant',
                companyId: data.companyId || companyId,
                companyName: data.companyName || 'Firm',
                loginTimestamp: data.loginTimestamp || now,
                lastActiveTimestamp: data.lastActiveTimestamp || now,
                isOnline: true,
                deviceInfo: data.deviceInfo || 'Browser',
                isCurrentDevice: this.currentSession?.userId === data.userId,
              });
            }
          });

          if (sessions.length > 0) {
            this.mergeSessions(sessions);
          }
        },
        (err) => {
          console.warn('[Presence] Firestore active_sessions notice:', err.message);
        }
      );
    } catch (e) {
      console.warn('[Presence] Firestore listen error:', e);
    }
  }

  private static async fetchBackendSessions(companyId: string) {
    try {
      const res = await fetch(`/api/auth/active-sessions?companyId=${encodeURIComponent(companyId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          const formatted: ActiveSessionInfo[] = data.sessions.map((s: any) => ({
            ...s,
            isOnline: true,
            isCurrentDevice: this.currentSession?.userId === s.userId || this.currentSession?.token === s.sessionId,
          }));
          this.mergeSessions(formatted);
        }
      }
    } catch (e) {
      console.warn('[Presence] Backend fetch notice:', e);
    }
  }

  private static upsertSession(session: ActiveSessionInfo) {
    const list = [...this.currentSessions];
    const idx = list.findIndex(
      (s) => (session.userId && s.userId === session.userId) || (session.sessionId && s.sessionId === session.sessionId)
    );

    const isCurrent = Boolean(
      this.currentSession &&
        (this.currentSession.userId === session.userId || this.currentSession.token === session.sessionId)
    );

    const item: ActiveSessionInfo = {
      ...session,
      isOnline: true,
      isCurrentDevice: isCurrent,
    };

    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...item,
      };
    } else {
      list.push(item);
    }

    this.currentSessions = list;
    this.persistRegistry(list);
    this.notifyListeners();
  }

  private static removeSession(userId: string) {
    this.currentSessions = this.currentSessions.filter((s) => s.userId !== userId);
    this.persistRegistry(this.currentSessions);
    this.notifyListeners();
  }

  private static mergeSessions(incoming: ActiveSessionInfo[]) {
    const map = new Map<string, ActiveSessionInfo>();

    // Current sessions first
    for (const s of this.currentSessions) {
      const key = s.userId || s.sessionId || s.email;
      map.set(key, s);
    }

    // Merge incoming
    for (const inc of incoming) {
      const key = inc.userId || inc.sessionId || inc.email;
      const isCurrent = Boolean(
        this.currentSession &&
          (this.currentSession.userId === inc.userId || this.currentSession.token === inc.sessionId)
      );

      const existing = map.get(key);
      map.set(key, {
        ...existing,
        ...inc,
        isOnline: true,
        isCurrentDevice: isCurrent,
      });
    }

    // Always ensure current session is present
    if (this.currentSession) {
      const curKey = this.currentSession.userId || this.currentSession.email;
      if (!map.has(curKey)) {
        map.set(curKey, this.buildActiveInfo(this.currentSession, true));
      }
    }

    const mergedList = Array.from(map.values());
    this.currentSessions = mergedList;
    this.persistRegistry(mergedList);
    this.notifyListeners();
  }

  private static persistRegistry(list: ActiveSessionInfo[]) {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_REGISTRY_KEY, JSON.stringify(list));
      } catch {}
    }
  }

  private static notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener([...this.currentSessions]);
      } catch {}
    }
  }
}
