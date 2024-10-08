import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "./ui/button";

export type Overview = {
  id: string;
  forget: number;
  phase: string;
  method: string;
  epochs: number | string;
  lr: number | string;
  batchSize: number | string;
  seed: number;
  ua: number;
  ra: number;
  tua: number;
  tra: number;
  rte: number | string;
};

export const colors = [
  "#A6A6F9",
  "#B4BBF4",
  "#C1C7F6",
  "#CDD2F7",
  "#FFFFFF",
  "#F7CFCD",
  "#F6C3C1",
  "#F4B6B4",
  "#F2AAA8",
];

export const columns: ColumnDef<Overview>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "phase",
    header: "Phase",
    cell: ({ row }) => {
      const value = row.getValue("phase") as string;
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const value = row.getValue("method") as string;
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "epochs",
    header: "Epochs",
    cell: ({ row }) => {
      const value = row.getValue("epochs") as string;

      return <div>{value !== "N/A" ? value : "-"}</div>;
    },
  },
  {
    accessorKey: "lr",
    header: "LR",
    cell: ({ row }) => {
      const value = row.getValue("lr") as string;
      return <div>{value !== "N/A" ? value : "-"}</div>;
    },
  },
  {
    accessorKey: "batchSize",
    header: "BS",
    cell: ({ row }) => {
      const value = row.getValue("batchSize") as string;
      return <div>{value !== "N/A" ? value : "-"}</div>;
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
    accessorKey: "tua",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TUA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("tua"));
      return <div className="ml-4">{value}</div>;
    },
  },
  {
    accessorKey: "tra",
    header: ({ column }) => {
      return (
        <Button
          className="px-3"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TRA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("tra"));
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
      const value = row.getValue("rte") as string;
      return <div className="ml-4">{value !== "N/A" ? value : "-"}</div>;
    },
  },
  // {
  //   accessorKey: "rank",
  //   header: "Rank",
  //   cell: ({ row }) => {
  //     const value = parseFloat(row.getValue("rank"));
  //     return <div className="text-center">{value}</div>;
  //   },
  // },
  {
    id: "baseline",
    header: "Baseline",
  },
  {
    id: "comparison",
    header: "Comparison",
  },
];
