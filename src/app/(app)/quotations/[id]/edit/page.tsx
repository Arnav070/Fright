"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { QuotationForm, type QuotationFormValues } from '@/components/quotations/QuotationForm';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import type { Quotation } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { getQuotationById, updateQuotation, loading: dataLoading } = useData();
  const { toast } = useToast();
  
  const [quotation, setQuotation] = React.useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [submittedCustomerEmail, setSubmittedCustomerEmail] = React.useState<string>("xyz@example.com");


  React.useEffect(() => {
    if (id) {
      const fetchQuotation = async () => {
        setIsLoading(true);
        const data = await getQuotationById(id);
        if (data) {
          setQuotation(data);
        } else {
          toast({ title: "Error", description: "Quotation not found.", variant: "destructive" });
          router.replace('/quotations');
        }
        setIsLoading(false);
      };
      fetchQuotation();
    }
  }, [id, getQuotationById, toast, router]);

  const handleSubmit = async (data: QuotationFormValues) => {
    if (!quotation) return;
    setIsSubmitting(true);
    try {
      const updatedData = await updateQuotation(quotation.id, data);
      if (updatedData) {
        toast({ title: "Success", description: "Quotation updated successfully." });
        // If status changed to 'Submitted', show popup
        if (data.status === 'Submitted' && quotation.status !== 'Submitted') {
            setSubmittedCustomerEmail(`${data.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`);
            setShowSuccessDialog(true);
        } else {
            router.push('/quotations');
        }
      } else {
        toast({ title: "Error", description: "Failed to update quotation.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };
  
  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    router.push('/quotations');
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Quotation" breadcrumbs={[{ label: 'Quotations', href: '/quotations' }, { label: 'Edit' }]} />
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-10 w-1/4 ml-auto" />
        </div>
      </div>
    );
  }

  if (!quotation) {
    return null; // Or a "not found" message, though useEffect handles redirect
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Quotation ${quotation.id}`}
        breadcrumbs={[{ label: 'Quotations', href: '/quotations' }, { label: 'Edit' }]}
      />
      <QuotationForm 
        initialData={quotation} 
        onSubmit={handleSubmit} 
        onCancel={() => router.push('/quotations')} 
        isSubmitting={isSubmitting || dataLoading}
      />
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quotation Submitted Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Quotation <strong>{quotation.id}</strong> has been updated and a confirmation (simulated) has been emailed to the client at <strong>{submittedCustomerEmail}</strong>.
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
