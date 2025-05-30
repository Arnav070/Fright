
"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns"; // Import parseISO

export const getBookingColumns = (
    onEdit: (booking: Booking) => void
    // onDelete might not be needed if bookings are not directly deleted, or handled differently
): ColumnDef<Booking>[] => [
  {
    accessorKey: "id",
    header: "Booking ID",
  },
  {
    accessorKey: "quotationId",
    header: "Quotation #REF",
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
    accessorKey: "sellRate", // Usually Sell Rate is what matters for booking revenue
    header: "Sell Rate",
    cell: ({ row }) => `$${row.original.sellRate.toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let badgeClass = "";
      if (status === "Booked") badgeClass = "bg-blue-500";
      else if (status === "Shipped") badgeClass = "bg-yellow-500";
      else if (status === "Delivered") badgeClass = "bg-green-500";
      else if (status === "Cancelled") badgeClass = "bg-red-500";
      
      return <Badge className={cn("text-white", badgeClass)}>{status}</Badge>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => format(parseISO(row.original.updatedAt), "dd MMM yyyy, HH:mm"), // Parse ISO string
  },
];
