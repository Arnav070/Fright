"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ColumnDef<TData> {
  accessorKey: keyof TData | string; // Allow string for custom accessors or nested paths
  header: React.ReactNode | (({ column }: { column: Column<TData> }) => React.ReactNode);
  cell?: ({ row }: { row: Row<TData> }) => React.ReactNode;
  enableSorting?: boolean;
  meta?: any; // For additional column metadata
}

// Minimalistic internal types for sortability if needed later
interface Column<TData> {
  id: string;
  toggleSorting: (isMulti?: boolean) => void;
  getIsSorted: () => false | 'asc' | 'desc';
}
interface Row<TData> {
  original: TData;
  id: string;
  // other row properties...
}


interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  // Pagination props
  pageCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  // Action column props
  renderRowActions?: (row: TData) => React.ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  pageCount,
  currentPage = 1,
  onPageChange,
  pageSize = 10,
  totalItems = 0,
  renderRowActions,
}: DataTableProps<TData>) {

  const getHeader = (columnDef: ColumnDef<TData>) => {
    if (typeof columnDef.header === 'function') {
      // This part is tricky without a full table library like TanStack Table.
      // For now, we'll just render it if it's a node.
      // A real implementation would pass a mock/simple column object.
      return columnDef.header({ column: { id: columnDef.accessorKey as string, toggleSorting: () => {}, getIsSorted: () => false } as Column<TData> });
    }
    return columnDef.header;
  };

  const getCellValue = (row: TData, columnDef: ColumnDef<TData>): React.ReactNode => {
    if (columnDef.cell) {
      return columnDef.cell({ row: { original: row, id: (row as any).id || JSON.stringify(row) } as Row<TData> });
    }
    // Basic accessor logic
    const accessorKey = columnDef.accessorKey as keyof TData;
    const value = row[accessorKey];
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value !== undefined && value !== null ? value : '');
  };
  
  const calculatedPageCount = totalItems > 0 && pageSize > 0 ? Math.ceil(totalItems / pageSize) : (pageCount || 1);

  return (
    <div className="space-y-4">
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={String(column.accessorKey) + index} className={cn(column.meta?.headerClassName)}>
                  {getHeader(column)}
                </TableHead>
              ))}
              {renderRowActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`loading-${i}`}>
                  {columns.map((column, j) => (
                    <TableCell key={`loading-cell-${i}-${j}`}>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                  {renderRowActions && (
                    <TableCell className="text-right">
                      <div className="h-8 w-8 bg-muted rounded animate-pulse ml-auto"></div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row, rowIndex) => (
                <TableRow key={(row as any).id || rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={String(column.accessorKey) + colIndex + rowIndex} className={cn(column.meta?.cellClassName)}>
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                  {renderRowActions && (
                    <TableCell className="text-right">
                      {renderRowActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (renderRowActions ? 1 : 0)} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {onPageChange && calculatedPageCount > 1 && (
        <div className="flex items-center justify-between space-x-2 py-4">
           <div className="text-sm text-muted-foreground">
            Page {currentPage} of {calculatedPageCount}. Total {totalItems} items.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= calculatedPageCount || isLoading}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for creating a sortable header
export const SortableHeader = <TData,>({ column, title }: { column: Column<TData>, title: string }) => {
  // For prototype, sorting is not implemented, so this is visual only.
  // In a real app, column.toggleSorting would be called.
  return (
    <Button variant="ghost" onClick={() => console.log(`Sorting by ${title}`)} className="-ml-4">
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

// Helper for action dropdown menu
export const RowActionsDropdown = ({ children }: { children: React.ReactNode }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);
