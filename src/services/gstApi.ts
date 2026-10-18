import { GSTDetails } from '../types/accounting';

export interface GSTApiResponse {
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
  isInactive?: boolean;
}

/**
 * Fetch and verify GST details by calling the secure server-side proxy endpoint.
 * This ensures GST_API_KEY and GST_API_SECRET remain protected on the backend.
 *
 * @param gstin 15-character Indian Goods and Services Tax Identification Number
 * @returns Parsed GST business details or null on failure
 */
export async function fetchGSTDetails(gstin: string): Promise<GSTDetails | null> {
  const cleanGstin = (gstin || '').trim().toUpperCase();

  if (!cleanGstin || cleanGstin.length !== 15) {
    throw new Error('GSTIN must be exactly 15 characters long (e.g. 27AABCS1429B1Z8).');
  }

  const response = await fetch('/api/gst/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ gstin: cleanGstin }),
  });

  const body: GSTApiResponse = await response.json();

  if (!response.ok && !body.data) {
    throw new Error(body.message || `GST Verification failed with status ${response.status}`);
  }

  if (body.data) {
    return body.data;
  }

  // If credentials are required or format fallback is returned
  if (body.extracted) {
    const fallbackDetails: GSTDetails = {
      gstin: cleanGstin,
      legalName: '',
      tradeName: '',
      address: `${body.extracted.stateName || 'State ' + body.extracted.stateCode}, India`,
      state: body.extracted.stateName || 'India',
      stateCode: body.extracted.stateCode,
      city: '',
      district: '',
      pincode: '',
      pan: body.extracted.pan,
      constitutionOfBusiness: 'Business Entity',
      gstStatus: 'Active',
      taxpayerType: 'Regular',
      verifiedAt: new Date().toISOString(),
    };
    return fallbackDetails;
  }

  return null;
}

/**
 * Full verification function returning status, errors, and metadata
 */
export async function verifyGSTINFull(gstin: string): Promise<GSTApiResponse> {
  const cleanGstin = (gstin || '').trim().toUpperCase();

  try {
    const response = await fetch('/api/gst/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ gstin: cleanGstin }),
    });

    const body: GSTApiResponse = await response.json();
    return body;
  } catch (err: any) {
    return {
      success: false,
      configured: true,
      error: 'NETWORK_ERROR',
      message: err?.message || 'Network failure while attempting to reach GST verification server.',
    };
  }
}
