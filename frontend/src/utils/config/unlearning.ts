export function getDefaultUnlearningConfig(method: string) {
  let epochs, learning_rate, batch_size;

  if (method === "ft") {
    epochs = "10";
    learning_rate = "0.01";
    batch_size = "64";
  } else if (method === "rl") {
    epochs = "3";
    learning_rate = "0.0001";
    batch_size = "32";
  } else {
    epochs = "5";
    learning_rate = "0.001";
    batch_size = "256";
  }

  return { epochs, learning_rate, batch_size };
}
