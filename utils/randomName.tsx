import { animals, type Config, colors } from "unique-names-generator";

export const customConfig: Config = {
  dictionaries: [colors, animals],
  separator: "-",
  length: 2,
  style: "capital",
};
