import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "./ui/button";

export type Overview = {
  id: string;
  model: string;
  dataset: string;
  forget: string;
  training: string;
  unlearning: string;
  defense: string;
  ua: number;
  ra: number;
  ta: number;
  mia: number;
  avgGap: number;
  rte: number;
  logits: number;
};

export const columns: ColumnDef<Overview>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "dataset",
    header: "Dataset",
  },
  {
    accessorKey: "forget",
    header: "Forget",
  },
  {
    accessorKey: "training",
    header: "Training",
    cell: ({ row }) => {
      const value = row.getValue("training") as string;
      const formatted = value.length > 13 ? value.slice(0, 13) + "..." : value;
      return <div className="w-[90px]">{formatted}</div>;
    },
  },
  {
    accessorKey: "unlearning",
    header: "Unlearning",
    cell: ({ row }) => {
      const value = row.getValue("unlearning");
      return <div className="w-[90px]">{value as string}</div>;
    },
  },
  {
    accessorKey: "defense",
    header: "Defense",
    cell: ({ row }) => {
      const value = row.getValue("defense");
      return <div className="w-[90px]">{value as string}</div>;
    },
  },
  {
    accessorKey: "ua",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          UA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("ua"));
      return <div className="ml-4">{value}</div>;
    },
  },
  {
    accessorKey: "ra",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          RA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("ra"));
      return <div className="ml-4">{value}</div>;
    },
  },
  {
    accessorKey: "ta",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("ta"));
      return <div className="ml-4">{value}</div>;
    },
  },
  {
    accessorKey: "mia",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          MIA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("mia"));
      return <div className="ml-4">{value}</div>;
    },
  },
  {
    accessorKey: "avgGap",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Avg.Gap
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("avgGap"));
      return <div className="ml-4">{value}</div>;
    },
  },
  {
    accessorKey: "rte",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          RTE(s)
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("rte"));
      return <div className="ml-4">{value}</div>;
    },
  },
  {
    accessorKey: "logits",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Logits
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("logits"));
      return <div className="ml-4">{value}</div>;
    },
  },
];
