
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
const fclBuyRatesFromImageRaw: Omit<BuyRate, 'id' | 'validFrom' | 'validTo' | 'freightModeType' | 'weightCapacity' | 'minBooking' | 'equipment'> & { equipmentCode: string }[] = [
  // ONEY | INMAA | USLGB | GDSM
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '20GP', rate: 1200 },
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '40GP', rate: 1150 },
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '40HC', rate: 1150 },
  // MAEU | INMAA | USLGB | GDSM
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '20GP', rate: 1100 },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '40GP', rate: 1200 },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '40HC', rate: 1200 },
  // HLCU | INMAA | USLGB | GDSM
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '20GP', rate: 900 },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '40GP', rate: 1600 },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', equipmentCode: '40HC', rate: 1600 },
  // ONEY | INNSA | GBFXS | GDSM
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '20GP', rate: 1100 },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '40GP', rate: 1375 },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '40HC', rate: 1375 },
  // HLCU | INNSA | GBFXS | GDSM
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '20GP', rate: 1200 },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '40GP', rate: 1450 },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '40HC', rate: 1450 },
  // MAEU | INNSA | GBFXS | GDSM
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '20GP', rate: 1000 },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '40GP', rate: 1400 },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', equipmentCode: '40HC', rate: 1400 },
  // HLCU | USSAV | AEDXB | GDSM
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipmentCode: '20GP', rate: 880 },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipmentCode: '40GP', rate: 1000 },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipmentCode: '40HC', rate: 1000 },
  // ONEY | USSAV | AEDXB | GDSM
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipmentCode: '20GP', rate: 980 },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipmentCode: '40GP', rate: 1150 },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', equipmentCode: '40HC', rate: 1150 },
  // MAEU | GBFXS | USSAV | GDSM
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '20GP', rate: 1000 },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '40GP', rate: 1100 },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '40HC', rate: 1100 },
  // MSCU | GBFXS | USSAV | GDSM
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '20GP', rate: 990 },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '40GP', rate: 1200 },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '40HC', rate: 1200 },
  // ONEY | GBFXS | USSAV | GDSM
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '20GP', rate: 800 },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '40GP', rate: 1200 },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', equipmentCode: '40HC', rate: 1200 },
];

const mapEquipmentCodeToName = (code: string): string => {
  switch (code) {
    case '20GP': return '20ft Dry';
    case '40GP': return '40ft Dry';
    case '40HC': return '40ft High Cube';
    case '20RF': return '20ft Reefer'; // Assuming 20RF maps to 20ft Reefer
    case 'LCL': return 'LCL';
    default: return code; // Fallback for unknown codes
  }
};

