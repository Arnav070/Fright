
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { BookingForm, type BookingFormValues } from '@/components/bookings/BookingForm';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Booking } from '@/lib/types';

export default function NewBookingPage() {
  const router = useRouter();
  const { createBooking, loading } = useData();
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [submittedBookingId, setSubmittedBookingId] = React.useState<string | null>(null);

  const handleSubmit = async (data: BookingFormValues) => {
    try {
      const bookingPayload: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
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
      const newBooking = await createBooking(bookingPayload);
      setSubmittedBookingId(newBooking.id);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to create booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    router.push('/bookings');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Booking"
        breadcrumbs={[{ label: 'Bookings', href: '/bookings' }, { label: 'New' }]}
      />
      <BookingForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/bookings')}
        isSubmitting={loading}
      />

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Booking Submitted Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Booking <strong>{submittedBookingId}</strong> has been created and a confirmation (simulated) has been emailed to the internal team at <strong>xyz@example.com</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
