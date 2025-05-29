"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DataTable, RowActionsDropdown } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { Quotation } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { getQuotationColumns } from './columns';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';

export default function QuotationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchQuotations, deleteQuotation, loading } = useData();
  const { toast } = useToast();

  const [quotations, setQuotations] = React.useState<Quotation[]>([]);
  const [totalQuotations, setTotalQuotations] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [quotationToDelete, setQuotationToDelete] = React.useState<Quotation | null>(null);

  const loadQuotations = React.useCallback(async (page: number) => {
    const { data, total } = await fetchQuotations(page, pageSize);
    setQuotations(data);
    setTotalQuotations(total);
    setCurrentPage(page);
  }, [fetchQuotations, pageSize]);

  React.useEffect(() => {
    loadQuotations(currentPage);
  }, [loadQuotations, currentPage]);

  const handleEdit = (quotation: Quotation) => {
    router.push(`/quotations/${quotation.id}/edit`);
  };

  const handleDeleteAttempt = (quotation: Quotation) => {
    if (quotation.status === 'Booking Completed') {
        toast({
            title: "Action Denied",
            description: "Cannot delete a quotation that has a completed booking.",
            variant: "destructive",
        });
        return;
    }
    setQuotationToDelete(quotation);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (quotationToDelete) {
      const success = await deleteQuotation(quotationToDelete.id);
      if (success) {
        toast({ title: "Success", description: "Quotation deleted successfully." });
        loadQuotations(currentPage); // Refresh list
      } else {
        toast({ title: "Error", description: "Failed to delete quotation. It might be linked to a booking.", variant: "destructive" });
      }
      setShowDeleteDialog(false);
      setQuotationToDelete(null);
    }
  };

  const columns = React.useMemo(() => getQuotationColumns(handleEdit, handleDeleteAttempt), [router]);
  
  const canCreate = user?.role === 'Admin' || user?.role === 'QuotationCreator';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        breadcrumbs={[{ label: 'Quotations' }]}
        actions={
          canCreate ? (
            <Button onClick={() => router.push('/quotations/new')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Quotation
            </Button>
          ) : null
        }
      />
      <DataTable
        columns={columns}
        data={quotations}
        isLoading={loading}
        currentPage={currentPage}
        totalItems={totalQuotations}
        pageCount={Math.ceil(totalQuotations / pageSize)}
        onPageChange={loadQuotations}
        pageSize={pageSize}
        renderRowActions={(row) => (
          <RowActionsDropdown>
            <DropdownMenuItem onClick={() => router.push(`/quotations/${row.id}/edit`)}>
                <Eye className="mr-2 h-4 w-4" /> View / Edit
            </DropdownMenuItem>
            {(user?.role === 'Admin' || user?.role === 'QuotationCreator') && (
                <DropdownMenuItem 
                    onClick={() => handleDeleteAttempt(row)} 
                    disabled={row.status === 'Booking Completed'}
                    className={row.status === 'Booking Completed' ? "text-muted-foreground" : "text-destructive focus:bg-destructive/10 focus:text-destructive"}
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
            <AlertDialogTitle>Are you sure you want to delete this quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quotation <span className="font-semibold">{quotationToDelete?.id}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setQuotationToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
