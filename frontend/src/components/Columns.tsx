import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "./ui/button";
import { Data } from "../types/data";

export const columns: ColumnDef<Data>[] = [
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
    accessorKey: "init_id",
    header: "Init",
    cell: ({ row }) => {
      const value = row.getValue("init_id") as string;
      return <div>{value !== "N/A" ? value : "-"}</div>;
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
    accessorKey: "learning_rate",
    header: "LR",
    cell: ({ row }) => {
      const value = row.getValue("learning_rate") as string;
      return <div>{value !== "N/A" ? value : "-"}</div>;
    },
  },
  {
    accessorKey: "batch_size",
    header: "# Batch",
    cell: ({ row }) => {
      const value = row.getValue("batch_size") as string;
      return <div>{value !== "N/A" ? value : "-"}</div>;
    },
  },
  {
    accessorKey: "unlearn_accuracy",
    header: ({ column }) => {
      return (
        <Button
          className="w-full px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          UA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("unlearn_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "remain_accuracy",
    header: ({ column }) => {
      return (
        <Button
          className="w-full px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          RA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("remain_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "test_unlearn_accuracy",
    header: ({ column }) => {
      return (
        <Button
          className="w-full px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TUA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("test_unlearn_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "test_remain_accuracy",
    header: ({ column }) => {
      return (
        <Button
          className="w-full px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TRA
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("test_remain_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "RTE",
    header: ({ column }) => {
      return (
        <Button
          className="w-full px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          RTE(s)
          <ArrowUpDown className="w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue("RTE") as string;
      return <div className="text-center">{value !== "N/A" ? value : "-"}</div>;
    },
  },
  {
    id: "baseline",
    header: () => {
      return <div className="-mr-2 w-[35px] px-0">Baseline</div>;
    },
  },
  {
    id: "comparison",
    header: () => {
      return <div className="-mr-3 w-[55px] px-0">Comparison</div>;
    },
  },
];
