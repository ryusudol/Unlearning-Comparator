import React, { useContext } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../UI/pagination";
import { PREV, NEXT } from "../../views/Progress";
import { RunningStatusContext } from "../../store/running-status-context";

interface Props extends React.LiHTMLAttributes<HTMLLIElement> {
  currentPage: number;
}

export default function ProgressPagination({ currentPage, ...props }: Props) {
  const { totalExperimentsCount } = useContext(RunningStatusContext);

  return (
    <Pagination className="w-fit mx-0">
      <PaginationContent className="h-7">
        <PaginationItem id={PREV} className="h-7" {...props}>
          <PaginationPrevious href="#" className="px-0.5 py-0 h-7" />
        </PaginationItem>
        <span className="text-sm">
          {currentPage} / {totalExperimentsCount}
        </span>
        <PaginationItem id={NEXT} className="h-7" {...props}>
          <PaginationNext href="#" className="px-0.5 py-0 h-7" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
