
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, RowActionsDropdown } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { Booking } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { getBookingColumns } from './columns';
import { PlusCircle, Edit, Eye, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchBookings, deleteBooking, loading } = useData();
  const { toast } = useToast();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [bookingToDelete, setBookingToDelete] = React.useState<Booking | null>(null);

  const loadBookings = React.useCallback(async (page: number, term: string) => {
    const { data, total } = await fetchBookings(page, pageSize, term);
    setBookings(data);
    setTotalBookings(total);
    setCurrentPage(page);
  }, [fetchBookings, pageSize]);

  React.useEffect(() => {
     if (currentPage !== 1 && debouncedSearchTerm !== searchTerm) {
       setCurrentPage(1);
       loadBookings(1, debouncedSearchTerm);
    } else {
       loadBookings(currentPage, debouncedSearchTerm);
    }
  }, [loadBookings, currentPage, debouncedSearchTerm, searchTerm]);

  const handleEdit = (booking: Booking) => {
    router.push(`/bookings/${booking.id}/edit`);
  };

  const handleDeleteAttempt = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (bookingToDelete) {
      const success = await deleteBooking(bookingToDelete.id);
      if (success) {
        toast({ title: "Success", description: "Booking deleted successfully." });
        loadBookings(currentPage, debouncedSearchTerm); 
      } else {
        toast({ title: "Error", description: "Failed to delete booking.", variant: "destructive" });
      }
      setShowDeleteDialog(false);
      setBookingToDelete(null);
    }
  };

  const columns = React.useMemo(() => getBookingColumns(handleEdit), [router]);
  
  const canCreate = user?.role === 'Admin' || user?.role === 'BookingCreator';
  const canDelete = user?.role === 'Admin';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        breadcrumbs={[{ label: 'Bookings' }]}
        actions={
          canCreate ? (
            <Button 
              onClick={() => router.push('/bookings/new')}
              className="bg-[#8E44AD] text-white hover:bg-[#7D3C98] focus-visible:ring-[#8E44AD]"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Booking
            </Button>
          ) : null
        }
      />
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={bookings}
        isLoading={loading}
        currentPage={currentPage}
        totalItems={totalBookings}
        pageCount={Math.ceil(totalBookings / pageSize)}
        onPageChange={(page) => loadBookings(page, debouncedSearchTerm)}
        pageSize={pageSize}
        renderRowActions={(row) => (
          <RowActionsDropdown>
            <DropdownMenuItem onClick={() => router.push(`/bookings/${row.id}/edit`)}>
                 <Eye className="mr-2 h-4 w-4" /> View / Edit
            </DropdownMenuItem>
            {canDelete && (
                <DropdownMenuItem 
                    onClick={() => handleDeleteAttempt(row)} 
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            )}
          </RowActionsDropdown>
        )}
      />
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the booking <span className="font-semibold">{bookingToDelete?.id}</span>. The associated quotation status will be reverted to 'Submitted'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    
