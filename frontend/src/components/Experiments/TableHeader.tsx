import { Table as TableType, flexRender } from "@tanstack/react-table";

import { Table, TableHead, TableHeader, TableRow } from "../UI/table";
import { COLUMN_WIDTHS } from "./Columns";
import { ExperimentData } from "../../types/data";
import { BASELINE, COMPARISON } from "../../constants/common";

interface Props {
  table: TableType<ExperimentData>;
}

export default function _TableHeader({ table }: Props) {
  return (
    <Table className="w-full table-fixed border-t">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const columnWidth =
                COLUMN_WIDTHS[header.column.id as keyof typeof COLUMN_WIDTHS];
              return (
                <TableHead
                  key={header.id}
                  style={{
                    width: `${columnWidth}px`,
                    minWidth: `${columnWidth}px`,
                    ...(header.column.id === BASELINE && { paddingRight: 0 }),
                    ...(header.column.id === COMPARISON && {
                      paddingLeft: 0,
                    }),
                  }}
                >
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
    </Table>
  );
}
