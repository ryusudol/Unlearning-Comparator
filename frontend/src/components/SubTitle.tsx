type PropsType = {
  subtitle: string;
  fontSize?: number;
};

export default function SubTitle({ subtitle, fontSize }: PropsType) {
  return (
    <p
      className="font-[500] mb-[3px] text-center"
      style={{ fontSize: fontSize }}
    >
      {subtitle}
    </p>
  );
}
