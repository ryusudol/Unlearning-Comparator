export function getDefaultUnlearningConfig(method: string) {
  let epoch, learning_rate, batch_size;

  if (method === "ft") {
    epoch = "1";
    learning_rate = "0.001";
    batch_size = "64";
  } else if (method === "rl") {
    epoch = "3";
    learning_rate = "0.001";
    batch_size = "64";
  } else {
    epoch = "7";
    learning_rate = "0.0001";
    batch_size = "256";
  }

  return { epoch, learning_rate, batch_size };
}
