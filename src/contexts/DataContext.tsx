
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
  initialMockBuyRates,
  initialMockSchedules,
  mockScheduleRates as staticMockScheduleRates, // Renamed to avoid conflict
  mockPorts,
  simulateDelay,
  quotationsToSeedFromImage, // Import data for seeding
  bookingsToSeedFromImageBase // Import data for seeding
} from '@/lib/mockData';
import { format, parseISO } from 'date-fns';
import { db } from '@/lib/firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  where,
  limit,
} from 'firebase/firestore';

interface DataContextType {
  ports: Port[];
  quotations: Quotation[];
  bookings: Booking[];
  buyRates: BuyRate[];
  schedules: Schedule[];
  scheduleRates: ScheduleRate[];
  loading: boolean; 

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
  deleteBooking: (id: string) => Promise<boolean>;

  fetchBuyRates: (page: number, pageSize: number) => Promise<{ data: BuyRate[], total: number }>;
  createBuyRate: (data: Omit<BuyRate, 'id'>) => Promise<BuyRate>;
  updateBuyRate: (id: string, data: Partial<Omit<BuyRate, 'id'>>) => Promise<BuyRate | undefined>;
  deleteBuyRate: (id: string) => Promise<boolean>;

  fetchSchedules: (page: number, pageSize: number) => Promise<{ data: Schedule[], total: number }>;
  createSchedule: (data: Omit<Schedule, 'id'>) => Promise<Schedule>;
  updateSchedule: (id: string, data: Partial<Omit<Schedule, 'id'>>) => Promise<Schedule | undefined>;
  deleteSchedule: (id: string) => Promise<boolean>;

  searchScheduleRates: (params: { pol?: string; pod?: string }) => Promise<ScheduleRate[]>;
  searchQuotations: (searchTerm: string) => Promise<Quotation[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const toQuotation = (docSnap: any): Quotation => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString(),
  } as Quotation;
};

const toBooking = (docSnap: any): Booking => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString(),
  } as Booking;
};


