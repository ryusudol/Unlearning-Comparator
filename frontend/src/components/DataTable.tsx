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

import { calculatePerformanceMetrics } from "../util";
import { ExperimentData } from "../types/data";
import { hexToRgba } from "../util";
import { ScrollArea } from "./UI/scroll-area";
import { ExperimentsContext } from "../store/experiments-context";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
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

const sortables = ["UA", "RA", "TUA", "TRA", "RTE"];

type PerformanceMetrics = {
  [key: string]: {
    colorScale: d3.ScaleLinear<number, number, never>;
    baseColor: string;
  };
};

interface Props {
  columns: ColumnDef<ExperimentData>[];
}

export default function DataTable({ columns }: Props) {
  const { experiments } = useContext(ExperimentsContext);
  const { baseline, comparison, saveBaseline, saveComparison } = useContext(
    BaselineComparisonContext
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const performanceMetrics = calculatePerformanceMetrics(
    experiments
  ) as PerformanceMetrics;

  const modifiedColumns = columns.map((column) => {
    if (column.id === "baseline") {
      return {
        ...column,
        cell: ({ row }: CellContext<ExperimentData, unknown>) => (
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
              disabled={comparison === row.id}
            />
          </RadioGroup>
        ),
      };
    }
    if (column.id === "comparison") {
      return {
        ...column,
        cell: ({ row }: CellContext<ExperimentData, unknown>) => (
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
              disabled={baseline === row.id}
            />
          </RadioGroup>
        ),
      };
    }
    return column;
  });

  const tableData = useMemo(() => {
    const dataArray = Object.values(experiments);
    if (dataArray.length === 0) return [];

    const pretrainedData = dataArray[0];
    const remainingData = dataArray.slice(1);
    const retrainData = remainingData.filter(
      (datum) => datum.phase === "Retrained"
    );
    const otherData = remainingData.filter(
      (datum) => datum.phase !== "Retrained"
    );

    return [pretrainedData, ...retrainData, ...otherData];
  }, [experiments]);

  const opacityMapping = useMemo(() => {
    const mapping: { [key: string]: { [value: number]: number } } = {};

    Object.keys(performanceMetrics).forEach((columnId) => {
      if (!performanceMetrics[columnId]) return;

      const values = tableData
        .map((datum) => datum[columnId as keyof ExperimentData] as number)
        .filter(
          (value) =>
            value !== undefined && value !== null && typeof value === "number"
        );

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
    getRowId: (row: ExperimentData) => row.id,
    data: tableData as ExperimentData[],
    columns: modifiedColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting },
  });

  useEffect(() => {
    if (tableData.length > 0) {
      saveBaseline(tableData[0].id);
      saveComparison(tableData[1]?.id);
    } else {
      saveBaseline("");
      saveComparison("");
    }
  }, [saveBaseline, saveComparison, tableData]);

  return (
    <div className="w-full h-[222px]">
      <Table className="table-fixed w-full border-none">
        <ScrollArea className="w-full h-[220px]">
          <TableHeader className="bg-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const columnId = cell.column.id;

                    const isPerformanceMetric = columnId in performanceMetrics;

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
                            columnId === "ua"
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
