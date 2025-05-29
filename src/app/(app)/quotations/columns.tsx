"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { Quotation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const getQuotationColumns = (
    onEdit: (quotation: Quotation) => void,
    onDelete: (quotation: Quotation) => void
): ColumnDef<Quotation>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "customerName",
    header: "Customer Name",
  },
  {
    accessorKey: "pol",
    header: "POL",
  },
  {
    accessorKey: "pod",
    header: "POD",
  },
  {
    accessorKey: "volume",
    header: "Volume",
  },
  {
    accessorKey: "equipment",
    header: "Equipment",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "buyRate",
    header: "Buy Rate",
    cell: ({ row }) => `$${row.original.buyRate.toFixed(2)}`,
  },
  {
    accessorKey: "sellRate",
    header: "Sell Rate",
    cell: ({ row }) => `$${row.original.sellRate.toFixed(2)}`,
  },
  {
    accessorKey: "profitAndLoss",
    header: "P/L",
    cell: ({ row }) => {
        const pnl = row.original.profitAndLoss;
        return (
            <span className={cn(pnl >= 0 ? "text-green-600" : "text-red-600")}>
                ${pnl.toFixed(2)}
            </span>
        );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      if (status === "Draft") variant = "secondary";
      else if (status === "Submitted") variant = "outline";
      else if (status === "Booking Completed") variant = "default"; // 'default' is often primary-like
      else if (status === "Cancelled") variant = "destructive";
      
      return <Badge variant={variant} className={cn(status === "Booking Completed" && "bg-green-500 text-white")}>{status}</Badge>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => format(new Date(row.original.updatedAt), "dd MMM yyyy, HH:mm"),
  },
];
