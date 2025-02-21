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
import { ExperimentData } from "../../types/data";
import { ScrollArea } from "../UI/scroll-area";
import { ExperimentsContext } from "../../stores/experiments-context";
import { RadioGroup, RadioGroupItem } from "../UI/radio-group";
import { cn } from "../../utils/util";
import { columns } from "./Columns";
import { COLORS } from "../../constants/colors";
import { Experiment } from "../../types/experiments-context";
import { useModelDataStore } from "../../stores/modelDataStore";

interface Props {
  isExpanded: boolean;
}

export default function DataTable({ isExpanded }: Props) {
  const { modelA, modelB, saveModelA, saveModelB } = useModelDataStore();

  const { experiments } = useContext(ExperimentsContext);

  const [sorting, setSorting] = useState<SortingState>([]);

  const tableData = useMemo(() => {
    const experimentsArray = Object.values(experiments);

    if (experimentsArray.length === 0) return [];

    const temporaryExps: Experiment[] = [];
    const nonTemporaryExps: Experiment[] = [];
    experimentsArray.forEach((exp) => {
      if (exp.ID !== "-") {
        nonTemporaryExps.push(exp);
      } else {
        temporaryExps.push(exp);
      }
    });
    nonTemporaryExps.sort(
      (a, b) =>
        new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
    );

    return [...nonTemporaryExps, ...temporaryExps];
  }, [experiments]);

  const modifiedColumns = columns.map((column) => {
    if (column.id !== "A" && column.id !== "B") {
      return column;
    }

    const isModelAColumn = column.id === "A";
    const currentSelection = isModelAColumn ? modelA : modelB;
    const saveModel = isModelAColumn ? saveModelA : saveModelB;
    const disabledValue = isModelAColumn ? modelB : modelA;

    return {
      ...column,
      cell: ({ row }: CellContext<ExperimentData, unknown>) => {
        const isSelected = currentSelection === row.id;
        return (
          <RadioGroup className="flex justify-center items-center">
            <RadioGroupItem
              value={row.id}
              className={cn(
                "w-[18px] h-[18px] rounded-full",
                isSelected && "[&_svg]:h-3 [&_svg]:w-3"
              )}
              checked={isSelected}
              onClick={() => saveModel(row.id)}
              disabled={disabledValue === row.id}
              color={isModelAColumn ? COLORS.EMERALD : COLORS.PURPLE}
            />
          </RadioGroup>
        );
      },
    };
  });

  const table = useReactTable({
    getRowId: (row: ExperimentData) => row.ID,
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
      (experiment) => experiment.ID === modelA
    );
    if (!baselineExists) {
      if (tableData.length > 0) {
        saveModelA(tableData[0].ID);
        saveModelB(tableData[1].ID);
      } else {
        saveModelA("");
        saveModelB("");
      }
    }
  }, [experiments, modelA, saveModelA, saveModelB, tableData]);

  return (
    <div className="w-full overflow-visible">
      <TableHeader table={table} />
      {isExpanded ? (
        <div className="w-[1008px] absolute top-[78px] z-[49] bg-white shadow-xl rounded-b-md">
          <TableBody table={table} tableData={tableData} />
        </div>
      ) : (
        <ScrollArea className="w-full h-[155px]">
          <TableBody table={table} tableData={tableData} />
        </ScrollArea>
      )}
    </div>
  );
}
