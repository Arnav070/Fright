
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

// Updated FCL Buy Rates based on the provided image
const fclBuyRatesFromImage: Omit<BuyRate, 'id' | 'validFrom' | 'validTo' | 'freightModeType' | 'weightCapacity' | 'minBooking'>[] = [
  // ONEY | INMAA | USLGB | GDSM
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '20GP', rate: 1200 },
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40GP', rate: 1150 },
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40HC', rate: 1150 },
  // MAEU | INMAA | USLGB | GDSM
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '20GP', rate: 1100 },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40GP', rate: 1200 },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40HC', rate: 1200 },
  // HLCU | INMAA | USLGB | GDSM
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '20GP', rate: 900 },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40GP', rate: 1600 },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipment: '40HC', rate: 1600 },
  // ONEY | INNSA | GBFXS | GDSM
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '20GP', rate: 1100 },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40GP', rate: 1375 },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40HC', rate: 1375 },
  // HLCU | INNSA | GBFXS | GDSM
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '20GP', rate: 1200 },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40GP', rate: 1450 },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40HC', rate: 1450 },
  // MAEU | INNSA | GBFXS | GDSM
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '20GP', rate: 1000 },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40GP', rate: 1400 },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipment: '40HC', rate: 1400 },
  // HLCU | USSAV | AEDXB | GDSM
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '20GP', rate: 880 },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40GP', rate: 1000 },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40HC', rate: 1000 },
  // ONEY | USSAV | AEDXB | GDSM
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '20GP', rate: 980 },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40GP', rate: 1150 },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipment: '40HC', rate: 1150 },
  // MAEU | GBFXS | USSAV | GDSM
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '20GP', rate: 1000 },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40GP', rate: 1100 },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40HC', rate: 1100 },
  // MSCU | GBFXS | USSAV | GDSM
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '20GP', rate: 990 },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40GP', rate: 1200 },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40HC', rate: 1200 },
  // ONEY | GBFXS | USSAV | GDSM
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '20GP', rate: 800 },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40GP', rate: 1200 },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipment: '40HC', rate: 1200 },
];

