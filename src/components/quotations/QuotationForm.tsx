
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Quotation, QuotationStatus, ScheduleRate, Port } from '@/lib/types';
import { DataTable, ColumnDef } from '@/components/common/DataTable';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, XCircle, Wand2 } from 'lucide-react'; // Added Wand2
import { useData } from '@/contexts/DataContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateQuotationSummary, type GenerateQuotationSummaryInput } from '@/ai/flows/generate-quotation-summary-flow';
import { useToast } from '@/hooks/use-toast';


const quotationFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  pol: z.string().min(1, 'Port of Loading is required'),
  pod: z.string().min(1, 'Port of Discharge is required'),
  equipment: z.string().min(1, 'Equipment type is required'),
  type: z.enum(['Import', 'Export', 'Cross-Trade'], { required_error: 'Type is required' }),
  status: z.enum(['Draft', 'Submitted', 'Booking Completed', 'Cancelled']).default('Draft'),
  selectedRateId: z.string().optional(),
  // These are part of selected rate logic or manually entered if no rate selected
  buyRate: z.number().positive('Buy rate must be positive').optional(), 
  sellRate: z.number().positive('Sell rate must be positive').optional(),
  notes: z.string().optional(),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;

interface QuotationFormProps {
  initialData?: Quotation | null;
  onSubmit: (data: QuotationFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const equipmentTypes = [
  "20ft Dry", 
  "40ft Dry", 
  "40ft High Cube", 
  "20ft Reefer", 
  "LCL", 
  "Air Freight Unit"
];
const quotationTypes: Quotation['type'][] = ['Import', 'Export', 'Cross-Trade'];
const quotationStatuses: QuotationStatus[] = ['Draft', 'Submitted', 'Booking Completed', 'Cancelled'];


export function QuotationForm({ initialData, onSubmit, onCancel, isSubmitting }: QuotationFormProps) {
  const { ports, searchScheduleRates, loading: dataLoading } = useData();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState('step1');
  const [availableRates, setAvailableRates] = React.useState<ScheduleRate[]>([]);
  const [ratesLoading, setRatesLoading] = React.useState(false);
  const [isAiGenerating, setIsAiGenerating] = React.useState(false);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: initialData ? {
      customerName: initialData.customerName,
      pol: initialData.pol,
      pod: initialData.pod,
      equipment: initialData.equipment,
      type: initialData.type,
      status: initialData.status,
      selectedRateId: initialData.selectedRateId,
      buyRate: initialData.buyRate,
      sellRate: initialData.sellRate,
      notes: (initialData as any).notes || '',
    } : {
      customerName: '',
      pol: '',
      pod: '',
      equipment: '',
      type: 'Export',
      status: 'Draft',
      notes: '',
      buyRate: undefined, // Explicitly set to undefined for new forms
      sellRate: undefined, // Explicitly set to undefined for new forms
    },
  });

  const selectedRateId = form.watch('selectedRateId');
  const selectedRate = availableRates.find(r => r.id === selectedRateId);
  const watchedPol = form.watch('pol');
  const watchedPod = form.watch('pod');

  React.useEffect(() => {
    if (selectedRate) {
      form.setValue('buyRate', selectedRate.buyRate);
    }
    // Not clearing sellRate here, as it's manually entered or pre-filled from initialData
  }, [selectedRate, form]);

  // Automatically fetch rates when POL, POD are set and user is on Step 2
  React.useEffect(() => {
    const autoFetchRates = async () => {
      if (currentStep === 'step2' && watchedPol && watchedPod) {
        setRatesLoading(true);
        // Clear previous selections and rates when POL/POD change or entering step 2
        form.setValue('selectedRateId', undefined, { shouldValidate: true });
        form.setValue('buyRate', undefined, { shouldValidate: true });
        form.setValue('sellRate', undefined, { shouldValidate: true });
        setAvailableRates([]); // Clear the table

        try {
          const rates = await searchScheduleRates({ pol: watchedPol, pod: watchedPod });
          setAvailableRates(rates);
          if (rates.length === 0) {
              toast({
                  title: "No Direct Rates Found",
                  description: `No direct schedule rates found for ${watchedPol} to ${watchedPod}. You may need to enter rates manually or check routes.`,
                  variant: "default",
                  duration: 5000,
              });
          }
        } catch (error) {
          console.error("Error auto-fetching rates:", error);
          toast({
              title: "Error Fetching Rates",
              description: "Could not load schedule rates automatically.",
              variant: "destructive",
          });
        } finally {
          setRatesLoading(false);
        }
      }
    };
    autoFetchRates();
  }, [watchedPol, watchedPod, currentStep, searchScheduleRates, toast, form]);


