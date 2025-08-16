export function getDefaultUnlearningConfig(method: string) {
  let epoch, learning_rate, batch_size;

  if (method === "ft") {
    epoch = "10";
    learning_rate = "0.01";
    batch_size = "128";
  } else if (method === "ga") {
    epoch = "7";
    learning_rate = "0.0001";
    batch_size = "256";
  } else if (method === "rl") {
    epoch = "3";
    learning_rate = "0.001";
    batch_size = "64";
  } else if (method === "ga_ft") {
    epoch = "4";
    learning_rate = "0.01";
    batch_size = "128";
  } else if (method === "ga_sl_ft") {
    epoch = "5";
    learning_rate = "0.01";
    batch_size = "128";
  } else if (method === "scrub") {
    epoch = "5";
    learning_rate = "0.01";
    batch_size = "128";
  } else if (method === "ga_sl_ft_v2") {
    epoch = "4";
    learning_rate = "0.01";
    batch_size = "128";
  } else if (method === "salun") {
    epoch = "5";
    learning_rate = "0.001";
    batch_size = "128";
  } else {
    epoch = "3";
    learning_rate = "0.01";
    batch_size = "128";
  }

  return { epoch, learning_rate, batch_size };
}
