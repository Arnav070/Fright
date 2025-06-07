
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import Link from "next/link";
import { PlusCircle, BarChart3, PieChart as PieChartIcon, Users, Settings, Ship, FileText, AlertTriangle, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext"; 
import type { QuotationStatusSummary, BookingsByMonthEntry } from "@/lib/types"; 
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, XAxis, YAxis, CartesianGrid, Bar } from 'recharts';
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
import { useToast } from '@/hooks/use-toast';

const PIE_CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']; 
const BAR_CHART_COLORS = ['hsl(var(--chart-1))'];

function QuotationStatusPieChart({ summaryData }: { summaryData: QuotationStatusSummary | null }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || !summaryData) return <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />;

  const data = [
    { name: 'Draft', value: summaryData.draft },
    { name: 'Submitted', value: summaryData.submitted },
    { name: 'Booking Completed', value: summaryData.completed },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BookingsByMonthBarChart({ monthlyData }: { monthlyData: BookingsByMonthEntry[] | null }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || !monthlyData) return <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" name="Bookings" fill={BAR_CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { quotationStatusSummary, bookingsByMonth, loading: dataLoading, clearAndReseedData } = useData(); 
  const { toast } = useToast();
  const [showClearDataDialog, setShowClearDataDialog] = React.useState(false);

  const handleClearAndReseed = async () => {
    setShowClearDataDialog(false); // Close dialog first
    toast({ title: "Processing...", description: "Clearing and re-seeding data. This may take a moment." });
    try {
      await clearAndReseedData();
      toast({ title: "Success!", description: "Data has been cleared and re-seeded with new IDs." });
    } catch (error) {
      console.error("Error during clear and re-seed:", error);
      toast({ title: "Error", description: "Failed to clear and re-seed data. Check console.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${user?.name || 'User'}!`} description={`Here's an overview of your freight operations. (${user?.role})`} />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary" /> Quotation Status</CardTitle>
            <CardDescription>Distribution of current quotation statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading && (!quotationStatusSummary || Object.keys(quotationStatusSummary).length === 0) ? (
                 <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />
            ) : (
                <QuotationStatusPieChart summaryData={quotationStatusSummary} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Bookings by Month</CardTitle>
            <CardDescription>Number of bookings created over the last few months.</CardDescription>
          </CardHeader>
          <CardContent>
             {dataLoading && (!bookingsByMonth || bookingsByMonth.length === 0) ? (
                 <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />
            ) : (
                <BookingsByMonthBarChart monthlyData={bookingsByMonth} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Quickly access common actions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(user?.role === 'Admin' || user?.role === 'QuotationCreator') && (
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow" asChild>
              <Link href="/quotations/new">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-5 w-5 text-accent" />
                  <span className="text-lg font-semibold">Create Quotation</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">Start a new freight quotation.</p>
              </Link>
            </Button>
          )}
          {(user?.role === 'Admin' || user?.role === 'BookingCreator') && (
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow" asChild>
              <Link href="/bookings/new">
                 <div className="flex items-center gap-2 mb-1">
                  <Ship className="h-5 w-5 text-accent" />
                  <span className="text-lg font-semibold">Create Booking</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">Initiate a new shipment booking.</p>
              </Link>
            </Button>
          )}
           {(user?.role === 'Admin') && (
            <>
             <Button variant="outline" className="h-auto py-4 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow" asChild>
                <Link href="/admin/schedule">
                    <div className="flex items-center gap-2 mb-1">
                    <Settings className="h-5 w-5 text-accent" />
                    <span className="text-lg font-semibold">Manage Schedules</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">View and update carrier schedules.</p>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow" asChild>
                <Link href="/admin/buy-rates">
                    <div className="flex items-center gap-2 mb-1">
                    <Users className="h-5 w-5 text-accent" />
                    <span className="text-lg font-semibold">Manage Buy Rates</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-left">Update and oversee buy rates.</p>
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {user?.role === 'Admin' && (
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Developer Utilities</CardTitle>
            <CardDescription>Use these actions with caution. They can lead to data loss.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowClearDataDialog(true)}
              disabled={dataLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear & Re-seed Quotation/Booking Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will delete ALL quotations and bookings and re-populate with initial mock data using the new ID format (CQ-X, CB-X).
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete ALL existing quotations and bookings from the database.
              The database will then be re-populated with the initial mock data, using the new ID formats (CQ-X, CB-X).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAndReseed}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Yes, Clear and Re-seed Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