  // Manual search rates function (for the button)
  const handleSearchRates = async () => {
    const currentPol = form.getValues('pol');
    const currentPod = form.getValues('pod');
    if (!currentPol || !currentPod) {
        toast({
            title: "POL and POD Required",
            description: "Please select Port of Loading and Port of Discharge in Step 1 first.",
            variant: "default"
        });
        setCurrentStep("step1");
        return;
    }
    setRatesLoading(true);
    form.setValue('selectedRateId', undefined, { shouldValidate: true });
    form.setValue('buyRate', undefined, { shouldValidate: true });
    form.setValue('sellRate', undefined, { shouldValidate: true });
    setAvailableRates([]);
    try {
      const rates = await searchScheduleRates({ pol: currentPol, pod: currentPod });
      setAvailableRates(rates);
       if (rates.length === 0) {
            toast({
                title: "No Direct Rates Found",
                description: `No direct schedule rates found for ${currentPol} to ${currentPod} after manual search.`,
                variant: "default",
                duration: 5000,
            });
        }
    } catch (error) {
        console.error("Error manual-fetching rates:", error);
        toast({
            title: "Error Fetching Rates",
            description: "Could not load schedule rates.",
            variant: "destructive",
        });
    } finally {
      setRatesLoading(false);
    }
  };
  
