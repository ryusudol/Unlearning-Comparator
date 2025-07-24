import { Skeleton } from "../../UI/skeleton";

export default function SubsetImageSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-[1px]">
      {Array.from({ length: 8 }).map((_) =>
        Array.from({ length: 12 }).map((_) => <Skeleton className="size-5" />)
      )}
    </div>
  );
}
