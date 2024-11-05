import { useState, useEffect, useContext, useMemo } from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  CellContext,
} from "@tanstack/react-table";

import { Data, TrainingData } from "../types/data";
import { hexToRgba } from "../util";
import { ScrollArea } from "./UI/scroll-area";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { RadioGroup, RadioGroupItem } from "./UI/radio-group";
import { cn } from "../lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./UI/table";

const sortables = [
  "unlearn_accuracy",
  "remain_accuracy",
  "test_unlearn_accuracy",
  "test_remain_accuracy",
  "RTE",
];

interface Props {
  columns: ColumnDef<Data | TrainingData>[];
  data: Data[];
  trainingData: TrainingData;
  performanceMetrics: {
    [key: string]: {
      colorScale: d3.ScaleLinear<number, number, never>;
      baseColor: string;
    };
  };
}

export default function DataTable({
  columns,
  data,
  trainingData,
  performanceMetrics,
}: Props) {
  const { forgetClass } = useContext(ForgetClassContext);
  const { baseline, comparison, saveBaseline, saveComparison } = useContext(
    BaselineComparisonContext
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const modifiedColumns = columns.map((column) => {
    if (column.id === "baseline") {
      return {
        ...column,
        cell: ({ row }: CellContext<Data | TrainingData, unknown>) => {
          const isTraining = row.original.phase === "Training";
          return (
            <RadioGroup className="flex justify-center items-center ml-[0px]">
              <RadioGroupItem
                value={row.id}
                className={cn(
                  "w-[18px] h-[18px] rounded-full",
                  baseline === row.id && "[&_svg]:h-3 [&_svg]:w-3"
                )}
                checked={baseline === row.id}
                onClick={() => {
                  saveBaseline(baseline === row.id ? "" : row.id);
                }}
                disabled={comparison === row.id || isTraining}
              />
            </RadioGroup>
          );
        },
      };
    }
    if (column.id === "comparison") {
      return {
        ...column,
        cell: ({ row }: CellContext<Data | TrainingData, unknown>) => {
          const isTraining = row.original.phase === "Training";
          return (
            <RadioGroup className="flex justify-center items-center ml-[0px]">
              <RadioGroupItem
                value={row.id}
                className={cn(
                  "w-[18px] h-[18px] rounded-full",
                  comparison === row.id && "[&_svg]:h-3 [&_svg]:w-3"
                )}
                checked={comparison === row.id}
                onClick={() => {
                  saveComparison(comparison === row.id ? "" : row.id);
                }}
                disabled={baseline === row.id || isTraining}
              />
            </RadioGroup>
          );
        },
      };
    }
    return column;
  });

  const tableData = useMemo(() => {
    const forgetData = data.filter(
      (datum) => datum.forget_class === forgetClass
    );
    const retrainData = forgetData.filter(
      (forgetDatum) => forgetDatum.method === "Retrain"
    );
    const otherData = forgetData.filter(
      (forgetDatum) => forgetDatum.method !== "Retrain"
    );

    return [trainingData, ...retrainData, ...otherData];
  }, [data, forgetClass, trainingData]);

  const opacityMapping = useMemo(() => {
    const mapping: { [key: string]: { [value: number]: number } } = {};

    Object.keys(performanceMetrics).forEach((columnId) => {
      const values = tableData
        .map((datum) => datum[columnId as keyof Data] as number)
        .filter((value) => typeof value === "number");

      const uniqueValues = Array.from(new Set(values));

      uniqueValues.sort((a, b) => a - b);

      const numUniqueValues = uniqueValues.length;

      const valueOpacityMap: { [value: number]: number } = {};

      if (numUniqueValues === 0) {
        uniqueValues.forEach((value) => {
          valueOpacityMap[value] = 0;
        });
      } else if (numUniqueValues === 1) {
        valueOpacityMap[uniqueValues[0]] = 1;
      } else {
        uniqueValues.forEach((value, index) => {
          const opacity = index / (numUniqueValues - 1);
          valueOpacityMap[value] = opacity;
        });
      }

      mapping[columnId] = valueOpacityMap;
    });

    return mapping;
  }, [tableData, performanceMetrics]);

  const table = useReactTable({
    getRowId: (row: Data | TrainingData) => row.id,
    data: tableData as (Data | TrainingData)[],
    columns: modifiedColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting },
  });

  useEffect(() => {
    if (tableData.length > 1) {
      saveBaseline(tableData[1].id);
      saveComparison(tableData[2]?.id);
    } else {
      saveBaseline("");
      saveComparison("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  return (
    <div className="w-full h-[222px]">
      <Table className="table-fixed w-full border-none">
        <ScrollArea className="w-full h-[220px]">
          <TableHeader className="bg-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-gray-200">
                {headerGroup.headers.map((header) => {
                  const style = sortables.includes(header.column.id)
                    ? { width: "80px" }
                    : header.column.id === "phase"
                    ? { width: "100px" }
                    : {};
                  return (
                    <TableHead key={header.id} style={style}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className={`text-sm ${
              table.getRowModel().rows?.length <= 5 &&
              "[&_tr:last-child]:border-b"
            }`}
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    row.original.phase === "Training"
                      ? "bg-gray-100 hover:bg-gray-100"
                      : ""
                  }
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const columnId = cell.column.id;

                    const isPerformanceMetric =
                      performanceMetrics[columnId] !== undefined;

                    let cellStyle = {};
                    if (isPerformanceMetric) {
                      const { baseColor } = performanceMetrics[columnId];
                      const value = cell.getValue() as number;
                      const opacity = opacityMapping[columnId]?.[value] ?? 0;

                      if (baseColor) {
                        let color, textColor;

                        if (tableData.length === 1 && value === 0) {
                          color = "#FFFFFF";
                          textColor = "#000000";
                        } else {
                          color = hexToRgba(baseColor, opacity);
                          textColor = opacity >= 0.8 ? "#FFFFFF" : "#000000";
                        }

                        cellStyle = {
                          borderLeft:
                            columnId === "unlearn_accuracy"
                              ? "1px solid rgb(229 231 235)"
                              : "none",
                          borderRight:
                            idx === row.getVisibleCells().length - 1
                              ? "none"
                              : "1px solid rgb(229 231 235)",
                          backgroundColor: color,
                          color: textColor,
                        };
                      }
                    }

                    return (
                      <TableCell key={cell.id} style={cellStyle}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[178px] text-center text-gray-500 text-[15px]"
                >
                  Run Training or Unlearning from the left first.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ScrollArea>
      </Table>
    </div>
  );
}
