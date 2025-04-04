// 만약 파일명 바뀌면 여기서 변경
const fileNames0 = ["0000", "a000", "20bd", "45ca", "2665"];
const fileNames1 = ["0001", "a001", "5821", "5c0b", "ab59"];
const fileNames2 = ["0002", "a002", "8b23", "801e", "e778"];
const fileNames3 = ["0003", "a003", "2e80", "59e4", "a128"];
const fileNames4 = ["0004", "a004", "4216", "ed7d", "fa3c"];
const fileNames5 = ["0005", "a005", "5788", "8767", "db4d"];
const fileNames6 = ["0006", "a006", "6f58", "a87f", "f83f"];
const fileNames7 = ["0007", "a007", "3d5a", "6b5d", "82b0"];
const fileNames8 = ["0008", "a008", "2c83", "2c64", "f133"];
const fileNames9 = ["0009", "a009", "228e", "271c", "4718"];

const fileNames = [
  fileNames0,
  fileNames1,
  fileNames2,
  fileNames3,
  fileNames4,
  fileNames5,
  fileNames6,
  fileNames7,
  fileNames8,
  fileNames9,
];

export async function loadExperimentData(forgetClass: number) {
  try {
    const dataArray = await Promise.all(
      fileNames[forgetClass].map(
        (fileName) => import(`./data/${forgetClass}/${fileName}.json`)
      )
    );

    return dataArray.reduce(
      (acc, data) => ({
        ...acc,
        [data.ID]: data,
      }),
      {}
    );
  } catch (error) {
    console.error(`Error loading data for forget class ${forgetClass}:`, error);
    throw error;
  }
}
