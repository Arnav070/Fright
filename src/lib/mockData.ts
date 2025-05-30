
import type { User, Quotation, QuotationStatus, Booking, BuyRate, Schedule, Port, ScheduleRate } from './types';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';

const today = new Date();
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd HH:mm:ss');
const formatDateShort = (date: Date) => format(date, 'yyyy-MM-dd');

export const mockUsers: User[] = [
  { id: 'admin-001', email: 'admin@cargoly.com', name: 'Admin User', role: 'Admin' },
  { id: 'qc-001', email: 'quotation@cargoly.com', name: 'Quotation Creator', role: 'QuotationCreator' },
  { id: 'bc-001', email: 'booking@cargoly.com', name: 'Booking Creator', role: 'BookingCreator' },
  { id: 'rev-001', email: 'reviewer@cargoly.com', name: 'Reviewer User', role: 'Reviewer' },
];

export const mockPorts: Port[] = [
  { code: 'INMAA', name: 'Chennai (Madras)', country: 'India' },
  { code: 'USLGB', name: 'Long Beach', country: 'USA' },
  { code: 'CNSGH', name: 'Shanghai', country: 'China' },
  { code: 'INNSA', name: 'Nhava Sheva', country: 'India' },
  { code: 'GBFXS', name: 'Felixstowe', country: 'UK' },
  { code: 'USSAV', name: 'Savannah', country: 'USA' },
  { code: 'AEDXB', name: 'Dubai', country: 'UAE' },
  // Keeping some of the previous distinct ports if not directly replaced
  { code: 'SGSIN', name: 'Singapore', country: 'Singapore' },
  { code: 'HKHKG', name: 'Hong Kong', country: 'Hong Kong SAR' },
  { code: 'NLRTM', name: 'Rotterdam', country: 'Netherlands' },
  { code: 'DEHAM', name: 'Hamburg', country: 'Germany' },
  { code: 'USNYC', name: 'New York', country: 'USA' },
  { code: 'BEANR', name: 'Antwerp', country: 'Belgium' },
  { code: 'MYPKG', name: 'Port Klang', country: 'Malaysia' },
];


// --- Data from "Rate Filing Quotation" ---
const rawQuotationData = [
  { customerName: 'ABC Limited', pol: 'INMAA', pod: 'USLGB', rates: { '20GP': 1100, '40GP': 1200, '40HC': 1200 } },
  { customerName: 'FED Limited', pol: 'USSAV', pod: 'AEDXB', rates: { '20GP': 920, '40GP': 1100, '40HC': 1100 } },
  { customerName: 'DEF Limited', pol: 'GBFXS', pod: 'USSAV', rates: { '20GP': 850, '40GP': 1150, '40HC': 1150 } },
  { customerName: 'DEF Limited', pol: 'INNSA', pod: 'GBFXS', rates: { '20GP': 900, '40GP': 1200, '40HC': 1200 } },
];

export const initialMockQuotations: Quotation[] = [];
rawQuotationData.forEach((item, index) => {
  Object.entries(item.rates).forEach(([equipment, sellRate], eqIndex) => {
    const buyRate = Math.round(sellRate * 0.8); // Assuming 20% margin for mock
    initialMockQuotations.push({
      id: `QTN-${String(1001 + initialMockQuotations.length).padStart(6, '0')}`,
      customerName: item.customerName,
      pol: item.pol,
      pod: item.pod,
      volume: `1x${equipment}`,
      equipment: equipment,
      type: 'Export', // Default
      buyRate: buyRate,
      sellRate: sellRate,
      profitAndLoss: sellRate - buyRate,
      status: 'Draft', // Default
      createdAt: formatDate(addDays(today, - (rawQuotationData.length - index))), // Spread out creation dates
      updatedAt: formatDate(addDays(today, - (rawQuotationData.length - index))),
      selectedRateId: `DUMMYRATE-${eqIndex}`
    });
  });
});


