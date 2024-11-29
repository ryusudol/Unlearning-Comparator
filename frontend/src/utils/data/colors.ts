export function hexToRgba(hex: string, opacity: number) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getPhaseColors(
  phase: string,
  colorOpacity: number,
  backgroundColorOpacity: number
) {
  let color, backgroundColor;
  if (phase === "Unlearned") {
    color = `rgba(255, 140, 0, ${colorOpacity})`;
    backgroundColor = `rgba(255, 140, 0, ${backgroundColorOpacity})`;
  } else if (phase === "Defended") {
    color = `rgba(34, 139, 34, ${colorOpacity})`;
    backgroundColor = `rgba(34, 139, 34, ${backgroundColorOpacity})`;
  } else if (phase === "Pretrained") {
    color = `#dd151a`;
    backgroundColor = `rgba(255, 0, 0, 0.25)`;
  } else {
    color = `rgba(80,80,80, ${colorOpacity})`;
    backgroundColor = `rgba(80,80,80, ${backgroundColorOpacity})`;
  }
  return { color, backgroundColor };
}
