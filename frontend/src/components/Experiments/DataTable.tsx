import { useState, useEffect, useContext, useMemo } from "react";
import {
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  CellContext,
} from "@tanstack/react-table";

import TableHeader from "./TableHeader";
import TableBody from "./TableBody";
import { useForgetClass } from "../../hooks/useForgetClass";
import { useModelSelection } from "../../hooks/useModelSelection";
import { ExperimentData } from "../../types/data";
import { ScrollArea } from "../UI/scroll-area";
import { ExperimentsContext } from "../../store/experiments-context";
import { BaselineComparisonContext } from "../../store/baseline-comparison-context";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { cn } from "../../utils/util";
import { BASELINE, COMPARISON } from "../../constants/common";
import { columns } from "./Columns";

const TABLE_HEADER_HEIGHT = 35;

interface Props {
  isExpanded: boolean;
}

export default function DataTable({ isExpanded }: Props) {
  const { experiments } = useContext(ExperimentsContext);
  const { saveBaseline, saveComparison } = useContext(
    BaselineComparisonContext
  );

  const { forgetClass } = useForgetClass();
  const { baseline, comparison } = useModelSelection();

  const [sorting, setSorting] = useState<SortingState>([]);

  const tableData = useMemo(() => {
    const experimentsArray = Object.values(experiments);
    const pretrainedExp = experimentsArray.find(
      (exp) => exp.id === `000${forgetClass}`
    );
    const retrainedExp = experimentsArray.find(
      (exp) => exp.id === `a00${forgetClass}`
    );

    if (!pretrainedExp || !retrainedExp) return [];

    const remainingExps = experimentsArray.filter(
      (exp) => exp.id !== pretrainedExp.id && exp.id !== retrainedExp.id
    );

    return [pretrainedExp, retrainedExp, ...remainingExps];
  }, [experiments, forgetClass]);

  const modifiedColumns = columns.map((column) => {
    if (column.id !== BASELINE && column.id !== COMPARISON) {
      return column;
    }

    const isBaselineColumn = column.id === BASELINE;
    const currentSelection = isBaselineColumn ? baseline : comparison;
    const saveFunction = isBaselineColumn ? saveBaseline : saveComparison;
    const disabledValue = isBaselineColumn ? comparison : baseline;

    return {
      ...column,
      cell: ({ row }: CellContext<ExperimentData, unknown>) => {
        const isSelected = currentSelection === row.id;
        return (
          <RadioGroup className="flex justify-center items-center ml-[0px]">
            <RadioGroupItem
              value={row.id}
              className={cn(
                "w-[18px] h-[18px] rounded-full",
                isSelected && "[&_svg]:h-3 [&_svg]:w-3"
              )}
              checked={isSelected}
              onClick={() => saveFunction(isSelected ? "" : row.id)}
              disabled={disabledValue === row.id}
            />
          </RadioGroup>
        );
      },
    };
  });

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
    const baselineExists = Object.values(experiments).some(
      (experiment) => experiment.id === baseline
    );
    if (!baselineExists) {
      if (tableData.length > 0) {
        saveBaseline(tableData[0].id);
        saveComparison(tableData[1].id);
      } else {
        saveBaseline("");
        saveComparison("");
      }
    }
  }, [
    baseline,
    comparison,
    experiments,
    saveBaseline,
    saveComparison,
    tableData,
  ]);

  return (
    <div className="relative right-1 w-[calc(100%+8px)] overflow-visible">
      <TableHeader table={table} />
      {isExpanded ? (
        <div
          className="absolute z-[49] bg-white shadow-xl rounded-b-md"
          style={{ top: TABLE_HEADER_HEIGHT + 1 }}
        >
          <TableBody table={table} tableData={tableData} />
        </div>
      ) : (
        <ScrollArea className="w-full h-[161px]">
          <TableBody table={table} tableData={tableData} />
        </ScrollArea>
      )}
    </div>
  );
}