// --- Data from "Booking module" ---
const rawBookingData = [
  { pol: 'INMAA', pod: 'USLGB', volumes: 3, equipmentInfo: '20 footer', customerName: 'ABC Limited', typeDetail: 'FCL', freightType: 'FAK' },
  { pol: 'CNSGH', pod: 'USLGB', volumes: null, equipmentInfo: '11 CBM / 6000 KGS', customerName: 'BCD LIMited', typeDetail: 'LCL', freightType: null },
  { pol: 'INNSA', pod: 'GBFXS', volumes: 2, equipmentInfo: '40 footer HC', customerName: 'DEF Limited', typeDetail: 'FCL', freightType: 'NAC' },
  { pol: 'USSAV', pod: 'AEDXB', volumes: 6, equipmentInfo: '40 Footer', customerName: 'FED Limited', typeDetail: 'FCL', freightType: 'FAK' },
  { pol: 'GBFXS', pod: 'USSAV', volumes: 2, equipmentInfo: '40 Footer', customerName: 'DEF Limited', typeDetail: 'FCL', freightType: 'NAC' },
];

export const initialMockBookings: Booking[] = [];
rawBookingData.forEach((item, index) => {
  let equipment = '';
  let volume = '';

  if (item.equipmentInfo.includes('20 footer')) equipment = '20GP';
  else if (item.equipmentInfo.includes('40 footer HC')) equipment = '40HC';
  else if (item.equipmentInfo.includes('40 Footer')) equipment = '40GP';
  else if (item.equipmentInfo.includes('CBM')) equipment = 'LCL';

  if (item.volumes) {
    volume = `${item.volumes}x${equipment} (${item.typeDetail})`;
  } else if (equipment === 'LCL') {
    volume = `${item.equipmentInfo} (${item.typeDetail})`;
  } else {
    volume = `1x${equipment} (${item.typeDetail})`; // Default if volume count not specified
  }
  
  // Try to find matching quotation for rates
  const matchingQuotation = initialMockQuotations.find(
    q => q.customerName === item.customerName && q.pol === item.pol && q.pod === item.pod && q.equipment === equipment
  );

  let buyRate = equipment === '20GP' ? 800 : (equipment === 'LCL' ? 50 : 1200);
  let sellRate = equipment === '20GP' ? 1000 : (equipment === 'LCL' ? 70 : 1500);

  if (matchingQuotation) {
    buyRate = matchingQuotation.buyRate;
    sellRate = matchingQuotation.sellRate;
  }
  
  initialMockBookings.push({
    id: `BKNG-${String(2001 + index).padStart(6, '0')}`,
    quotationId: matchingQuotation ? matchingQuotation.id : `QTN-DUMMY-${index}`,
    customerName: item.customerName,
    pol: item.pol,
    pod: item.pod,
    volume: volume,
    equipment: equipment,
    type: 'Export', // Default
    buyRate: buyRate,
    sellRate: sellRate,
    profitAndLoss: sellRate - buyRate,
    status: 'Booked', // Default
    createdAt: formatDate(addDays(today, - (rawBookingData.length - index))),
    updatedAt: formatDate(addDays(today, - (rawBookingData.length - index))),
    selectedCarrierRateId: `DUMMYCARRIERRATE-${index}`
  });
});

// Mark related quotations as 'Booking Completed'
initialMockBookings.forEach(booking => {
  const qIndex = initialMockQuotations.findIndex(q => q.id === booking.quotationId);
  if (qIndex !== -1) {
    initialMockQuotations[qIndex].status = 'Booking Completed';
    initialMockQuotations[qIndex].updatedAt = formatDate(new Date(booking.createdAt));
  }
});


