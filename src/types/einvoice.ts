export type EInvoiceStatus = 'GENERATED' | 'CANCELLED' | 'FAILED';

export interface EInvoiceItem {
  itemNo: number;
  productDesc: string;
  isService: boolean;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalItemValue: number;
}

export interface EInvoiceRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplyType: 'B2B' | 'SEZWP' | 'SEZWOP' | 'EXPWP' | 'EXPWOP' | 'DEXP';
  
  // Supplier Info (Seller)
  sellerGstin: string;
  sellerLegalName: string;
  sellerTradeName: string;
  sellerAddress: string;
  sellerPlace: string;
  sellerStateCode: string;
  sellerPincode: string;

  // Buyer Info
  buyerGstin: string;
  buyerLegalName: string;
  buyerTradeName?: string;
  buyerAddress: string;
  buyerPlace: string;
  buyerStateCode: string;
  buyerPincode: string;
  placeOfSupplyCode: string;

  // Value Summary
  totalTaxableValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  roundOff: number;
  totalInvoiceValue: number;

  // Items
  items: EInvoiceItem[];

  // Statutory IRN Details
  irn: string; // 64-char hex hash
  ackNo: string; // 15-16 digit Acknowledgement Number
  ackDate: string; // ISO Date string
  signedQRCode: string; // Payload string / JWT for QR code
  signedInvoicePayload: string; // JSON string of the complete NIC v1.03 payload

  // Status & Lifecycle
  status: EInvoiceStatus;
  isSandbox: boolean; // Flag identifying simulated sandbox / demo response
  irpProvider: string; // 'NIC-Sandbox' | 'Sandbox.co.in' | 'ClearTax' | 'MasterGST' | 'NIC-Production'
  
  // Cancellation details
  cancelReason?: '1' | '2' | '3' | '4'; // 1: Duplicate, 2: Data entry mistake, 3: Order cancelled, 4: Others
  cancelReasonText?: string;
  cancelRemarks?: string;
  cancelledAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface EInvoiceGenerateRequest {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplyType?: 'B2B' | 'SEZWP' | 'SEZWOP' | 'EXPWP' | 'EXPWOP' | 'DEXP';
  sellerGstin: string;
  sellerLegalName: string;
  sellerTradeName?: string;
  sellerAddress: string;
  sellerPlace: string;
  sellerStateCode: string;
  sellerPincode: string;
  buyerGstin: string;
  buyerLegalName: string;
  buyerTradeName?: string;
  buyerAddress: string;
  buyerPlace: string;
  buyerStateCode: string;
  buyerPincode: string;
  placeOfSupplyCode: string;
  isInterState: boolean;
  isRcm?: boolean;
  items: Array<{
    description: string;
    hsnSac: string;
    qty: number;
    unit: string;
    rate: number;
    discountAmount?: number;
    taxableAmount: number;
    gstRate: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
  }>;
  totalTaxable: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff?: number;
  grandTotal: number;
  forceSandbox?: boolean;
}

export interface EInvoiceCancelRequest {
  irn: string;
  reason: '1' | '2' | '3' | '4';
  remarks: string;
}
