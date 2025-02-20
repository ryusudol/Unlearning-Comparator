import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import MethodFilterHeader from "./MethodFilterHeader";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../UI/hover-card";
import { ModelAIcon, ModelBIcon } from "../UI/icons";
import { Badge } from "../UI/badge";
import { Button } from "../UI/button";
import { ExperimentData } from "../../types/data";
import { getPhaseColors } from "../../utils/data/colors";

function getValueToDisplay(value: unknown) {
  return value === "N/A" || value === "NaN"
    ? "-"
    : typeof value === "string"
    ? value
    : Number(value);
}

export const COLUMN_WIDTHS = {
  id: 32,
  phase: 78,
  init: 38,
  method: 90,
  epochs: 64,
  BS: 44,
  LR: 60,
  UA: 60,
  TUA: 60,
  RA: 60,
  TRA: 60,
  PA: 60,
  RTE: 60,
  FQS: 60,
  a: 42,
  b: 42,
};

export const columns: ColumnDef<ExperimentData>[] = [
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
    header: "Type",
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
    accessorKey: "init",
    header: "Base",
    cell: ({ row }) => {
      const init = row.getValue("init");
      const value = getValueToDisplay(init);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "method",
    header: ({ column }) => <MethodFilterHeader column={column} />,
    filterFn: (row, columnId, filterValue) => {
      const rowValue = row.getValue(columnId);
      if (filterValue === "all") return true;
      return String(rowValue) === filterValue;
    },
    cell: ({ row }) => {
      const method = row.getValue("method");
      const value = getValueToDisplay(method) as string;
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "epochs",
    header: ({ column }) => (
      <Button
        className="w-full px-0 h-[34px] justify-start"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Epoch
        <ArrowUpDown className="w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const epochs = row.getValue("epochs");
      const value = getValueToDisplay(epochs);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "BS",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px] justify-start"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            BS
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Batch Size
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const batchSize = row.getValue("BS");
      const value = getValueToDisplay(batchSize);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "LR",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px] justify-start"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            LR
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Learning Rate
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const learningRate = row.getValue("LR");
      const value = getValueToDisplay(learningRate);
      return <div className="w-[38px]">{value}</div>;
    },
  },
  {
    accessorKey: "UA",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
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
      const ua = row.getValue("UA");
      const value = getValueToDisplay(ua);
      return (
        <div className="text-center">
          {typeof value === "number"
            ? value === 0 || value === 1
              ? value
              : value.toFixed(3)
            : value}
        </div>
      );
    },
  },
  {
    accessorKey: "TUA",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
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
      const tua = row.getValue("TUA");
      const value = getValueToDisplay(tua);
      return (
        <div className="text-center">
          {typeof value === "number"
            ? value === 0 || value === 1
              ? value
              : value.toFixed(3)
            : value}
        </div>
      );
    },
  },
  {
    accessorKey: "RA",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
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
      const ra = row.getValue("RA");
      const value = getValueToDisplay(ra);
      return (
        <div className="text-center">
          {typeof value === "number"
            ? value === 0 || value === 1
              ? value
              : value.toFixed(3)
            : value}
        </div>
      );
    },
  },
  {
    accessorKey: "TRA",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
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
      const tra = row.getValue("TRA");
      const value = getValueToDisplay(tra);
      return (
        <div className="text-center">
          {typeof value === "number"
            ? value === 0 || value === 1
              ? value
              : value.toFixed(3)
            : value}
        </div>
      );
    },
  },
  {
    accessorKey: "PA",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px]"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            PA
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Pulled Accuracy
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      // const pa = row.getValue("PA");
      // const value = getValueToDisplay(pa);
      return (
        <div className="text-center">
          -
          {/* {typeof value === "number"
            ? value === 0 || value === 1
              ? value
              : value.toFixed(3)
            : value} */}
        </div>
      );
    },
  },
  {
    accessorKey: "RTE",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
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
    accessorKey: "FQS",
    header: ({ column }) => (
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger>
          <Button
            className="w-full px-0 h-[34px]"
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            FQS
            <ArrowUpDown className="w-4" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto px-3 py-2" side="top">
          Forgetting Quality Score
        </HoverCardContent>
      </HoverCard>
    ),
    cell: ({ row }) => {
      const fqs = row.getValue("FQS");
      const value = getValueToDisplay(fqs);
      return <div className="text-center">{value}</div>;
    },
  },
  {
    id: "a",
    header: () => (
      <div className="w-full flex items-center justify-center">
        <ModelAIcon className="mr-1" />
        <span>A</span>
      </div>
    ),
  },
  {
    id: "b",
    header: () => (
      <div className="w-full flex items-center justify-center">
        <ModelBIcon className="mr-1" />
        <span>B</span>
      </div>
    ),
  },
];
