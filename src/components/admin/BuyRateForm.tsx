
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns"; // Import parseISO
import type { BuyRate, Port } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { ScrollArea } from '../ui/scroll-area';

const buyRateFormSchema = z.object({
  carrier: z.string().min(1, 'Carrier is required'),
  pol: z.string().min(1, 'Port of Loading is required'),
  pod: z.string().min(1, 'Port of Discharge is required'),
  commodity: z.string().min(1, 'Commodity is required'),
  freightModeType: z.enum(['Sea', 'Air', 'Land'], { required_error: 'Freight Mode Type is required' }),
  equipment: z.string().min(1, 'Equipment is required'),
  weightCapacity: z.string().min(1, 'Weight/Capacity is required'),
  minBooking: z.string().min(1, 'Min Booking is required'),
  rate: z.coerce.number().positive('Rate must be a positive number'),
  validFrom: z.date({ required_error: "Valid From date is required." }),
  validTo: z.date({ required_error: "Valid To date is required." }),
}).refine(data => data.validTo >= data.validFrom, {
  message: "Valid To date must be after or same as Valid From date.",
  path: ["validTo"],
});

export type BuyRateFormValues = z.infer<typeof buyRateFormSchema>;

interface BuyRateFormProps {
  initialData?: BuyRate | null;
  onSubmit: (data: BuyRateFormValues) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const equipmentTypes = [
  "20ft Dry", 
  "40ft Dry", 
  "40ft High Cube",
  "LCL",
];
const freightModeTypes: BuyRate['freightModeType'][] = ['Sea', 'Air', 'Land'];

export function BuyRateForm({ initialData, onSubmit, open, onOpenChange }: BuyRateFormProps) {
  const { ports } = useData();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<BuyRateFormValues>({
    resolver: zodResolver(buyRateFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      rate: Number(initialData.rate),
      validFrom: parseISO(initialData.validFrom), // Parse string date to Date object
      validTo: parseISO(initialData.validTo),     // Parse string date to Date object
    } : {
      carrier: '',
      pol: '',
      pod: '',
      commodity: '',
      equipment: '',
      weightCapacity: '',
      minBooking: '',
      rate: 0,
      freightModeType: undefined,
      validFrom: undefined,
      validTo: undefined,
    },
  });
  
  React.useEffect(() => {
    if (open) { // Reset form only when dialog opens
      if (initialData) {
        form.reset({
          ...initialData,
          rate: Number(initialData.rate),
          validFrom: parseISO(initialData.validFrom),
          validTo: parseISO(initialData.validTo),
        });
      } else {
        form.reset({
          carrier: '', pol: '', pod: '', commodity: '', equipment: '', freightModeType: undefined,
          weightCapacity: '', minBooking: '', rate: 0, validFrom: undefined, validTo: undefined
        });
      }
    }
  }, [initialData, form, open]);


  const handleFormSubmit = async (data: BuyRateFormValues) => {
    setIsSubmitting(true);
    await onSubmit(data);
    setIsSubmitting(false);
    if (!form.formState.errors || Object.keys(form.formState.errors).length === 0) {
       onOpenChange(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Buy Rate' : 'Create New Buy Rate'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details of the existing buy rate.' : 'Enter the details for the new buy rate.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
              <FormField control={form.control} name="carrier" render={({ field }) => (
                <FormItem><FormLabel>Carrier</FormLabel><FormControl><Input placeholder="e.g., Maersk" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="pol" render={({ field }) => (
                  <FormItem><FormLabel>POL</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select POL" /></SelectTrigger></FormControl>
                      <SelectContent><ScrollArea className="h-40">{ports.map(p => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}</ScrollArea></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pod" render={({ field }) => (
                  <FormItem><FormLabel>POD</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select POD" /></SelectTrigger></FormControl>
                      <SelectContent><ScrollArea className="h-40">{ports.map(p => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}</ScrollArea></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="commodity" render={({ field }) => (
                <FormItem><FormLabel>Commodity</FormLabel><FormControl><Input placeholder="e.g., Electronics" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="freightModeType" render={({ field }) => (
                <FormItem><FormLabel>Freight Mode Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger></FormControl>
                    <SelectContent>{freightModeTypes.map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="equipment" render={({ field }) => (
                <FormItem><FormLabel>Equipment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Equipment" /></SelectTrigger></FormControl>
                    <SelectContent>{equipmentTypes.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="weightCapacity" render={({ field }) => (
                  <FormItem><FormLabel>Weight/Capacity</FormLabel><FormControl><Input placeholder="e.g., 20 TON or 15 CBM" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="minBooking" render={({ field }) => (
                  <FormItem><FormLabel>Min Booking</FormLabel><FormControl><Input placeholder="e.g., 1 TEU or 1 CBM" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="rate" render={({ field }) => (
                <FormItem><FormLabel>Rate (USD)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 1200.50" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="validFrom" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Valid From</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="validTo" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Valid To</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover><FormMessage /></FormItem>
                  )} />
              </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Save Changes' : 'Create Buy Rate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

