
import type { User, UserRole, Quotation, QuotationStatus, Booking, BuyRate, Schedule, Port, ScheduleRate } from './types';
import { format } from 'date-fns';

const today = new Date();
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd HH:mm:ss');

export const mockUsers: User[] = [
  { id: 'admin-001', email: 'admin@cargoly.com', name: 'Admin User', role: 'Admin' },
  { id: 'qc-001', email: 'quotation@cargoly.com', name: 'Quotation Creator', role: 'QuotationCreator' },
  { id: 'bc-001', email: 'booking@cargoly.com', name: 'Booking Creator', role: 'BookingCreator' },
  { id: 'rev-001', email: 'reviewer@cargoly.com', name: 'Reviewer User', role: 'Reviewer' },
];

export const mockPorts: Port[] = [
  { code: 'SGSIN', name: 'Singapore', country: 'Singapore' },
  { code: 'HKHKG', name: 'Hong Kong', country: 'Hong Kong SAR' },
  { code: 'CNSHA', name: 'Shanghai', country: 'China' },
  { code: 'AEJEA', name: 'Jebel Ali', country: 'UAE' },
  { code: 'NLRTM', name: 'Rotterdam', country: 'Netherlands' },
  { code: 'DEHAM', name: 'Hamburg', country: 'Germany' },
  { code: 'USLAX', name: 'Los Angeles', country: 'USA' },
  { code: 'USNYC', name: 'New York', country: 'USA' },
  { code: 'BEANR', name: 'Antwerp', country: 'Belgium' },
  { code: 'MYPKG', name: 'Port Klang', country: 'Malaysia' },
];

