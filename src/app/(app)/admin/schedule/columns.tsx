
"use client";

import type { ColumnDef } from "@/components/common/DataTable";
import type { Schedule, Port } from "@/lib/types"; // Added Port
import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { useData } from '@/contexts/DataContext'; // To get ports for name mapping

const PortNameCell = ({ portCode }: { portCode: string }) => {
  const { ports } = useData();
  const port = ports.find(p => p.code === portCode);
  return port ? `${port.name} (${port.code})` : portCode;
};

export const getScheduleColumns = (): ColumnDef<Schedule>[] => [
  { accessorKey: "carrier", header: "Carrier" },
  { 
    accessorKey: "origin", 
    header: "Origin",
    cell: ({ row }) => <PortNameCell portCode={row.original.origin} />
  },
  { 
    accessorKey: "destination", 
    header: "Destination",
    cell: ({ row }) => <PortNameCell portCode={row.original.destination} />
  },
  { accessorKey: "serviceRoute", header: "Service Route" },
  { 
    accessorKey: "allocation", 
    header: "Allocation",
    cell: ({ row }) => `${row.original.allocation} Units`
  },
  { 
    accessorKey: "etd", 
    header: "ETD",
    cell: ({ row }) => {
        const date = parseISO(row.original.etd); // Already ISO string from Firestore
        return isValid(date) ? format(date, "dd MMM yy, HH:mm") : "Invalid Date";
    }
  },
  { 
    accessorKey: "eta", 
    header: "ETA",
    cell: ({ row }) => {
        const date = parseISO(row.original.eta); // Already ISO string from Firestore
        return isValid(date) ? format(date, "dd MMM yy, HH:mm") : "Invalid Date";
    }
  },
  {
    accessorKey: "transitTime", 
    header: "Transit Time",
    cell: ({ row }) => {
      const etdDate = parseISO(row.original.etd);
      const etaDate = parseISO(row.original.eta);
      if (!isValid(etdDate) || !isValid(etaDate)) return "N/A";
      const transitDays = differenceInDays(etaDate, etdDate);
      return `${transitDays} days`;
    }
  },
  { accessorKey: "frequency", header: "Frequency" },
];
