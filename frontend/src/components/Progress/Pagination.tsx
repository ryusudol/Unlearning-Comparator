import React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../UI/pagination";
import { PREV, NEXT } from "../../views/Progress";
import { useRunningStatusStore } from "../../stores/runningStatusStore";

interface Props extends React.LiHTMLAttributes<HTMLLIElement> {
  currentPage: number;
}

export default function ProgressPagination({ currentPage, ...props }: Props) {
  const { totalExperimentsCount } = useRunningStatusStore();

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
