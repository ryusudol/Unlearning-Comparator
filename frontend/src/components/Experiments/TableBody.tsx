import React, { useMemo } from "react";
import { Table as TableType, flexRender } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import * as d3 from "d3";

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
import { useForgetClassStore } from "../../stores/forgetClassStore";
import { PerformanceMetrics } from "../../types/experiments";
import { Experiment, Experiments } from "../../types/data";
import { Table, TableBody, TableCell, TableRow } from "../UI/table";
import { useExperimentsStore } from "../../stores/experimentsStore";
import { fetchAllExperimentsData } from "../../utils/api/unlearning";
import { calculatePerformanceMetrics } from "../../utils/data/experiments";
import { useRunningStatusStore } from "../../stores/runningStatusStore";
import { useModelDataStore } from "../../stores/modelDataStore";

const CONFIG = {
  TEMPORARY_ROW_BG_COLOR: "#F0F6FA",
  COLOR_MAPPING_THRESHOLD: 0.8,
  COLOR_MAPPING_RTE_THRESHOLD: 200,
};

interface Props {
  table: TableType<ExperimentData>;
  tableData: Experiment[];
}

export default function _TableBody({ table, tableData }: Props) {
  const { modelA, modelB, saveModelA, saveModelB } = useModelDataStore();
  const { forgetClass } = useForgetClassStore();
  const { isRunning } = useRunningStatusStore();
  const { experiments, saveExperiments, setIsExperimentsLoading } =
    useExperimentsStore();

  const performanceMetrics = calculatePerformanceMetrics(
    experiments
  ) as PerformanceMetrics;

  const greenScaleLower = useMemo(
    () =>
      d3
        .scaleSequential(d3.interpolateGreens)
        .domain([1 - CONFIG.COLOR_MAPPING_THRESHOLD, 0])
        .clamp(true),
    []
  );
  const greenScaleHigher = useMemo(
    () =>
      d3
        .scaleSequential(d3.interpolateGreens)
        .domain([CONFIG.COLOR_MAPPING_THRESHOLD, 1])
        .clamp(true),
    []
  );
  const blueScale = useMemo(
    () =>
      d3
        .scaleSequential(d3.interpolateBlues)
        .domain([CONFIG.COLOR_MAPPING_RTE_THRESHOLD, 0])
        .clamp(true),
    []
  );

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
        if (columnId === "RTE" || columnId === "FQS") {
          if (value <= CONFIG.COLOR_MAPPING_RTE_THRESHOLD) {
            backgroundColor = blueScale(value);
            textColor =
              value <= CONFIG.COLOR_MAPPING_RTE_THRESHOLD / 2
                ? COLORS.WHITE
                : COLORS.BLACK;
          } else {
            backgroundColor = "#f8f8f8";
            textColor = COLORS.BLACK;
          }
        } else {
          if (columnId === "UA" || columnId === "TUA") {
            if (value <= 1 - CONFIG.COLOR_MAPPING_THRESHOLD) {
              backgroundColor = greenScaleLower(value);
              textColor = value <= 0.1 ? COLORS.WHITE : COLORS.BLACK;
            } else {
              backgroundColor = "#f8f8f8";
              textColor = COLORS.BLACK;
            }
          } else {
            if (value >= CONFIG.COLOR_MAPPING_THRESHOLD) {
              backgroundColor = greenScaleHigher(value);
              textColor = value >= 0.9 ? COLORS.WHITE : COLORS.BLACK;
            } else {
              backgroundColor = "#f8f8f8";
              textColor = COLORS.BLACK;
            }
          }
        }
      }

      style = {
        ...style,
        borderLeft: columnId === "UA" ? borderStyle : "none",
        borderRight: borderStyle,
        backgroundColor,
        color: textColor,
      };
    }

    if (isTemporaryRow) {
      style.backgroundColor = CONFIG.TEMPORARY_ROW_BG_COLOR;
    }

    return style;
  };

  const handleDeleteRow = async (id: string) => {
    try {
      await deleteRow(forgetClass, id);
      setIsExperimentsLoading(true);
      const allExperiments: Experiments = await fetchAllExperimentsData(
        forgetClass
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

        if (id === modelA) {
          if (!modelB.startsWith("000")) {
            saveModelA(`000${forgetClass}`);
          } else if (!modelB.startsWith("a00")) {
            saveModelA(`a00${forgetClass}`);
          } else {
            const nextBaselineExperiment = Object.values(
              sortedExperiments
            ).find((experiment) => experiment.ID !== modelB);
            saveModelA(nextBaselineExperiment!.ID);
          }
        } else if (id === modelB) {
          if (!modelA.startsWith("000")) {
            saveModelB(`000${forgetClass}`);
          } else if (!modelA.startsWith("a00")) {
            saveModelB(`a00${forgetClass}`);
          } else {
            const nextComparisonExperiment = Object.values(
              sortedExperiments
            ).find((experiment) => experiment.ID !== modelA);
            saveModelB(nextComparisonExperiment!.ID);
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
      const json = await downloadJSON(forgetClass, id);
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
      await downloadPTH(forgetClass, id);
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
