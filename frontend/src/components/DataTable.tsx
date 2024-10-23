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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Data } from "../types/data";
import { hexToRgba } from "../util";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";

interface Props {
  columns: ColumnDef<Data>[];
  data: Data[];
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
        cell: ({ row }: CellContext<Data, unknown>) => (
          <div className="flex items-center ml-4">
            <Checkbox
              className="w-[18px] h-[18px]"
              checked={baseline === row.id}
              onCheckedChange={() => {
                saveBaseline(baseline === row.id ? "" : row.id);
              }}
            />
          </div>
        ),
      };
    }
    if (column.id === "comparison") {
      return {
        ...column,
        cell: ({ row }: CellContext<Data, unknown>) => (
          <div className="flex items-center ml-4">
            <Checkbox
              className="w-[18px] h-[18px]"
              checked={comparison === row.id}
              onCheckedChange={() => {
                saveComparison(comparison === row.id ? "" : row.id);
              }}
            />
          </div>
        ),
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

    return [...retrainData, ...otherData];
  }, [data, forgetClass]);

  const table = useReactTable({
    getRowId: (row: Data) => row.id,
    data: tableData,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  return (
    <div className="w-full h-[251px] rounded-md border">
      <Table className="table-fixed w-full">
        <ScrollArea className="w-full h-[249px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          <TableBody className="text-[13px]">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, rowIdx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const columnId = cell.column.id;

                    const isPerformanceMetric =
                      performanceMetrics[columnId] !== undefined;

                    let cellStyle = {};
                    if (isPerformanceMetric) {
                      const value = cell.getValue() as number;
                      const { colorScale, baseColor } =
                        performanceMetrics[columnId];

                      if (colorScale && baseColor) {
                        const opacity = colorScale(value);
                        const color = hexToRgba(baseColor, opacity);

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
