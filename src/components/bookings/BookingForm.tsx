
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Booking, Quotation, ScheduleRate } from '@/lib/types';
import { DataTable, type ColumnDef } from '@/components/common/DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

const bookingFormSchema = z.object({
  quotationIdSearch: z.string().optional(),
  customerNameSearch: z.string().optional(),
  selectedQuotationId: z.string().min(1, "A quotation must be selected"),

  // Readonly fields from quotation
  customerName: z.string(),
  pol: z.string(),
  pod: z.string(),
  equipment: z.string(),
  type: z.enum(['Import', 'Export', 'Cross-Trade']),
  sellRate: z.number(), // from quotation
  buyRate: z.number(), // this will be from the NEW rate search for booking
  profitAndLoss: z.number(), // calculated based on quotation's sellRate and booking's buyRate

  // Fields for rate selection for booking
  selectedCarrierRateId: z.string().optional(), // ID of the rate selected for THIS booking
  status: z.enum(['Booked', 'Shipped', 'Delivered', 'Cancelled']).default('Booked'),
  notes: z.string().optional(),
}).refine(data => {
    // Allow 0 as a valid buyRate if it's explicitly entered,
    // but if it's 0 AND no carrier rate is selected, it might imply it wasn't set.
    // For the purpose of the refine, if buyRate is explicitly 0, it's considered "set".
    if (!data.selectedCarrierRateId && (data.buyRate === undefined || data.buyRate === null )) {
        return false;
    }
    return true;
}, {
    message: "Either select a carrier rate or provide a manual buy rate for the booking.",
    path: ["buyRate"],
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  initialData?: Booking | null;
  onSubmit: (data: BookingFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BookingForm({ initialData, onSubmit, onCancel, isSubmitting }: BookingFormProps) {
  const { searchQuotations, searchScheduleRates, getQuotationById, loading: dataLoading } = useData();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState('step1');

  const [searchedQuotations, setSearchedQuotations] = React.useState<Quotation[]>([]);
  const [quotationSearchLoading, setQuotationSearchLoading] = React.useState(false);

  const [availableBookingRates, setAvailableBookingRates] = React.useState<ScheduleRate[]>([]);
  const [bookingRatesLoading, setBookingRatesLoading] = React.useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialData ? {
        ...initialData, // Spreads all fields from Booking type
        quotationIdSearch: initialData.quotationId || '',
        customerNameSearch: '',
        selectedQuotationId: initialData.quotationId,
        notes: (initialData as any).notes || '', // notes might not be on Booking type strictly
        selectedCarrierRateId: initialData.selectedCarrierRateId || undefined,
    } : {
      quotationIdSearch: '',
      customerNameSearch: '',
      selectedQuotationId: '',
      customerName: '',
      pol: '',
      pod: '',
      equipment: '',
      type: 'Import',
      sellRate: 0,
      buyRate: 0,
      profitAndLoss: 0,
      selectedCarrierRateId: undefined,
      status: 'Booked',
      notes: '',
    },
  });

  const selectedQuotationId = form.watch('selectedQuotationId');
  const selectedCarrierRateId = form.watch('selectedCarrierRateId');
  const selectedBookingRate = availableBookingRates.find(r => r.id === selectedCarrierRateId);

  // Effect to prefill form when a quotation is selected
  React.useEffect(() => {
    if (selectedQuotationId) {
      const fetchAndSetQuotation = async () => {
        let quotationData: Quotation | undefined | null = searchedQuotations.find(sq => sq.id === selectedQuotationId);

        if (!quotationData) {
            if (initialData && initialData.quotationId === selectedQuotationId) {
                 quotationData = { // Reconstruct a Quotation-like object for prefill
                    id: initialData.quotationId,
                    customerName: initialData.customerName,
                    pol: initialData.pol,
                    pod: initialData.pod,
                    equipment: initialData.equipment,
                    type: initialData.type,
                    sellRate: initialData.sellRate,
                    buyRate: initialData.buyRate,
                    profitAndLoss: initialData.profitAndLoss,
                    status: 'Booking Completed', // Assuming this status if it's an existing booking
                    createdAt: initialData.createdAt,
                    updatedAt: initialData.updatedAt,
                };
            } else {
                quotationData = await getQuotationById(selectedQuotationId);
            }
        }

        if (quotationData) {
          form.setValue('customerName', quotationData.customerName);
          form.setValue('pol', quotationData.pol);
          form.setValue('pod', quotationData.pod);
          form.setValue('equipment', quotationData.equipment);
          form.setValue('type', quotationData.type);
          form.setValue('sellRate', quotationData.sellRate);
        }
      };
      fetchAndSetQuotation();
    }
  }, [selectedQuotationId, form, getQuotationById, searchedQuotations, initialData]);

  // Effect to set buyRate for booking when a carrier rate is selected in Step 3
   React.useEffect(() => {
    if (selectedBookingRate) {
      form.setValue('buyRate', selectedBookingRate.buyRate);
      const sellRate = form.getValues('sellRate');
      if (typeof sellRate === 'number') { // Ensure sellRate is a number
        form.setValue('profitAndLoss', sellRate - selectedBookingRate.buyRate);
      }
    } else if (!selectedCarrierRateId && initialData && initialData.buyRate !== undefined) {
      // If editing and deselecting a carrier rate, revert to initial buyRate if one existed
      // or allow manual input to take precedence if user has typed.
    }
  }, [selectedBookingRate, selectedCarrierRateId, form, initialData]);


  const handleSearchQuotations = async () => {
    setQuotationSearchLoading(true);
    const idTerm = form.getValues('quotationIdSearch');
    const nameTerm = form.getValues('customerNameSearch');

    const term = idTerm || nameTerm || '';

    if (term) {
      const results = await searchQuotations(term);
      setSearchedQuotations(results);
      if (results.length === 0) {
        toast({ title: "No Quotations Found", description: "Try different search terms.", variant: "default" });
      }
    } else {
        toast({ title: "Search Term Required", description: "Please enter a Quotation ID or Customer Name.", variant: "default" });
    }
    setQuotationSearchLoading(false);
  };

  const quotationTableColumns: ColumnDef<Quotation>[] = [
    {
      id: 'select', header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.id === selectedQuotationId}
          onCheckedChange={(checked) => form.setValue('selectedQuotationId', checked ? row.original.id : '', { shouldValidate: true })}
        />
      ),
    },
    { accessorKey: 'id', header: 'Quotation ID' },
    { accessorKey: 'customerName', header: 'Customer' },
    { accessorKey: 'pol', header: 'POL' },
    { accessorKey: 'pod', header: 'POD' },
    { accessorKey: 'status', header: 'Status' },
  ];

  const handleSearchBookingRates = async () => {
    setBookingRatesLoading(true);
    const pol = form.getValues('pol');
    const pod = form.getValues('pod');
    if (pol && pod) {
      const rates = await searchScheduleRates({ pol, pod });
      setAvailableBookingRates(rates);
    }
    setBookingRatesLoading(false);
  };

  const bookingRateTableColumns: ColumnDef<ScheduleRate>[] = [
    {
      id: 'select', header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.id === selectedCarrierRateId}
          onCheckedChange={(checked) => {
            form.setValue('selectedCarrierRateId', checked ? row.original.id : undefined, { shouldValidate: true });
             if (checked) {
                form.setValue('buyRate', row.original.buyRate);
                const sellRate = form.getValues('sellRate');
                if (typeof sellRate === 'number') form.setValue('profitAndLoss', sellRate - row.original.buyRate);
            } else {
                // When unchecking, reset buyRate to 0 to allow manual input or indicate no rate.
                form.setValue('buyRate', 0, { shouldValidate: true });
                const sellRate = form.getValues('sellRate');
                // Recalculate P&L based on potentially new (or 0) buyRate
                if (typeof sellRate === 'number') form.setValue('profitAndLoss', sellRate - 0);
            }
          }}
        />
      ),
    },
    { accessorKey: 'carrier', header: 'Carrier' },
    { accessorKey: 'origin', header: 'Origin' },
    { accessorKey: 'destination', header: 'Destination' },
    { accessorKey: 'voyageDetails', header: 'String' },
    { accessorKey: 'buyRate', header: 'Buy Rate', cell: ({ row }) => `$${row.original.buyRate.toFixed(2)}`},
    { accessorKey: 'allocation', header: 'Allocation', cell: ({ row }) => `${row.original.allocation} Units`},
  ];

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <FormField control={form.control} name="quotationIdSearch" render={({ field }) => (
          <FormItem>
            <FormLabel>Quotation ID</FormLabel>
            <FormControl><Input placeholder="Search by Quotation ID" {...field} /></FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="customerNameSearch" render={({ field }) => (
          <FormItem>
            <FormLabel>Customer Name</FormLabel>
            <FormControl><Input placeholder="Search by Customer Name" {...field} /></FormControl>
          </FormItem>
        )} />
      </div>
      <Button type="button" onClick={handleSearchQuotations} disabled={quotationSearchLoading || dataLoading}>
        {quotationSearchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
        Search Quotations
      </Button>
      {searchedQuotations.length > 0 && (
        <DataTable columns={quotationTableColumns} data={searchedQuotations} isLoading={quotationSearchLoading} pageSize={5} />
      )}
    </div>
  );

  const renderStep2 = () => {
    const values = form.getValues();
    if (!values.selectedQuotationId) {
        return <p className="text-muted-foreground">Please select a quotation in Step 1 to proceed.</p>;
    }
    return (
        <Card>
            <CardHeader><CardTitle>Quotation Details (Read-only)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <p><strong>Quotation ID:</strong> {values.selectedQuotationId}</p>
                <p><strong>Customer:</strong> {values.customerName}</p>
                <p><strong>Route:</strong> {values.pol} to {values.pod}</p>
                <p><strong>Equipment:</strong> {values.equipment}</p>
                <p><strong>Type:</strong> {values.type}</p>
                <p><strong>Original Sell Rate:</strong> ${typeof values.sellRate === 'number' ? values.sellRate.toFixed(2) : 'N/A'}</p>
            </CardContent>
        </Card>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={handleSearchBookingRates} disabled={bookingRatesLoading || dataLoading || !form.getValues('selectedQuotationId')}>
            {bookingRatesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search Rates for Booking
        </Button>
      </div>
      <DataTable columns={bookingRateTableColumns} data={availableBookingRates} isLoading={bookingRatesLoading} pageSize={5} />
      {!selectedCarrierRateId && (
          <div className="mt-4 border-t pt-4">
              <FormField control={form.control} name="buyRate" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Manual Buy Rate (for this Booking)</FormLabel>
                      <FormControl><Input
                        type="number"
                        step="0.01"
                        placeholder="Enter Buy Rate"
                        {...field}
                        value={field.value === undefined || field.value === null ? '' : field.value} // Handle undefined for input
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )} />
          </div>
      )}
       <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem className="mt-4">
          <FormLabel>Booking Notes</FormLabel>
          <FormControl><Textarea placeholder="Internal notes or comments for this booking..." {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  const renderStep4 = () => {
    const values = form.getValues();
    const finalBuyRate = values.buyRate;
    const finalSellRate = values.sellRate;
    const finalProfitAndLoss = (typeof finalSellRate === 'number' && typeof finalBuyRate === 'number') ? finalSellRate - finalBuyRate : 0;

    return (
        <Card>
            <CardHeader><CardTitle>Review Booking Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <p><strong>Quotation Ref:</strong> {values.selectedQuotationId}</p>
                <p><strong>Customer:</strong> {values.customerName}</p>
                <p><strong>Route:</strong> {values.pol} to {values.pod}</p>
                <p><strong>Equipment:</strong> {values.equipment}</p>
                {selectedBookingRate && <p><strong>Selected Carrier for Booking:</strong> {selectedBookingRate.carrier}</p>}
                <p><strong>Booking Buy Rate:</strong> ${typeof finalBuyRate === 'number' ? finalBuyRate.toFixed(2) : 'N/A'}</p>
                <p><strong>Quotation Sell Rate:</strong> ${typeof finalSellRate === 'number' ? finalSellRate.toFixed(2) : 'N/A'}</p>
                <p><strong>Estimated P/L for Booking:</strong> <span className={finalProfitAndLoss >= 0 ? 'text-green-600' : 'text-red-600'}>${finalProfitAndLoss.toFixed(2)}</span></p>
                <p><strong>Status:</strong> {values.status}</p>
                {values.notes && <p><strong>Notes:</strong> {values.notes}</p>}
            </CardContent>
        </Card>
    );
  };

  const handleFormSubmit = async (data: BookingFormValues) => {
    if (data.buyRate === undefined || data.buyRate === null) {
        data.buyRate = 0;
    }
    const finalPL = (typeof data.sellRate === 'number' && typeof data.buyRate === 'number') ? data.sellRate - data.buyRate : 0;
    await onSubmit({...data, profitAndLoss: finalPL});
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Accordion type="single" value={currentStep} onValueChange={setCurrentStep} collapsible className="w-full">
          <AccordionItem value="step1">
            <AccordionTrigger className="text-lg font-semibold">Step 1: Quotation Search</AccordionTrigger>
            <AccordionContent className="pt-4">{renderStep1()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step2" disabled={!selectedQuotationId}>
            <AccordionTrigger className="text-lg font-semibold">Step 2: Booking Form (from Quotation)</AccordionTrigger>
            <AccordionContent className="pt-4">{renderStep2()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step3" disabled={!selectedQuotationId}>
            <AccordionTrigger className="text-lg font-semibold">Step 3: Rates & Allocation for Booking</AccordionTrigger>
            <AccordionContent className="pt-4">{renderStep3()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step4" disabled={!selectedQuotationId || (form.getValues('buyRate') === undefined && !selectedCarrierRateId )}>
            <AccordionTrigger className="text-lg font-semibold">Step 4: Review & Submit</AccordionTrigger>
            <AccordionContent className="pt-4">{renderStep4()}</AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
           {currentStep !== "step4" && (
            <Button type="button" onClick={() => {
              const steps = ["step1", "step2", "step3", "step4"];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                if(currentStep === "step1" && !form.getValues("selectedQuotationId")) {
                    toast({title: "Quotation Required", description: "Please search and select a quotation.", variant:"default"});
                    return;
                }
                setCurrentStep(steps[currentIndex + 1]);
              }
            }}>
              Next
            </Button>
          )}
          {currentStep === "step4" && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialData ? 'Update Booking' : 'Submit Booking')}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
