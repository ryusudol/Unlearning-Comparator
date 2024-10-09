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
import { Overview } from "../types/overview";
import { hexToRgba } from "../util";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { forgetClassNames } from "../constants/forgetClassNames";
import { MultiplicationSignIcon } from "./ui/icons";
import { BaselineComparisonContext } from "../store/baseline-comparison-context";
import { ForgetClassContext } from "../store/forget-class-context";
import { basicData } from "../constants/basicData";

interface Props {
  columns: ColumnDef<Overview>[];
  data: Overview[];
  performanceMetrics: {
    [key: string]: {
      colorScale: false | d3.ScaleQuantile<string, never>;
    };
  };
}

export default function DataTable({
  columns,
  data,
  performanceMetrics,
}: Props) {
  const { forgetClass, saveForgetClass } = useContext(ForgetClassContext);
  const { baseline, comparison, saveBaseline, saveComparison } = useContext(
    BaselineComparisonContext
  );

  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  // TODO: 기본으로 제공하는 파일에서 unlearning 한 클래스 뽑지 않고
  //       시용지가 unlearning 수행할 때 하나씩 추가하도록 로직 변경
  const unlearnedFCIndices = new Set(
    basicData.map((item) => item.forget_class)
  );
  const unlearnedFCList = forgetClassNames.filter((_, idx) =>
    unlearnedFCIndices.has(idx)
  );

  const modifiedColumns = columns.map((column) => {
    if (column.id === "baseline") {
      return {
        ...column,
        cell: ({ row }: CellContext<Overview, unknown>) => (
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
        cell: ({ row }: CellContext<Overview, unknown>) => (
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

  const tableData = useMemo(
    () =>
      data.filter((datum) => forgetClassNames[datum.forget] === forgetClass),
    [data, forgetClass]
  );

  const table = useReactTable({
    getRowId: (row: Overview) => row.id,
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
      saveComparison(tableData[1].id);
    } else {
      saveBaseline("");
      saveComparison("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  return (
    <div>
      <div className="flex items-center my-1">
        <Select
          onValueChange={(forgetClass) => saveForgetClass(forgetClass)}
          value={forgetClass}
        >
          <SelectTrigger className="w-[128px] h-6 bg-white text-black font-normal pr-1">
            <div className="flex items-center">
              <MultiplicationSignIcon className="mr-1" />
              <SelectValue placeholder="Forget Class" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white text-black">
            {/* TODO: 나중에 basicData가 아닌 이때까지 돌린 class로 변경 */}
            {unlearnedFCList.map((el, idx) => (
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
    </div>
  );
}
