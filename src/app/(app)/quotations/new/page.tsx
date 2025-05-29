"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { QuotationForm, type QuotationFormValues } from '@/components/quotations/QuotationForm';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NewQuotationPage() {
  const router = useRouter();
  const { createQuotation, loading } = useData();
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [submittedQuotationId, setSubmittedQuotationId] = React.useState<string | null>(null);
  const [submittedCustomerEmail, setSubmittedCustomerEmail] = React.useState<string>("xyz@example.com");


  const handleSubmit = async (data: QuotationFormValues) => {
    try {
      const newQuotation = await createQuotation(data);
      setSubmittedQuotationId(newQuotation.id);
      // For prototype, use a generic email or one derived from customer name
      setSubmittedCustomerEmail(`${data.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`);
      setShowSuccessDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create quotation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    router.push('/quotations');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Quotation"
        breadcrumbs={[{ label: 'Quotations', href: '/quotations' }, { label: 'New' }]}
      />
      <QuotationForm 
        onSubmit={handleSubmit} 
        onCancel={() => router.push('/quotations')}
        isSubmitting={loading} 
      />

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quotation Submitted Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Quotation <strong>{submittedQuotationId}</strong> has been created and a confirmation (simulated) has been emailed to the client at <strong>{submittedCustomerEmail}</strong>.
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
