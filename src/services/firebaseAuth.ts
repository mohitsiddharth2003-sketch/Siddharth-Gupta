import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AuthSession } from '../types/auth';
import { AuthService } from './auth';

export interface EmailSignUpPayload {
  fullName: string;
  email: string;
  password: string;
  companyName?: string;
}

export class FirebaseAuthService {
  // 1. Sign Up with Email and Password
  static async signUpWithEmailPassword(payload: EmailSignUpPayload): Promise<{
    success: boolean;
    session?: AuthSession;
    error?: string;
    errorCode?: string;
  }> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.fullName.trim();
    const cleanCompany = payload.companyName?.trim() || `${cleanName}'s Firm`;

    if (!cleanName) {
      return { success: false, error: 'Full Name is required.', errorCode: 'MISSING_NAME' };
    }

    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.', errorCode: 'MISSING_EMAIL' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.', errorCode: 'INVALID_EMAIL' };
    }

    if (!payload.password || payload.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.', errorCode: 'WEAK_PASSWORD' };
    }

    let firebaseUid: string | null = null;

    // A. Attempt Firebase Email/Password creation
    try {
      const userCred: UserCredential = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
      if (userCred?.user) {
        firebaseUid = userCred.user.uid;
        try {
          await updateProfile(userCred.user, { displayName: cleanName });
        } catch {
          // ignore display name update error
        }
      }
    } catch (fbErr: unknown) {
      const fbError = fbErr as { code?: string; message?: string };
      console.warn('[FirebaseAuth] Firebase createUser notice:', fbError);

      if (fbError.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: 'An account with this email address already exists. Please log in instead.',
          errorCode: 'auth/email-already-in-use',
        };
      } else if (fbError.code === 'auth/invalid-email') {
        return {
          success: false,
          error: 'The email address format is invalid.',
          errorCode: 'auth/invalid-email',
        };
      } else if (fbError.code === 'auth/weak-password') {
        return {
          success: false,
          error: 'Password must be at least 6 characters long.',
          errorCode: 'auth/weak-password',
        };
      }
      // If auth/operation-not-allowed or network, we fall back to our secure backend and local vault
    }

    // B. Register via Backend API
    let backendSession: AuthSession | null = null;
    try {
      const apiRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          password: payload.password,
          companyName: cleanCompany,
        }),
      });

      const apiData = await apiRes.json();
      if (!apiRes.ok && apiData.errorCode === 'DUPLICATE_ACCOUNT') {
        return {
          success: false,
          error: apiData.error || 'An account with this email address already exists.',
          errorCode: 'DUPLICATE_ACCOUNT',
        };
      }

      if (apiRes.ok && apiData.session) {
        backendSession = apiData.session;
      }
    } catch (apiErr) {
      console.warn('[FirebaseAuth] Backend register API request error:', apiErr);
    }

    const finalUid = firebaseUid || backendSession?.userId || `usr_${Date.now()}`;
    const finalCompanyId = backendSession?.companyId || `comp_${Date.now()}`;
    const now = new Date().toISOString();

    // C. Write profile to Firestore
    try {
      const userProfileData = {
        uid: finalUid,
        fullName: cleanName,
        email: cleanEmail,
        phoneNumber: '+919800000000',
        companyId: finalCompanyId,
        companyName: cleanCompany,
        role: 'Admin' as const,
        createdAt: now,
        updatedAt: now,
      };

      const companyProfileData = {
        id: finalCompanyId,
        name: cleanCompany,
        ownerUid: finalUid,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', finalUid), userProfileData);
      await setDoc(doc(db, 'companies', finalCompanyId), companyProfileData);
      console.log(`[FirebaseAuth] Firestore user profile & company registered: ${finalUid}`);
    } catch (dbErr) {
      console.warn('[FirebaseAuth] Firestore sync notice (persisting session locally):', dbErr);
    }

    // D. Save to local AuthService vault (using salted SHA-256 hash)
    await AuthService.register({
      userId: finalUid,
      companyId: finalCompanyId,
      name: cleanName,
      email: cleanEmail,
      password: payload.password,
      role: 'Admin',
      companyName: cleanCompany,
      companyGstin: 'Unregistered / MSME',
    });

    // E. Establish active session
    const session: AuthSession = backendSession || {
      token: `fb_sess_${finalUid}_${Date.now()}`,
      userId: finalUid,
      email: cleanEmail,
      name: cleanName,
      role: 'Admin',
      companyId: finalCompanyId,
      companyName: cleanCompany,
      companyGstin: 'Unregistered / MSME',
      loginTimestamp: Date.now(),
    };

    AuthService.setSession(session);
    return { success: true, session };
  }

  // 2. Sign In with Email and Password
  static async signInWithEmailPassword(
    email: string,
    pass: string
  ): Promise<{
    success: boolean;
    session?: AuthSession;
    error?: string;
    errorCode?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      return {
        success: false,
        error: 'Email and password are required fields.',
        errorCode: 'MISSING_FIELDS',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid business email address.',
        errorCode: 'INVALID_EMAIL',
      };
    }

    // A. Attempt Firebase Auth sign-in
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (userCred?.user) {
        console.log('[FirebaseAuth] Firebase sign-in successful for:', cleanEmail);
      }
    } catch (fbErr: unknown) {
      const fbError = fbErr as { code?: string; message?: string };
      console.warn('[FirebaseAuth] Firebase signIn notice:', fbError);

      if (
        fbError.code === 'auth/wrong-password' ||
        fbError.code === 'auth/user-not-found' ||
        fbError.code === 'auth/invalid-credential'
      ) {
        // Double check against local vault and backend before rejecting (in case user registered locally or via backend)
      }
    }

    // B. Attempt Backend API sign-in
    try {
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass }),
      });

      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.success && apiData.session) {
        AuthService.setSession(apiData.session);
        return { success: true, session: apiData.session };
      }
    } catch (apiErr) {
      console.warn('[FirebaseAuth] Backend login API request notice:', apiErr);
    }

    // C. Check local cryptographic vault
    const localRes = await AuthService.login(cleanEmail, pass);
    if (localRes.success && localRes.session) {
      return { success: true, session: localRes.session };
    }

    return {
      success: false,
      error: localRes.error || 'Invalid email or password. Passwords are case-sensitive.',
      errorCode: 'INVALID_CREDENTIALS',
    };
  }

  // 3. Password Reset Request
  static async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message?: string;
    resetCode?: string;
    error?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }

    // A. Attempt Firebase Auth password reset email
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      console.log('[FirebaseAuth] Password reset email triggered via Firebase');
    } catch (fbErr) {
      console.warn('[FirebaseAuth] Firebase sendPasswordResetEmail notice:', fbErr);
    }

    // B. Request via Backend API
    try {
      const apiRes = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.success) {
        return {
          success: true,
          message: apiData.message,
          resetCode: apiData.resetCode,
        };
      }
    } catch (apiErr) {
      console.warn('[FirebaseAuth] Backend forgot-password API notice:', apiErr);
    }

    // C. Fallback to AuthService
    const localRes = AuthService.requestPasswordReset(cleanEmail);
    if (localRes.success) {
      return {
        success: true,
        message: `Password reset verification code generated for ${cleanEmail} (Valid for 15 minutes).`,
        resetCode: localRes.code,
      };
    }

    return {
      success: false,
      error: localRes.error || 'No registered accounting account found with this email address.',
    };
  }

  // 4. Confirm Password Reset
  static async confirmPasswordReset(
    email: string,
    code: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // A. Backend API
    try {
      const apiRes = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, newPassword: newPass }),
      });

      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.success) {
        // Also update local vault
        await AuthService.verifyAndResetPassword(cleanEmail, code, newPass);
        return { success: true };
      }
    } catch (apiErr) {
      console.warn('[FirebaseAuth] Backend reset-password API notice:', apiErr);
    }

    // B. AuthService
    const localRes = await AuthService.verifyAndResetPassword(cleanEmail, code, newPass);
    return localRes;
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    AuthService.logout();
  }
}
