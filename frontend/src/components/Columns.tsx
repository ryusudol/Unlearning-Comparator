import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";

export type Overview = {
  rank: number;
  id: string;
  forget: string;
  training: string;
  unlearning: string;
  defense: string;
  ua: number;
  ra: number;
  ta: number;
  tua: number;
  tra: number;
  rte: number;
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
    accessorKey: "forget",
    header: "Forget",
    cell: ({ row }) => {
      const value = row.getValue("forget") as string;
      return <div className="text-center mr-3">{value}</div>;
    },
  },
  {
    accessorKey: "training",
    header: "Training",
    cell: ({ row }) => {
      const value = row.getValue("training") as string;
      return <div>{value}</div>;
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
      const value = parseFloat(row.getValue("rte"));
      return <div className="ml-4">{value}</div>;
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
    header: "Baseline",
    cell: () => (
      <div className="w-full ml-3">
        <Checkbox className="ml-2" />
      </div>
    ),
  },
  {
    header: "Comparison",
    cell: () => (
      <div className="w-full ml-5">
        <Checkbox className="ml-2" />
      </div>
    ),
  },
];
