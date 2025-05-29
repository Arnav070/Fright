"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { Schedule } from "@/lib/types";
import { format } from "date-fns";

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
    cell: ({ row }) => format(new Date(row.original.etd), "dd MMM yy, HH:mm")
  },
  { 
    accessorKey: "eta", 
    header: "ETA",
    cell: ({ row }) => format(new Date(row.original.eta), "dd MMM yy, HH:mm")
  },
  { accessorKey: "frequency", header: "Frequency" },
];
