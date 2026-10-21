export type EWayBillStatus = 'ACT' | 'CNL' | 'EXP'; // Active, Cancelled, Expired

export type TransportMode = '1' | '2' | '3' | '4'; // 1-Road, 2-Rail, 3-Air, 4-Ship
export type VehicleType = 'R' | 'O'; // Regular, Over Dimensional Cargo

export interface PartBUpdateEntry {
  vehicleNo: string;
  fromPlace: string;
  fromState: string;
  reasonCode: '1' | '2' | '3' | '4'; // 1: Due to Break down, 2: Due to Transshipment, 3: Others, 4: First Time
  reasonRemarks: string;
  transDocNo?: string;
  transDocDate?: string;
  updatedAt: string;
}

export interface ValidityExtensionEntry {
  remainingDistance: number;
  currentPlace: string;
  currentPincode?: string;
  reasonCode: '1' | '2' | '3' | '4' | '5'; // 1: Natural Calamity, 2: Transshipment delay, 3: Accident, 4: Traffic Congestion, 5: Law and Order
  remarks: string;
  extendedUpto: string;
  updatedAt: string;
}

export interface EWayBillItem {
  itemNo: number;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  totalAmount: number;
}

export interface EWayBillRecord {
  id: string;
  ewbNo: string; // 12-digit number e.g. 241000123456
  ewbDate: string; // ISO date
  validUpto: string; // ISO date
  status: EWayBillStatus;
  
  // Linked Document
  invoiceId?: string;
  invoiceNumber: string;
  irn?: string; // Optional linked e-invoice IRN

  // Part A Details
  supplyType: 'Outward' | 'Inward';
  subSupplyType: 'Supply' | 'Export' | 'Job Work' | 'SKD/CKD' | 'Recipient Not Known' | 'For Own Use' | 'Exhibition' | 'Line Sales' | 'Others';
  docType: 'INV' | 'BIL' | 'BOE' | 'CHL' | 'OTH';
  docNo: string;
  docDate: string;

  // Supplier / Dispatcher
  fromGstin: string;
  fromTradeName: string;
  fromAddress: string;
  fromPlace: string;
  fromPincode: string;
  fromStateCode: string;

  // Consignee / Ship To
  toGstin: string;
  toTradeName: string;
  toAddress: string;
  toPlace: string;
  toPincode: string;
  toStateCode: string;

  // Values
  totalValue: number;
  totalTaxable: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  items: EWayBillItem[];

  // Part B Details (Transport)
  transporterId?: string; // 15-char GSTIN or TRANSIN
  transporterName?: string;
  transMode: TransportMode;
  transDocNo?: string; // LR / RR / Airway bill / Bill of lading
  transDocDate?: string;
  vehicleNo?: string;
  vehicleType: VehicleType;
  distance: number; // in KM

  // History & Extensions
  partBHistory: PartBUpdateEntry[];
  validityExtensionHistory: ValidityExtensionEntry[];

  // Cancellation
  cancelReason?: '1' | '2' | '3' | '4'; // 1: Duplicate, 2: Order Cancelled, 3: Data Entry Mistake, 4: Others
  cancelRemarks?: string;
  cancelledAt?: string;

  // Sandbox & Metadata
  isSandbox: boolean;
  irpProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface EWayBillGenerateRequest {
  invoiceId?: string;
  invoiceNumber: string;
  irn?: string;
  supplyType: 'Outward' | 'Inward';
  subSupplyType: 'Supply' | 'Export' | 'Job Work' | 'SKD/CKD' | 'Recipient Not Known' | 'For Own Use' | 'Exhibition' | 'Line Sales' | 'Others';
  docType: 'INV' | 'BIL' | 'BOE' | 'CHL' | 'OTH';
  docNo: string;
  docDate: string;
  fromGstin: string;
  fromTradeName: string;
  fromAddress: string;
  fromPlace: string;
  fromPincode: string;
  fromStateCode: string;
  toGstin: string;
  toTradeName: string;
  toAddress: string;
  toPlace: string;
  toPincode: string;
  toStateCode: string;
  totalValue: number;
  totalTaxable: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  items?: Array<{
    productName: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    taxableAmount: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    totalAmount: number;
  }>;
  transporterId?: string;
  transporterName?: string;
  transMode: TransportMode;
  transDocNo?: string;
  transDocDate?: string;
  vehicleNo?: string;
  vehicleType: VehicleType;
  distance: number;
  forceSandbox?: boolean;
}
