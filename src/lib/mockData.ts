
import type { User, Quotation, QuotationStatus, Booking, BuyRate, Schedule, Port, ScheduleRate } from './types';
import { format, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const today = new Date();
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd HH:mm:ss');
const formatDateISO = (date: Date) => date.toISOString();
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
  { code: 'SGSIN', name: 'Singapore', country: 'Singapore' },
  { code: 'HKHKG', name: 'Hong Kong', country: 'Hong Kong SAR' },
  { code: 'NLRTM', name: 'Rotterdam', country: 'Netherlands' },
  { code: 'DEHAM', name: 'Hamburg', country: 'Germany' },
  { code: 'USNYC', name: 'New York', country: 'USA' },
  { code: 'BEANR', name: 'Antwerp', country: 'Belgium' },
  { code: 'MYPKG', name: 'Port Klang', country: 'Malaysia' },
];

// Quotations and Bookings are now fetched from Firestore.
// The initial mock data for them can be removed or commented out if you plan to populate Firestore manually.
// For a clean start with Firestore, ensure your 'quotations' and 'bookings' collections are empty or have the data you want.

// export const initialMockQuotations: Quotation[] = []; // Now from Firestore
// export const initialMockBookings: Booking[] = []; // Now from Firestore


// --- Data from "Freight Module (Buyrates)" --- (Still mock)
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
      freightModeType: 'Sea',
      equipment: equipmentKey,
      weightCapacity: equipmentKey === '20GP' ? '21 TON' : (equipmentKey === '40GP' ? '26 TON' : '28 TON'),
      minBooking: '1 TEU',
      rate: rate,
      validFrom: formatDateShort(startOfMonth(today)), // String 'yyyy-MM-dd'
      validTo: formatDateShort(endOfMonth(today)),   // String 'yyyy-MM-dd'
    });
  });
});


// --- Data from "Schedule" --- (Still mock)
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
  etd: formatDateISO(addDays(today, index * 7)), // ISO String
  eta: formatDateISO(addDays(today, (index * 7) + (Math.floor(Math.random() * 10) + 15))), // ISO String
  frequency: 'Weekly',
}));


// --- Derived mockScheduleRates --- (Still mock)
export const mockScheduleRates: ScheduleRate[] = [];
initialMockSchedules.forEach((schedule, index) => {
  const representativeBuyRate = initialMockBuyRates.find(
    br => br.carrier === schedule.carrier &&
          br.pol === schedule.origin &&
          br.pod === schedule.destination &&
          br.equipment === '20GP'
  );

  mockScheduleRates.push({
    id: `SRATE-${String(5001 + index).padStart(5, '0')}`,
    carrier: schedule.carrier,
    origin: schedule.origin,
    destination: schedule.destination,
    voyageDetails: `${schedule.serviceRoute} / ${format(parseISO(schedule.etd), 'ddMMMyy').toUpperCase()}`,
    buyRate: representativeBuyRate ? representativeBuyRate.rate : (Math.floor(Math.random() * 1000) + 500),
    allocation: schedule.allocation,
  });
});


export const simulateDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));