export function DataProvider({ children }: { children: ReactNode }) {
  const [ports, setPorts] = useState<Port[]>(mockPorts);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [buyRates, setBuyRates] = useState<BuyRate[]>(initialMockBuyRates);
  const [schedules, setSchedules] = useState<Schedule[]>(initialMockSchedules);
  const [scheduleRates, setScheduleRates] = useState<ScheduleRate[]>(staticMockScheduleRates);
  const [loading, setLoading] = useState(true); 

  const [quotationStatusSummary, setQuotationStatusSummary] = useState<QuotationStatusSummary>({ draft: 0, submitted: 0, completed: 0, cancelled: 0 });
  const [bookingsByMonth, setBookingsByMonth] = useState<BookingsByMonthEntry[]>([]);

  const seedDatabaseIfEmpty = useCallback(async () => {
    console.log("Checking if database needs seeding...");
    const quotationsRef = collection(db, "quotations");
    const bookingsRef = collection(db, "bookings");

    const quotationsSnapshot = await getDocs(query(quotationsRef, limit(1)));
    if (quotationsSnapshot.empty) {
      console.log("Quotations collection is empty. Seeding quotations...");
      const batch = writeBatch(db);
      const seededQuotationRefs: { [key: string]: string } = {}; // To map temp ref to Firestore ID

      quotationsToSeedFromImage.forEach((qData, index) => {
        const docRef = doc(quotationsRef); // Auto-generate ID
        const profitAndLoss = (qData.sellRate || 0) - (qData.buyRate || 0);
        batch.set(docRef, {
          ...qData,
          profitAndLoss,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        // Create a temporary reference key for linking bookings
        const tempRefKey = `${qData.customerName}-${qData.pol}-${qData.pod}-${qData.equipment}`;
        seededQuotationRefs[tempRefKey] = docRef.id;
      });
      await batch.commit();
      console.log(`${quotationsToSeedFromImage.length} quotations seeded.`);
      
      // Now seed bookings if empty
      const bookingsSnapshot = await getDocs(query(bookingsRef, limit(1)));
      if (bookingsSnapshot.empty) {
        console.log("Bookings collection is empty. Seeding bookings...");
        const bookingsBatch = writeBatch(db);
        bookingsToSeedFromImageBase.forEach(bData => {
          const tempRefKey = `${bData.quotationRefCustomer}-${bData.quotationRefPol}-${bData.quotationRefPod}-${bData.quotationRefEquipment}`;
          const quotationId = seededQuotationRefs[tempRefKey];

          if (quotationId) {
            const bookingDocRef = doc(bookingsRef);
            const { quotationRefCustomer, quotationRefPol, quotationRefPod, quotationRefEquipment, ...restOfBData } = bData;
            const profitAndLoss = (bData.sellRate || 0) - (bData.buyRate || 0);
            bookingsBatch.set(bookingDocRef, {
              ...restOfBData,
              quotationId,
              profitAndLoss,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            console.warn(`Could not find quotation ID for booking: ${tempRefKey}`);
          }
        });
        await bookingsBatch.commit();
        console.log("Bookings seeded.");
      } else {
        console.log("Bookings collection not empty, skipping booking seed.");
      }
    } else {
      console.log("Quotations collection not empty, skipping all seeding.");
    }
  }, []);


  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await seedDatabaseIfEmpty(); // Attempt to seed first

      const quotationsQuery = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
      const quotationsSnapshot = await getDocs(quotationsQuery);
      const fetchedQuotations = quotationsSnapshot.docs.map(toQuotation);
      setQuotations(fetchedQuotations);

      const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const fetchedBookings = bookingsSnapshot.docs.map(toBooking);
      setBookings(fetchedBookings);

    } catch (error) {
      console.error("Error during data loading or seeding:", error);
    }
    setLoading(false);
  }, [seedDatabaseIfEmpty]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);


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

  useEffect(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const countsByMonth: { [key: string]: number } = {};
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    bookings.forEach(b => {
      const bookingDate = parseISO(b.createdAt); 
      if (bookingDate >= sixMonthsAgo && bookingDate <= today) {
          const monthName = monthNames[bookingDate.getMonth()];
          countsByMonth[monthName] = (countsByMonth[monthName] || 0) + 1;
      }
    });

    const result: BookingsByMonthEntry[] = [];
    const currentMonthIndex = today.getMonth();
    for (let i = 5; i >= 0; i--) {
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
    // Re-fetch from Firestore for pagination if desired, or use local for simplicity
    // For now, uses local state after initial load + seed.
    const allQuotations = quotations.sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setLoading(false);
    return { data: allQuotations.slice(start, end), total: allQuotations.length };
  }, [quotations]);

  const getQuotationById = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, "quotations", id);
      const docSnap = await getDoc(docRef);
      setLoading(false);
      return docSnap.exists() ? toQuotation(docSnap) : undefined;
    } catch (error) {
      console.error("Error fetching quotation by ID:", error);
      setLoading(false);
      return undefined;
    }
  }, []);

  const createQuotation = useCallback(async (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>) => {
    setLoading(true);
    try {
      const dataToSave = {
        ...quotationData,
        profitAndLoss: (quotationData.sellRate || 0) - (quotationData.buyRate || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "quotations"), dataToSave);
      // For immediate UI update, create an approximate object. True values come on next load.
      const newQuotation = { ...quotationData, id: docRef.id, profitAndLoss: dataToSave.profitAndLoss, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await loadAllData(); 
      setLoading(false);
      return newQuotation;
    } catch (error) {
      console.error("Error creating quotation:", error);
      setLoading(false);
      throw error;
    }
  }, [loadAllData]);

  const updateQuotation = useCallback(async (id: string, quotationData: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setLoading(true);
    try {
      const docRef = doc(db, "quotations", id);
      const currentDocSnap = await getDoc(docRef);
      if (!currentDocSnap.exists()) throw new Error("Quotation not found for update");
      
      const currentData = toQuotation(currentDocSnap); // Use toQuotation to get proper types
      const currentBuyRate = quotationData.buyRate !== undefined ? quotationData.buyRate : currentData.buyRate;
      const currentSellRate = quotationData.sellRate !== undefined ? quotationData.sellRate : currentData.sellRate;

      const dataToUpdate: any = { // Use 'any' for Firestore partial update object
        ...quotationData,
        profitAndLoss: (currentSellRate || 0) - (currentBuyRate || 0),
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, dataToUpdate);
      const updatedQuotation = { ...currentData, ...dataToUpdate, id, updatedAt: new Date().toISOString() } as Quotation; 
      await loadAllData();
      setLoading(false);
      return updatedQuotation;
    } catch (error) {
      console.error("Error updating quotation:", error);
      setLoading(false);
      throw error;
    }
  }, [loadAllData]);

  const deleteQuotation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const qtnDocRef = doc(db, "quotations", id);
      const qtnSnap = await getDoc(qtnDocRef);
      if (qtnSnap.exists() && qtnSnap.data().status === 'Booking Completed') {
        setLoading(false);
        return false; 
      }
      await deleteDoc(qtnDocRef);
      await loadAllData();
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Error deleting quotation:", error);
      setLoading(false);
      throw error; 
    }
  }, [loadAllData]);

  const searchQuotations = useCallback(async (searchTerm: string) => {
    setLoading(true);
    const lowerSearchTerm = searchTerm.toLowerCase();
    // Client-side search on already loaded quotations
    const results = quotations.filter(q =>
        q.id.toLowerCase().includes(lowerSearchTerm) ||
        q.customerName.toLowerCase().includes(lowerSearchTerm) ||
        q.pol.toLowerCase().includes(lowerSearchTerm) ||
        q.pod.toLowerCase().includes(lowerSearchTerm)
    );
    setLoading(false);
    return results;
  }, [quotations]);


  // Booking Operations
  const fetchBookings = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
     const allBookings = bookings.sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setLoading(false);
    return { data: allBookings.slice(start, end), total: allBookings.length };
  }, [bookings]);

   const getBookingById = useCallback(async (id: string) => {
    setLoading(true);
     try {
      const docRef = doc(db, "bookings", id);
      const docSnap = await getDoc(docRef);
      setLoading(false);
      return docSnap.exists() ? toBooking(docSnap) : undefined;
    } catch (error) {
      console.error("Error fetching booking by ID:", error);
      setLoading(false);
      return undefined;
    }
  }, []);

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    const batch = writeBatch(db);
    try {
      const dataToSave = {
        ...bookingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const bookingDocRef = doc(collection(db, "bookings")); 
      batch.set(bookingDocRef, dataToSave);

      const quotationDocRef = doc(db, "quotations", bookingData.quotationId);
      batch.update(quotationDocRef, { status: 'Booking Completed', updatedAt: serverTimestamp() });

      await batch.commit();
      const newBooking = { ...bookingData, id: bookingDocRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await loadAllData();
      setLoading(false);
      return newBooking;
    } catch (error) {
      console.error("Error creating booking:", error);
      setLoading(false);
      throw error;
    }
  }, [loadAllData]);

  const updateBooking = useCallback(async (id: string, bookingData: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setLoading(true);
    try {
      const docRef = doc(db, "bookings", id);
      const dataToUpdate: any = { // Use 'any' for Firestore partial update object
        ...bookingData,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, dataToUpdate);
      const currentDocSnap = await getDoc(docRef);
      const updatedBooking = currentDocSnap.exists() ? toBooking(currentDocSnap) : undefined;
      await loadAllData();
      setLoading(false);
      return updatedBooking;
    } catch (error) {
      console.error("Error updating booking:", error);
      setLoading(false);
      throw error;
    }
  }, [loadAllData]);

  const deleteBooking = useCallback(async (id: string) => {
    setLoading(true);
    const batch = writeBatch(db);
    try {
      const bookingDocRef = doc(db, "bookings", id);
      const bookingSnap = await getDoc(bookingDocRef);

      if (!bookingSnap.exists()) {
        setLoading(false);
        return false;
      }
      const bookingToDelete = toBooking(bookingSnap);
      batch.delete(bookingDocRef);

      const quotationDocRef = doc(db, "quotations", bookingToDelete.quotationId);
      const quotationSnap = await getDoc(quotationDocRef);
      if (quotationSnap.exists() && quotationSnap.data().status === 'Booking Completed') {
         batch.update(quotationDocRef, { status: 'Submitted', updatedAt: serverTimestamp() });
      }

      await batch.commit();
      await loadAllData();
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Error deleting booking:", error);
      setLoading(false);
      throw error;
    }
  }, [loadAllData]);


  // BuyRate Operations (still mock)
  const fetchBuyRates = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    await simulateDelay();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const sortedBuyRates = [...buyRates].sort((a,b) => parseISO(b.validTo).getTime() - parseISO(a.validTo).getTime());
    setLoading(false);
    return { data: sortedBuyRates.slice(start, end), total: sortedBuyRates.length };
  }, [buyRates]);

  const createBuyRate = useCallback(async (data: Omit<BuyRate, 'id'>) => {
    setLoading(true);
    await simulateDelay();
    const newBuyRate: BuyRate = { ...data, id: `BR-${String(Date.now()).slice(-6)}` };
    setBuyRates(prev => [...prev, newBuyRate].sort((a,b) => parseISO(b.validTo).getTime() - parseISO(a.validTo).getTime()));
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
    }).sort((a,b) => parseISO(b.validTo).getTime() - parseISO(a.validTo).getTime()));
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

  // Schedule Operations (still mock)
  const fetchSchedules = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    await simulateDelay();
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const sortedSchedules = [...schedules].sort((a,b) => parseISO(b.etd).getTime() - parseISO(a.etd).getTime());
    setLoading(false);
    return { data: sortedSchedules.slice(start, end), total: sortedSchedules.length };
  }, [schedules]);

  const createSchedule = useCallback(async (data: Omit<Schedule, 'id'>) => {
    setLoading(true);
    await simulateDelay();
    const newSchedule: Schedule = { ...data, id: `SCH-${String(Date.now()).slice(-6)}` };
    setSchedules(prev => [...prev, newSchedule].sort((a,b) => parseISO(b.etd).getTime() - parseISO(a.etd).getTime()));
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
    }).sort((a,b) => parseISO(b.etd).getTime() - parseISO(a.etd).getTime()));
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

  // ScheduleRates (still mock)
  const searchScheduleRates = useCallback(async (params: { pol?: string; pod?: string }) => {
    setLoading(true);
    await simulateDelay();
    let results = [...scheduleRates]; // scheduleRates has origin/destination as CODES

    if (params.pol) { // params.pol is a NAME (e.g., "Long Beach")
        results = results.filter(sr => {
            // sr.origin is a CODE (e.g., "USLGB")
            const originPort = ports.find(p => p.code === sr.origin);
            // Compare names: "Long Beach" (from form) with "Long Beach" (from ports matching sr.origin code)
            return originPort && originPort.name.toLowerCase().includes(params.pol!.toLowerCase());
        });
    }
    if (params.pod) { // params.pod is a NAME
        results = results.filter(sr => {
            const destinationPort = ports.find(p => p.code === sr.destination);
            return destinationPort && destinationPort.name.toLowerCase().includes(params.pod!.toLowerCase());
        });
    }
    setLoading(false);
    return results.slice(0, 10);
  }, [scheduleRates, ports]); // Added ports to dependency array


  return (
    <DataContext.Provider value={{
      ports, quotations, bookings, buyRates, schedules, scheduleRates, loading,
      quotationStatusSummary, bookingsByMonth,
      fetchQuotations, getQuotationById, createQuotation, updateQuotation, deleteQuotation, searchQuotations,
      fetchBookings, getBookingById, createBooking, updateBooking, deleteBooking,
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

