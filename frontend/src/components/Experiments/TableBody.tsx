import React, { useMemo, useContext } from "react";
import { Table as TableType, flexRender } from "@tanstack/react-table";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "../UI/context-menu";
import {
  deleteRow,
  downloadJSON,
  downloadPTH,
} from "../../utils/api/dataTable";
import { columns } from "./Columns";
import { COLUMN_WIDTHS } from "./Columns";
import { COLORS } from "../../constants/colors";
import { ExperimentData } from "../../types/data";
import { hexToRgba } from "../../utils/data/colors";
import { useForgetClass } from "../../hooks/useForgetClass";
import { PerformanceMetrics } from "../../types/experiments";
import { Experiment, Experiments } from "../../types/experiments-context";
import { BASELINE, COMPARISON } from "../../constants/common";
import { useModelSelection } from "../../hooks/useModelSelection";
import { Table, TableBody, TableCell, TableRow } from "../UI/table";
import { ExperimentsContext } from "../../store/experiments-context";
import { fetchAllExperimentsData } from "../../utils/api/unlearning";
import { calculatePerformanceMetrics } from "../../utils/data/experiments";
import { BaselineComparisonContext } from "../../store/baseline-comparison-context";

interface Props {
  table: TableType<ExperimentData>;
  tableData: Experiment[];
}

export default function _TableBody({ table, tableData }: Props) {
  const { experiments, saveExperiments, setIsExperimentsLoading } =
    useContext(ExperimentsContext);
  const { saveBaseline, saveComparison } = useContext(
    BaselineComparisonContext
  );

  const { baseline, comparison } = useModelSelection();
  const { forgetClass, forgetClassNumber } = useForgetClass();

  const performanceMetrics = calculatePerformanceMetrics(
    experiments
  ) as PerformanceMetrics;

  const opacityMapping = useMemo(() => {
    const mapping: { [key: string]: { [value: number]: number } } = {};

    Object.keys(performanceMetrics).forEach((columnId) => {
      if (!performanceMetrics[columnId]) return;

      const values = tableData
        .map((datum) => datum[columnId as keyof Experiment] as number)
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

  const handleDeleteRow = async (id: string) => {
    try {
      await deleteRow(forgetClassNumber, id);
      setIsExperimentsLoading(true);
      const allExperiments: Experiments = await fetchAllExperimentsData(
        forgetClassNumber
      );
      if ("detail" in allExperiments) {
        saveExperiments({});
      } else {
        const sortedExperiments = Object.fromEntries(
          Object.entries(allExperiments).sort(([id1], [id2]) =>
            id1.localeCompare(id2)
          )
        );
        saveExperiments(sortedExperiments);
        if (id === baseline) {
          if (!comparison.startsWith("000")) {
            saveBaseline(`000${forgetClass}`);
          } else if (!comparison.startsWith("a00")) {
            saveBaseline(`a00${forgetClass}`);
          } else {
            const nextBaselineExperiment = Object.values(
              sortedExperiments
            ).find((experiment) => experiment.id !== comparison);
            saveBaseline(nextBaselineExperiment!.id);
          }
        } else if (id === comparison) {
          if (!baseline.startsWith("000")) {
            saveComparison(`000${forgetClass}`);
          } else if (!baseline.startsWith("a00")) {
            saveComparison(`a00${forgetClass}`);
          } else {
            const nextComparisonExperiment = Object.values(
              sortedExperiments
            ).find((experiment) => experiment.id !== baseline);
            saveComparison(nextComparisonExperiment!.id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete the row:", error);
    } finally {
      setIsExperimentsLoading(false);
    }
  };

  const handleDownloadJSON = async (id: string) => {
    try {
      const json = await downloadJSON(forgetClassNumber, id);
      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download the JSON file:", error);
    }
  };

  const handleDownloadPTH = async (id: string) => {
    try {
      await downloadPTH(forgetClassNumber, id);
    } catch (error) {
      console.error("Failed to download the PTH file:", error);
    }
  };

  return (
    <Table className="w-full table-fixed">
      <TableBody
        className={`text-sm ${
          table.getRowModel().rows?.length <= 5 && "[&_tr:last-child]:border-b"
        }`}
      >
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <ContextMenu key={row.id}>
              <ContextMenuTrigger className="contents">
                <TableRow
                  id={row.id}
                  className="!border-b"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const columnId = cell.column.id;
                    const columnWidth =
                      COLUMN_WIDTHS[columnId as keyof typeof COLUMN_WIDTHS];
                    const isPerformanceMetric = columnId in performanceMetrics;
                    let cellStyle: React.CSSProperties = {
                      width: `${columnWidth}px`,
                      minWidth: `${columnWidth}px`,
                      ...(columnId === BASELINE && { paddingRight: 0 }),
                      ...(columnId === COMPARISON && { paddingLeft: 0 }),
                    };

                    if (isPerformanceMetric) {
                      const { baseColor } = performanceMetrics[columnId];
                      const value = cell.getValue() as number;
                      const opacity = opacityMapping[columnId]?.[value] ?? 0;
                      if (baseColor) {
                        let color, textColor;
                        if (tableData.length === 1 && value === 0) {
                          color = COLORS.WHITE;
                          textColor = COLORS.BLACK;
                        } else {
                          color = hexToRgba(baseColor, opacity);
                          textColor =
                            opacity >= 0.8 ? COLORS.WHITE : COLORS.BLACK;
                        }
                        cellStyle = {
                          ...cellStyle,
                          borderLeft:
                            columnId === "UA"
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
              </ContextMenuTrigger>
              <ContextMenuContent className="z-[50]">
                {!row.id.startsWith("000") && !row.id.startsWith("a00") && (
                  <ContextMenuItem onClick={() => handleDeleteRow(row.id)}>
                    Delete
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={() => handleDownloadJSON(row.id)}>
                  Download JSON
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleDownloadPTH(row.id)}>
                  Download PTH
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-[178px] text-center text-gray-500 text-[15px]"
            >
              Failed to load the data.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
