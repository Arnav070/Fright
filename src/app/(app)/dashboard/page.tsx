
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import Link from "next/link";
import { PlusCircle, BarChart3, PieChart as PieChartIcon, Users, Settings, Ship, FileText, AlertTriangle, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext"; 
import type { QuotationStatusSummary, BookingsByMonthEntry, Booking } from "@/lib/types"; 
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
import { parseISO } from 'date-fns';

const PIE_CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']; 
const BAR_CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))']; // For stacked bars

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
        <Bar dataKey="outOfAllocation" name="Out-of-Allocation" stackId="a" fill={BAR_CHART_COLORS[1]} />
        <Bar dataKey="allocationBased" name="Allocation-Based" stackId="a" fill={BAR_CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { allBookingsForChart, quotationStatusSummary, loading: dataLoading } = useData(); 
  const [bookingsByMonthData, setBookingsByMonthData] = React.useState<BookingsByMonthEntry[]>([]);

  React.useEffect(() => {
    if (allBookingsForChart && allBookingsForChart.length > 0) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const countsByMonth: { [key: string]: { allocationBased: number; outOfAllocation: number } } = {};
      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

      allBookingsForChart.forEach((b: Booking) => {
        const bookingDate = parseISO(b.createdAt);
        if (bookingDate >= sixMonthsAgo && bookingDate <= today) {
            const monthName = monthNames[bookingDate.getMonth()];
            if (!countsByMonth[monthName]) {
                countsByMonth[monthName] = { allocationBased: 0, outOfAllocation: 0 };
            }
            if (b.selectedCarrierRateId) {
                countsByMonth[monthName].allocationBased++;
            } else {
                countsByMonth[monthName].outOfAllocation++;
            }
        }
      });

      const result: BookingsByMonthEntry[] = [];
      const currentMonthIndex = today.getMonth();
      for (let i = 5; i >= 0; i--) {
        const monthIdx = (currentMonthIndex - i + 12) % 12;
        const monthName = monthNames[monthIdx];
        result.push({
          month: monthName,
          allocationBased: countsByMonth[monthName]?.allocationBased || 0,
          outOfAllocation: countsByMonth[monthName]?.outOfAllocation || 0,
        });
      }
      setBookingsByMonthData(result);
    } else {
       // If no bookings, set empty data for past 6 months
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const result: BookingsByMonthEntry[] = [];
      const today = new Date();
      const currentMonthIndex = today.getMonth();
      for (let i = 5; i >= 0; i--) {
        const monthIdx = (currentMonthIndex - i + 12) % 12;
        const monthName = monthNames[monthIdx];
        result.push({ month: monthName, allocationBased: 0, outOfAllocation: 0 });
      }
      setBookingsByMonthData(result);
    }
  }, [allBookingsForChart]);


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
             {dataLoading && (!bookingsByMonthData || bookingsByMonthData.length === 0) ? (
                 <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />
            ) : (
                <BookingsByMonthBarChart monthlyData={bookingsByMonthData} />
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
    </div>
  );
}
