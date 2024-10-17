export default function Header() {
  return (
    <div className="w-full text-white bg-black h-[66px] flex justify-start items-center px-4">
      <span className="ml-2 text-[40px] font-semibold">Title</span>
      <div className="ml-5 h-9 flex items-end">
        <span className="mr-3 text-[11px]">
          <strong>Model</strong>: Resnet18
        </span>
        <span className="text-[11px]">
          <strong>Dataset</strong>: CIFAR-10
        </span>
      </div>
    </div>
  );
}
