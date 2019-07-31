import * as os from "os";

interface IExportConfig {
  [key: string]: {
    name: string;
    path: string;
    mark?: string;
    isDefault?: boolean;
  };
}

export const prettierConfig: any = {
  singleQuote: true,
  semi: false,
  endOfLine: os.type() === "Windows_NT" ? "crlf" : "lf",
  parser: "babel"
};
/**
 * 语言文件路径
 * https://cloud.google.com/translate/docs/languages 查询对应语言标志
 */
export const exportConfig: IExportConfig = {
  zh_CN: {
    name: "中文",
    path: "../../../../www/xls-business-app/i18n/zh_CN",
    mark: "zh-CN",
    isDefault: true
  },
  th_TH: {
    name: "泰语",
    path: "../../../../www/xls-business-app/i18n/th_TH",
    mark: "th"
  },
  vi_VN: {
    name: "越语",
    path: "../../../../www/xls-business-app/i18n/vi_VN",
    mark: "vi"
  }
};

/**
 * excel 文件路径
 */
export const excelConfig: {
  importPath: string;
  exportPath: string;
} = {
  // 生成的 excel 路径
  exportPath: "../../../../www/xls-business-app/dist/excel",
  // 导入的 excel 路径
  importPath:
    "../../../../www/xls-business-app/tmp/translate-20190731-17-09-19.xlsx"
};