export const initialMockBuyRates: BuyRate[] = fclBuyRatesFromImage.map((item, index) => ({
  ...item,
  id: `BR-IMG-${String(index + 1).padStart(4, '0')}`,
  freightModeType: 'Sea', // All rates from image are FCL, assumed Sea
  weightCapacity: item.equipment === '20GP' ? '21 TON' : (item.equipment === '40GP' ? '26 TON' : '28 TON'),
  minBooking: '1 TEU',
  validFrom: formatDateShort(startOfMonth(today)),
  validTo: formatDateShort(endOfMonth(today)),
})).concat([
  // Preserve existing LCL Buy Rate (not in the image)
  {
    id: `BR-LCL-001`, // Unique ID for LCL
    carrier: 'N/A',
    pol: 'CNSGH',
    pod: 'USLGB',
    commodity: 'GDSM',
    freightModeType: 'Sea',
    equipment: 'LCL',
    weightCapacity: '1 CBM',
    minBooking: '1 CBM',
    rate: 50,
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
   // Adding MSCU schedule based on buy rates
  { carrier: 'MSCU', origin: 'GBFXS', destination: 'USSAV', serviceRoute: 'S1', allocation: 2 },
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
  // Try to find a 20GP rate for this schedule's carrier and route
  const representativeBuyRate20GP = initialMockBuyRates.find(
    br => br.carrier === schedule.carrier &&
          br.pol === schedule.origin && // schedule.origin is port CODE
          br.pod === schedule.destination && // schedule.destination is port CODE
          br.equipment === '20GP'
  );
   // Try to find a 40GP rate
  const representativeBuyRate40GP = initialMockBuyRates.find(
    br => br.carrier === schedule.carrier &&
          br.pol === schedule.origin &&
          br.pod === schedule.destination &&
          br.equipment === '40GP'
  );
  // Try to find a 40HC rate
  const representativeBuyRate40HC = initialMockBuyRates.find(
    br => br.carrier === schedule.carrier &&
          br.pol === schedule.origin &&
          br.pod === schedule.destination &&
          br.equipment === '40HC'
  );

  // Push 20GP if found
  if (representativeBuyRate20GP) {
    mockScheduleRates.push({
      id: `SRATE-${schedule.id}-20GP`,
      carrier: schedule.carrier,
      origin: schedule.origin, // Port code
      destination: schedule.destination, // Port code
      voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()} / 20GP`,
      buyRate: representativeBuyRate20GP.rate,
      allocation: schedule.allocation > 1 ? Math.floor(schedule.allocation / 2) : schedule.allocation, // Split allocation somewhat
    });
  }
  // Push 40GP if found
  if (representativeBuyRate40GP) {
     mockScheduleRates.push({
      id: `SRATE-${schedule.id}-40GP`,
      carrier: schedule.carrier,
      origin: schedule.origin,
      destination: schedule.destination,
      voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()} / 40GP`,
      buyRate: representativeBuyRate40GP.rate,
      allocation: schedule.allocation > 1 ? Math.ceil(schedule.allocation / 3) : schedule.allocation,
    });
  }
   // Push 40HC if found
  if (representativeBuyRate40HC) {
    mockScheduleRates.push({
      id: `SRATE-${schedule.id}-40HC`,
      carrier: schedule.carrier,
      origin: schedule.origin,
      destination: schedule.destination,
      voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()} / 40HC`,
      buyRate: representativeBuyRate40HC.rate,
      allocation: schedule.allocation > 1 ? Math.ceil(schedule.allocation / 3) : schedule.allocation,
    });
  }

  // If no specific equipment rate found for the schedule, add a generic one (fallback)
  if (!representativeBuyRate20GP && !representativeBuyRate40GP && !representativeBuyRate40HC) {
     mockScheduleRates.push({
        id: `SRATE-${schedule.id}-GEN`,
        carrier: schedule.carrier,
        origin: schedule.origin,
        destination: schedule.destination,
        voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()} / GEN`,
        buyRate: (Math.floor(Math.random() * 500) + 800), // Random fallback
        allocation: schedule.allocation,
      });
  }
});
// Ensure LCL rate is present if CNSGH to USLGB schedule exists
const lclSchedule = initialMockSchedules.find(s => s.origin === 'CNSGH' && s.destination === 'USLGB');
const lclBuyRate = initialMockBuyRates.find(br => br.equipment === 'LCL' && br.pol === 'CNSGH' && br.pod === 'USLGB');
if (lclBuyRate) { // Removed lclSchedule check to ensure LCL rate is always available if buyrate exists
    mockScheduleRates.push({
        id: `SRATE-LCL-CNSGH-USLGB-001`,
        carrier: lclBuyRate.carrier, // Use carrier from LCL buy rate, or 'N/A'
        origin: 'CNSGH',
        destination: 'USLGB',
        voyageDetails: `LCL Service / ${format(addDays(today, 10), 'ddMMMyy').toUpperCase()} / LCL`, // Example voyage
        buyRate: lclBuyRate.rate,
        allocation: 50, // Example allocation for LCL
    });
}


// Data for Firestore Seeding
const findBuyRate = (pol: string, pod: string, equipment: string, carrier?: string): number => {
    const polPort = mockPorts.find(p => p.name === pol);
    const podPort = mockPorts.find(p => p.name === pod);

    if (!polPort || !podPort) return equipment === 'LCL' ? 50 : 1000; // fallback if port names not found

    const polCode = polPort.code;
    const podCode = podPort.code;

    const potentialRates = initialMockBuyRates.filter(br =>
        br.pol === polCode &&
        br.pod === podCode &&
        br.equipment === equipment &&
        (carrier ? br.carrier === carrier : true)
    );
    if (potentialRates.length > 0) {
        return potentialRates.sort((a,b) => a.rate - b.rate)[0].rate; // take cheapest
    }
    return equipment === 'LCL' ? 50 : 1000; // fallback
};


