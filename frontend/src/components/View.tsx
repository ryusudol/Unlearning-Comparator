interface Props {
  width?: number;
  height: number | string;
  className?: string;
  borderTop?: boolean;
  borderRight?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  children: React.ReactNode;
}

export default function View({
  width,
  height,
  className,
  borderTop = false,
  borderRight = false,
  borderBottom = false,
  borderLeft = false,
  children,
}: Props) {
  return (
    <section
      style={{
        width,
        height,
        borderTop: borderTop ? "3px solid #E5E7EB" : "0px",
        borderRight: borderRight ? "3px solid #E5E7EB" : "0px",
        borderBottom: borderBottom ? "3px solid #E5E7EB" : "0px",
        borderLeft: borderLeft ? "3px solid #E5E7EB" : "0px",
      }}
      className={"px-3 py-2.5 relative " + className}
    >
      {children}
    </section>
  );
}
