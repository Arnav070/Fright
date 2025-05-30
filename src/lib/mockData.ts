
import type { User, Quotation, QuotationStatus, Booking, BuyRate, Schedule, Port, ScheduleRate } from './types';
import { format, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const today = new Date();
const formatDateISO = (date: Date) => date.toISOString();
const formatDateShort = (date: Date) => format(date, 'yyyy-MM-dd');

export const mockUsers: User[] = [
  { id: 'admin-001', email: 'admin@cargoly.com', name: 'Admin User', role: 'Admin' },
  { id: 'qc-001', email: 'quotation@cargoly.com', name: 'Quotation Creator', role: 'QuotationCreator' },
  { id: 'bc-001', email: 'booking@cargoly.com', name: 'Booking Creator', role: 'BookingCreator' },
  { id: 'rev-001', email: 'reviewer@cargoly.com', name: 'Reviewer User', role: 'Reviewer' },
];

export const mockPorts: Port[] = [
  { code: 'INMAA', name: 'Chennai', country: 'India' },
  { code: 'USLGB', name: 'Long Beach', country: 'USA' },
  { code: 'CNSGH', name: 'Shanghai', country: 'China' },
  { code: 'INNSA', name: 'Nhava Sheva', country: 'India' },
  { code: 'GBFXS', name: 'Felixstowe', country: 'UK' },
  { code: 'USSAV', name: 'Savannah', country: 'USA' },
  { code: 'AEDXB', name: 'Dubai', country: 'UAE' },
  // USLGBN seems like a typo for USLGB, using USLGB if it appears.
];

const fclBuyRatesFromImage: Omit<BuyRate, 'id' | 'validFrom' | 'validTo' | 'freightModeType' | 'weightCapacity' | 'minBooking'>[] = [
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '20GP', rate: 1200 },
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40GP', rate: 1150 },
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40HC', rate: 1150 },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '20GP', rate: 1100 },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40GP', rate: 1200 },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40HC', rate: 1200 },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '20GP', rate: 900 },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40GP', rate: 1600 },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40HC', rate: 1600 },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '20GP', rate: 1100 },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40GP', rate: 1375 },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40HC', rate: 1375 },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '20GP', rate: 1200 },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40GP', rate: 1450 },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40HC', rate: 1450 },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '20GP', rate: 1000 },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40GP', rate: 1400 },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40HC', rate: 1400 },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '20GP', rate: 880 },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40GP', rate: 1000 },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40HC', rate: 1000 },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '20GP', rate: 980 },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40GP', rate: 1150 },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40HC', rate: 1150 },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '20GP', rate: 1000 },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40GP', rate: 1100 },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40HC', rate: 1100 },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '20GP', rate: 990 },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40GP', rate: 1200 },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40HC', rate: 1200 },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '20GP', rate: 800 },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40GP', rate: 1200 },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40HC', rate: 1200 },
];

export const initialMockBuyRates: BuyRate[] = fclBuyRatesFromImage.map((item, index) => ({
  ...item,
  id: `BR-IMG-${String(index + 1).padStart(4, '0')}`,
  freightModeType: 'Sea',
  weightCapacity: item.equipment === '20GP' ? '21 TON' : (item.equipment === '40GP' ? '26 TON' : '28 TON'),
  minBooking: '1 TEU',
  validFrom: formatDateShort(startOfMonth(today)),
  validTo: formatDateShort(endOfMonth(today)),
})).concat([
  // Adding the LCL Buy Rate from "Freight Module Buy Rate L" section
  {
    id: `BR-IMG-LCL-001`,
    carrier: 'N/A', // Carrier not specified for this LCL rate in image
    pol: 'CNSGH',
    pod: 'USLGB', // Assuming USLGBN is USLGB
    commodity: 'GDSM',
    freightModeType: 'Sea',
    equipment: 'LCL',
    weightCapacity: '1 CBM', // Per CBM rate
    minBooking: '1 CBM',
    rate: 50, // Assuming a rate of 50 $/CBM for example, not clear from image
    validFrom: formatDateShort(startOfMonth(today)),
    validTo: formatDateShort(endOfMonth(today)),
  }
]);

