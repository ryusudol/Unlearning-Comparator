export function hexToRgba(hex: string, opacity: number) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getPhaseColors(type: string) {
  let backgroundColor;
  if (type === "Original") {
    backgroundColor = "#FDFDFD";
  } else if (type === "Retrained") {
    backgroundColor = "#505050";
  } else if (type === "Unlearned") {
    backgroundColor = "#FF8C00";
  }
  const color = type === "Original" ? "#222222" : "#FFFFFF";
  return { color, backgroundColor };
}
