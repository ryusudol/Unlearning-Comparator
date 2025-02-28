import { ColumnDef } from "@tanstack/react-table";

import {
  EpochHeader,
  BSHeader,
  LRHeader,
  UAHeader,
  RAHeader,
  TUAHeader,
  TRAHeader,
  RTEHeader,
  FQSHeader,
} from "./ColumnHeaders";
import MethodFilterHeader from "./MethodFilterHeader";
import { Badge } from "../UI/badge";
import { ExperimentData } from "../../types/data";
import { getTypeColors } from "../../utils/data/colors";
import { COLORS } from "../../constants/colors";

function getValueToDisplay(value: unknown) {
  return value === "N/A" || value === "NaN"
    ? "-"
    : typeof value === "string"
    ? value
    : Number(value);
}

const DECIMAL_POINT = 3;
export const COLUMN_WIDTHS = {
  ID: 35,
  Type: 78,
  Base: 40,
  Method: 90,
  Epoch: 60,
  BS: 44,
  LR: 60,
  UA: 60,
  RA: 60,
  TUA: 60,
  TRA: 60,
  RTE: 60,
  FQS: 60,
  A: 46,
  B: 46,
};

export const columns: ColumnDef<ExperimentData>[] = [
  {
    accessorKey: "ID",
    header: "ID",
    cell: ({ row }) => {
      const value = row.getValue("ID") as string;
      return <div className="w-7">{value}</div>;
    },
  },
  {
    accessorKey: "Type",
    header: "Type",
    cell: ({ row }) => {
      const value = row.getValue("Type") as string;
      const { color, backgroundColor } = getTypeColors(value);
      return (
        <Badge
          className="w-[70px] flex justify-center"
          style={{ backgroundColor, color }}
        >
          {value}
        </Badge>
      );
    },
  },
  {
    accessorKey: "Base",
    header: "Base",
    cell: ({ row }) => {
      const init = row.getValue("Base");
      const value = getValueToDisplay(init);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "Method",
    header: ({ column }) => <MethodFilterHeader column={column} />,
    filterFn: (row, columnId, filterValue) => {
      const rowValue = row.getValue(columnId);
      if (filterValue === "all") return true;
      return String(rowValue) === filterValue;
    },
    cell: ({ row }) => {
      const method = row.getValue("Method");
      const value = getValueToDisplay(method) as string;
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "Epoch",
    header: ({ column }) => <EpochHeader column={column} />,
    cell: ({ row }) => {
      const epoch = row.getValue("Epoch");
      const value = getValueToDisplay(epoch);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "BS",
    header: ({ column }) => <BSHeader column={column} />,
    cell: ({ row }) => {
      const batchSize = row.getValue("BS");
      const value = getValueToDisplay(batchSize);
      return <div>{value}</div>;
    },
  },
  {
    accessorKey: "LR",
    header: ({ column }) => <LRHeader column={column} />,
    cell: ({ row }) => {
      const learningRate = row.getValue("LR");
      const value = getValueToDisplay(learningRate);
      return <div className="w-[38px]">{value}</div>;
    },
  },
  {
    accessorKey: "UA",
    header: ({ column }) => <UAHeader column={column} />,
    cell: ({ row }) => {
      const ua = row.getValue("UA");
      const value = getValueToDisplay(ua);
      return (
        <div className="text-center">
          {typeof value === "number" ? value.toFixed(DECIMAL_POINT) : value}
        </div>
      );
    },
  },
  {
    accessorKey: "RA",
    header: ({ column }) => <RAHeader column={column} />,
    cell: ({ row }) => {
      const ra = row.getValue("RA");
      const value = getValueToDisplay(ra);
      return (
        <div className="text-center">
          {typeof value === "number" ? value.toFixed(DECIMAL_POINT) : value}
        </div>
      );
    },
  },
  {
    accessorKey: "TUA",
    header: ({ column }) => <TUAHeader column={column} />,
    cell: ({ row }) => {
      const tua = row.getValue("TUA");
      const value = getValueToDisplay(tua);
      return (
        <div className="text-center">
          {typeof value === "number" ? value.toFixed(DECIMAL_POINT) : value}
        </div>
      );
    },
  },
  {
    accessorKey: "TRA",
    header: ({ column }) => <TRAHeader column={column} />,
    cell: ({ row }) => {
      const tra = row.getValue("TRA");
      const value = getValueToDisplay(tra);
      return (
        <div className="text-center">
          {typeof value === "number" ? value.toFixed(DECIMAL_POINT) : value}
        </div>
      );
    },
  },
  {
    accessorKey: "RTE",
    header: ({ column }) => <RTEHeader column={column} />,
    cell: ({ row }) => {
      const rte = row.getValue("RTE");
      const value = getValueToDisplay(rte);
      return <div className="text-center">{value}</div>;
    },
  },
  {
    accessorKey: "FQS",
    header: ({ column }) => <FQSHeader column={column} />,
    cell: ({ row }) => {
      const fqs = row.getValue("FQS");
      const value = getValueToDisplay(fqs);
      return (
        <div className="text-center">
          {typeof value === "number" ? value.toFixed(DECIMAL_POINT) : value}
        </div>
      );
    },
  },
  {
    id: "A",
    header: () => <span style={{ color: COLORS.EMERALD }}>Model A</span>,
  },
  {
    id: "B",
    header: () => <span style={{ color: COLORS.PURPLE }}>Model B</span>,
  },
];
