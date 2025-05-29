
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable, RowActionsDropdown } from '@/components/common/DataTable';
import { PageHeader } from '@/components/common/PageHeader';
import type { Schedule } from '@/lib/types';
import { useData } from '@/contexts/DataContext';
import { getScheduleColumns } from './columns';
import { ScheduleForm, type ScheduleFormValues } from '@/components/admin/ScheduleForm';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { format } from 'date-fns';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function ManageSchedulesPage() {
  const { fetchSchedules, createSchedule, updateSchedule, deleteSchedule, loading } = useData();
  const { toast } = useToast();

  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [totalSchedules, setTotalSchedules] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null);
  
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<Schedule | null>(null);

  const loadData = React.useCallback(async (page: number) => {
    const { data, total } = await fetchSchedules(page, pageSize);
    setSchedules(data);
    setTotalSchedules(total);
    setCurrentPage(page);
  }, [fetchSchedules, pageSize]);

  React.useEffect(() => {
    loadData(currentPage);
  }, [loadData, currentPage]);

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
      loadData(currentPage); // Refresh list
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleFormSubmit = async (data: ScheduleFormValues) => {
    // Format dates to ISO string or desired string format for mock storage
    const formattedData = {
        ...data,
        etd: format(data.etd, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        eta: format(data.eta, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    };

    if (editingSchedule) {
      await updateSchedule(editingSchedule.id, formattedData);
      toast({ title: "Success", description: "Schedule updated successfully." });
    } else {
      await createSchedule(formattedData);
      toast({ title: "Success", description: "Schedule created successfully." });
    }
    loadData(currentPage);
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  const columns = React.useMemo(() => getScheduleColumns(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Schedules"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Schedules' }]}
        actions={
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Schedule
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={schedules}
        isLoading={loading}
        currentPage={currentPage}
        totalItems={totalSchedules}
        pageCount={Math.ceil(totalSchedules / pageSize)}
        onPageChange={loadData}
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
              This action cannot be undone. This will permanently delete the schedule for carrier <strong>{itemToDelete?.carrier}</strong> on route <strong>{itemToDelete?.serviceRoute}</strong>.
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
