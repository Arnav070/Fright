
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, RowActionsDropdown } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { BuyRate } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { getBuyRateColumns } from './columns';
import { BuyRateForm, type BuyRateFormValues } from '@/components/admin/BuyRateForm';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
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
import { format, parseISO } from 'date-fns';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function ManageBuyRatesPage() {
  const { fetchBuyRates, createBuyRate, updateBuyRate, deleteBuyRate, loading } = useData();
  const { toast } = useToast();

  const [buyRates, setBuyRates] = React.useState<BuyRate[]>([]);
  const [totalBuyRates, setTotalBuyRates] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingBuyRate, setEditingBuyRate] = React.useState<BuyRate | null>(null);
  
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<BuyRate | null>(null);

  const loadData = React.useCallback(async (page: number, term: string) => {
    const { data, total } = await fetchBuyRates(page, pageSize, term);
    setBuyRates(data);
    setTotalBuyRates(total);
    setCurrentPage(page);
  }, [fetchBuyRates, pageSize]);

  React.useEffect(() => {
    if (currentPage !== 1 && debouncedSearchTerm !== searchTerm) { 
       setCurrentPage(1);
       loadData(1, debouncedSearchTerm);
    } else {
       loadData(currentPage, debouncedSearchTerm);
    }
  }, [loadData, currentPage, debouncedSearchTerm, searchTerm]);


  const handleCreateNew = () => {
    setEditingBuyRate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (buyRate: BuyRate) => {
    setEditingBuyRate(buyRate);
    setIsFormOpen(true);
  };

  const handleDeleteAttempt = (buyRate: BuyRate) => {
    setItemToDelete(buyRate);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteBuyRate(itemToDelete.id);
      toast({ title: "Success", description: "Buy Rate deleted successfully." });
      loadData(currentPage, debouncedSearchTerm); 
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleFormSubmit = async (data: BuyRateFormValues) => {
    // DataContext now handles date formatting to string for Firestore
    if (editingBuyRate) {
      await updateBuyRate(editingBuyRate.id, data as Partial<Omit<BuyRate, 'id'>>);
      toast({ title: "Success", description: "BuyRate updated successfully." });
    } else {
      await createBuyRate(data as Omit<BuyRate, 'id'>);
      toast({ title: "Success", description: "BuyRate created successfully." });
    }
    loadData(currentPage, debouncedSearchTerm);
    setIsFormOpen(false);
    setEditingBuyRate(null);
  };

  const columns = React.useMemo(() => getBuyRateColumns(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Buy Rates"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Buy Rates' }]}
        actions={
          <Button 
            onClick={handleCreateNew}
            className="bg-[#8E44AD] text-white hover:bg-[#7D3C98] focus-visible:ring-[#8E44AD]"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Buy Rate
          </Button>
        }
      />
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search buy rates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={buyRates}
        isLoading={loading}
        currentPage={currentPage}
        totalItems={totalBuyRates}
        pageCount={Math.ceil(totalBuyRates / pageSize)}
        onPageChange={(page) => loadData(page, debouncedSearchTerm)}
        pageSize={pageSize}
        renderRowActions={(row) => (
          <RowActionsDropdown>
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDeleteAttempt(row)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </RowActionsDropdown>
        )}
      />
      <BuyRateForm
        initialData={editingBuyRate}
        onSubmit={handleFormSubmit}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the buy rate for carrier <strong>{itemToDelete?.carrier}</strong> from <strong>{itemToDelete?.pol}</strong> to <strong>{itemToDelete?.pod}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
