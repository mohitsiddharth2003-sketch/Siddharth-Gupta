import {
  EInvoiceRecord,
  EInvoiceGenerateRequest,
  EInvoiceCancelRequest,
} from '../types/einvoice';

export interface EInvoiceConfigStatus {
  sandboxMode: boolean;
  provider: string;
  hasCredentials: boolean;
  clientGstin: string;
}

export class EInvoiceService {
  /**
   * Fetch backend IRP/GSP configuration status
   */
  static async getConfigStatus(): Promise<EInvoiceConfigStatus> {
    try {
      const res = await fetch('/api/einvoice/status');
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
   * Generate statutory IRN and signed QR code via backend API
   */
  static async generateEInvoice(payload: EInvoiceGenerateRequest): Promise<{
    success: boolean;
    data?: EInvoiceRecord;
    error?: string;
    isSandbox?: boolean;
    warning?: string;
  }> {
    try {
      const res = await fetch('/api/einvoice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to generate e-invoice IRN',
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
        error: err instanceof Error ? err.message : 'Network error communicating with e-Invoice server',
      };
    }
  }

  /**
   * Cancel an IRN within the 24-hour statutory window
   */
  static async cancelEInvoice(payload: EInvoiceCancelRequest): Promise<{
    success: boolean;
    data?: { irn: string; cancelledAt: string; cancelReason: string };
    error?: string;
  }> {
    try {
      const res = await fetch('/api/einvoice/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Failed to cancel IRN on e-Invoice portal',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error communicating with e-Invoice server',
      };
    }
  }

  /**
   * Helper to format e-invoice signed QR code payload string for scanning or display
   */
  static buildQrCodeData(rec: EInvoiceRecord): string {
    if (rec.signedQRCode) {
      return rec.signedQRCode;
    }
    // NIC QR standard text payload:
    // Seller GSTIN, Buyer GSTIN, Doc No, Doc Typ, Doc Dt, Tot Inv Val, Item Cnt, Main HSN, IRN
    const mainHsn = rec.items?.[0]?.hsnCode || '998313';
    return `NIC:EINVOICE:1.03:${rec.sellerGstin}:${rec.buyerGstin}:${rec.invoiceNumber}:INV:${rec.invoiceDate}:${rec.totalInvoiceValue}:${rec.items?.length || 1}:${mainHsn}:${rec.irn}`;
  }
}
