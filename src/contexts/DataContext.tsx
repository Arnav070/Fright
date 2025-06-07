
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
  clearAndReseedData: () => Promise<void>;
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
      const seededQuotationRefs: { [key: string]: string } = {};
      let quotationCounter = 1;

      quotationsToSeedFromImage.forEach((qData) => {
        const newQuotationId = `CQ-${quotationCounter}`;
        const profitAndLoss = (qData.sellRate || 0) - (qData.buyRate || 0);
        const quotationDocRef = doc(db, "quotations", newQuotationId);
        batch.set(quotationDocRef, {
          ...qData,
          buyRate: qData.buyRate ?? 0,
          sellRate: qData.sellRate ?? 0,
          profitAndLoss,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        const tempRefKey = `${qData.customerName}-${qData.pol}-${qData.pod}-${qData.equipment}`;
        seededQuotationRefs[tempRefKey] = newQuotationId;
        quotationCounter++;
      });
      await batch.commit();
      console.log(`${quotationsToSeedFromImage.length} quotations seeded with CQ-X format.`);

      const bookingsSnapshot = await getDocs(query(bookingsRef, limit(1))); // Re-check bookings after quotations might have been seeded
      if (bookingsSnapshot.empty) {
        console.log("Bookings collection is empty. Seeding bookings...");
        const bookingsBatch = writeBatch(db);
        let bookingCounter = 1;
        bookingsToSeedFromImageBase.forEach(bData => {
          const newBookingId = `CB-${bookingCounter}`;
          const tempRefKey = `${bData.quotationRefCustomer}-${bData.quotationRefPol}-${bData.quotationRefPod}-${bData.quotationRefEquipment}`;
          const quotationId = seededQuotationRefs[tempRefKey];

          if (quotationId) {
            const bookingDocRef = doc(db, "bookings", newBookingId);
            const { quotationRefCustomer, quotationRefPol, quotationRefPod, quotationRefEquipment, ...restOfBData } = bData;
            const profitAndLoss = (bData.sellRate || 0) - (bData.buyRate || 0);
            bookingsBatch.set(bookingDocRef, {
              ...restOfBData,
              quotationId,
              buyRate: bData.buyRate ?? 0,
              sellRate: bData.sellRate ?? 0,
              profitAndLoss,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            bookingCounter++;
          } else {
            console.warn(`Could not find quotation ID for booking seed: ${tempRefKey}`);
          }
        });
        await bookingsBatch.commit();
        console.log("Bookings seeded with CB-X format.");
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
      await seedDatabaseIfEmpty();

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

  const clearAndReseedData = async () => {
    setLoading(true);
    console.log("Attempting to clear and re-seed all Quotation and Booking data...");
    const BATCH_SIZE = 499; // Firestore batch limit is 500 operations

    try {
      // 1. Delete all quotations
      const quotationsRef = collection(db, "quotations");
      const qSnapshot = await getDocs(quotationsRef);
      let quotationDeleteBatch = writeBatch(db);
      let qDeleteCount = 0;
      for (const docSnap of qSnapshot.docs) {
        quotationDeleteBatch.delete(docSnap.ref);
        qDeleteCount++;
        if (qDeleteCount % BATCH_SIZE === 0) {
          console.log(`Committing batch delete for quotations (batch ${Math.ceil(qDeleteCount / BATCH_SIZE)})...`);
          await quotationDeleteBatch.commit();
          quotationDeleteBatch = writeBatch(db); // Start a new batch
        }
      }
      if (qDeleteCount % BATCH_SIZE !== 0 && qDeleteCount > 0) { // Commit any remaining deletes
          console.log("Committing final batch delete for quotations...");
          await quotationDeleteBatch.commit();
      }
      console.log(`${qDeleteCount} quotations deleted.`);
      setQuotations([]); // Clear local state

      // 2. Delete all bookings
      const bookingsRef = collection(db, "bookings");
      const bSnapshot = await getDocs(bookingsRef);
      let bookingDeleteBatch = writeBatch(db);
      let bDeleteCount = 0;
      for (const docSnap of bSnapshot.docs) {
        bookingDeleteBatch.delete(docSnap.ref);
        bDeleteCount++;
        if (bDeleteCount % BATCH_SIZE === 0) {
          console.log(`Committing batch delete for bookings (batch ${Math.ceil(bDeleteCount / BATCH_SIZE)})...`);
          await bookingDeleteBatch.commit();
          bookingDeleteBatch = writeBatch(db);
        }
      }
      if (bDeleteCount % BATCH_SIZE !== 0 && bDeleteCount > 0) {
          console.log("Committing final batch delete for bookings...");
          await bookingDeleteBatch.commit();
      }
      console.log(`${bDeleteCount} bookings deleted.`);
      setBookings([]); // Clear local state

      // 3. Re-run seeding logic (loadAllData calls seedDatabaseIfEmpty)
      await loadAllData();

      console.log("Data cleared and re-seeded successfully.");
    } catch (error) {
      console.error("Error during clear and re-seed:", error);
      // Potentially try to reload data even if clear/re-seed failed partially
      await loadAllData();
    } finally {
      setLoading(false);
    }
  };


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
      const newId = await getNextId("quotations", "CQ-");
      const finalBuyRate = quotationData.buyRate ?? 0;
      const finalSellRate = quotationData.sellRate ?? 0;

      const dataToSave = {
        ...quotationData,
        buyRate: finalBuyRate,
        sellRate: finalSellRate,
        profitAndLoss: finalSellRate - finalBuyRate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "quotations", newId), dataToSave);

      const newQuotation: Quotation = {
        id: newId,
        customerName: dataToSave.customerName,
        pol: dataToSave.pol,
        pod: dataToSave.pod,
        equipment: dataToSave.equipment,
        type: dataToSave.type,
        buyRate: dataToSave.buyRate,
        sellRate: dataToSave.sellRate,
        profitAndLoss: dataToSave.profitAndLoss,
        status: dataToSave.status,
        selectedRateId: dataToSave.selectedRateId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if ((dataToSave as any).notes !== undefined) {
        (newQuotation as any).notes = (dataToSave as any).notes;
      }

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

      const currentData = toQuotation(currentDocSnap);

      const dataToUpdate: Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue } = {
        updatedAt: serverTimestamp(),
      };

      for (const key in quotationData) {
        if (Object.prototype.hasOwnProperty.call(quotationData, key)) {
          const value = quotationData[key as keyof typeof quotationData];
          if (value !== undefined) {
            (dataToUpdate as any)[key] = value;
          }
        }
      }

      const effectiveBuyRate = (dataToUpdate as any).buyRate !== undefined ? (dataToUpdate as any).buyRate : currentData.buyRate;
      const effectiveSellRate = (dataToUpdate as any).sellRate !== undefined ? (dataToUpdate as any).sellRate : currentData.sellRate;

      (dataToUpdate as any).buyRate = effectiveBuyRate ?? 0;
      (dataToUpdate as any).sellRate = effectiveSellRate ?? 0;
      (dataToUpdate as any).profitAndLoss = ((dataToUpdate as any).sellRate || 0) - ((dataToUpdate as any).buyRate || 0);

      await updateDoc(docRef, dataToUpdate as any);

      const updatedQuotationData = { ...currentData, ...dataToUpdate, id, updatedAt: new Date().toISOString() } as Quotation;

      await loadAllData();
      setLoading(false);
      return updatedQuotationData;
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
      const newId = await getNextId("bookings", "CB-");
      const finalBuyRate = bookingData.buyRate ?? 0;
      const finalSellRate = bookingData.sellRate ?? 0;

      const dataToSave = {
        ...bookingData,
        buyRate: finalBuyRate,
        sellRate: finalSellRate,
        profitAndLoss: finalSellRate - finalBuyRate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const bookingDocRef = doc(db, "bookings", newId);
      batch.set(bookingDocRef, dataToSave);

      const quotationDocRef = doc(db, "quotations", bookingData.quotationId);
      batch.update(quotationDocRef, { status: 'Booking Completed', updatedAt: serverTimestamp() });

      await batch.commit();

      const newBooking: Booking = {
        id: newId,
        quotationId: dataToSave.quotationId,
        customerName: dataToSave.customerName,
        pol: dataToSave.pol,
        pod: dataToSave.pod,
        equipment: dataToSave.equipment,
        type: dataToSave.type,
        buyRate: dataToSave.buyRate,
        sellRate: dataToSave.sellRate,
        profitAndLoss: dataToSave.profitAndLoss,
        status: dataToSave.status,
        selectedCarrierRateId: dataToSave.selectedCarrierRateId,
        notes: (dataToSave as any).notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

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
      const currentDocSnap = await getDoc(docRef);
      if (!currentDocSnap.exists()) throw new Error("Booking not found for update");
      const currentData = toBooking(currentDocSnap);

      const dataToUpdate: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue } = {
          updatedAt: serverTimestamp(),
      };

      for (const key in bookingData) {
          if (Object.prototype.hasOwnProperty.call(bookingData, key)) {
              const value = bookingData[key as keyof typeof bookingData];
              if (value !== undefined) {
                  (dataToUpdate as any)[key] = value;
              }
          }
      }

      const effectiveBuyRate = bookingData.buyRate !== undefined ? bookingData.buyRate : currentData.buyRate;
      const effectiveSellRate = bookingData.sellRate !== undefined ? bookingData.sellRate : currentData.sellRate;

      dataToUpdate.buyRate = effectiveBuyRate ?? 0;
      dataToUpdate.sellRate = effectiveSellRate ?? 0;
      dataToUpdate.profitAndLoss = (dataToUpdate.sellRate || 0) - (dataToUpdate.buyRate || 0);

      await updateDoc(docRef, dataToUpdate as any);

      const updatedBookingData = { ...currentData, ...dataToUpdate, id, updatedAt: new Date().toISOString() } as Booking;
      await loadAllData();
      setLoading(false);
      return updatedBookingData;
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
    let results = [...scheduleRates];

    if (params.pol) {
        const polPort = ports.find(p => p.name.toLowerCase() === params.pol!.toLowerCase());
        if (polPort) {
            results = results.filter(sr => sr.origin === polPort.code);
        } else {
            results = [];
        }
    }
    if (params.pod) {
        const podPort = ports.find(p => p.name.toLowerCase() === params.pod!.toLowerCase());
        if (podPort) {
            results = results.filter(sr => sr.destination === podPort.code);
        } else {
            results = [];
        }
    }
    setLoading(false);
    return results.slice(0, 10);
  }, [scheduleRates, ports]);


  return (
    <DataContext.Provider value={{
      ports, quotations, bookings, buyRates, schedules, scheduleRates, loading,
      quotationStatusSummary, bookingsByMonth,
      fetchQuotations, getQuotationById, createQuotation, updateQuotation, deleteQuotation, searchQuotations,
      fetchBookings, getBookingById, createBooking, updateBooking, deleteBooking,
      fetchBuyRates, createBuyRate, updateBuyRate, deleteBuyRate,
      fetchSchedules, createSchedule, updateSchedule, deleteSchedule,
      searchScheduleRates,
      clearAndReseedData,
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
