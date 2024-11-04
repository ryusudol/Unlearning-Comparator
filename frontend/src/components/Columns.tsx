import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "./UI/button";
import { Data } from "../types/data";
import { Badge } from "./UI/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./UI/hover-card";
import { getPhaseColors } from "../util";

export const columns: ColumnDef<Data>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const value = row.getValue("id") as string;
      return <div className="w-7">{value}</div>;
    },
  },
  {
    accessorKey: "phase",
    header: "Phase",
    cell: ({ row }) => {
      const method = row.getValue("method") as string;
      const phase =
        method === "Retrain" ? "Retrained" : (row.getValue("phase") as string);
      const { color, backgroundColor } = getPhaseColors(phase, 1, 0.15);
      return (
        <Badge className="w-auto py-[2.5px]" style={{ backgroundColor, color }}>
          {phase}
        </Badge>
      );
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
      return (
        <div className="w-[138px]">{value === "Retrain" ? "-" : value}</div>
      );
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
      return <div className="w-[38px]">{value !== "N/A" ? value : "-"}</div>;
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
    header: ({ column }) => (
      <HoverCard>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px]"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            UA
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Unlearning Accuracy
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("unlearn_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "remain_accuracy",
    header: ({ column }) => (
      <HoverCard>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px]"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            RA
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Remaining Accuracy
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("remain_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "test_unlearn_accuracy",
    header: ({ column }) => (
      <HoverCard>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px]"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            TUA
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Test Unlearning Accuracy
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("test_unlearn_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "test_remain_accuracy",
    header: ({ column }) => (
      <HoverCard>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px]"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            TRA
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Test Remaining Accuracy
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("test_remain_accuracy"));
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "RTE",
    header: ({ column }) => (
      <HoverCard>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px]"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            RTE(s)
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Run-Time Efficiency
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const value = row.getValue("RTE") as string;
      return <div className="text-center">{value !== "N/A" ? value : "-"}</div>;
    },
  },
  {
    id: "baseline",
    header: () => <div className="w-full text-center">Baseline</div>,
  },
  {
    id: "comparison",
    header: () => <div className="w-full text-center">Comparison</div>,
  },
];
