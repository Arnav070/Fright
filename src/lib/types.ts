
export type UserRole = 'Admin' | 'QuotationCreator' | 'BookingCreator' | 'Reviewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token?: string;
}

export type QuotationStatus = 'Draft' | 'Submitted' | 'Booking Completed' | 'Cancelled';

export interface Quotation {
  id: string;
  customerName: string;
  pol: string; // Port of Loading
  pod: string; // Port of Discharge
  equipment: string; // e.g., "40ft High Cube"
  type: 'Import' | 'Export' | 'Cross-Trade'; // Or other relevant types
  buyRate: number;
  sellRate: number;
  profitAndLoss: number;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  selectedRateId?: string;
}

export interface ScheduleRate {
  id: string;
  carrier: string;
  origin: string;
  destination: string;
  // "String" seems like a vessel/voyage string, let's call it voyageDetails
  voyageDetails: string;
  buyRate: number;
  allocation: number; // available capacity
  // Sell rate and margin will be calculated/entered in quotation flow
}

export interface Booking {
  id: string;
  quotationId: string;
  customerName: string;
  pol: string;
  pod: string;
  equipment: string;
  type: 'Import' | 'Export' | 'Cross-Trade';
  buyRate: number; // This might be the selected rate from quotation or re-confirmed
  sellRate: number; // From quotation
  profitAndLoss: number; // From quotation
  status: 'Booked' | 'Shipped' | 'Delivered' | 'Cancelled'; // Simplified status
  createdAt: string;
  updatedAt: string;
  selectedCarrierRateId?: string;
}

export interface BuyRate {
  id: string;
  carrier: string;
  pol: string;
  pod: string;
  commodity: string;
  freightModeType: 'Sea' | 'Air' | 'Land';
  equipment: string; // e.g., "20GP", "40HC", "LCL"
  weightCapacity: string; // e.g., "20 TON", "10 CBM"
  minBooking: string; // e.g., "1 TEU", "1 CBM"
  rate: number; // The actual buy rate value
  validFrom: string;
  validTo: string;
}

export interface Schedule {
  id: string;
  carrier: string;
  origin: string; // Could be port code
  destination: string; // Could be port code
  // "String" again, let's call it serviceRoute or voyageIdentifier
  serviceRoute: string;
  allocation: number; // Capacity allocated for this schedule
  etd: string; // Estimated Time of Departure
  eta: string; // Estimated Time of Arrival
  frequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
}

export interface Port {
  code: string;
  name: string;
  country: string;
}

// Types for dashboard data
export interface QuotationStatusSummary {
  draft: number;
  submitted: number;
  completed: number;
  cancelled: number;
}

export interface BookingsByMonthEntry {
  month: string;
  count: number;
}
