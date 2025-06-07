
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { BookingForm, type BookingFormValues } from '@/components/bookings/BookingForm';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { getBookingById, updateBooking, loading: dataLoading } = useData();
  const { toast } = useToast();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (id) {
      const fetchBooking = async () => {
        setIsLoading(true);
        const data = await getBookingById(id);
        if (data) {
          setBooking(data);
        } else {
          toast({ title: "Error", description: "Booking not found.", variant: "destructive" });
          router.replace('/bookings');
        }
        setIsLoading(false);
      };
      fetchBooking();
    }
  }, [id, getBookingById, toast, router]);

  const handleSubmit = async (data: BookingFormValues) => {
    if (!booking) return;
    setIsSubmitting(true);
    try {
      const bookingPayload: Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>> = {
        quotationId: data.selectedQuotationId,
        customerName: data.customerName,
        pol: data.pol,
        pod: data.pod,
        equipment: data.equipment,
        type: data.type,
        sellRate: data.sellRate,
        buyRate: data.buyRate,
        profitAndLoss: data.profitAndLoss,
        status: data.status,
        notes: data.notes,
        selectedCarrierRateId: data.selectedCarrierRateId,
      };
      const updatedData = await updateBooking(booking.id, bookingPayload);
      if (updatedData) {
        toast({ title: "Success", description: "Booking updated successfully." });
        router.push('/bookings');
      } else {
        toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Booking" breadcrumbs={[{ label: 'Bookings', href: '/bookings' }, { label: 'Edit' }]} />
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-10 w-1/4 ml-auto" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Booking ${booking.id}`}
        breadcrumbs={[{ label: 'Bookings', href: '/bookings' }, { label: 'Edit' }]}
      />
      <BookingForm
        initialData={booking}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/bookings')}
        isSubmitting={isSubmitting || dataLoading}
      />
    </div>
  );
}
