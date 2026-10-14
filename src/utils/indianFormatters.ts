import { StateInfo, TDSConfig } from '../types/accounting';

export const INDIAN_STATES: StateInfo[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
];

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const TDS_SECTIONS_CONFIG: TDSConfig[] = [
  {
    sectionCode: '194C_IND',
    section: '194C',
    title: 'Payment to Contractors (Individual/HUF)',
    defaultRate: 1.0,
    thresholdLimit: 30000,
    description: 'Contract or sub-contract work for individuals/HUFs (Single payment > ₹30k or aggregate > ₹1L p.a.)'
  },
  {
    sectionCode: '194C_OTH',
    section: '194C',
    title: 'Payment to Contractors (Companies/Firms)',
    defaultRate: 2.0,
    thresholdLimit: 30000,
    description: 'Contract or sub-contract work for Companies, LLPs, or Partnership Firms'
  },
  {
    sectionCode: '194J_TECH',
    section: '194J(a)',
    title: 'Fees for Technical Services',
    defaultRate: 2.0,
    thresholdLimit: 30000,
    description: 'Routine IT, technical support, call center services (> ₹30,000 p.a.)'
  },
  {
    sectionCode: '194J_PROF',
    section: '194J(b)',
    title: 'Fees for Professional Services / Royalty',
    defaultRate: 10.0,
    thresholdLimit: 30000,
    description: 'CA, Legal, Medical, Architecture, Consultancy, Director fees (> ₹30,000 p.a.)'
  },
  {
    sectionCode: '194I_RENT_BLDG',
    section: '194I(a)',
    title: 'Rent of Land, Building or Furniture',
    defaultRate: 10.0,
    thresholdLimit: 240000,
    description: 'Office, commercial or residential rent (> ₹2,40,000 p.a.)'
  },
  {
    sectionCode: '194I_RENT_PLANT',
    section: '194I(b)',
    title: 'Rent of Plant, Machinery or Equipment',
    defaultRate: 2.0,
    thresholdLimit: 240000,
    description: 'Machinery or equipment leasing (> ₹2,40,000 p.a.)'
  },
  {
    sectionCode: '194H',
    section: '194H',
    title: 'Commission or Brokerage',
    defaultRate: 5.0,
    thresholdLimit: 15000,
    description: 'Agent commission or brokerage charges (> ₹15,000 p.a.)'
  },
  {
    sectionCode: '194Q',
    section: '194Q',
    title: 'Purchase of Goods exceeding ₹50 Lakhs',
    defaultRate: 0.1,
    thresholdLimit: 5000000,
    description: 'TDS on purchase of goods from resident seller where aggregate exceeds ₹50 Lakhs'
  },
  {
    sectionCode: '192',
    section: '192',
    title: 'Salaries',
    defaultRate: 10.0,
    thresholdLimit: 300000,
    description: 'Tax deducted at source on employee salary payments as per slab'
  }
];

/**
 * Authentic Indian Currency formatting (e.g. ₹12,34,567.89)
 */
export function formatINR(
  val: number | undefined | null,
  options?: { showSymbol?: boolean; decimals?: number }
): string {
  if (val === undefined || val === null || isNaN(val)) {
    return options?.showSymbol !== false ? '₹0.00' : '0.00';
  }

  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const decimals = options?.decimals ?? 2;

  // Split integer and fraction
  const fixed = absVal.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');

  // Indian number grouping: last 3 digits, then pairs of 2 digits
  let result = '';
  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  } else {
    result = intPart;
  }

  if (decimals > 0 && decPart !== undefined) {
    result = `${result}.${decPart}`;
  }

  const prefix = isNegative ? '-' : '';
  const symbol = options?.showSymbol !== false ? '₹' : '';

  return `${prefix}${symbol}${result}`;
}

/**
 * Convert number to words in Indian Rupees (e.g. "One Lakh Twenty-Five Thousand Four Hundred Thirty Rupees Only")
 */
export function numberToWordsINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const isNegative = amount < 0;
  amount = Math.abs(amount);

  const integerPart = Math.floor(amount);
  const paisePart = Math.round((amount - integerPart) * 100);

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]} ${units[unit]}`.trim();
  }

  function convertThreeDigits(n: number): string {
    let str = '';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;

    if (hundred > 0) {
      str += `${units[hundred]} Hundred `;
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundreds = remainder;

  if (crore > 0) {
    words += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (hundreds > 0) {
    words += `${convertThreeDigits(hundreds)} `;
  }

  words = words.trim();
  if (!words) {
    words = 'Zero';
  }

  let result = `${isNegative ? 'Minus ' : ''}${words} Rupees`;

  if (paisePart > 0) {
    result += ` and ${convertTwoDigits(paisePart)} Paise`;
  }

  return `${result} Only`;
}

/**
 * Validate GSTIN (15 characters: 2 state code + 10 PAN + 1 entity + 1 'Z' + 1 checksum)
 */
export function validateGSTIN(gstin: string): { valid: boolean; error?: string; stateCode?: string; pan?: string } {
  if (!gstin) return { valid: false, error: 'GSTIN is required' };
  const cleaned = gstin.trim().toUpperCase();

  if (cleaned.length !== 15) {
    return { valid: false, error: 'GSTIN must be exactly 15 characters long' };
  }

  // Regex pattern: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric/number, 'Z', 1 alphanumeric
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid GSTIN structure (e.g. 27AAAAA0000A1Z5)' };
  }

  const stateCode = cleaned.substring(0, 2);
  const stateFound = INDIAN_STATES.some(s => s.code === stateCode);
  if (!stateFound) {
    return { valid: false, error: `Invalid GST state code "${stateCode}"` };
  }

  const pan = cleaned.substring(2, 12);
  return { valid: true, stateCode, pan };
}

/**
 * Validate PAN (10 characters: 5 letters + 4 digits + 1 letter)
 */
export function validatePAN(pan: string): { valid: boolean; error?: string } {
  if (!pan) return { valid: false, error: 'PAN is required' };
  const cleaned = pan.trim().toUpperCase();

  if (cleaned.length !== 10) {
    return { valid: false, error: 'PAN must be exactly 10 characters long' };
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid PAN structure (e.g. ABCDE1234F)' };
  }

  return { valid: true };
}

/**
 * Check if Place of Supply is Inter-State or Intra-State relative to company state
 */
export function isInterStateTransaction(companyStateCode: string, supplyStateCode: string): boolean {
  if (!companyStateCode || !supplyStateCode) return false;
  return companyStateCode.trim() !== supplyStateCode.trim();
}
