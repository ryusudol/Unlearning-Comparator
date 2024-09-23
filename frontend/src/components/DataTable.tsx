import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  performanceMetrics: {
    [key: string]: {
      colorScale: d3.ScaleQuantile<string, never>;
    };
  };
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  performanceMetrics,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
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
        <Input
          placeholder="Filter forget class..."
          value={(table.getColumn("forget")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("forgetClass")?.setFilterValue(event.target.value)
          }
          className="w-[140px] h-6"
        />
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnId = cell.column.id;

                      const isPerformanceMetric =
                        performanceMetrics[columnId] !== undefined;

                      let cellStyle = {};
                      if (isPerformanceMetric) {
                        const value = cell.getValue() as number;
                        const { colorScale } = performanceMetrics[columnId];
                        const color = colorScale(value);

                        cellStyle = {
                          backgroundColor: color,
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
