
"use client";

import type { ReactNode } from 'react';
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
  mockScheduleRates as staticMockScheduleRates, // Will be phased out
  mockPorts,
  simulateDelay, // Will be removed for Firestore ops
  quotationsToSeedFromImage,
  bookingsToSeedFromImageBase
} from '@/lib/mockData';
import { format, parseISO, isValid } from 'date-fns';
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
  getCountFromServer,
} from 'firebase/firestore';

interface DataContextType {
  ports: Port[];
  loading: boolean;
  quotationStatusSummary: QuotationStatusSummary;
  // bookingsByMonth: BookingsByMonthEntry[]; // This structure changed

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
  allBookingsForChart: Booking[]; // Expose for dashboard
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
    buyRate: data.buyRate === null ? undefined : data.buyRate,
    sellRate: data.sellRate === null ? undefined : data.sellRate,
    profitAndLoss: data.profitAndLoss,
    status: data.status,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString(),
    selectedRateId: data.selectedRateId === null ? undefined : data.selectedRateId,
    notes: data.notes === null ? undefined : data.notes,
  };
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

const toBuyRate = (docSnap: any): BuyRate => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    carrier: data.carrier,
    pol: data.pol,
    pod: data.pod,
    commodity: data.commodity,
    freightModeType: data.freightModeType,
    equipment: data.equipment,
    weightCapacity: data.weightCapacity,
    minBooking: data.minBooking,
    rate: data.rate,
    validFrom: data.validFrom, // Assuming stored as "yyyy-MM-dd" string
    validTo: data.validTo,     // Assuming stored as "yyyy-MM-dd" string
  };
};

async function getNextIdForCollection(collectionName: string, prefix: string): Promise<string> {
  const collRef = collection(db, collectionName);
  const q = query(collRef, orderBy('__name__', 'desc'), limit(1)); // Efficiently get the last ID
  const snapshot = await getDocs(q);
  let maxNum = 0;
  if (!snapshot.empty) {
    const lastId = snapshot.docs[0].id;
    if (lastId.startsWith(prefix)) {
      const numPart = lastId.substring(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num)) {
        maxNum = num;
      }
    }
  }
  // If no documents or no matching prefix, and collectionName is one of our main ones, start from count.
  if (maxNum === 0 && ['quotations', 'bookings', 'buyRates', 'schedules'].includes(collectionName)) {
     const countSnapshot = await getCountFromServer(collection(db, collectionName));
     maxNum = countSnapshot.data().count;
  }
  return `${prefix}${maxNum + 1}`;
}


