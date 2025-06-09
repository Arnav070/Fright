
"use client";

import type { ReactNode, FieldValue} from 'react';
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
  mockScheduleRates as staticMockScheduleRates,
  mockPorts,
  simulateDelay,
  quotationsToSeedFromImage,
  bookingsToSeedFromImageBase
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
  setDoc,
} from 'firebase/firestore';

interface DataContextType {
  ports: Port[];
  // quotations: Quotation[]; // No longer storing all quotations directly in context state
  // bookings: Booking[]; // No longer storing all bookings directly in context state
  buyRates: BuyRate[]; // Keep for mock data
  schedules: Schedule[]; // Keep for mock data
  scheduleRates: ScheduleRate[]; // Keep for mock data
  loading: boolean;

  quotationStatusSummary: QuotationStatusSummary;
  bookingsByMonth: BookingsByMonthEntry[];

  fetchQuotations: (page: number, pageSize: number, searchTerm?: string) => Promise<{ data: Quotation[], total: number }>;
  getQuotationById: (id: string) => Promise<Quotation | undefined>;
  createQuotation: (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>) => Promise<Quotation>;
  updateQuotation: (id: string, quotationData: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Quotation | undefined>;
  deleteQuotation: (id: string) => Promise<boolean>;

  fetchBookings: (page: number, pageSize: number, searchTerm?: string) => Promise<{ data: Booking[], total: number }>;
  getBookingById: (id: string) => Promise<Booking | undefined>;
  createBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Booking>;
  updateBooking: (id: string, bookingData: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Booking | undefined>;
  deleteBooking: (id: string) => Promise<boolean>;

  fetchBuyRates: (page: number, pageSize: number, searchTerm?: string) => Promise<{ data: BuyRate[], total: number }>;
  createBuyRate: (data: Omit<BuyRate, 'id'>) => Promise<BuyRate>;
  updateBuyRate: (id: string, data: Partial<Omit<BuyRate, 'id'>>) => Promise<BuyRate | undefined>;
  deleteBuyRate: (id: string) => Promise<boolean>;

  fetchSchedules: (page: number, pageSize: number, searchTerm?: string) => Promise<{ data: Schedule[], total: number }>;
  createSchedule: (data: Omit<Schedule, 'id'>) => Promise<Schedule>;
  updateSchedule: (id: string, data: Partial<Omit<Schedule, 'id'>>) => Promise<Schedule | undefined>;
  deleteSchedule: (id: string) => Promise<boolean>;

  searchScheduleRates: (params: { pol?: string; pod?: string; equipment?: string; }) => Promise<ScheduleRate[]>;
  // searchQuotations: (searchTerm: string) => Promise<Quotation[]>; // This will be integrated into fetchQuotations
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const toQuotation = (docSnap: any): Quotation => {
  const data = docSnap.data();
  const quotation: Quotation = {
    id: docSnap.id,
    customerName: data.customerName,
    pol: data.pol,
    pod: data.pod,
    equipment: data.equipment,
    type: data.type,
    buyRate: data.buyRate === null || data.buyRate === undefined ? undefined : data.buyRate,
    sellRate: data.sellRate === null || data.sellRate === undefined ? undefined : data.sellRate,
    profitAndLoss: data.profitAndLoss,
    status: data.status,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString(),
    selectedRateId: data.selectedRateId === null ? undefined : data.selectedRateId,
  };
  if (data.notes !== null && data.notes !== undefined) {
    (quotation as any).notes = data.notes;
  }
  return quotation;
};

const toBooking = (docSnap: any): Booking => {
  const data = docSnap.data();
  const booking: Booking = {
    id: docSnap.id,
    quotationId: data.quotationId,
    customerName: data.customerName,
    pol: data.pol,
    pod: data.pod,
    equipment: data.equipment,
    type: data.type,
    buyRate: data.buyRate,
    sellRate: data.sellRate,
    profitAndLoss: data.profitAndLoss,
    status: data.status,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString(),
    selectedCarrierRateId: data.selectedCarrierRateId === null ? undefined : data.selectedCarrierRateId,
    notes: data.notes === null ? undefined : data.notes,
  };
  return booking;
};

async function getNextId(collectionName: string, prefix: string): Promise<string> {
  const collRef = collection(db, collectionName);
  const q = query(collRef);
  const snapshot = await getDocs(q);
  let maxNum = 0;
  snapshot.docs.forEach(docSnap => {
    const id = docSnap.id;
    if (id.startsWith(prefix)) {
      const numPart = id.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  return `${prefix}${maxNum + 1}`;
}


export function DataProvider({ children }: { children: ReactNode }) {
  const [portsDataState, setPortsDataState] = useState<Port[]>(mockPorts);
  const [buyRatesDataState, setBuyRatesDataState] = useState<BuyRate[]>(initialMockBuyRates);
  const [schedulesDataState, setSchedulesDataState] = useState<Schedule[]>(initialMockSchedules);
  const [scheduleRatesDataState, setScheduleRatesDataState] = useState<ScheduleRate[]>(staticMockScheduleRates);
  const [appLoading, setAppLoading] = useState(true);

  // For dashboard charts, we need all data
  const [allQuotationsForChart, setAllQuotationsForChart] = useState<Quotation[]>([]);
  const [allBookingsForChart, setAllBookingsForChart] = useState<Booking[]>([]);


  const [quotationStatusSummaryData, setQuotationStatusSummaryData] = useState<QuotationStatusSummary>({ draft: 0, submitted: 0, completed: 0, cancelled: 0 });
  const [bookingsByMonthData, setBookingsByMonthData] = useState<BookingsByMonthEntry[]>([]);

  const seedDatabaseIfEmpty = useCallback(async () => {
    console.log("Checking if database needs seeding...");
    const quotationsRef = collection(db, "quotations");
    const bookingsRef = collection(db, "bookings");

    const quotationsSnapshot = await getDocs(query(quotationsRef, limit(1)));
    if (quotationsSnapshot.empty) {
      console.log("Quotations collection is empty. Seeding quotations...");
      const batch = writeBatch(db);
      const seededQuotationRefs: { [key: string]: string } = {};
      let quotationCounter = 0;

      for (const qData of quotationsToSeedFromImage) {
        quotationCounter++;
        const newQuotationId = `CQ-${quotationCounter}`;
        const profitAndLoss = (qData.sellRate || 0) - (qData.buyRate || 0);

        const quotationToSave: any = {
          ...qData,
          buyRate: qData.buyRate === undefined ? null : qData.buyRate,
          sellRate: qData.sellRate === undefined ? null : qData.sellRate,
          profitAndLoss,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (quotationToSave.selectedRateId === undefined) quotationToSave.selectedRateId = null;
        if (quotationToSave.notes === undefined) quotationToSave.notes = null;

        const quotationDocRef = doc(db, "quotations", newQuotationId);
        batch.set(quotationDocRef, quotationToSave);
        const tempRefKey = `${qData.customerName}-${qData.pol}-${qData.pod}-${qData.equipment}`;
        seededQuotationRefs[tempRefKey] = newQuotationId;
      }
      await batch.commit();
      console.log(`${quotationsToSeedFromImage.length} quotations seeded with CQ-X format.`);

      const bookingsSnapshot = await getDocs(query(bookingsRef, limit(1)));
      if (bookingsSnapshot.empty) {
        console.log("Bookings collection is empty. Seeding bookings...");
        const bookingsBatch = writeBatch(db);
        let bookingCounter = 0;
        for (const bData of bookingsToSeedFromImageBase) {
          bookingCounter++;
          const newBookingId = `CB-${bookingCounter}`;
          const tempRefKey = `${bData.quotationRefCustomer}-${bData.quotationRefPol}-${bData.quotationRefPod}-${bData.quotationRefEquipment}`;
          const quotationId = seededQuotationRefs[tempRefKey];

          if (quotationId) {
            const bookingDocRef = doc(db, "bookings", newBookingId);
            const { quotationRefCustomer, quotationRefPol, quotationRefPod, quotationRefEquipment, ...restOfBData } = bData;
            const profitAndLoss = (bData.sellRate || 0) - (bData.buyRate || 0);

            const bookingToSave: any = {
              ...restOfBData,
              quotationId,
              buyRate: bData.buyRate ?? 0,
              sellRate: bData.sellRate ?? 0,
              profitAndLoss,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            if (bookingToSave.selectedCarrierRateId === undefined) bookingToSave.selectedCarrierRateId = null;
            if (bookingToSave.notes === undefined) bookingToSave.notes = null;

            bookingsBatch.set(bookingDocRef, bookingToSave);
          } else {
            console.warn(`Could not find quotation ID for booking seed: ${tempRefKey}`);
          }
        }
        await bookingsBatch.commit();
        console.log("Bookings seeded with CB-X format.");
      } else {
        console.log("Bookings collection not empty, skipping booking seed.");
      }
    } else {
      console.log("Quotations collection not empty, skipping all seeding.");
    }
  }, []);


  const loadInitialDataForCharts = useCallback(async () => {
    setAppLoading(true);
    try {
      await seedDatabaseIfEmpty(); // Ensure seeding happens if needed

      const quotationsQuery = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
      const quotationsSnapshot = await getDocs(quotationsQuery);
      const fetchedQuotations = quotationsSnapshot.docs.map(toQuotation);
      setAllQuotationsForChart(fetchedQuotations);

      const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const fetchedBookings = bookingsSnapshot.docs.map(toBooking);
      setAllBookingsForChart(fetchedBookings);

    } catch (error) {
      console.error("Error during initial chart data loading or seeding:", error);
    }
    setAppLoading(false);
  }, [seedDatabaseIfEmpty]);

  useEffect(() => {
    loadInitialDataForCharts();
  }, [loadInitialDataForCharts]);


  useEffect(() => {
    const summary: QuotationStatusSummary = { draft: 0, submitted: 0, completed: 0, cancelled: 0 };
    allQuotationsForChart.forEach(q => {
      if (q.status === 'Draft') summary.draft++;
      else if (q.status === 'Submitted') summary.submitted++;
      else if (q.status === 'Booking Completed') summary.completed++;
      else if (q.status === 'Cancelled') summary.cancelled++;
    });
    setQuotationStatusSummaryData(summary);
  }, [allQuotationsForChart]);

  useEffect(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const countsByMonth: { [key: string]: number } = {};
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    allBookingsForChart.forEach(b => {
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
    setBookingsByMonthData(result);
  }, [allBookingsForChart]);

  // Quotation Operations
  const fetchQuotations = useCallback(async (page: number, pageSize: number, searchTerm?: string) => {
    setAppLoading(true);
    // Fetch all quotations first
    const quotationsQuery = query(collection(db, "quotations"), orderBy("updatedAt", "desc"));
    const quotationsSnapshot = await getDocs(quotationsQuery);
    let allQuotations = quotationsSnapshot.docs.map(toQuotation);

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      allQuotations = allQuotations.filter(q =>
        q.id.toLowerCase().includes(lowerSearchTerm) ||
        q.customerName.toLowerCase().includes(lowerSearchTerm) ||
        q.pol.toLowerCase().includes(lowerSearchTerm) ||
        q.pod.toLowerCase().includes(lowerSearchTerm) ||
        q.equipment.toLowerCase().includes(lowerSearchTerm) ||
        q.status.toLowerCase().includes(lowerSearchTerm)
      );
    }

    const total = allQuotations.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setAppLoading(false);
    return { data: allQuotations.slice(start, end), total };
  }, []);

  const getQuotationById = useCallback(async (id: string) => {
    setAppLoading(true);
    try {
      const docRef = doc(db, "quotations", id);
      const docSnap = await getDoc(docRef);
      setAppLoading(false);
      return docSnap.exists() ? toQuotation(docSnap) : undefined;
    } catch (error) {
      console.error("Error fetching quotation by ID:", error);
      setAppLoading(false);
      return undefined;
    }
  }, []);

  const createQuotation = useCallback(async (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'profitAndLoss'>) => {
    setAppLoading(true);
    try {
      const newId = await getNextId("quotations", "CQ-");
      const finalBuyRate = quotationData.buyRate;
      const finalSellRate = quotationData.sellRate;

      const dataToSave: any = {
        ...quotationData,
        buyRate: finalBuyRate === undefined ? null : finalBuyRate,
        sellRate: finalSellRate === undefined ? null : finalSellRate,
        profitAndLoss: (finalSellRate || 0) - (finalBuyRate || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        selectedRateId: quotationData.selectedRateId === undefined ? null : quotationData.selectedRateId,
        notes: (quotationData as any).notes === undefined ? null : (quotationData as any).notes,
      };

      await setDoc(doc(db, "quotations", newId), dataToSave);
      await loadInitialDataForCharts(); // Refresh chart data
      setAppLoading(false);
      return {
        id: newId,
        ...quotationData,
        buyRate: finalBuyRate,
        sellRate: finalSellRate,
        profitAndLoss: dataToSave.profitAndLoss,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error creating quotation:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);

  const updateQuotation = useCallback(async (id: string, quotationData: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setAppLoading(true);
    try {
      const docRef = doc(db, "quotations", id);
      const currentDocSnap = await getDoc(docRef);
      if (!currentDocSnap.exists()) throw new Error("Quotation not found for update");

      const currentData = toQuotation(currentDocSnap);
      const dataToUpdate: any = { updatedAt: serverTimestamp() };

      for (const key in quotationData) {
        if (Object.prototype.hasOwnProperty.call(quotationData, key)) {
          const value = (quotationData as any)[key];
          (dataToUpdate as any)[key] = value === undefined ? null : value;
        }
      }

      const effectiveBuyRate = quotationData.buyRate !== undefined ? quotationData.buyRate : currentData.buyRate;
      const effectiveSellRate = quotationData.sellRate !== undefined ? quotationData.sellRate : currentData.sellRate;

      dataToUpdate.buyRate = effectiveBuyRate === undefined ? null : effectiveBuyRate;
      dataToUpdate.sellRate = effectiveSellRate === undefined ? null : effectiveSellRate;
      dataToUpdate.profitAndLoss = (effectiveSellRate || 0) - (effectiveBuyRate || 0);

      await updateDoc(docRef, dataToUpdate);
      await loadInitialDataForCharts(); // Refresh chart data
      setAppLoading(false);
      return {
        ...currentData,
        ...quotationData,
        id,
        profitAndLoss: dataToUpdate.profitAndLoss,
        buyRate: effectiveBuyRate,
        sellRate: effectiveSellRate,
        updatedAt: new Date().toISOString(),
        selectedRateId: dataToUpdate.selectedRateId === null ? undefined : dataToUpdate.selectedRateId,
        notes: dataToUpdate.notes === null ? undefined : dataToUpdate.notes,
      } as Quotation;
    } catch (error) {
      console.error("Error updating quotation:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);

  const deleteQuotation = useCallback(async (id: string) => {
    setAppLoading(true);
    try {
      const qtnDocRef = doc(db, "quotations", id);
      const qtnSnap = await getDoc(qtnDocRef);
      if (qtnSnap.exists() && qtnSnap.data().status === 'Booking Completed') {
        setAppLoading(false);
        return false;
      }
      await deleteDoc(qtnDocRef);
      await loadInitialDataForCharts(); // Refresh chart data
      setAppLoading(false);
      return true;
    } catch (error) {
      console.error("Error deleting quotation:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);

  // Booking Operations
  const fetchBookings = useCallback(async (page: number, pageSize: number, searchTerm?: string) => {
    setAppLoading(true);
    const bookingsQuery = query(collection(db, "bookings"), orderBy("updatedAt", "desc"));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    let allBookings = bookingsSnapshot.docs.map(toBooking);

    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        allBookings = allBookings.filter(b =>
            b.id.toLowerCase().includes(lowerSearchTerm) ||
            b.quotationId.toLowerCase().includes(lowerSearchTerm) ||
            b.customerName.toLowerCase().includes(lowerSearchTerm) ||
            b.pol.toLowerCase().includes(lowerSearchTerm) ||
            b.pod.toLowerCase().includes(lowerSearchTerm) ||
            b.equipment.toLowerCase().includes(lowerSearchTerm) ||
            b.status.toLowerCase().includes(lowerSearchTerm)
        );
    }

    const total = allBookings.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setAppLoading(false);
    return { data: allBookings.slice(start, end), total };
  }, []);

   const getBookingById = useCallback(async (id: string) => {
    setAppLoading(true);
     try {
      const docRef = doc(db, "bookings", id);
      const docSnap = await getDoc(docRef);
      setAppLoading(false);
      return docSnap.exists() ? toBooking(docSnap) : undefined;
    } catch (error) {
      console.error("Error fetching booking by ID:", error);
      setAppLoading(false);
      return undefined;
    }
  }, []);

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    setAppLoading(true);
    const batch = writeBatch(db);
    try {
      const newId = await getNextId("bookings", "CB-");
      const finalBuyRate = bookingData.buyRate ?? 0;
      const finalSellRate = bookingData.sellRate ?? 0;

      const dataToSave: any = {
        ...bookingData,
        buyRate: finalBuyRate,
        sellRate: finalSellRate,
        profitAndLoss: finalSellRate - finalBuyRate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        selectedCarrierRateId: bookingData.selectedCarrierRateId === undefined ? null : bookingData.selectedCarrierRateId,
        notes: bookingData.notes === undefined ? null : bookingData.notes,
      };

      const bookingDocRef = doc(db, "bookings", newId);
      batch.set(bookingDocRef, dataToSave);

      const quotationDocRef = doc(db, "quotations", bookingData.quotationId);
      batch.update(quotationDocRef, { status: 'Booking Completed', updatedAt: serverTimestamp() });

      await batch.commit();
      await loadInitialDataForCharts(); // Refresh chart data
      setAppLoading(false);
      return {
        id: newId,
        ...bookingData,
        buyRate: dataToSave.buyRate,
        sellRate: dataToSave.sellRate,
        profitAndLoss: dataToSave.profitAndLoss,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error creating booking:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);

  const updateBooking = useCallback(async (id: string, bookingData: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setAppLoading(true);
    try {
      const docRef = doc(db, "bookings", id);
      const currentDocSnap = await getDoc(docRef);
      if (!currentDocSnap.exists()) throw new Error("Booking not found for update");
      const currentData = toBooking(currentDocSnap);

      const dataToUpdate: any = { updatedAt: serverTimestamp() };

      for (const key in bookingData) {
        if (Object.prototype.hasOwnProperty.call(bookingData, key)) {
          const value = (bookingData as any)[key];
           (dataToUpdate as any)[key] = value === undefined ? null : value;
        }
      }

      const effectiveBuyRate = bookingData.buyRate !== undefined ? bookingData.buyRate : currentData.buyRate;
      const effectiveSellRate = bookingData.sellRate !== undefined ? bookingData.sellRate : currentData.sellRate;

      dataToUpdate.buyRate = effectiveBuyRate ?? 0;
      dataToUpdate.sellRate = effectiveSellRate ?? 0;
      dataToUpdate.profitAndLoss = (dataToUpdate.sellRate || 0) - (dataToUpdate.buyRate || 0);

      await updateDoc(docRef, dataToUpdate);
      await loadInitialDataForCharts(); // Refresh chart data
      setAppLoading(false);
      return {
        ...currentData,
        ...bookingData,
        id,
        profitAndLoss: dataToUpdate.profitAndLoss,
        buyRate: dataToUpdate.buyRate,
        sellRate: dataToUpdate.sellRate,
        updatedAt: new Date().toISOString(),
        selectedCarrierRateId: dataToUpdate.selectedCarrierRateId === null ? undefined : dataToUpdate.selectedCarrierRateId,
        notes: dataToUpdate.notes === null ? undefined : dataToUpdate.notes,
      } as Booking;
    } catch (error) {
      console.error("Error updating booking:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);

  const deleteBooking = useCallback(async (id: string) => {
    setAppLoading(true);
    const batch = writeBatch(db);
    try {
      const bookingDocRef = doc(db, "bookings", id);
      const bookingSnap = await getDoc(bookingDocRef);

      if (!bookingSnap.exists()) {
        setAppLoading(false);
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
      await loadInitialDataForCharts(); // Refresh chart data
      setAppLoading(false);
      return true;
    } catch (error) {
      console.error("Error deleting booking:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);


  // BuyRate Operations (mock)
  const fetchBuyRates = useCallback(async (page: number, pageSize: number, searchTerm?: string) => {
    setAppLoading(true);
    await simulateDelay(); // Keep simulation for mock data operations
    let filteredData = [...buyRatesDataState];
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = filteredData.filter(br =>
            br.carrier.toLowerCase().includes(lowerSearchTerm) ||
            br.pol.toLowerCase().includes(lowerSearchTerm) ||
            br.pod.toLowerCase().includes(lowerSearchTerm) ||
            br.commodity.toLowerCase().includes(lowerSearchTerm) ||
            br.equipment.toLowerCase().includes(lowerSearchTerm) ||
            br.freightModeType.toLowerCase().includes(lowerSearchTerm)
        );
    }
    const sortedData = filteredData.sort((a,b) => parseISO(b.validTo).getTime() - parseISO(a.validTo).getTime());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setAppLoading(false);
    return { data: sortedData.slice(start, end), total: sortedData.length };
  }, [buyRatesDataState]);

  const createBuyRate = useCallback(async (data: Omit<BuyRate, 'id'>) => {
    setAppLoading(true);
    await simulateDelay();
    const newBuyRate: BuyRate = { ...data, id: `BR-${String(Date.now()).slice(-6)}` };
    setBuyRatesDataState(prev => [...prev, newBuyRate].sort((a,b) => parseISO(b.validTo).getTime() - parseISO(a.validTo).getTime()));
    setAppLoading(false);
    return newBuyRate;
  }, []);

  const updateBuyRate = useCallback(async (id: string, data: Partial<Omit<BuyRate, 'id'>>) => {
    setAppLoading(true);
    await simulateDelay();
    let updated: BuyRate | undefined;
    setBuyRatesDataState(prev => prev.map(br => {
      if (br.id === id) {
        updated = { ...br, ...data };
        return updated;
      }
      return br;
    }).sort((a,b) => parseISO(b.validTo).getTime() - parseISO(a.validTo).getTime()));
    setAppLoading(false);
    return updated;
  }, []);

  const deleteBuyRate = useCallback(async (id: string) => {
    setAppLoading(true);
    await simulateDelay();
    setBuyRatesDataState(prev => prev.filter(br => br.id !== id));
    setAppLoading(false);
    return true;
  }, []);

  // Schedule Operations (mock)
  const fetchSchedules = useCallback(async (page: number, pageSize: number, searchTerm?: string) => {
    setAppLoading(true);
    await simulateDelay();
    let filteredData = [...schedulesDataState];
     if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = filteredData.filter(s =>
            s.carrier.toLowerCase().includes(lowerSearchTerm) ||
            s.origin.toLowerCase().includes(lowerSearchTerm) ||
            s.destination.toLowerCase().includes(lowerSearchTerm) ||
            s.serviceRoute.toLowerCase().includes(lowerSearchTerm) ||
            s.frequency.toLowerCase().includes(lowerSearchTerm)
        );
    }
    const sortedData = filteredData.sort((a,b) => parseISO(b.etd).getTime() - parseISO(a.etd).getTime());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setAppLoading(false);
    return { data: sortedData.slice(start, end), total: sortedData.length };
  }, [schedulesDataState]);

  const createSchedule = useCallback(async (data: Omit<Schedule, 'id'>) => {
    setAppLoading(true);
    await simulateDelay();
    const newSchedule: Schedule = { ...data, id: `SCH-${String(Date.now()).slice(-6)}` };
    setSchedulesDataState(prev => [...prev, newSchedule].sort((a,b) => parseISO(b.etd).getTime() - parseISO(a.etd).getTime()));
    setAppLoading(false);
    return newSchedule;
  }, []);

  const updateSchedule = useCallback(async (id: string, data: Partial<Omit<Schedule, 'id'>>) => {
    setAppLoading(true);
    await simulateDelay();
    let updated: Schedule | undefined;
    setSchedulesDataState(prev => prev.map(s => {
      if (s.id === id) {
        updated = { ...s, ...data };
        return updated;
      }
      return s;
    }).sort((a,b) => parseISO(b.etd).getTime() - parseISO(a.etd).getTime()));
    setAppLoading(false);
    return updated;
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    setAppLoading(true);
    await simulateDelay();
    setSchedulesDataState(prev => prev.filter(s => s.id !== id));
    setAppLoading(false);
    return true;
  }, []);

  const searchScheduleRates = useCallback(async (params: { pol?: string; pod?: string; equipment?: string }) => {
    setAppLoading(true);
    await simulateDelay();
    let results = [...scheduleRatesDataState];

    if (params.pol) {
        const polPort = portsDataState.find(p => p.name.toLowerCase() === params.pol!.toLowerCase());
        if (polPort) {
            results = results.filter(sr => sr.origin === polPort.code);
        } else {
            results = [];
        }
    }
    if (params.pod) {
        const podPort = portsDataState.find(p => p.name.toLowerCase() === params.pod!.toLowerCase());
        if (podPort) {
            results = results.filter(sr => sr.destination === podPort.code);
        } else {
            results = [];
        }
    }
    if (params.equipment) {
      const equipmentLower = params.equipment.toLowerCase();
      results = results.filter(sr => sr.voyageDetails.toLowerCase().includes(equipmentLower));
    }

    setAppLoading(false);
    return results.slice(0, 10);
  }, [portsDataState, scheduleRatesDataState]);


  return (
    <DataContext.Provider value={{
      ports: portsDataState,
      buyRates: buyRatesDataState,
      schedules: schedulesDataState,
      scheduleRates: scheduleRatesDataState,
      loading: appLoading,
      quotationStatusSummary: quotationStatusSummaryData,
      bookingsByMonth: bookingsByMonthData,
      fetchQuotations, getQuotationById, createQuotation, updateQuotation, deleteQuotation,
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