// --- Data from "Freight Module (Buyrates)" ---
const rawBuyRateData = [
  { carrier: 'ONEY', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', rates: { '20GP': 1200, '40GP': 1150, '40HC': 1150 } },
  { carrier: 'MAEU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', rates: { '20GP': 1100, '40GP': 1200, '40HC': 1200 } },
  { carrier: 'HLCU', pol: 'INMAA', pod: 'USLGB', commodity: 'GDSM', rates: { '20GP': 900, '40GP': 1600, '40HC': 1600 } },
  { carrier: 'ONEY', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', rates: { '20GP': 1100, '40GP': 1375, '40HC': 1375 } },
  { carrier: 'HLCU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', rates: { '20GP': 1200, '40GP': 1450, '40HC': 1450 } },
  { carrier: 'MAEU', pol: 'INNSA', pod: 'GBFXS', commodity: 'GDSM', rates: { '20GP': 1000, '40GP': 1400, '40HC': 1400 } },
  { carrier: 'HLCU', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', rates: { '20GP': 880, '40GP': 1000, '40HC': 1000 } },
  { carrier: 'ONEY', pol: 'USSAV', pod: 'AEDXB', commodity: 'GDSM', rates: { '20GP': 980, '40GP': 1150, '40HC': 1150 } },
  { carrier: 'MAEU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', rates: { '20GP': 1000, '40GP': 1100, '40HC': 1100 } },
  { carrier: 'MSCU', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', rates: { '20GP': 990, '40GP': 1200, '40HC': 1200 } },
  { carrier: 'ONEY', pol: 'GBFXS', pod: 'USSAV', commodity: 'GDSM', rates: { '20GP': 800, '40GP': 1200, '40HC': 1200 } },
];

export const initialMockBuyRates: BuyRate[] = [];
rawBuyRateData.forEach((item) => {
  Object.entries(item.rates).forEach(([equipmentKey, rate]) => {
    initialMockBuyRates.push({
      id: `BR-${String(3001 + initialMockBuyRates.length).padStart(4, '0')}`,
      carrier: item.carrier,
      pol: item.pol,
      pod: item.pod,
      commodity: item.commodity,
      freightModeType: 'Sea', // Default
      equipment: equipmentKey, // '20GP', '40GP', '40HC'
      weightCapacity: equipmentKey === '20GP' ? '21 TON' : (equipmentKey === '40GP' ? '26 TON' : '28 TON'), // Example capacity
      minBooking: '1 TEU', // Default
      rate: rate,
      validFrom: formatDateShort(startOfMonth(today)),
      validTo: formatDateShort(endOfMonth(today)),
    });
  });
});


// --- Data from "Schedule" ---
const rawScheduleData = [
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

export const initialMockSchedules: Schedule[] = rawScheduleData.map((item, index) => ({
  id: `SCH-${String(4001 + index).padStart(4, '0')}`,
  carrier: item.carrier,
  origin: item.origin,
  destination: item.destination,
  serviceRoute: item.serviceRoute,
  allocation: item.allocation,
  etd: formatDate(addDays(today, index * 7)), // Weekly departures from today
  eta: formatDate(addDays(today, (index * 7) + (Math.floor(Math.random() * 10) + 15))), // ETA 15-25 days after ETD
  frequency: 'Weekly', // Default
}));

// --- Derived mockScheduleRates ---
export const mockScheduleRates: ScheduleRate[] = [];
initialMockSchedules.forEach((schedule, index) => {
  // Find a representative buy rate (e.g., for 20GP) for this schedule's route and carrier
  const representativeBuyRate = initialMockBuyRates.find(
    br => br.carrier === schedule.carrier &&
          br.pol === schedule.origin &&
          br.pod === schedule.destination &&
          br.equipment === '20GP' // Using 20GP as a common representative equipment
  );

  mockScheduleRates.push({
    id: `SRATE-${String(5001 + index).padStart(5, '0')}`,
    carrier: schedule.carrier,
    origin: schedule.origin,
    destination: schedule.destination,
    voyageDetails: `${schedule.serviceRoute} / ${format(new Date(schedule.etd), 'ddMMMyy').toUpperCase()}`,
    buyRate: representativeBuyRate ? representativeBuyRate.rate : (Math.floor(Math.random() * 1000) + 500), // Fallback buy rate
    allocation: schedule.allocation,
  });
});


// Helper to simulate API delay
export const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));
