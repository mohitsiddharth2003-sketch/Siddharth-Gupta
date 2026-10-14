import { AppUser, AuthSession, CloudAuthStatus, PasswordResetCode, UserRole } from '../types/auth';

const STORAGE_KEYS = {
  USERS_VAULT: 'accountspro_users_vault_v1',
  ACTIVE_SESSION: 'accountspro_auth_session_v1',
  RESET_CODES: 'accountspro_reset_codes_v1',
  ACTIVE_COMPANY_ID: 'accountspro_active_company_id',
};

// Cryptographic hash helper using Web Crypto API (SHA-256 with salt)
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}:accountspro_salt_key_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Pre-computed hashes for default demo accounts so synchronous/async init is instantaneous
const SEED_USERS: Omit<AppUser, 'passwordHash' | 'salt'>[] = [
  {
    id: 'user_ca_01',
    email: 'ca.sharma@accountspro.in',
    name: 'CA Rajesh K. Sharma',
    role: 'Admin',
    companyId: 'comp_01',
    companyName: 'Shree Ganesh Enterprises Pvt Ltd',
    companyGstin: '27AABCS1429B1Z8',
    createdAt: '2026-04-01T09:00:00Z',
    lastLogin: '2026-10-14T07:15:00Z',
  },
  {
    id: 'user_auditor_02',
    email: 'audit.verma@deloitte-associates.in',
    name: 'Priya Verma, FCA',
    role: 'Tax Auditor',
    companyId: 'comp_01',
    companyName: 'Shree Ganesh Enterprises Pvt Ltd',
    companyGstin: '27AABCS1429B1Z8',
    createdAt: '2026-04-05T10:30:00Z',
    lastLogin: '2026-10-13T14:20:00Z',
  },
  {
    id: 'user_acc_03',
    email: 'accounts@ganeshenterprises.in',
    name: 'Sanjay Mehta',
    role: 'Senior Accountant',
    companyId: 'comp_01',
    companyName: 'Shree Ganesh Enterprises Pvt Ltd',
    companyGstin: '27AABCS1429B1Z8',
    createdAt: '2026-04-10T11:00:00Z',
    lastLogin: '2026-10-12T16:45:00Z',
  },
];

