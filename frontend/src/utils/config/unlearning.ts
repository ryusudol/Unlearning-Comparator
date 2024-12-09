export function getDefaultUnlearningConfig(method: string) {
  let epochs, learning_rate, batch_size;

  if (method === "ft") {
    epochs = 10;
    learning_rate = 6;
    batch_size = 6;
  } else if (method === "rl") {
    epochs = 3;
    learning_rate = 2;
    batch_size = 5;
  } else {
    epochs = 5;
    learning_rate = 4;
    batch_size = 8;
  }

  return { epochs, learning_rate, batch_size };
}