const getRandomPort = (): string => mockPorts[Math.floor(Math.random() * mockPorts.length)].name;
const getRandomStatus = (): QuotationStatus => {
  const statuses: QuotationStatus[] = ['Draft', 'Submitted', 'Booking Completed', 'Cancelled'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};
const getRandomEquipment = (): string => {
    const equipments = ['20ft Dry', '40ft Dry', '40ft High Cube', '20ft Reefer'];
    return equipments[Math.floor(Math.random() * equipments.length)];
};
const getRandomVolume = (): string => `${Math.floor(Math.random() * 5) + 1}x${getRandomEquipment().split(' ')[1]}`;


export const initialMockQuotations: Quotation[] = Array.from({ length: 20 }, (_, i) => {
  const buyRate = Math.floor(Math.random() * 2000) + 500;
  const sellRate = buyRate + Math.floor(Math.random() * 500) + 100;
  return {
    id: `QTN-${String(1001 + i).padStart(6, '0')}`,
    customerName: `Customer ${String.fromCharCode(65 + (i % 26))}${Math.floor(i/26) || ''}`,
    pol: getRandomPort(),
    pod: getRandomPort(),
    volume: getRandomVolume(),
    equipment: getRandomEquipment(),
    type: (i % 2 === 0) ? 'Import' : 'Export',
    buyRate,
    sellRate,
    profitAndLoss: sellRate - buyRate,
    status: getRandomStatus(),
    createdAt: formatDate(new Date(today.getTime() - (20-i) * 24 * 60 * 60 * 1000)),
    updatedAt: formatDate(new Date(today.getTime() - (20-i) * 24 * 60 * 60 * 1000)),
  };
});

export const initialMockBookings: Booking[] = initialMockQuotations
  .filter(q => q.status === 'Booking Completed')
  .slice(0, 10) // Take up to 10 completed quotations to make bookings
  .map((q, i) => ({
    id: `BKNG-${String(2001 + i).padStart(6, '0')}`,
    quotationId: q.id,
    customerName: q.customerName,
    pol: q.pol,
    pod: q.pod,
    volume: q.volume,
    equipment: q.equipment,
    type: q.type,
    buyRate: q.buyRate,
    sellRate: q.sellRate,
    profitAndLoss: q.profitAndLoss,
    status: (i % 3 === 0) ? 'Booked' : (i % 3 === 1) ? 'Shipped' : 'Delivered',
    createdAt: formatDate(new Date(new Date(q.createdAt).getTime() + 24 * 60 * 60 * 1000)), // Booking created after quotation
    updatedAt: formatDate(new Date(new Date(q.updatedAt).getTime() + 24 * 60 * 60 * 1000)),
  }));

// Adding more bookings if needed to reach 20
const additionalBookingsNeeded = 20 - initialMockBookings.length;
if (additionalBookingsNeeded > 0) {
    for (let i = 0; i < additionalBookingsNeeded; i++) {
        const q = initialMockQuotations[i % initialMockQuotations.length]; // reuse some quotations for dummy data
        initialMockBookings.push({
            id: `BKNG-${String(2001 + initialMockBookings.length).padStart(6, '0')}`,
            quotationId: `QTN-DUMMY-${i}`, // a dummy quotation ref
            customerName: `New Customer ${i}`,
            pol: getRandomPort(),
            pod: getRandomPort(),
            volume: getRandomVolume(),
            equipment: getRandomEquipment(),
            type: (i % 2 === 0) ? 'Import' : 'Export',
            buyRate: q.buyRate,
            sellRate: q.sellRate,
            profitAndLoss: q.profitAndLoss,
            status: (i % 3 === 0) ? 'Booked' : (i % 3 === 1) ? 'Shipped' : 'Delivered',
            createdAt: formatDate(new Date(today.getTime() - (10-i) * 24 * 60 * 60 * 1000)),
            updatedAt: formatDate(new Date(today.getTime() - (10-i) * 24 * 60 * 60 * 1000)),
        });
    }
}


export const initialMockBuyRates: BuyRate[] = Array.from({ length: 15 }, (_, i) => ({
  id: `BR-${String(3001 + i).padStart(4, '0')}`,
  carrier: `Carrier ${String.fromCharCode(65 + (i % 5))}`, // 5 unique carriers
  pol: getRandomPort(),
  pod: getRandomPort(),
  commodity: (i % 2 === 0) ? 'General Cargo' : 'Electronics',
  freightModeType: (i % 3 === 0) ? 'Sea' : (i % 3 === 1) ? 'Air' : 'Land',
  equipment: getRandomEquipment(),
  weightCapacity: `${Math.floor(Math.random() * 20) + 5} TON`,
  minBooking: `${Math.floor(Math.random() * 2) + 1} TEU`,
  rate: Math.floor(Math.random() * 1500) + 300,
  validFrom: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  validTo: formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
}));

export const initialMockSchedules: Schedule[] = Array.from({ length: 12 }, (_, i) => ({
  id: `SCH-${String(4001 + i).padStart(4, '0')}`,
  carrier: `Carrier ${String.fromCharCode(65 + (i % 5))}`,
  origin: getRandomPort(),
  destination: getRandomPort(),
  serviceRoute: `SRVC-${String.fromCharCode(88 + (i % 3))}${100+i}`, // SRVC-X100, SRVC-Y101, SRVC-Z102
  allocation: Math.floor(Math.random() * 50) + 10, // 10 to 60 units
  etd: formatDate(new Date(today.getTime() + i * 7 * 24 * 60 * 60 * 1000)), // Weekly departures starting today
  eta: formatDate(new Date(today.getTime() + (i * 7 + (Math.floor(Math.random()*10)+10)) * 24 * 60 * 60 * 1000)), // ETA 10-20 days after ETD
  frequency: (i % 4 === 0) ? 'Daily' : (i % 4 === 1) ? 'Weekly' : (i % 4 === 2) ? 'Bi-Weekly' : 'Monthly',
}));

export const mockScheduleRates: ScheduleRate[] = Array.from({ length: 30 }, (_, i) => {
  const origin = getRandomPort();
  const destination = getRandomPort();
  return {
    id: `SRATE-${String(5001 + i).padStart(5, '0')}`,
    carrier: `Carrier ${String.fromCharCode(65 + (i % 5))}`,
    origin: origin,
    destination: destination === origin ? getRandomPort() : destination, // ensure origin and dest are different
    voyageDetails: `V${1000+i}W / ${format(new Date(today.getTime() + (i % 7) * 24 * 60 * 60 * 1000), 'ddMMMyy').toUpperCase()}`,
    buyRate: Math.floor(Math.random() * 1800) + 400,
    allocation: Math.floor(Math.random() * 20) + 5,
  };
});

// Helper to simulate API delay
export const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));
