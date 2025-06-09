
"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { Schedule } from "@/lib/types";
import { format, parseISO, differenceInDays } from "date-fns"; // Import parseISO and differenceInDays

export const getScheduleColumns = (): ColumnDef<Schedule>[] => [
  { accessorKey: "carrier", header: "Carrier" },
  { accessorKey: "origin", header: "Origin" },
  { accessorKey: "destination", header: "Destination" },
  { accessorKey: "serviceRoute", header: "Service Route" },
  { 
    accessorKey: "allocation", 
    header: "Allocation",
    cell: ({ row }) => `${row.original.allocation} Units`
  },
  { 
    accessorKey: "etd", 
    header: "ETD",
    cell: ({ row }) => format(parseISO(row.original.etd), "dd MMM yy, HH:mm") // Parse ISO string
  },
  { 
    accessorKey: "eta", 
    header: "ETA",
    cell: ({ row }) => format(parseISO(row.original.eta), "dd MMM yy, HH:mm") // Parse ISO string
  },
  {
    accessorKey: "transitTime", // Custom key for the new column
    header: "Transit Time",
    cell: ({ row }) => {
      const etdDate = parseISO(row.original.etd);
      const etaDate = parseISO(row.original.eta);
      const transitDays = differenceInDays(etaDate, etdDate);
      return `${transitDays} days`;
    }
  },
  { accessorKey: "frequency", header: "Frequency" },
];

