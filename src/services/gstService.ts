import { GSTDetails, StateInfo } from '../types/accounting';
import { INDIAN_STATES, validateGSTIN } from '../utils/indianFormatters';

export interface GSTVerificationResult {
  success: boolean;
  configured: boolean;
  error?: string;
  message: string;
  data?: GSTDetails;
  extracted?: {
    stateCode: string;
    stateName?: string;
    pan: string;
  };
  setupRequired?: {
    envVar: string;
    provider: string;
    steps: string[];
  };
  isInactive?: boolean;
}

export class GSTService {
  /**
   * Validate GSTIN locally before making network requests
   */
  static validate(gstin: string): { valid: boolean; error?: string; stateCode?: string; pan?: string; stateName?: string } {
    const res = validateGSTIN(gstin);
    if (!res.valid || !res.stateCode) {
      return res;
    }

    const stateObj = INDIAN_STATES.find((s) => s.code === res.stateCode);
    return {
      ...res,
      stateName: stateObj?.name,
    };
  }

  /**
   * Check if backend has authorized GST credentials configured
   */
  static async checkStatus(): Promise<{ configured: boolean; provider: string; message: string }> {
    try {
      const res = await fetch('/api/gst/status');
      if (!res.ok) {
        return { configured: false, provider: 'sandbox', message: 'API status check failed' };
      }
      const data = await res.json();
      return {
        configured: Boolean(data.configured),
        provider: data.provider || 'sandbox',
        message: data.message || '',
      };
    } catch {
      return { configured: false, provider: 'sandbox', message: 'Network offline' };
    }
  }

  /**
   * Fetch official GST details from secure backend proxy
   */
  static async fetchDetails(gstin: string): Promise<GSTVerificationResult> {
    const clean = gstin.trim().toUpperCase();

    // 1. Client-side validation first
    const val = this.validate(clean);
    if (!val.valid) {
      return {
        success: false,
        configured: true,
        error: 'INVALID_FORMAT',
        message: val.error || 'Invalid 15-character GSTIN format',
      };
    }

    // 2. Call backend verification proxy
    try {
      const response = await fetch('/api/gst/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ gstin: clean }),
      });

      const body = await response.json();

      if (!response.ok) {
        return {
          success: false,
          configured: body.configured !== false,
          error: body.error || `HTTP_${response.status}`,
          message: body.message || 'Failed to verify GSTIN with provider gateway.',
        };
      }

      // If server does not have API credentials configured
      if (!body.configured) {
        return {
          success: false,
          configured: false,
          error: body.error || 'API_CREDENTIALS_REQUIRED',
          message: body.message,
          extracted: body.extracted || {
            stateCode: val.stateCode || '',
            stateName: val.stateName,
            pan: val.pan || '',
          },
          setupRequired: body.setupRequired,
        };
      }

      // Successful API return
      const data = body.data as GSTDetails;
      const isInactive = Boolean(body.data?.isInactive || (data.gstStatus && data.gstStatus.toLowerCase() !== 'active'));

      return {
        success: true,
        configured: true,
        data,
        isInactive,
        message: isInactive
          ? `GSTIN found, but registration status is ${data.gstStatus || 'Inactive'}.`
          : `GST registration verified successfully for ${data.legalName || clean}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        configured: true,
        error: 'NETWORK_ERROR',
        message: 'Network connectivity failure while attempting to reach GST verification server.',
      };
    }
  }
}
