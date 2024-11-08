import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "./UI/button";
import { UnlearningDataType } from "../types/data";
import { Badge } from "./UI/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./UI/hover-card";
import { getPhaseColors } from "../util";
import { NotAvailable } from "../constants/overview";

function getValueToDisplay(value: unknown) {
  return value === NotAvailable
    ? "-"
    : typeof value === "string"
    ? value
    : Number(value);
}

export const columns: ColumnDef<UnlearningDataType>[] = [
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
      const phase = row.getValue("phase") as string;
      const value =
        method === "Retrain"
          ? "Retrained"
          : phase === "Training"
          ? "Pretrained"
          : phase;
      const { color, backgroundColor } = getPhaseColors(value, 1, 0.15);
      return <Badge style={{ backgroundColor, color }}>{value}</Badge>;
    },
  },
  {
    accessorKey: "init_id",
    header: "Init",
    cell: ({ row }) => {
      const init = row.getValue("init_id");
      const value = getValueToDisplay(init);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("method");
      const value = getValueToDisplay(method);
      return <div className="w-[138px]">{value}</div>;
    },
  },
  {
    accessorKey: "epochs",
    header: "Epochs",
    cell: ({ row }) => {
      const epochs = row.getValue("epochs");
      const value = getValueToDisplay(epochs);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "learning_rate",
    header: "LR",
    cell: ({ row }) => {
      const learningRate = row.getValue("learning_rate");
      const value = getValueToDisplay(learningRate);
      return <div className="w-[38px]">{value}</div>;
    },
  },
  {
    accessorKey: "batch_size",
    header: "# Batch",
    cell: ({ row }) => {
      const batchSize = row.getValue("batch_size");
      const value = getValueToDisplay(batchSize);
      return <div>{value}</div>;
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
      const ua = row.getValue("unlearn_accuracy");
      const value = getValueToDisplay(ua);
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
      const ra = row.getValue("remain_accuracy");
      const value = getValueToDisplay(ra);
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
      const tua = row.getValue("test_unlearn_accuracy");
      const value = getValueToDisplay(tua);
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
      const tra = row.getValue("test_remain_accuracy");
      const value = getValueToDisplay(tra);
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
      const rte = row.getValue("RTE");
      const value = getValueToDisplay(rte);
      return <div className="text-center">{value}</div>;
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
