
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, RowActionsDropdown } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { Schedule } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { getScheduleColumns } from './columns';
import { ScheduleForm, type ScheduleFormValues } from '@/components/admin/ScheduleForm';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '../../../../hooks/useDebounce';
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

export default function ManageSchedulesPage() {
  const { fetchSchedules, createSchedule, updateSchedule, deleteSchedule, loading, ports } = useData();
  const { toast } = useToast();

  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [totalSchedules, setTotalSchedules] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null);
  
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<Schedule | null>(null);

  const loadData = React.useCallback(async (page: number, term: string) => {
    const { data, total } = await fetchSchedules(page, pageSize, term);
    setSchedules(data);
    setTotalSchedules(total);
    setCurrentPage(page);
  }, [fetchSchedules, pageSize]);

  React.useEffect(() => {
     if (currentPage !== 1 && debouncedSearchTerm !== searchTerm) {
       setCurrentPage(1);
       loadData(1, debouncedSearchTerm);
    } else {
       loadData(currentPage, debouncedSearchTerm);
    }
  }, [loadData, currentPage, debouncedSearchTerm, searchTerm]);

  const handleCreateNew = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDeleteAttempt = (schedule: Schedule) => {
    setItemToDelete(schedule);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteSchedule(itemToDelete.id);
      toast({ title: "Success", description: "Schedule deleted successfully." });
      loadData(currentPage, debouncedSearchTerm);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleFormSubmit = async (data: ScheduleFormValues) => {
    // DataContext's createSchedule/updateSchedule now expect ScheduleFormValues
    // and will handle date to ISO string conversion internally if needed.
    if (editingSchedule) {
      await updateSchedule(editingSchedule.id, data as Partial<Omit<Schedule, 'id'>>);
      toast({ title: "Success", description: "Schedule updated successfully." });
    } else {
      await createSchedule(data as Omit<Schedule, 'id'>);
      toast({ title: "Success", description: "Schedule created successfully." });
    }
    loadData(currentPage, debouncedSearchTerm);
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  const columns = React.useMemo(() => getScheduleColumns(), []);

  const getPortName = (code: string | undefined) => {
    if (!code) return 'N/A';
    const port = ports.find(p => p.code === code);
    return port ? port.name : code;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Schedules"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Schedules' }]}
        actions={
          <Button 
            onClick={handleCreateNew}
            className="bg-[#8E44AD] text-white hover:bg-[#7D3C98] focus-visible:ring-[#8E44AD]"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Schedule
          </Button>
        }
      />
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={schedules}
        isLoading={loading}
        currentPage={currentPage}
        totalItems={totalSchedules}
        pageCount={Math.ceil(totalSchedules / pageSize)}
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
      <ScheduleForm
        initialData={editingSchedule}
        onSubmit={handleFormSubmit}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the schedule for carrier <strong>{itemToDelete?.carrier}</strong> from <strong>{getPortName(itemToDelete?.origin)}</strong> to <strong>{getPortName(itemToDelete?.destination)}</strong>.
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
