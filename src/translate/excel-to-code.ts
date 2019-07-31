import { FileHandle } from "../utils";
import xlsx from "xlsx";
import { exportConfig, prettierConfig } from "../config";
import * as _ from "lodash";
import * as prettier from "prettier";
import * as fs from "fs";

/**
 * excel 写入到代码文件
 */
export class ExcelToCode extends FileHandle {
  private workbook: xlsx.WorkBook;
  constructor(path: string) {
    super();
    this.workbook = xlsx.readFile(super.getPath([path]));
  }

  /**
   * 初始化
   */
  async init() {
    const aoa = this.sheetToAoa();
    const keys = Object.keys(aoa);
    for (const key of keys) {
      const config = _.find(exportConfig, item => item.name === key);
      if (!config) return console.error(`找不到${key}的配置路径`);
      console.log(`正将 Excel 中的${key}写入到目录${config.path}`);
      await this.aoaToFiles(aoa[key], config.path, 2);
    }
    return Promise.resolve(true);
  }

  /**
   * excel 数据导出到对象
   */
  private sheetToAoa() {
    const workSheets = this.workbook.SheetNames;
    const data: { [key: string]: string[][] } = {};
    workSheets.forEach(name => {
      data[name] = xlsx.utils.sheet_to_json(this.workbook.Sheets[name], {
        header: 1
      });
    });
    return data;
  }

  /**
   * 二维数组生成代码文件
   * @param aoa 二维数据数组
   * @param path 语言目录地址
   * @param index 读取 excel 第几列的内容
   */
  private async aoaToFiles(aoa: string[][], path: string, index: number) {
    try {
      const src = super.getPath([path]);
      // 删除原来的翻译
      await super.remove(src);
      const temObj: { [key: string]: { [key: string]: string } } = {};
      const pathStrs: string[] = [];
      const data = _.drop(aoa);
      _.forEach(data, arr => {
        let paths = _.drop(arr[0].split("/"), 2);
        paths = paths.map((item, index) => {
          if (index === paths.length - 1) return item;
          if (item === "Index") return item;
          return _.kebabCase(item);
        });
        const pathStr = super.getPath([src, ..._.dropRight(paths)]);
        pathStrs.push(pathStr);
        if (!temObj[pathStr]) {
          temObj[pathStr] = {};
        }
        temObj[pathStr][paths[paths.length - 1]] = arr[index]
          ? arr[index]
          : arr[1];
      });
      // 新建文件夹
      await super.mltMkdirp(pathStrs);
      // 文件列表的 index.ts
      await this.filesInputIndex(path);
      // 最底层的 index.ts
      const keys = Object.keys(temObj);
      for (const key of keys) {
        await super.outputFile(
          super.getPath([key, "index.ts"]),
          this.templateFile(temObj[key])
        );
      }
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  /**
   * 生成导入模块的文件
   */
  private async filesInputIndex(path: string) {
    const src = super.getPath([path]);
    const parseData = async (src: string) => {
      const filesDirent = await fs.promises.readdir(src, {
        withFileTypes: true
      });
      const files = filesDirent.filter(item => item.name !== "index.ts");
      const flag = _.every(files, dirent => dirent.isDirectory());
      if (flag) {
        const fileNames: string[] = files.map(item => item.name);
        if (fileNames.length) {
          await this.outputFile(
            super.getPath([src, "index.ts"]),
            `${this.templateDir(fileNames)}${this.templateFile(fileNames)}`
          );
        }
        for (const file of files) {
          await parseData(super.getPath([src, file.name]));
        }
      }
    };
    await parseData(src);
    return Promise.resolve(true);
  }

  /**
   * 生成导入模版
   * @param keys 文件名数组
   */
  protected templateDir(keys: string[]) {
    const ks = _.sortBy(keys, item => {
      return _.toLower(item);
    });
    const compiled = _.template(
      "<% _.forEach(keys, function(key) {  %> import <%- key === 'Index' ? key : _.camelCase(key) %> from './<%= key === 'Index' ? 'Index/index' : _.kebabCase(key) %>'\n<%});%>"
    );
    return prettier.format(compiled({ keys: ks }), prettierConfig);
  }

  /**
   * 导出对象模板
   * @param data 导出对象
   */
  protected templateFile(data: {} | []) {
    if (_.isArray(data)) {
      const compiled = _.template(
        "export default { <% _.forEach(data, function(key){ %> <%= key === 'Index' ? key : _.camelCase(key) %>,\n <%});%>} "
      );
      return prettier.format(
        compiled({ data: _.sortBy(data) }),
        prettierConfig
      );
    }
    const str = JSON.stringify(data);
    return prettier.format(`export default ${str}`, prettierConfig);
  }
}
