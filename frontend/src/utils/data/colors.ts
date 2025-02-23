import { COLORS } from "../../constants/colors";

export function getTypeColors(type: string) {
  let backgroundColor;
  if (type === "Original") {
    backgroundColor = "#f2f2f2";
  } else if (type === "Retrained") {
    backgroundColor = COLORS.DARK_GRAY;
  } else if (type === "Unlearned") {
    backgroundColor = "#FF8C00";
  }
  const color = type === "Original" ? "#222222" : "#FFFFFF";
  return { color, backgroundColor };
}
