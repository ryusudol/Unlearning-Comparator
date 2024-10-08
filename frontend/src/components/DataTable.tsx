import { useState, useContext } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  CellContext,
} from "@tanstack/react-table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { hexToRgba } from "../util";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { forgetClasses } from "../constants/forgetClasses";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  performanceMetrics: {
    [key: string]: {
      colorScale: false | d3.ScaleQuantile<string, never>;
    };
  };
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  performanceMetrics,
}: DataTableProps<TData, TValue>) {
  const { baseline, comparison, saveBaseline, saveComparison } = useContext(
    BaselineComparisonContext
  );

  const [forgetClass, setForgetClass] = useState<string | undefined>(undefined);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const modifiedColumns = columns.map((column) => {
    if (column.id === "baseline") {
      return {
        ...column,
        cell: ({ row }: CellContext<TData, unknown>) => (
          <div className="w-full ml-3 flex items-center">
            <Checkbox
              className="ml-2"
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
        cell: ({ row }: CellContext<TData, unknown>) => (
          <div className="w-full ml-3 flex items-center">
            <Checkbox
              className="ml-4"
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

  const table = useReactTable({
    data,
    columns: modifiedColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
  });

  return (
    <div>
      <div className="flex items-center my-1">
        <Select onValueChange={setForgetClass} value={forgetClass}>
          <SelectTrigger className="w-[128px] h-6 bg-white text-black font-normal pr-1">
            <SelectValue placeholder="Forget Class" />
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
            {forgetClasses.map((el, idx) => (
              <SelectItem key={idx} value={el}>
                {el}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <ScrollArea className="w-[1096px] h-[220px]">
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
                    onMouseEnter={() => setHoveredRowIndex(rowIdx)}
                    onMouseLeave={() => setHoveredRowIndex(null)}
                  >
                    {row.getVisibleCells().map((cell, idx) => {
                      const columnId = cell.column.id;

                      const isPerformanceMetric =
                        performanceMetrics[columnId] !== undefined;

                      let cellStyle = {},
                        color = "",
                        rgbaColor = "";
                      if (isPerformanceMetric) {
                        const value = cell.getValue() as number;
                        const { colorScale } = performanceMetrics[columnId];
                        if (colorScale) color = colorScale(value);
                        rgbaColor = hexToRgba(color);

                        cellStyle = {
                          borderLeft:
                            columnId === "ua"
                              ? "1px solid rgb(229 231 235)"
                              : "none",
                          borderRight:
                            idx === row.getVisibleCells().length - 1
                              ? "none"
                              : "1px solid rgb(229 231 235)",
                          backgroundColor:
                            hoveredRowIndex === rowIdx ? rgbaColor : color,
                        };
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
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </ScrollArea>
        </Table>
      </div>
    </div>
  );
}
