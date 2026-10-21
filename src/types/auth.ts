export type UserRole = 'Admin' | 'Senior Accountant' | 'Tax Auditor' | 'Accountant';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  companyGstin: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  companyGstin: string;
  loginTimestamp: number;
}

export interface PasswordResetCode {
  email: string;
  code: string;
  createdAt: number;
  expiresAt: number;
}

export interface CloudAuthStatus {
  isFirebaseConfigured: boolean;
  activeAuthMethod: 'local-vault' | 'firebase';
  description: string;
  securityNotice: string;
}

export interface ActiveSessionInfo {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  loginTimestamp: number;
  lastActiveTimestamp: number;
  isOnline: boolean;
  deviceInfo?: string;
  isCurrentDevice?: boolean;
}

export interface TeamMemberInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  createdAt: string;
  lastLogin?: string;
  isOnline: boolean;
}
