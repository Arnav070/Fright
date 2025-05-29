
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, RowActionsDropdown } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { Booking } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { getBookingColumns } from './columns';
import { PlusCircle, Edit, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchBookings, loading } = useData();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const loadBookings = React.useCallback(async (page: number) => {
    const { data, total } = await fetchBookings(page, pageSize);
    setBookings(data);
    setTotalBookings(total);
    setCurrentPage(page);
  }, [fetchBookings, pageSize]);

  React.useEffect(() => {
    loadBookings(currentPage);
  }, [loadBookings, currentPage]);

  const handleEdit = (booking: Booking) => {
    router.push(`/bookings/${booking.id}/edit`);
  };

  const columns = React.useMemo(() => getBookingColumns(handleEdit), [router]);
  
  const canCreate = user?.role === 'Admin' || user?.role === 'BookingCreator';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        breadcrumbs={[{ label: 'Bookings' }]}
        actions={
          canCreate ? (
            <Button onClick={() => router.push('/bookings/new')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Booking
            </Button>
          ) : null
        }
      />
      <DataTable
        columns={columns}
        data={bookings}
        isLoading={loading}
        currentPage={currentPage}
        totalItems={totalBookings}
        pageCount={Math.ceil(totalBookings / pageSize)}
        onPageChange={loadBookings}
        pageSize={pageSize}
        renderRowActions={(row) => (
          <RowActionsDropdown>
            <DropdownMenuItem onClick={() => router.push(`/bookings/${row.id}/edit`)}>
                 <Eye className="mr-2 h-4 w-4" /> View / Edit
            </DropdownMenuItem>
            {/* Add other actions if necessary, e.g., Cancel Booking */}
          </RowActionsDropdown>
        )}
      />
    </div>
  );
}
