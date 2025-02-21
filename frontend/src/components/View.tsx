interface Props {
  width?: number;
  height: number | string;
  className?: string;
  children: React.ReactNode;
}

export default function View({ width, height, className, children }: Props) {
  return (
    <section
      style={{ width, height }}
      className={"px-3 py-2.5 border relative " + className}
    >
      {children}
    </section>
  );
}
