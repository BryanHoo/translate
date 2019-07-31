import * as _ from "lodash";
import { CodeToExcel } from "./src/translate/code-to-excel";
import { exportConfig, excelConfig } from "./src/config";
import { ExcelToCode } from "./src/translate/excel-to-code";

async function start() {
  try {
    // excel 数据写成文件
    const etc = new ExcelToCode(excelConfig.importPath);
    await etc.init();
    // 生成 excel
    const workSheet = new CodeToExcel();
    const keys = Object.keys(exportConfig);
    for (const key of keys) {
      if (!exportConfig[key].isDefault) {
        await workSheet.appendSheet(
          exportConfig[key].name,
          exportConfig[key].path
        );
      }
    }
    workSheet.createXlsx(excelConfig.exportPath);
    console.log("翻译程序执行完毕");
  } catch (error) {
    console.log(error);
  }
}

start();