export const quotationsToSeedFromImage: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>[] = [
  // ABC Limited, Chennai -> Long Beach
  { customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', equipment: '20GP', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '20GP', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='20GP')?.id },
  { customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', equipment: '40GP', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '40GP', 'MAEU'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='40GP')?.id },
  { customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', equipment: '40HC', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '40HC', 'MAEU'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='40HC')?.id },
  // FED Limited, Savannah -> Dubai
  { customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', equipment: '20GP', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '20GP', 'HLCU'), sellRate: 920, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='20GP')?.id },
  { customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', equipment: '40GP', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '40GP', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='40GP')?.id },
  { customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', equipment: '40HC', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '40HC', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='40HC')?.id },
  // DEF Limited, Felixstowe -> Savannah
  { customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', equipment: '20GP', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '20GP', 'ONEY'), sellRate: 850, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='20GP')?.id },
  { customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', equipment: '40GP', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '40GP', 'MAEU'), sellRate: 1150, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='40GP')?.id },
  { customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', equipment: '40HC', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '40HC', 'MAEU'), sellRate: 1150, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='40HC')?.id },
  // DEF Limited, Nhava Sheva -> Felixstowe
  { customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', equipment: '20GP', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '20GP', 'MAEU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='20GP')?.id },
  { customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', equipment: '40GP', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '40GP', 'ONEY'), sellRate: 1475, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='40GP')?.id },
  { customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', equipment: '40HC', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '40HC', 'ONEY'), sellRate: 1475, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='40HC')?.id },
  // BCD Limited (LCL), Shanghai -> Long Beach
  { customerName: 'BCD Limited', pol: 'Shanghai', pod: 'Long Beach', equipment: 'LCL', type: 'Import', buyRate: (findBuyRate('Shanghai', 'Long Beach', 'LCL') * 11), sellRate: (70 * 11), status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.pol==='CNSGH'&&br.pod==='USLGB'&&br.equipment==='LCL')?.id },
];

type TempBookingSeedData = Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'quotationId' | 'profitAndLoss'> & { quotationRefCustomer: string, quotationRefPol: string, quotationRefPod: string, quotationRefEquipment: string };

export const bookingsToSeedFromImageBase: TempBookingSeedData[] = [
  { quotationRefCustomer: 'ABC Limited', quotationRefPol: 'Chennai', quotationRefPod: 'Long Beach', quotationRefEquipment: '20GP', customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', volume: '3x20GP', equipment: '20GP', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '20GP','HLCU'), sellRate: 1100, status: 'Booked' },
  { quotationRefCustomer: 'BCD Limited', quotationRefPol: 'Shanghai', quotationRefPod: 'Long Beach', quotationRefEquipment: 'LCL', customerName: 'BCD Limited', pol: 'Shanghai', pod: 'Long Beach', volume: '11 CBM', equipment: 'LCL', type: 'Import', buyRate: (findBuyRate('Shanghai', 'Long Beach', 'LCL')*11), sellRate: (70*11), status: 'Booked' },
  { quotationRefCustomer: 'DEF Limited', quotationRefPol: 'Nhava Sheva', quotationRefPod: 'Felixstowe', quotationRefEquipment: '40HC', customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', volume: '2x40HC', equipment: '40HC', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '40HC', 'ONEY'), sellRate: 1475, status: 'Booked' },
  { quotationRefCustomer: 'FED Limited', quotationRefPol: 'Savannah', quotationRefPod: 'Dubai', quotationRefEquipment: '40GP', customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', volume: '6x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '40GP', 'HLCU'), sellRate: 1100, status: 'Booked' },
  { quotationRefCustomer: 'DEF Limited', quotationRefPol: 'Felixstowe', quotationRefPod: 'Savannah', quotationRefEquipment: '40GP', customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', volume: '2x40GP', equipment: '40GP', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '40GP', 'MAEU'), sellRate: 1150, status: 'Booked' },
];


export const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