export const initialMockBuyRates: BuyRate[] = fclBuyRatesFromImageRaw.map((item, index) => ({
  ...item,
  id: `BR-IMG-${String(index + 1).padStart(4, '0')}`,
  equipment: mapEquipmentCodeToName(item.equipmentCode),
  freightModeType: 'Sea', 
  weightCapacity: item.equipmentCode === '20GP' ? '21 TON' : (item.equipmentCode === '40GP' ? '26 TON' : '28 TON'),
  minBooking: '1 TEU',
  validFrom: formatDateShort(startOfMonth(today)),
  validTo: formatDateShort(endOfMonth(today)),
})).concat([
  {
    id: `BR-LCL-001`,
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
  { carrier: 'MSCU', origin: 'GBFXS', destination: 'USSAV', serviceRoute: 'S1', allocation: 2 },
];

export const initialMockSchedules: Schedule[] = schedulesFromImage.map((item, index) => ({
  ...item,
  id: `SCH-IMG-${String(index + 1).padStart(4, '0')}`,
  etd: formatDateISO(addDays(today, index * 3)),
  eta: formatDateISO(addDays(today, (index * 3) + (15 + Math.floor(Math.random() * 10)))),
  frequency: 'Weekly',
}));

export const mockScheduleRates: ScheduleRate[] = [];
initialMockSchedules.forEach((schedule) => {
  const addRateIfFound = (equipmentName: string, idSuffix: string, allocationSplitFn: (total: number) => number) => {
    const buyRateEntry = initialMockBuyRates.find(
      br => br.carrier === schedule.carrier &&
            br.pol === schedule.origin &&
            br.pod === schedule.destination &&
            br.equipment === equipmentName
    );
    if (buyRateEntry) {
      mockScheduleRates.push({
        id: `SRATE-${schedule.id}-${idSuffix}`,
        carrier: schedule.carrier,
        origin: schedule.origin,
        destination: schedule.destination,
        voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()} / ${equipmentName}`,
        buyRate: buyRateEntry.rate,
        allocation: allocationSplitFn(schedule.allocation),
      });
    }
    return !!buyRateEntry;
  };

  let rateFound = false;
  rateFound = addRateIfFound('20ft Dry', '20ftDry', total => total > 1 ? Math.floor(total / 2) : total) || rateFound;
  rateFound = addRateIfFound('40ft Dry', '40ftDry', total => total > 1 ? Math.ceil(total / 3) : total) || rateFound;
  rateFound = addRateIfFound('40ft High Cube', '40ftHC', total => total > 1 ? Math.ceil(total / 3) : total) || rateFound;
  // Add other equipment types from your new list if they should be derived similarly, e.g., "20ft Reefer"
  rateFound = addRateIfFound('20ft Reefer', '20ftReefer', total => total > 1 ? Math.ceil(total / 3) : total) || rateFound;


  if (!rateFound) { // Fallback if no specific equipment rate matched for the schedule
     mockScheduleRates.push({
        id: `SRATE-${schedule.id}-GEN`,
        carrier: schedule.carrier,
        origin: schedule.origin,
        destination: schedule.destination,
        voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()} / GEN`,
        buyRate: (Math.floor(Math.random() * 500) + 800),
        allocation: schedule.allocation,
      });
  }
});

const lclBuyRateEntry = initialMockBuyRates.find(br => br.equipment === 'LCL' && br.pol === 'CNSGH' && br.pod === 'USLGB');
if (lclBuyRateEntry) {
    mockScheduleRates.push({
        id: `SRATE-LCL-CNSGH-USLGB-001`,
        carrier: lclBuyRateEntry.carrier,
        origin: 'CNSGH',
        destination: 'USLGB',
        voyageDetails: `LCL Service / ${format(addDays(today, 10), 'ddMMMyy').toUpperCase()} / LCL`,
        buyRate: lclBuyRateEntry.rate,
        allocation: 50,
    });
}


export const findBuyRate = (pol: string, pod: string, equipment: string, carrier?: string): number => {
    const polPort = mockPorts.find(p => p.name === pol);
    const podPort = mockPorts.find(p => p.name === pod);

    if (!polPort || !podPort) return equipment === 'LCL' ? 50 : 1000;

    const polCode = polPort.code;
    const podCode = podPort.code;

    const potentialRates = initialMockBuyRates.filter(br =>
        br.pol === polCode &&
        br.pod === podCode &&
        br.equipment === equipment && // This will now use new equipment names
        (carrier ? br.carrier === carrier : true)
    );
    if (potentialRates.length > 0) {
        return potentialRates.sort((a,b) => a.rate - b.rate)[0].rate;
    }
    return equipment === 'LCL' ? 50 : (equipment === 'Air Freight Unit' ? 200 : 1000); // Added fallback for Air
};


export const quotationsToSeedFromImage: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>[] = [
  { customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', equipment: '20ft Dry', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '20ft Dry', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='20ft Dry')?.id },
  { customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', equipment: '40ft Dry', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '40ft Dry', 'MAEU'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='40ft Dry')?.id },
  { customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', equipment: '40ft High Cube', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '40ft High Cube', 'MAEU'), sellRate: 1200, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INMAA'&&br.pod==='USLGB'&&br.equipment==='40ft High Cube')?.id },
  { customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', equipment: '20ft Dry', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '20ft Dry', 'HLCU'), sellRate: 920, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='20ft Dry')?.id },
  { customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', equipment: '40ft Dry', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '40ft Dry', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='40ft Dry')?.id },
  { customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', equipment: '40ft High Cube', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '40ft High Cube', 'HLCU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'HLCU' && br.pol==='USSAV'&&br.pod==='AEDXB'&&br.equipment==='40ft High Cube')?.id },
  { customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', equipment: '20ft Dry', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '20ft Dry', 'ONEY'), sellRate: 850, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='20ft Dry')?.id },
  { customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', equipment: '40ft Dry', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '40ft Dry', 'MAEU'), sellRate: 1150, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='40ft Dry')?.id },
  { customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', equipment: '40ft High Cube', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '40ft High Cube', 'MAEU'), sellRate: 1150, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='GBFXS'&&br.pod==='USSAV'&&br.equipment==='40ft High Cube')?.id },
  { customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', equipment: '20ft Dry', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '20ft Dry', 'MAEU'), sellRate: 1100, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'MAEU' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='20ft Dry')?.id },
  { customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', equipment: '40ft Dry', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '40ft Dry', 'ONEY'), sellRate: 1475, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='40ft Dry')?.id },
  { customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', equipment: '40ft High Cube', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '40ft High Cube', 'ONEY'), sellRate: 1475, status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.carrier === 'ONEY' && br.pol==='INNSA'&&br.pod==='GBFXS'&&br.equipment==='40ft High Cube')?.id },
  { customerName: 'BCD Limited', pol: 'Shanghai', pod: 'Long Beach', equipment: 'LCL', type: 'Import', buyRate: (findBuyRate('Shanghai', 'Long Beach', 'LCL') * 11), sellRate: (70 * 11), status: 'Draft', selectedRateId: initialMockBuyRates.find(br=>br.pol==='CNSGH'&&br.pod==='USLGB'&&br.equipment==='LCL')?.id },
  { customerName: 'Air Cargo Inc', pol: 'Shanghai', pod: 'Long Beach', equipment: 'Air Freight Unit', type: 'Import', buyRate: findBuyRate('Shanghai', 'Long Beach', 'Air Freight Unit') * 5, sellRate: 250 * 5, status: 'Draft', selectedRateId: undefined }, // Example for Air Freight
];

type TempBookingSeedData = Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'quotationId' | 'profitAndLoss'> & { quotationRefCustomer: string, quotationRefPol: string, quotationRefPod: string, quotationRefEquipment: string };

export const bookingsToSeedFromImageBase: TempBookingSeedData[] = [
  { quotationRefCustomer: 'ABC Limited', quotationRefPol: 'Chennai', quotationRefPod: 'Long Beach', quotationRefEquipment: '20ft Dry', customerName: 'ABC Limited', pol: 'Chennai', pod: 'Long Beach', equipment: '20ft Dry', type: 'Export', buyRate: findBuyRate('Chennai', 'Long Beach', '20ft Dry','HLCU'), sellRate: 1100, status: 'Booked' },
  { quotationRefCustomer: 'BCD Limited', quotationRefPol: 'Shanghai', quotationRefPod: 'Long Beach', quotationRefEquipment: 'LCL', customerName: 'BCD Limited', pol: 'Shanghai', pod: 'Long Beach', equipment: 'LCL', type: 'Import', buyRate: (findBuyRate('Shanghai', 'Long Beach', 'LCL')*11), sellRate: (70*11), status: 'Booked' },
  { quotationRefCustomer: 'DEF Limited', quotationRefPol: 'Nhava Sheva', quotationRefPod: 'Felixstowe', quotationRefEquipment: '40ft High Cube', customerName: 'DEF Limited', pol: 'Nhava Sheva', pod: 'Felixstowe', equipment: '40ft High Cube', type: 'Export', buyRate: findBuyRate('Nhava Sheva', 'Felixstowe', '40ft High Cube', 'ONEY'), sellRate: 1475, status: 'Booked' },
  { quotationRefCustomer: 'FED Limited', quotationRefPol: 'Savannah', quotationRefPod: 'Dubai', quotationRefEquipment: '40ft Dry', customerName: 'FED Limited', pol: 'Savannah', pod: 'Dubai', equipment: '40ft Dry', type: 'Export', buyRate: findBuyRate('Savannah', 'Dubai', '40ft Dry', 'HLCU'), sellRate: 1100, status: 'Booked' },
  { quotationRefCustomer: 'DEF Limited', quotationRefPol: 'Felixstowe', quotationRefPod: 'Savannah', quotationRefEquipment: '40ft Dry', customerName: 'DEF Limited', pol: 'Felixstowe', pod: 'Savannah', equipment: '40ft Dry', type: 'Export', buyRate: findBuyRate('Felixstowe', 'Savannah', '40ft Dry', 'MAEU'), sellRate: 1150, status: 'Booked' },
];


export const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));