export function DataProvider({ children }: { children: ReactNode }) {
  const [portsData, setPortsData] = useState<Port[]>(mockPorts);
  // const [buyRatesDataState, setBuyRatesDataState] = useState<BuyRate[]>(initialMockBuyRates); // To be removed
  const [schedulesDataState, setSchedulesDataState] = useState<Schedule[]>(initialMockSchedules); // To be removed
  const [scheduleRatesDataState, setScheduleRatesDataState] = useState<ScheduleRate[]>(staticMockScheduleRates); // To be refactored
  const [appLoading, setAppLoading] = useState(true);

  const [allQuotationsForChart, setAllQuotationsForChart] = useState<Quotation[]>([]);
  const [allBookingsForChartData, setAllBookingsForChartData] = useState<Booking[]>([]);
  const [quotationStatusSummaryData, setQuotationStatusSummaryData] = useState<QuotationStatusSummary>({ draft: 0, submitted: 0, completed: 0, cancelled: 0 });
  // const [bookingsByMonthData, setBookingsByMonthData] = useState<BookingsByMonthEntry[]>([]); // Managed by dashboard

  const seedDatabaseIfEmpty = useCallback(async () => {
    console.log("Checking if database needs seeding...");
    
    const batch = writeBatch(db);
    let seededSomething = false;

    // Seed Quotations
    const quotationsRef = collection(db, "quotations");
    const quotationsSnapshot = await getDocs(query(quotationsRef, limit(1)));
    const seededQuotationRefs: { [key: string]: string } = {}; // For booking foreign keys

    if (quotationsSnapshot.empty) {
      console.log("Quotations collection is empty. Seeding quotations...");
      seededSomething = true;
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
          selectedRateId: qData.selectedRateId === undefined ? null : qData.selectedRateId,
          notes: (qData as any).notes === undefined ? null : (qData as any).notes,
        };
        const quotationDocRef = doc(db, "quotations", newQuotationId);
        batch.set(quotationDocRef, quotationToSave);
        const tempRefKey = `${qData.customerName}-${qData.pol}-${qData.pod}-${qData.equipment}`;
        seededQuotationRefs[tempRefKey] = newQuotationId;
      }
      console.log(`${quotationsToSeedFromImage.length} quotations prepared for seeding.`);
    } else {
      console.log("Quotations collection not empty, skipping quotation seed.");
       // Populate seededQuotationRefs for bookings even if not seeding quotations, assuming IDs are CQ-1, CQ-2 etc.
      const existingQuotationsSnapshot = await getDocs(query(quotationsRef, orderBy('__name__')));
      existingQuotationsSnapshot.docs.forEach(docSnap => {
        const qData = toQuotation(docSnap);
        const tempRefKey = `${qData.customerName}-${qData.pol}-${qData.pod}-${qData.equipment}`;
        seededQuotationRefs[tempRefKey] = qData.id;
      });
    }

    // Seed Bookings (after quotations)
    const bookingsRef = collection(db, "bookings");
    const bookingsSnapshot = await getDocs(query(bookingsRef, limit(1)));
    if (bookingsSnapshot.empty) {
      console.log("Bookings collection is empty. Seeding bookings...");
      seededSomething = true;
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
            selectedCarrierRateId: bData.selectedCarrierRateId === undefined ? null : bData.selectedCarrierRateId,
            notes: bData.notes === undefined ? null : bData.notes,
          };
          batch.set(bookingDocRef, bookingToSave);
        } else {
          console.warn(`Could not find quotation ID for booking seed: ${tempRefKey}`);
        }
      }
      console.log("Bookings prepared for seeding.");
    } else {
      console.log("Bookings collection not empty, skipping booking seed.");
    }

    // Seed BuyRates
    const buyRatesRef = collection(db, "buyRates");
    const buyRatesSnapshot = await getDocs(query(buyRatesRef, limit(1)));
    if (buyRatesSnapshot.empty) {
        console.log("BuyRates collection is empty. Seeding buy rates...");
        seededSomething = true;
        initialMockBuyRates.forEach((brDataSource, index) => {
            const { id: brIdFromSource, ...restOfBrData } = brDataSource; // Destructure id out
            const buyRateId = brIdFromSource.startsWith("BR-IMG-") || brIdFromSource.startsWith("BR-LCL-") ? brIdFromSource : `BR-Seed-${index + 1}`;
            const buyRateDocRef = doc(db, "buyRates", buyRateId);
            // Now, restOfBrData does not contain the 'id' field.
            // Ensure validFrom and validTo are strings if they aren't already
            const dataToSet = {
              ...restOfBrData,
              validFrom: typeof restOfBrData.validFrom === 'string' ? restOfBrData.validFrom : format(restOfBrData.validFrom as unknown as Date, "yyyy-MM-dd"),
              validTo: typeof restOfBrData.validTo === 'string' ? restOfBrData.validTo : format(restOfBrData.validTo as unknown as Date, "yyyy-MM-dd"),
            };
            batch.set(buyRateDocRef, dataToSet);
        });
        console.log(`${initialMockBuyRates.length} buy rates prepared for seeding.`);
    } else {
        console.log("BuyRates collection not empty, skipping buy rate seed.");
    }
    
    if (seededSomething) {
        await batch.commit();
        console.log("Database seeding committed.");
    } else {
        console.log("No new seeding required for Quotations, Bookings, or BuyRates.");
    }

  }, []);


  const loadInitialDataForCharts = useCallback(async () => {
    setAppLoading(true);
    try {
      await seedDatabaseIfEmpty();

      const quotationsQuery = query(collection(db, "quotations"), orderBy("createdAt", "desc"));
      const quotationsSnapshotData = await getDocs(quotationsQuery);
      const fetchedQuotations = quotationsSnapshotData.docs.map(toQuotation);
      setAllQuotationsForChart(fetchedQuotations);

      const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
      const bookingsSnapshotData = await getDocs(bookingsQuery);
      const fetchedBookings = bookingsSnapshotData.docs.map(toBooking);
      setAllBookingsForChartData(fetchedBookings);

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


  // Quotation Operations
  const fetchQuotations = useCallback(async (page: number, pageSize: number, searchTerm?: string) => {
    setAppLoading(true);
    const qCollectionRef = collection(db, "quotations");
    let allQuotations: Quotation[];

    if (searchTerm) {
      // Firestore doesn't support case-insensitive partial text search on multiple fields well.
      // Fetch all and filter client-side for prototype simplicity.
      // For production, consider a dedicated search service like Algolia/Typesense or more structured queries.
      const snapshot = await getDocs(query(qCollectionRef, orderBy("updatedAt", "desc")));
      allQuotations = snapshot.docs.map(toQuotation);
      const lowerSearchTerm = searchTerm.toLowerCase();
      allQuotations = allQuotations.filter(qItem =>
        Object.values(qItem).some(val =>
          String(val).toLowerCase().includes(lowerSearchTerm)
        )
      );
    } else {
      const snapshot = await getDocs(query(qCollectionRef, orderBy("updatedAt", "desc")));
      allQuotations = snapshot.docs.map(toQuotation);
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
      const newId = await getNextIdForCollection("quotations", "CQ-");
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
      await loadInitialDataForCharts();
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
      await loadInitialDataForCharts();
      setAppLoading(false);
      return {
        ...currentData,
        ...quotationData, // applies partial updates
        id, // ensure id is present
        buyRate: effectiveBuyRate, // ensure these are set
        sellRate: effectiveSellRate,
        profitAndLoss: dataToUpdate.profitAndLoss,
        updatedAt: new Date().toISOString(), // reflect update time
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
      await loadInitialDataForCharts();
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
    const bCollectionRef = collection(db, "bookings");
    let allBookings: Booking[];

    if (searchTerm) {
        const snapshot = await getDocs(query(bCollectionRef, orderBy("updatedAt", "desc")));
        allBookings = snapshot.docs.map(toBooking);
        const lowerSearchTerm = searchTerm.toLowerCase();
        allBookings = allBookings.filter(bItem =>
            Object.values(bItem).some(val =>
                String(val).toLowerCase().includes(lowerSearchTerm)
            )
        );
    } else {
        const snapshot = await getDocs(query(bCollectionRef, orderBy("updatedAt", "desc")));
        allBookings = snapshot.docs.map(toBooking);
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
    const batchOp = writeBatch(db);
    try {
      const newId = await getNextIdForCollection("bookings", "CB-");
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
      batchOp.set(bookingDocRef, dataToSave);

      const quotationDocRef = doc(db, "quotations", bookingData.quotationId);
      batchOp.update(quotationDocRef, { status: 'Booking Completed', updatedAt: serverTimestamp() });

      await batchOp.commit();
      await loadInitialDataForCharts();
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
      await loadInitialDataForCharts();
      setAppLoading(false);
      return {
        ...currentData,
        ...bookingData,
        id,
        buyRate: dataToUpdate.buyRate,
        sellRate: dataToUpdate.sellRate,
        profitAndLoss: dataToUpdate.profitAndLoss,
        updatedAt: new Date().toISOString(),
      } as Booking;
    } catch (error) {
      console.error("Error updating booking:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);

  const deleteBooking = useCallback(async (id: string) => {
    setAppLoading(true);
    const batchOp = writeBatch(db);
    try {
      const bookingDocRef = doc(db, "bookings", id);
      const bookingSnap = await getDoc(bookingDocRef);
      if (!bookingSnap.exists()) {
        setAppLoading(false);
        return false;
      }
      const bookingToDelete = toBooking(bookingSnap);
      batchOp.delete(bookingDocRef);

      const quotationDocRef = doc(db, "quotations", bookingToDelete.quotationId);
      const quotationSnap = await getDoc(quotationDocRef);
      if (quotationSnap.exists() && quotationSnap.data().status === 'Booking Completed') {
         batchOp.update(quotationDocRef, { status: 'Submitted', updatedAt: serverTimestamp() });
      }
      await batchOp.commit();
      await loadInitialDataForCharts();
      setAppLoading(false);
      return true;
    } catch (error) {
      console.error("Error deleting booking:", error);
      setAppLoading(false);
      throw error;
    }
  }, [loadInitialDataForCharts]);


  // BuyRate Operations (Firestore)
  const fetchBuyRates = useCallback(async (page: number, pageSize: number, searchTerm?: string) => {
    setAppLoading(true);
    const brCollectionRef = collection(db, "buyRates");
    let allBuyRates: BuyRate[];

    // Similar to quotations, fetch all then filter client-side for prototype search simplicity
    const snapshot = await getDocs(query(brCollectionRef, orderBy("validTo", "desc"))); // Order by something relevant
    allBuyRates = snapshot.docs.map(toBuyRate);

    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        allBuyRates = allBuyRates.filter(br =>
            Object.values(br).some(val =>
                String(val).toLowerCase().includes(lowerSearchTerm)
            )
        );
    }
    
    const total = allBuyRates.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setAppLoading(false);
    return { data: allBuyRates.slice(start, end), total };
  }, []);

  const createBuyRate = useCallback(async (data: Omit<BuyRate, 'id'>) => {
    setAppLoading(true);
    try {
      const newId = await getNextIdForCollection("buyRates", "BR-");
      // Ensure dates are strings "yyyy-MM-dd"
      const dataToSave = {
        ...data,
        validFrom: typeof data.validFrom === 'string' ? data.validFrom : format(data.validFrom as unknown as Date, "yyyy-MM-dd"),
        validTo: typeof data.validTo === 'string' ? data.validTo : format(data.validTo as unknown as Date, "yyyy-MM-dd"),
      };
      await setDoc(doc(db, "buyRates", newId), dataToSave);
      setAppLoading(false);
      return { ...dataToSave, id: newId };
    } catch (error) {
      console.error("Error creating buy rate:", error);
      setAppLoading(false);
      throw error;
    }
  }, []);

  const updateBuyRate = useCallback(async (id: string, data: Partial<Omit<BuyRate, 'id'>>) => {
    setAppLoading(true);
    try {
      const docRef = doc(db, "buyRates", id);
      // Ensure dates are strings "yyyy-MM-dd" if provided
      const dataToUpdate: any = { ...data };
      if (data.validFrom) {
        dataToUpdate.validFrom = typeof data.validFrom === 'string' ? data.validFrom : format(data.validFrom as unknown as Date, "yyyy-MM-dd");
      }
      if (data.validTo) {
        dataToUpdate.validTo = typeof data.validTo === 'string' ? data.validTo : format(data.validTo as unknown as Date, "yyyy-MM-dd");
      }
      await updateDoc(docRef, dataToUpdate);
      setAppLoading(false);
      const updatedDoc = await getDoc(docRef);
      return updatedDoc.exists() ? toBuyRate(updatedDoc) : undefined;
    } catch (error) {
      console.error("Error updating buy rate:", error);
      setAppLoading(false);
      throw error;
    }
  }, []);

  const deleteBuyRate = useCallback(async (id: string) => {
    setAppLoading(true);
    try {
      await deleteDoc(doc(db, "buyRates", id));
      setAppLoading(false);
      return true;
    } catch (error) {
      console.error("Error deleting buy rate:", error);
      setAppLoading(false);
      throw error;
    }
  }, []);

  // Schedule Operations (mock for now, to be Firestore)
  const fetchSchedules = useCallback(async (page: number, pageSize: number, searchTerm?: string) => {
    setAppLoading(true);
    await simulateDelay(); // Keep simulation for mock data operations
    let filteredData = [...schedulesDataState]; // Replace with Firestore fetch
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
    // This will need a significant refactor to use Firestore data for Schedules and BuyRates
    await simulateDelay();
    let results = [...scheduleRatesDataState]; // Current mock implementation

    const polPort = params.pol ? portsData.find(p => p.name.toLowerCase() === params.pol!.toLowerCase()) : undefined;
    const podPort = params.pod ? portsData.find(p => p.name.toLowerCase() === params.pod!.toLowerCase()) : undefined;

    if (polPort) {
        results = results.filter(sr => sr.origin === polPort.code);
    }
    if (podPort) {
        results = results.filter(sr => sr.destination === podPort.code);
    }
    if (params.equipment) {
      const equipmentLower = params.equipment.toLowerCase();
      results = results.filter(sr => sr.voyageDetails.toLowerCase().includes(equipmentLower));
    }

    setAppLoading(false);
    return results.slice(0, 10);
  }, [portsData, scheduleRatesDataState]);


  return (
    <DataContext.Provider value={{
      ports: portsData,
      loading: appLoading,
      quotationStatusSummary: quotationStatusSummaryData,
      // bookingsByMonth: bookingsByMonthData,
      allBookingsForChart: allBookingsForChartData,
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

