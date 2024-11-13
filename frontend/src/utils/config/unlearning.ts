export function getDefaultUnlearningConfig(method: string) {
  let epochs, learning_rate;

  if (method === "ft") {
    epochs = 10;
    learning_rate = -2;
  } else if (method === "rl") {
    epochs = 3;
    learning_rate = -2;
  } else if (method === "ga") {
    epochs = 3;
    learning_rate = -4;
  } else {
    epochs = 30;
    learning_rate = -2;
  }

  return { epochs, learning_rate };
}
