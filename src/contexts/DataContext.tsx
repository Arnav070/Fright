
"use client";

import type { ReactNode} from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  Quotation, 
  Booking, 
  BuyRate, 
  Schedule, 
  ScheduleRate, 
  Port,
  QuotationStatusSummary,
  BookingsByMonthEntry
} from '@/lib/types';
import { 
  initialMockQuotations, 
  initialMockBookings, 
  initialMockBuyRates, 
  initialMockSchedules,
  mockScheduleRates,
  mockPorts,
  simulateDelay
} from '@/lib/mockData';
import { format, parseISO } from 'date-fns';

interface DataContextType {
  ports: Port[];
  quotations: Quotation[];
  bookings: Booking[];
  buyRates: BuyRate[];
  schedules: Schedule[];
  scheduleRates: ScheduleRate[];
  loading: boolean;

  // Dashboard specific data
  quotationStatusSummary: QuotationStatusSummary;
  bookingsByMonth: BookingsByMonthEntry[];

  fetchQuotations: (page: number, pageSize: number) => Promise<{ data: Quotation[], total: number }>;
  getQuotationById: (id: string) => Promise<Quotation | undefined>;
  createQuotation: (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>) => Promise<Quotation>;
  updateQuotation: (id: string, quotationData: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Quotation | undefined>;
  deleteQuotation: (id: string) => Promise<boolean>;
  
  fetchBookings: (page: number, pageSize: number) => Promise<{ data: Booking[], total: number }>;
  getBookingById: (id: string) => Promise<Booking | undefined>;
  createBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Booking>;
  updateBooking: (id: string, bookingData: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Booking | undefined>;
  
  fetchBuyRates: (page: number, pageSize: number) => Promise<{ data: BuyRate[], total: number }>;
  createBuyRate: (data: Omit<BuyRate, 'id'>) => Promise<BuyRate>;
  updateBuyRate: (id: string, data: Partial<Omit<BuyRate, 'id'>>) => Promise<BuyRate | undefined>;
  deleteBuyRate: (id: string) => Promise<boolean>;

  fetchSchedules: (page: number, pageSize: number) => Promise<{ data: Schedule[], total: number }>;
  createSchedule: (data: Omit<Schedule, 'id'>) => Promise<Schedule>;
  updateSchedule: (id: string, data: Partial<Omit<Schedule, 'id'>>) => Promise<Schedule | undefined>;
  deleteSchedule: (id: string) => Promise<boolean>;

  searchScheduleRates: (params: any) => Promise<ScheduleRate[]>; // params can be pol, pod etc.
  searchQuotations: (searchTerm: string) => Promise<Quotation[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [ports, setPorts] = useState<Port[]>(mockPorts);
  const [quotations, setQuotations] = useState<Quotation[]>(initialMockQuotations);
  const [bookings, setBookings] = useState<Booking[]>(initialMockBookings);
  const [buyRates, setBuyRates] = useState<BuyRate[]>(initialMockBuyRates);
  const [schedules, setSchedules] = useState<Schedule[]>(initialMockSchedules);
  const [scheduleRates, setScheduleRates] = useState<ScheduleRate[]>(mockScheduleRates);
  const [loading, setLoading] = useState(false); // For individual operations

  const [quotationStatusSummary, setQuotationStatusSummary] = useState<QuotationStatusSummary>({ draft: 0, submitted: 0, completed: 0, cancelled: 0 });
  const [bookingsByMonth, setBookingsByMonth] = useState<BookingsByMonthEntry[]>([]);

  const now = () => format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  // Recalculate quotation status summary when quotations change
  useEffect(() => {
    const summary: QuotationStatusSummary = { draft: 0, submitted: 0, completed: 0, cancelled: 0 };
    quotations.forEach(q => {
      if (q.status === 'Draft') summary.draft++;
      else if (q.status === 'Submitted') summary.submitted++;
      else if (q.status === 'Booking Completed') summary.completed++;
      else if (q.status === 'Cancelled') summary.cancelled++;
    });
    setQuotationStatusSummary(summary);
  }, [quotations]);

  // Recalculate bookings by month when bookings change
  useEffect(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const countsByMonth: { [key: string]: number } = {};
    
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); // Start of the 6-month window (e.g. if June, starts Jan)

    bookings.forEach(b => {
      // Ensure createdAt is a string before parsing. If it's already a Date object, handle appropriately.
      // Mock data uses 'yyyy-MM-dd HH:mm:ss' which might not be directly parseable by new Date() consistently across browsers.
      // It's safer to parse it manually or use date-fns.parse if the format is fixed.
      // For simplicity here, assuming `b.createdAt` string is reliably parseable to a Date.
      // A more robust way: const bookingDate = parseISO(b.createdAt.replace(' ', 'T')); // if ISO-like
      const [datePart] = b.createdAt.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      // JavaScript months are 0-indexed, so month - 1
      const bookingDate = new Date(year, month - 1, day);


      if (bookingDate >= sixMonthsAgo && bookingDate <= today) {
          const monthName = monthNames[bookingDate.getMonth()];
          countsByMonth[monthName] = (countsByMonth[monthName] || 0) + 1;
      }
    });

    const result: BookingsByMonthEntry[] = [];
    const currentMonthIndex = today.getMonth();
    for (let i = 5; i >= 0; i--) { // Iterate for the last 6 months including current
      const monthIdx = (currentMonthIndex - i + 12) % 12;
      const monthName = monthNames[monthIdx];
      result.push({
        month: monthName,
        count: countsByMonth[monthName] || 0
      });
    }
    setBookingsByMonth(result);
  }, [bookings]);


  // Quotation Operations
  const fetchQuotations = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    await simulateDelay();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setLoading(false);
    return { data: quotations.slice(start, end), total: quotations.length };
  }, [quotations]);

  const getQuotationById = useCallback(async (id: string) => {
    setLoading(true);
    await simulateDelay();
    const quotation = quotations.find(q => q.id === id);
    setLoading(false);
    return quotation;
  }, [quotations]);

  const createQuotation = useCallback(async (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>) => {
    setLoading(true);
    await simulateDelay();
    const newQuotation: Quotation = {
      ...quotationData,
      id: `QTN-${String(Date.now()).slice(-6)}`,
      profitAndLoss: (quotationData.sellRate || 0) - (quotationData.buyRate || 0),
      createdAt: now(),
      updatedAt: now(),
    };
    setQuotations(prev => [newQuotation, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
    return newQuotation;
  }, []);

  const updateQuotation = useCallback(async (id: string, quotationData: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setLoading(true);
    await simulateDelay();
    let updatedQuotation: Quotation | undefined;
    setQuotations(prev => prev.map(q => {
      if (q.id === id) {
        const currentBuyRate = quotationData.buyRate !== undefined ? quotationData.buyRate : q.buyRate;
        const currentSellRate = quotationData.sellRate !== undefined ? quotationData.sellRate : q.sellRate;
        updatedQuotation = { 
            ...q, 
            ...quotationData, 
            updatedAt: now(),
            profitAndLoss: (currentSellRate || 0) - (currentBuyRate || 0),
        };
        return updatedQuotation;
      }
      return q;
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
    return updatedQuotation;
  }, []);

  const deleteQuotation = useCallback(async (id: string) => {
    setLoading(true);
    await simulateDelay();
    const qtn = quotations.find(q => q.id === id);
    if (qtn && qtn.status === 'Booking Completed') {
      setLoading(false);
      return false; // Cannot delete if booking completed
    }
    setQuotations(prev => prev.filter(q => q.id !== id));
    setLoading(false);
    return true;
  }, [quotations]);

  const searchQuotations = useCallback(async (searchTerm: string) => {
    setLoading(true);
    await simulateDelay();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = quotations.filter(q => 
        q.id.toLowerCase().includes(lowerSearchTerm) || 
        q.customerName.toLowerCase().includes(lowerSearchTerm)
    );
    setLoading(false);
    return results;
  }, [quotations]);

  // Booking Operations
  const fetchBookings = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    await simulateDelay();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setLoading(false);
    return { data: bookings.slice(start, end), total: bookings.length };
  }, [bookings]);

   const getBookingById = useCallback(async (id: string) => {
    setLoading(true);
    await simulateDelay();
    const booking = bookings.find(b => b.id === id);
    setLoading(false);
    return booking;
  }, [bookings]);

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    await simulateDelay();
    const newBooking: Booking = {
      ...bookingData,
      id: `BKNG-${String(Date.now()).slice(-6)}`,
      createdAt: now(),
      updatedAt: now(),
    };
    setBookings(prev => [newBooking, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
    return newBooking;
  }, []);

  const updateBooking = useCallback(async (id: string, bookingData: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setLoading(true);
    await simulateDelay();
    let updatedBooking: Booking | undefined;
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        updatedBooking = { ...b, ...bookingData, updatedAt: now() };
        return updatedBooking;
      }
      return b;
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
    return updatedBooking;
  }, []);


  // BuyRate Operations
  const fetchBuyRates = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    await simulateDelay();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setLoading(false);
    return { data: buyRates.slice(start, end), total: buyRates.length };
  }, [buyRates]);

  const createBuyRate = useCallback(async (data: Omit<BuyRate, 'id'>) => {
    setLoading(true);
    await simulateDelay();
    const newBuyRate: BuyRate = { ...data, id: `BR-${String(Date.now()).slice(-6)}` };
    setBuyRates(prev => [newBuyRate, ...prev].sort((a,b) => new Date(b.validTo).getTime() - new Date(a.validTo).getTime()));
    setLoading(false);
    return newBuyRate;
  }, []);

  const updateBuyRate = useCallback(async (id: string, data: Partial<Omit<BuyRate, 'id'>>) => {
    setLoading(true);
    await simulateDelay();
    let updated: BuyRate | undefined;
    setBuyRates(prev => prev.map(br => {
      if (br.id === id) {
        updated = { ...br, ...data };
        return updated;
      }
      return br;
    }).sort((a,b) => new Date(b.validTo).getTime() - new Date(a.validTo).getTime()));
    setLoading(false);
    return updated;
  }, []);
  
  const deleteBuyRate = useCallback(async (id: string) => {
    setLoading(true);
    await simulateDelay();
    setBuyRates(prev => prev.filter(br => br.id !== id));
    setLoading(false);
    return true;
  }, []);

  // Schedule Operations
  const fetchSchedules = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    await simulateDelay();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setLoading(false);
    return { data: schedules.slice(start, end), total: schedules.length };
  }, [schedules]);

  const createSchedule = useCallback(async (data: Omit<Schedule, 'id'>) => {
    setLoading(true);
    await simulateDelay();
    const newSchedule: Schedule = { ...data, id: `SCH-${String(Date.now()).slice(-6)}` };
    setSchedules(prev => [newSchedule, ...prev].sort((a,b) => new Date(b.etd).getTime() - new Date(a.etd).getTime()));
    setLoading(false);
    return newSchedule;
  }, []);

  const updateSchedule = useCallback(async (id: string, data: Partial<Omit<Schedule, 'id'>>) => {
    setLoading(true);
    await simulateDelay();
    let updated: Schedule | undefined;
    setSchedules(prev => prev.map(s => {
      if (s.id === id) {
        updated = { ...s, ...data };
        return updated;
      }
      return s;
    }).sort((a,b) => new Date(b.etd).getTime() - new Date(a.etd).getTime()));
    setLoading(false);
    return updated;
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    setLoading(true);
    await simulateDelay();
    setSchedules(prev => prev.filter(s => s.id !== id));
    setLoading(false);
    return true;
  }, []);

  // ScheduleRates (for quotation/booking rate selection step)
  const searchScheduleRates = useCallback(async (params: any) => {
    setLoading(true);
    await simulateDelay();
    // Simple mock search: if params include POL/POD, filter by them.
    let results = [...scheduleRates];
    if (params.pol) {
        results = results.filter(sr => sr.origin.toLowerCase().includes(params.pol.toLowerCase()));
    }
    if (params.pod) {
        results = results.filter(sr => sr.destination.toLowerCase().includes(params.pod.toLowerCase()));
    }
    setLoading(false);
    return results.slice(0, 10); // return a limited number for demo
  }, [scheduleRates]);


  return (
    <DataContext.Provider value={{
      ports, quotations, bookings, buyRates, schedules, scheduleRates, loading,
      quotationStatusSummary, bookingsByMonth, // Provide dashboard data
      fetchQuotations, getQuotationById, createQuotation, updateQuotation, deleteQuotation, searchQuotations,
      fetchBookings, getBookingById, createBooking, updateBooking,
      fetchBuyRates, createBuyRate, updateBuyRate, deleteBuyRate,
      fetchSchedules, createSchedule, updateSchedule, deleteSchedule,
      searchScheduleRates,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