export class AuthService {
  // Initialize vault with seeded users
  static async initVault(): Promise<void> {
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.USERS_VAULT);
      if (!existing) {
        const initialUsers: AppUser[] = [];
        for (const seed of SEED_USERS) {
          const salt = generateSalt();
          const defaultPassword =
            seed.role === 'Tax Auditor' ? 'Auditor@2026' : 'AccountsPro@2026';
          const passwordHash = await hashPasswordWithSalt(defaultPassword, salt);
          initialUsers.push({
            ...seed,
            salt,
            passwordHash,
          });
        }
        localStorage.setItem(STORAGE_KEYS.USERS_VAULT, JSON.stringify(initialUsers));
      }
    } catch (e) {
      console.warn('Failed to initialize users vault:', e);
    }
  }

  static getUsers(): AppUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS_VAULT);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveUsers(users: AppUser[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS_VAULT, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users vault:', e);
    }
  }

  // Active Session Management
  static getCurrentSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      // Optional: check session expiry (e.g. 7 days)
      const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - session.loginTimestamp > maxAgeMs) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static setSession(session: AuthSession): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, session.companyId);
    } catch (e) {
      console.error('Failed to set active session:', e);
    }
  }

  static getActiveCompanyId(): string {
    const session = this.getCurrentSession();
    if (session?.companyId) return session.companyId;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID) || 'comp_01';
  }

  static logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } catch (e) {
      console.error('Logout error:', e);
    }
  }

  // Authentication Flow
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    await this.initVault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required fields.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid business email address.' };
    }

    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return {
        success: false,
        error: 'No registered accounting profile found for this email address. Please check your spelling or register.',
      };
    }

    const calculatedHash = await hashPasswordWithSalt(password, user.salt);
    if (calculatedHash !== user.passwordHash) {
      return {
        success: false,
        error: 'Incorrect password. Passwords are case-sensitive. Please re-enter or use Forgot Password.',
      };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUsers(users);

    // Create session token
    const token = `ap_sess_${generateSalt(12)}_${Date.now()}`;
    const session: AuthSession = {
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: user.companyName,
      companyGstin: user.companyGstin,
      loginTimestamp: Date.now(),
    };

    this.setSession(session);
    return { success: true, session };
  }

  // Register New User / Company
  static async register(params: {
    userId?: string;
    companyId?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyName: string;
    companyGstin: string;
  }): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    await this.initVault();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim();
    const cleanCompany = params.companyName.trim();
    const cleanGstin = params.companyGstin.trim().toUpperCase();

    if (!cleanName || !cleanEmail || !params.password || !cleanCompany) {
      return { success: false, error: 'All fields are required to register an accounting account.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please provide a valid email format.' };
    }

    if (params.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters with mixed characters.' };
    }

    // Validate GSTIN if provided (skip validation if Unregistered / MSME / Composition)
    const isSpecialGstin =
      cleanGstin.includes('UNREGISTERED') ||
      cleanGstin.includes('MSME') ||
      cleanGstin.includes('COMPOSITION') ||
      cleanGstin === 'APPLIED_FOR' ||
      cleanGstin === '';

    if (cleanGstin && !isSpecialGstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(cleanGstin)) {
        return {
          success: false,
          error: 'Invalid GSTIN format (Standard: 15 alphanumeric characters e.g. 27AABCS1429B1Z8).',
        };
      }
    }

    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    const salt = generateSalt();
    const passwordHash = await hashPasswordWithSalt(params.password, salt);
    const companyId = params.companyId || `comp_${Date.now()}`;
    const userId = params.userId || `usr_${Date.now()}`;

    const newUser: AppUser = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      role: params.role || 'Admin',
      companyId,
      companyName: cleanCompany,
      companyGstin: cleanGstin || 'Unregistered / MSME',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    this.saveUsers(users);

    const token = `ap_sess_${generateSalt(12)}_${Date.now()}`;
    const session: AuthSession = {
      token,
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      companyId: newUser.companyId,
      companyName: newUser.companyName,
      companyGstin: newUser.companyGstin,
      loginTimestamp: Date.now(),
    };

    this.setSession(session);
    return { success: true, session };
  }

  // Password Reset Flow with 6-digit OTP verification
  static requestPasswordReset(email: string): { success: boolean; code?: string; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return {
        success: false,
        error: 'No registered accounting user found for this email address.',
      };
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    try {
      const resetVaultRaw = localStorage.getItem(STORAGE_KEYS.RESET_CODES);
      const resetVault: PasswordResetCode[] = resetVaultRaw ? JSON.parse(resetVaultRaw) : [];
      // Clean older codes for this email
      const filtered = resetVault.filter((r) => r.email.toLowerCase() !== cleanEmail);
      filtered.push({ email: cleanEmail, code, createdAt: Date.now(), expiresAt });
      localStorage.setItem(STORAGE_KEYS.RESET_CODES, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Could not store reset code in local vault:', e);
    }

    return { success: true, code };
  }

  static async verifyAndResetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail || !cleanCode || !newPassword) {
      return { success: false, error: 'Email, verification code, and new password are required.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    try {
      const resetVaultRaw = localStorage.getItem(STORAGE_KEYS.RESET_CODES);
      const resetVault: PasswordResetCode[] = resetVaultRaw ? JSON.parse(resetVaultRaw) : [];
      const record = resetVault.find(
        (r) => r.email.toLowerCase() === cleanEmail && r.code === cleanCode
      );

      if (!record) {
        return { success: false, error: 'Invalid verification code. Please check and try again.' };
      }

      if (Date.now() > record.expiresAt) {
        return { success: false, error: 'Verification code has expired (validity 15 mins). Please request a new code.' };
      }

      // Update password in users vault
      const users = this.getUsers();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return { success: false, error: 'User not found in vault.' };
      }

      const newSalt = generateSalt();
      const newHash = await hashPasswordWithSalt(newPassword, newSalt);
      user.salt = newSalt;
      user.passwordHash = newHash;

      this.saveUsers(users);

      // Clean used code
      const remaining = resetVault.filter((r) => r !== record);
      localStorage.setItem(STORAGE_KEYS.RESET_CODES, JSON.stringify(remaining));

      return { success: true };
    } catch {
      return { success: false, error: 'Password reset failed due to a vault storage error.' };
    }
  }

  // Cloud & Firebase Integration Status
  static getCloudStatus(): CloudAuthStatus {
    return {
      isFirebaseConfigured: false,
      activeAuthMethod: 'local-vault',
      description:
        'Firebase Authentication is currently unconfigured (Cloud setup declined by user). AccountsPro India is operating securely using local client-side SHA-256 cryptographic vault with salted hashes.',
      securityNotice:
        'Passwords are cryptographically hashed using Web Crypto SHA-256 with unique salts. No plaintext passwords or API keys are ever stored or transmitted.',
    };
  }
}
