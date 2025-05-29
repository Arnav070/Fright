"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { BuyRate } from "@/lib/types";
import { format } from "date-fns";

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
    cell: ({ row }) => format(new Date(row.original.validFrom), "dd MMM yy")
  },
  { 
    accessorKey: "validTo", 
    header: "Valid To",
    cell: ({ row }) => format(new Date(row.original.validTo), "dd MMM yy")
  },
];