  const rateTableColumns: ColumnDef<ScheduleRate>[] = [
    {
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.id === selectedRateId}
          onCheckedChange={(checked) => {
            form.setValue('selectedRateId', checked ? row.original.id : undefined, { shouldValidate: true });
            if (checked) {
              form.setValue('buyRate', row.original.buyRate, { shouldValidate: true });
              // Clear sellRate when a new rate is selected to force re-entry or ensure it's intentional
              form.setValue('sellRate', undefined, { shouldValidate: true }); 
            } else {
              form.setValue('buyRate', undefined, { shouldValidate: true });
              form.setValue('sellRate', undefined, { shouldValidate: true });
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
    {
      id: 'sellRate',
      header: 'Sell Rate',
      cell: ({ row }) => {
        const isSelected = row.original.id === selectedRateId;
        return isSelected ? (
           <FormField
              control={form.control}
              name="sellRate"
              render={({ field }) => (
                <Input 
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value ?? ''} // Ensure controlled input
                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                  className="h-8 w-24"
                  placeholder="Sell Rate"
                />
              )}
            />
        ) : <span className="text-muted-foreground">-</span>;
      }
    },
    {
        id: 'margin',
        header: 'Margin',
        cell: ({ row }) => {
            const isSelected = row.original.id === selectedRateId;
            const sellRateValue = form.watch('sellRate'); // Watch sellRate for dynamic updates
            if (isSelected && typeof sellRateValue === 'number' && typeof row.original.buyRate === 'number') {
                const margin = sellRateValue - row.original.buyRate;
                return <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>${margin.toFixed(2)}</span>;
            }
            return <span className="text-muted-foreground">-</span>;
        }
    }
  ];

  const handleGenerateSummary = async () => {
    const values = form.getValues();
    const requiredFields: (keyof QuotationFormValues)[] = ['customerName', 'pol', 'pod', 'equipment', 'type'];
    const missingFields = requiredFields.filter(field => !values[field]);

    if (missingFields.length > 0) {
        toast({
            title: "Missing Information",
            description: `Please fill in ${missingFields.join(', ')} before generating summary.`,
            variant: "default"
        });
        return;
    }

    setIsAiGenerating(true);
    try {
        const input: GenerateQuotationSummaryInput = {
            customerName: values.customerName!,
            pol: values.pol!,
            pod: values.pod!,
            equipment: values.equipment!,
            type: values.type!,
        };
        const result = await generateQuotationSummary(input);
        form.setValue('notes', result.summary);
        toast({
            title: "AI Summary Generated",
            description: "The notes field has been populated."
        });
    } catch (error) {
        console.error("AI Summary generation failed:", error);
        toast({
            title: "AI Error",
            description: "Failed to generate summary. Please try again or enter manually.",
            variant: "destructive"
        });
    } finally {
        setIsAiGenerating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <FormField control={form.control} name="customerName" render={({ field }) => (
        <FormItem>
          <FormLabel>Customer Name</FormLabel>
          <FormControl><Input placeholder="ABC Corp" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="pol" render={({ field }) => (
          <FormItem>
            <FormLabel>Port of Loading (POL)</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select POL" /></SelectTrigger></FormControl>
              <SelectContent><ScrollArea className="h-60">{ports.map(p => <SelectItem key={p.code} value={p.name}>{p.name} ({p.code})</SelectItem>)}</ScrollArea></SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="pod" render={({ field }) => (
          <FormItem>
            <FormLabel>Port of Discharge (POD)</FormLabel>
             <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select POD" /></SelectTrigger></FormControl>
              <SelectContent><ScrollArea className="h-60">{ports.map(p => <SelectItem key={p.code} value={p.name}>{p.name} ({p.code})</SelectItem>)}</ScrollArea></SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>
       <FormField control={form.control} name="equipment" render={({ field }) => (
            <FormItem>
              <FormLabel>Equipment</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select Equipment Type" /></SelectTrigger></FormControl>
                <SelectContent>{equipmentTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select Quotation Type" /></SelectTrigger></FormControl>
              <SelectContent>{quotationTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={initialData?.status === 'Booking Completed'}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
              <SelectContent>{quotationStatuses.map(s => <SelectItem key={s} value={s} disabled={s === 'Booking Completed' && !initialData}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button type="button" onClick={handleSearchRates} disabled={ratesLoading || dataLoading || isAiGenerating}>
                {ratesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Refresh / Search Rates
            </Button>
        </div>
      <DataTable columns={rateTableColumns} data={availableRates} isLoading={ratesLoading} pageSize={5} />
      {!selectedRateId && (form.getValues('buyRate') === undefined || form.getValues('sellRate') === undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t pt-4">
              <FormField control={form.control} name="buyRate" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Manual Buy Rate</FormLabel>
                      <FormControl><Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Enter Buy Rate" 
                        {...field} 
                        value={field.value ?? ''} // Ensure controlled
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} 
                      /></FormControl>
                      <FormDescription>Enter if no rate selected or for custom rate.</FormDescription>
                      <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="sellRate" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Manual Sell Rate</FormLabel>
                      <FormControl><Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Enter Sell Rate" 
                        {...field} 
                        value={field.value ?? ''} // Ensure controlled
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} 
                      /></FormControl>
                      <FormDescription>Enter if no rate selected or for custom rate.</FormDescription>
                      <FormMessage />
                  </FormItem>
              )} />
          </div>
      )}
       <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>Notes</FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateSummary} 
              disabled={isAiGenerating || isSubmitting || dataLoading || ratesLoading}
              className="ml-2"
            >
              {isAiGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate with AI
            </Button>
          </div>
          <FormControl><Textarea placeholder="Internal notes or comments for this quotation..." {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  const renderStep3 = () => {
    const values = form.getValues();
    const calculatedMargin = (typeof values.sellRate === 'number' && typeof values.buyRate === 'number') ? values.sellRate - values.buyRate : 0;
    return (
        <Card>
            <CardHeader><CardTitle>Review Quotation Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <p><strong>Customer:</strong> {values.customerName}</p>
                <p><strong>Route:</strong> {values.pol} to {values.pod}</p>
                <p><strong>Equipment:</strong> {values.equipment}</p>
                <p><strong>Type:</strong> {values.type} / <strong>Status:</strong> {values.status}</p>
                {selectedRate && (
                    <>
                        <p><strong>Selected Carrier:</strong> {selectedRate.carrier}</p>
                        <p><strong>Voyage:</strong> {selectedRate.voyageDetails}</p>
                    </>
                )}
                <p><strong>Buy Rate:</strong> ${typeof values.buyRate === 'number' ? values.buyRate.toFixed(2) : 'N/A'}</p>
                <p><strong>Sell Rate:</strong> ${typeof values.sellRate === 'number' ? values.sellRate.toFixed(2) : 'N/A'}</p>
                <p><strong>Estimated Margin:</strong> <span className={calculatedMargin >= 0 ? 'text-green-600' : 'text-red-600'}>${calculatedMargin.toFixed(2)}</span></p>
                {values.notes && <p><strong>Notes:</strong> {values.notes}</p>}
            </CardContent>
        </Card>
    );
  };
  
  const handleFormSubmit = async (data: QuotationFormValues) => {
    if (data.status !== 'Draft' && (data.buyRate === undefined || data.sellRate === undefined)) {
        toast({
            title: "Missing Rates",
            description: "Buy Rate and Sell Rate are required for non-draft quotations.",
            variant: "destructive"
        });
        setCurrentStep("step2"); 
        form.setError("buyRate", {type: "manual", message: "Buy rate is required."});
        form.setError("sellRate", {type: "manual", message: "Sell rate is required."});
        return;
    }
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Accordion type="single" value={currentStep} onValueChange={setCurrentStep} collapsible className="w-full">
          <AccordionItem value="step1">
            <AccordionTrigger className="text-lg font-semibold">Step 1: Quotation Info</AccordionTrigger>
            <AccordionContent className="pt-4">{renderStep1()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step2">
            <AccordionTrigger className="text-lg font-semibold">Step 2: Rates & Allocation</AccordionTrigger>
            <AccordionContent className="pt-4">{renderStep2()}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="step3">
            <AccordionTrigger className="text-lg font-semibold">Step 3: Review & Submit</AccordionTrigger>
            <AccordionContent className="pt-4">{renderStep3()}</AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isAiGenerating}>
            Cancel
          </Button>
          {currentStep !== "step3" && (
            <Button type="button" onClick={() => {
              const steps = ["step1", "step2", "step3"];
              const currentIndex = steps.indexOf(currentStep);
              let fieldsToValidate: (keyof QuotationFormValues)[] = [];
              if (currentStep === "step1") {
                fieldsToValidate = ["customerName", "pol", "pod", "equipment", "type", "status"];
              } 
              // No specific validation for step2 here, main validation on submit.
              // Or if buyRate/sellRate become non-optional based on selections, they could be added.

              form.trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined).then(isValid => {
                if(isValid) {
                    if (currentIndex < steps.length - 1) {
                        // If moving to step 2, and POL/POD are not set, it won't auto-fetch.
                        // The useEffect for auto-fetching will handle it once POL/POD are available.
                        if (steps[currentIndex + 1] === 'step2' && (!form.getValues('pol') || !form.getValues('pod'))) {
                             toast({
                                title: "POL and POD Required",
                                description: "Please select Port of Loading and Port of Discharge to see rates.",
                                variant: "default"
                            });
                        }
                        setCurrentStep(steps[currentIndex + 1]);
                    }
                } else {
                    toast({ title: "Validation Error", description: "Please correct the errors before proceeding.", variant: "destructive"});
                }
              });
            }}
            disabled={isAiGenerating || ratesLoading}
            >
              Next
            </Button>
          )}
          {currentStep === "step3" && (
            <Button type="submit" disabled={isSubmitting || initialData?.status === 'Booking Completed' || isAiGenerating || ratesLoading}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (initialData ? 'Update Quotation' : 'Submit Quotation')}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

