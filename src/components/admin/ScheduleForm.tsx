
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
import { format, parseISO, isValid } from "date-fns";
import type { Schedule, Port } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { ScrollArea } from '../ui/scroll-area';

const scheduleFormSchema = z.object({
  carrier: z.string().min(1, 'Carrier is required'),
  origin: z.string().min(1, 'Origin port code is required'),
  destination: z.string().min(1, 'Destination port code is required'),
  serviceRoute: z.string().min(1, 'Service Route/String is required'),
  allocation: z.coerce.number().int().positive('Allocation must be a positive integer'),
  etd: z.date({ required_error: "ETD is required." }),
  eta: z.date({ required_error: "ETA is required." }),
  frequency: z.enum(['Daily', 'Weekly', 'Bi-Weekly', 'Monthly'], { required_error: 'Frequency is required' }),
}).refine(data => data.eta >= data.etd, {
  message: "ETA must be after or same as ETD.",
  path: ["eta"],
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  initialData?: Schedule | null;
  onSubmit: (data: ScheduleFormValues) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const frequencies: Schedule['frequency'][] = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly'];

export function ScheduleForm({ initialData, onSubmit, open, onOpenChange }: ScheduleFormProps) {
  const { ports } = useData();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const parseDateString = (dateString: string | undefined): Date | undefined => {
    if (!dateString) return undefined;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : undefined;
  };

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      allocation: Number(initialData.allocation),
      etd: parseDateString(initialData.etd) || new Date(),
      eta: parseDateString(initialData.eta) || new Date(),
      frequency: initialData.frequency,
    } : {
      carrier: '',
      origin: '',
      destination: '',
      serviceRoute: '',
      allocation: 0,
      frequency: undefined,
      etd: undefined,
      eta: undefined,
    },
  });

  React.useEffect(() => {
    if (open) { 
      if (initialData) {
        form.reset({
          ...initialData,
          allocation: Number(initialData.allocation),
          etd: parseDateString(initialData.etd) || new Date(),
          eta: parseDateString(initialData.eta) || new Date(),
          frequency: initialData.frequency,
        });
      } else {
         form.reset({
          carrier: '', origin: '', destination: '', serviceRoute: '', allocation: 0, 
          etd: undefined, eta: undefined, frequency: undefined
        });
      }
    }
  }, [initialData, form, open]);

  const handleFormSubmit = async (data: ScheduleFormValues) => {
    setIsSubmitting(true);
    await onSubmit(data); 
    setIsSubmitting(false);
    // Only close dialog if submission was successful (no errors)
    // We rely on the parent component toasting errors if onSubmit throws
    const formErrors = form.formState.errors;
    if (Object.keys(formErrors).length === 0) {
       onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details of the existing schedule.' : 'Enter the details for the new schedule.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
              <FormField control={form.control} name="carrier" render={({ field }) => (
                <FormItem><FormLabel>Carrier</FormLabel><FormControl><Input placeholder="e.g., CMA CGM" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="origin" render={({ field }) => (
                  <FormItem><FormLabel>Origin Port</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Origin Port" /></SelectTrigger></FormControl>
                      <SelectContent><ScrollArea className="h-40">{ports.map(p => <SelectItem key={p.code} value={p.code}>{p.name} ({p.code})</SelectItem>)}</ScrollArea></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="destination" render={({ field }) => (
                  <FormItem><FormLabel>Destination Port</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Destination Port" /></SelectTrigger></FormControl>
                      <SelectContent><ScrollArea className="h-40">{ports.map(p => <SelectItem key={p.code} value={p.code}>{p.name} ({p.code})</SelectItem>)}</ScrollArea></SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="serviceRoute" render={({ field }) => (
                <FormItem><FormLabel>Service Route / String</FormLabel><FormControl><Input placeholder="e.g., PHOENIX1" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="allocation" render={({ field }) => (
                <FormItem><FormLabel>Allocation (Units)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="etd" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>ETD</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP HH:mm") : <span>Pick ETD</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="eta" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>ETA</FormLabel>
                      <Popover><PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP HH:mm") : <span>Pick ETA</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover><FormMessage /></FormItem>
                  )} />
              </div>
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem><FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Frequency" /></SelectTrigger></FormControl>
                    <SelectContent>{frequencies.map(freq => <SelectItem key={freq} value={freq}>{freq}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Save Changes' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
