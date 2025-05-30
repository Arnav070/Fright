
"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { BuyRate } from "@/lib/types";
import { format, parseISO } from "date-fns"; // Import parseISO

export const getBuyRateColumns = (): ColumnDef<BuyRate>[] => [
  { accessorKey: "carrier", header: "Carrier" },
  { accessorKey: "pol", header: "POL" },
  { accessorKey: "pod", header: "POD" },
  { accessorKey: "commodity", header: "Commodity" },
  { accessorKey: "freightModeType", header: "Mode" },
  { accessorKey: "equipment", header: "Equipment" },
  { accessorKey: "weightCapacity", header: "Capacity" },
  { accessorKey: "minBooking", header: "Min Booking" },
  { 
    accessorKey: "rate", 
    header: "Rate",
    cell: ({ row }) => `$${Number(row.original.rate).toFixed(2)}`
  },
  { 
    accessorKey: "validFrom", 
    header: "Valid From",
    // Assuming validFrom is 'yyyy-MM-dd' string, parse it first
    cell: ({ row }) => format(parseISO(row.original.validFrom), "dd MMM yy") 
  },
  { 
    accessorKey: "validTo", 
    header: "Valid To",
    // Assuming validTo is 'yyyy-MM-dd' string, parse it first
    cell: ({ row }) => format(parseISO(row.original.validTo), "dd MMM yy")
  },
];
