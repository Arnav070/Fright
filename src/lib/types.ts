
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
  buyRate?: number; // Optional: Can be from selectedRateId or manual
  sellRate?: number; // Optional: Can be manual or derived
  profitAndLoss: number;
  status: QuotationStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  selectedRateId?: string;
  notes?: string;
}

export interface ScheduleRate {
  id: string;
  carrier: string;
  origin: string; // Port Code
  destination: string; // Port Code
  voyageDetails: string; // e.g., Service String / Vessel Voyage / Equipment
  buyRate: number;
  allocation: number; // available capacity
}

export interface Booking {
  id: string;
  quotationId: string;
  customerName: string;
  pol: string;
  pod: string;
  equipment: string;
  type: 'Import' | 'Export' | 'Cross-Trade';
  buyRate: number;
  sellRate: number;
  profitAndLoss: number;
  status: 'Booked' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  selectedCarrierRateId?: string;
  notes?: string;
}

export interface BuyRate {
  id: string;
  carrier: string;
  pol: string; // Port Name (will be mapped to code for ScheduleRate generation)
  pod: string; // Port Name
  commodity: string;
  freightModeType: 'Sea' | 'Air' | 'Land';
  equipment: string; // e.g., "20ft Dry", "40ft High Cube", "LCL"
  weightCapacity: string;
  minBooking: string;
  rate: number;
  validFrom: string; // "yyyy-MM-dd"
  validTo: string;   // "yyyy-MM-dd"
}

export interface Schedule {
  id: string;
  carrier: string;
  origin: string; // Port Name (will be mapped to code for ScheduleRate generation)
  destination: string; // Port Name
  serviceRoute: string;
  allocation: number;
  etd: string; // ISO string
  eta: string; // ISO string
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
  allocationBased: number;
  outOfAllocation: number;
}
