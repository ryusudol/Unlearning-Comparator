import React, { useMemo, useContext } from "react";
import { Table as TableType, flexRender } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

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
import { useModelSelection } from "../../hooks/useModelSelection";
import { Table, TableBody, TableCell, TableRow } from "../UI/table";
import { ExperimentsContext } from "../../stores/experiments-context";
import { fetchAllExperimentsData } from "../../utils/api/unlearning";
import { calculatePerformanceMetrics } from "../../utils/data/experiments";
import { BaselineComparisonContext } from "../../stores/baseline-comparison-context";
import { RunningStatusContext } from "../../stores/running-status-context";

const CONFIG = {
  // GREEN: "#157f3b",
  BLUE: "#265599",
  TEMPORARY_ROW_BG_COLOR: "#f0f6fa",
  COLOR_MAPPING_THRESHOLD: 0.75,
  TEXT_OPACITY_THRESHOLD: 0.5,
};

interface Props {
  table: TableType<ExperimentData>;
  tableData: Experiment[];
}

export default function _TableBody({ table, tableData }: Props) {
  const { isRunning } = useContext(RunningStatusContext);
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

      const columnValues = tableData
        .map((datum) => datum[columnId as keyof Experiment] as number)
        .filter(
          (datum) =>
            datum !== undefined && datum !== null && typeof datum === "number"
        );

      const valueOpacityMap: { [value: number]: number } = {};

      columnValues.forEach((value) => {
        let opacity = 0;
        if (columnId === "UA" || columnId === "TUA") {
          opacity = 1 - value / 0.3;
        } else if (value >= CONFIG.COLOR_MAPPING_THRESHOLD) {
          opacity =
            (value - CONFIG.COLOR_MAPPING_THRESHOLD) /
            (1 - CONFIG.COLOR_MAPPING_THRESHOLD);
        }

        if (opacity > 1) opacity = 1;
        if (opacity < 0) opacity = 0;

        valueOpacityMap[value] = opacity;
      });

      mapping[columnId] = valueOpacityMap;
    });

    return mapping;
  }, [performanceMetrics, tableData]);

  const getCellStyle = (
    cell: any,
    isTemporaryRow: boolean
  ): React.CSSProperties => {
    const columnId = cell.column.id;
    const columnWidth = COLUMN_WIDTHS[columnId as keyof typeof COLUMN_WIDTHS];
    let style: React.CSSProperties = { width: `${columnWidth}px` };

    if (columnId in performanceMetrics) {
      const value = cell.getValue() as "N/A" | number;
      const borderStyle = "1px solid rgb(229 231 235)";
      let backgroundColor: string, textColor: string | undefined;

      if (value === "N/A") {
        backgroundColor = "white";
      } else {
        const opacity = opacityMapping[columnId]?.[value] ?? 0;
        backgroundColor =
          opacity < 0.1 ? "#f8f8f8" : hexToRgba(CONFIG.BLUE, opacity);
        textColor =
          opacity >= CONFIG.TEXT_OPACITY_THRESHOLD
            ? COLORS.WHITE
            : COLORS.BLACK;
      }

      style = {
        ...style,
        borderLeft: columnId === "UA" ? borderStyle : "none",
        borderRight: borderStyle,
        backgroundColor,
        color: textColor,
      };
    }

    if (columnId === "A") {
      style.paddingRight = 0;
      style.paddingLeft = 14;
    } else if (columnId === "B") {
      style.paddingLeft = 6;
    }

    if (isTemporaryRow) {
      style.backgroundColor = CONFIG.TEMPORARY_ROW_BG_COLOR;
    }

    return style;
  };

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
        Object.values(allExperiments).forEach((experiment) => {
          if (experiment && "points" in experiment) {
            delete experiment.points;
          }
        });

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
            ).find((experiment) => experiment.ID !== comparison);
            saveBaseline(nextBaselineExperiment!.ID);
          }
        } else if (id === comparison) {
          if (!baseline.startsWith("000")) {
            saveComparison(`000${forgetClass}`);
          } else if (!baseline.startsWith("a00")) {
            saveComparison(`a00${forgetClass}`);
          } else {
            const nextComparisonExperiment = Object.values(
              sortedExperiments
            ).find((experiment) => experiment.ID !== baseline);
            saveComparison(nextComparisonExperiment!.ID);
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
          table.getRowModel().rows.map((row, rowIdx) => {
            const isTemporaryRow = row.id === "-";
            let isRunningRow = false;
            if (isTemporaryRow) {
              const temporaryExperimentEntries = Object.entries(
                experiments
              ).filter(([key]) => key.length < 4);
              const tempIndex = temporaryExperimentEntries.findIndex(
                ([, experiment]) => experiment === row.original
              );
              isRunningRow = tempIndex === 0;
            }

            return (
              <ContextMenu key={rowIdx}>
                <ContextMenuTrigger className="contents">
                  <TableRow
                    id={row.id}
                    className="!border-b"
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnId = cell.column.id;
                      const cellStyle = getCellStyle(cell, isTemporaryRow);

                      const cellContent =
                        isRunningRow && columnId === "ID" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        );

                      return (
                        <TableCell key={cell.id} style={cellStyle}>
                          {cellContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </ContextMenuTrigger>
                {!isTemporaryRow && (
                  <ContextMenuContent className="z-[50]">
                    {!row.id.startsWith("000") &&
                      !row.id.startsWith("a00") &&
                      !isRunning && (
                        <ContextMenuItem
                          onClick={() => handleDeleteRow(row.id)}
                        >
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
                )}
              </ContextMenu>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-[178px] text-center text-gray-500 text-[15px]"
            >
              No data found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
