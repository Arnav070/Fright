
"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { BuyRate } from "@/lib/types";
import { format, parseISO, isValid } from "date-fns";

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
    cell: ({ row }) => {
        const date = parseISO(row.original.validFrom);
        return isValid(date) ? format(date, "dd MMM yy") : "Invalid Date";
    }
  },
  { 
    accessorKey: "validTo", 
    header: "Valid To",
    cell: ({ row }) => {
        const date = parseISO(row.original.validTo);
        return isValid(date) ? format(date, "dd MMM yy") : "Invalid Date";
    }
  },
];
