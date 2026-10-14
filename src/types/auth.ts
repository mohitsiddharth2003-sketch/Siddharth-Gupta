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
