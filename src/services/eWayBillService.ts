import {
  EWayBillRecord,
  EWayBillGenerateRequest,
  PartBUpdateEntry,
  ValidityExtensionEntry,
} from '../types/ewaybill';

export interface EWayBillConfigStatus {
  sandboxMode: boolean;
  provider: string;
  hasCredentials: boolean;
  clientGstin: string;
}

export class EWayBillService {
  /**
   * Fetch backend E-Way Bill configuration status
   */
  static async getConfigStatus(): Promise<EWayBillConfigStatus> {
    try {
      const res = await fetch('/api/ewaybill/status');
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch {
      return {
        sandboxMode: true,
        provider: 'Sandbox Mock Engine',
        hasCredentials: false,
        clientGstin: '27AABCS1429B1Z8',
      };
    }
  }

  /**
   * Generate E-Way Bill from an existing invoice or IRN
   */
  static async generateEWayBill(payload: EWayBillGenerateRequest): Promise<{
    success: boolean;
    data?: EWayBillRecord;
    error?: string;
    isSandbox?: boolean;
    warning?: string;
  }> {
    try {
      const res = await fetch('/api/ewaybill/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to generate E-Way Bill',
        };
      }

      return {
        success: true,
        data: result.data,
        isSandbox: result.isSandbox,
        warning: result.warning,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error communicating with E-Way Bill server',
      };
    }
  }

  /**
   * Update Part B (Vehicle / Transporter Details)
   */
  static async updatePartB(params: {
    ewbNo: string;
    vehicleNo: string;
    fromPlace: string;
    fromState: string;
    reasonCode: '1' | '2' | '3' | '4';
    reasonRemarks: string;
    transDocNo?: string;
    transDocDate?: string;
  }): Promise<{
    success: boolean;
    data?: PartBUpdateEntry;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/ewaybill/update-part-b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to update Part B on E-Way Bill portal',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error communicating with server',
      };
    }
  }

  /**
   * Extend validity of an active E-Way Bill
   */
  static async extendValidity(params: {
    ewbNo: string;
    remainingDistance: number;
    currentPlace: string;
    reasonCode: '1' | '2' | '3' | '4' | '5';
    remarks: string;
  }): Promise<{
    success: boolean;
    data?: ValidityExtensionEntry;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/ewaybill/extend-validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to extend validity on E-Way Bill portal',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error communicating with server',
      };
    }
  }

  /**
   * Cancel an E-Way Bill within the statutory 24-hour window
   */
  static async cancelEWayBill(params: {
    ewbNo: string;
    cancelReason: '1' | '2' | '3' | '4';
    cancelRemarks: string;
  }): Promise<{
    success: boolean;
    data?: { ewbNo: string; cancelledAt: string; cancelReason: string };
    error?: string;
  }> {
    try {
      const res = await fetch('/api/ewaybill/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to cancel E-Way Bill on portal',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error communicating with server',
      };
    }
  }
}