const schedulesFromImage: Omit<Schedule, 'id' | 'etd' | 'eta' | 'frequency'>[] = [
  { carrier: 'ONEY', origin: 'INMAA', destination: 'USLGB', serviceRoute: 'O1', allocation: 5 },
  { carrier: 'MAEU', origin: 'INMAA', destination: 'USLGB', serviceRoute: 'M1', allocation: 2 },
  { carrier: 'HLCU', origin: 'INMAA', destination: 'USLGB', serviceRoute: 'H1', allocation: 3 },
  { carrier: 'ONEY', origin: 'INNSA', destination: 'GBFXS', serviceRoute: 'O2', allocation: 1 },
  { carrier: 'MAEU', origin: 'INNSA', destination: 'GBFXS', serviceRoute: 'M2', allocation: 3 },
  { carrier: 'HLCU', origin: 'INNSA', destination: 'GBFXS', serviceRoute: 'H2', allocation: 4 },
  { carrier: 'ONEY', origin: 'USSAV', destination: 'AEDXB', serviceRoute: 'O3', allocation: 4 },
  { carrier: 'MAEU', origin: 'USSAV', destination: 'AEDXB', serviceRoute: 'M3', allocation: 4 },
  { carrier: 'HLCU', origin: 'USSAV', destination: 'AEDXB', serviceRoute: 'H3', allocation: 4 },
  { carrier: 'ONEY', origin: 'GBFXS', destination: 'USSAV', serviceRoute: 'O4', allocation: 3 },
  { carrier: 'MAEU', origin: 'GBFXS', destination: 'USSAV', serviceRoute: 'M4', allocation: 2 },
  { carrier: 'HLCU', origin: 'GBFXS', destination: 'USSAV', serviceRoute: 'H4', allocation: 3 },
];

export const initialMockSchedules: Schedule[] = schedulesFromImage.map((item, index) => ({
  ...item,
  id: `SCH-IMG-${String(index + 1).padStart(4, '0')}`,
  etd: formatDateISO(addDays(today, index * 3)), // Stagger ETDs
  eta: formatDateISO(addDays(today, (index * 3) + (15 + Math.floor(Math.random() * 10)))),
  frequency: 'Weekly',
}));

export const mockScheduleRates: ScheduleRate[] = [];
initialMockSchedules.forEach((schedule, index) => {
  const representativeBuyRate = initialMockBuyRates.find(
    br => br.carrier === schedule.carrier &&
          br.pol === schedule.origin &&
          br.pod === schedule.destination &&
          br.equipment === '20GP' // Use 20GP as representative for FCL
  );
  mockScheduleRates.push({
    id: `SRATE-IMG-${String(index + 1).padStart(5, '0')}`,
    carrier: schedule.carrier,
    origin: schedule.origin,
    destination: schedule.destination,
    voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()}`,
    buyRate: representativeBuyRate ? representativeBuyRate.rate : (Math.floor(Math.random() * 500) + 800),
    allocation: schedule.allocation,
  });
});


// Data for Firestore Seeding
// Using a function to find buy rates to avoid issues with undefined initialMockBuyRates at parse time
const findBuyRate = (pol: string, pod: string, equipment: string, carrier?: string): number => {
    const potentialRates = initialMockBuyRates.filter(br => 
        br.pol === pol && 
        br.pod === pod && 
        br.equipment === equipment &&
        (carrier ? br.carrier === carrier : true)
    );
    if (potentialRates.length > 0) {
        return potentialRates.sort((a,b) => a.rate - b.rate)[0].rate; // take cheapest
    }
    return equipment === 'LCL' ? 50 : 1000; // fallback
};


export const quotationsToSeedFromImage: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>[] = [
  // ABC Limited, INMAA -> USLGB
  { customerName: 'ABC Limited', pol: 'INMAA', pod: 'USLGB', volume: '1x20GP', equipment: '20GP', type: 'Export', buyRate: findBuyRate('INMAA', 'USLGB', '20GP', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='20GP')?.id },
  { customerName: 'ABC Limited', pol: 'INMAA', pod: 'USLGB', volume: '1x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('INMAA', 'USLGB', '40GP', 'MAEU'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='40GP')?.id },
  { customerName: 'ABC Limited', pol: 'INMAA', pod: 'USLGB', volume: '1x40HC', equipment: '40HC', type: 'Export', buyRate: findBuyRate('INMAA', 'USLGB', '40HC', 'MAEU'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='40HC')?.id },
  // FED Limited, USSAV -> AEDXB
  { customerName: 'FED Limited', pol: 'USSAV', pod: 'AEDXB', volume: '1x20GP', equipment: '20GP', type: 'Export', buyRate: findBuyRate('USSAV', 'AEDXB', '20GP', 'HLCU'), sellRate: 920, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='20GP')?.id },
  { customerName: 'FED Limited', pol: 'USSAV', pod: 'AEDXB', volume: '1x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('USSAV', 'AEDXB', '40GP', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='40GP')?.id },
  { customerName: 'FED Limited', pol: 'USSAV', pod: 'AEDXB', volume: '1x40HC', equipment: '40HC', type: 'Export', buyRate: findBuyRate('USSAV', 'AEDXB', '40HC', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='40HC')?.id },
  // DEF Limited, GBFXS -> USSAV
  { customerName: 'DEF Limited', pol: 'GBFXS', pod: 'USSAV', volume: '1x20GP', equipment: '20GP', type: 'Export', buyRate: findBuyRate('GBFXS', 'USSAV', '20GP', 'ONEY'), sellRate: 850, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='20GP')?.id },
  { customerName: 'DEF Limited', pol: 'GBFXS', pod: 'USSAV', volume: '1x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('GBFXS', 'USSAV', '40GP', 'MAEU'), sellRate: 1150, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='40GP')?.id },
  { customerName: 'DEF Limited', pol: 'GBFXS', pod: 'USSAV', volume: '1x40HC', equipment: '40HC', type: 'Export', buyRate: findBuyRate('GBFXS', 'USSAV', '40HC', 'MAEU'), sellRate: 1150, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='40HC')?.id },
  // DEF Limited, INNSA -> GBFXS
  { customerName: 'DEF Limited', pol: 'INNSA', pod: 'GBFXS', volume: '1x20GP', equipment: '20GP', type: 'Export', buyRate: findBuyRate('INNSA', 'GBFXS', '20GP', 'MAEU'), sellRate: 900, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='20GP')?.id }, // Buy > Sell
  { customerName: 'DEF Limited', pol: 'INNSA', pod: 'GBFXS', volume: '1x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('INNSA', 'GBFXS', '40GP', 'ONEY'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='40GP')?.id }, // Buy > Sell
  { customerName: 'DEF Limited', pol: 'INNSA', pod: 'GBFXS', volume: '1x40HC', equipment: '40HC', type: 'Export', buyRate: findBuyRate('INNSA', 'GBFXS', '40HC', 'ONEY'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='40HC')?.id }, // Buy > Sell
  // BCD Limited (LCL), CNSGH -> USLGB
  { customerName: 'BCD Limited', pol: 'CNSGH', pod: 'USLGB', volume: '11 CBM', equipment: 'LCL', type: 'Import', buyRate: (findBuyRate('CNSGH', 'USLGB', 'LCL') * 11), sellRate: (70 * 11), status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.pol==='CNSGH'&&br.pod==='USLGB'&&br.equipment==='LCL')?.id },
];

// Placeholder for actual quotation IDs after seeding
type TempBookingSeedData = Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'quotationId' | 'profitAndLoss'> & { quotationRefCustomer: string, quotationRefPol: string, quotationRefPod: string, quotationRefEquipment: string };

export const bookingsToSeedFromImageBase: TempBookingSeedData[] = [
  { quotationRefCustomer: 'ABC Limited', quotationRefPol: 'INMAA', quotationRefPod: 'USLGB', quotationRefEquipment: '20GP', customerName: 'ABC Limited', pol: 'INMAA', pod: 'USLGB', volume: '3x20GP', equipment: '20GP', type: 'Export', buyRate: findBuyRate('INMAA', 'USLGB', '20GP','HLCU'), sellRate: 1100, status: 'Booked' },
  { quotationRefCustomer: 'BCD Limited', quotationRefPol: 'CNSGH', quotationRefPod: 'USLGB', quotationRefEquipment: 'LCL', customerName: 'BCD Limited', pol: 'CNSGH', pod: 'USLGB', volume: '11 CBM', equipment: 'LCL', type: 'Import', buyRate: (findBuyRate('CNSGH', 'USLGB', 'LCL')*11), sellRate: (70*11), status: 'Booked' },
  { quotationRefCustomer: 'DEF Limited', quotationRefPol: 'INNSA', quotationRefPod: 'GBFXS', quotationRefEquipment: '40HC', customerName: 'DEF Limited', pol: 'INNSA', pod: 'GBFXS', volume: '2x40HC', equipment: '40HC', type: 'Export', buyRate: findBuyRate('INNSA', 'GBFXS', '40HC', 'ONEY'), sellRate: 1200, status: 'Booked' },
  { quotationRefCustomer: 'FED Limited', quotationRefPol: 'USSAV', quotationRefPod: 'AEDXB', quotationRefEquipment: '40GP', customerName: 'FED Limited', pol: 'USSAV', pod: 'AEDXB', volume: '6x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('USSAV', 'AEDXB', '40GP', 'HLCU'), sellRate: 1100, status: 'Booked' },
  { quotationRefCustomer: 'DEF Limited', quotationRefPol: 'GBFXS', quotationRefPod: 'USSAV', quotationRefEquipment: '40GP', customerName: 'DEF Limited', pol: 'GBFXS', pod: 'USSAV', volume: '2x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('GBFXS', 'USSAV', '40GP', 'MAEU'), sellRate: 1150, status: 'Booked' },
];


export const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));
