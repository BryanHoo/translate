import * as _ from "lodash";
import xlsx from "xlsx";
import dayjs from "dayjs";
import { exportConfig } from "../config";
import { FileHandle } from "../utils";

/**
 * 代码导出生成 excel
 */
export class CodeToExcel extends FileHandle {
  private workbook: xlsx.WorkBook;
  private defaultLanguageData: {};
  private defaultLanguagePath: string;
  private aoaData: string[][];

  constructor() {
    super();
    this.workbook = xlsx.utils.book_new();
    this.defaultLanguageData = {};
    this.defaultLanguagePath = "";
    this.aoaData = [["模块路径", "中文"]];
    this.init();
  }

  private init() {
    this.getDefaultLanguage();
    this.aoaData = [
      ...this.aoaData,
      ...this.transformData(this.defaultLanguageData)
    ];
  }

  /**
   * 获取默认语言数据
   */
  private getDefaultLanguage() {
    const defaultLanguage = _.find(exportConfig, item => !!item.isDefault);
    if (defaultLanguage) {
      this.defaultLanguagePath = defaultLanguage.path;
      this.defaultLanguageData = require(super.getPath([defaultLanguage.path]));
      console.log(`正在导出${defaultLanguage.name}...`);
    } else {
      console.error("没有默认语言");
    }
  }

  /**
   * 数据处理为二维数组形式
   * @param data 翻译对象
   */
  private transformData(data: { [key: string]: {} }) {
    const temData: string[][] = [];
    const parseData = function func(data: string | {}, path: string = "") {
      if (_.isObject(data)) {
        _.forEach(data, (value: string | {}, key: string) => {
          func(value, `${path}/${key}`);
        });
      } else {
        temData.push([path, data]);
      }
    };
    parseData(data);
    return temData;
  }

  /**
   * 二维数组数组生成一张表
   * @param data 要生成的二维数组
   * @param name 表名
   */
  private aoaToSheet(data: string[][], name: string) {
    const workSheet = xlsx.utils.aoa_to_sheet(data);
    xlsx.utils.book_append_sheet(this.workbook, workSheet, name);
  }

  /**
   * 其他语言合并到默认数组
   */
  private mergeAoaData(sourceData: string[][], targetData: string[][]) {
    const temData: { [key: string]: string } = {};
    const data: string[][] = _.cloneDeep(sourceData).map((item, index) => {
      if (index === 0) return item;
      targetData.forEach(it => {
        // 同一 key 值
        if (super.pathToLower(item[0]) === super.pathToLower(it[0])) {
          item[2] = it[1];
          // 未翻译
          if (item[1] === it[1]) {
            item[2] = "";
          } else {
            // 缓存已翻译
            if (it[1]) {
              temData[item[1]] = it[1];
            }
          }
        }
      });
      return item;
    });
    // 查找已经翻译过的词汇
    data.forEach(item => {
      if (!item[2]) {
        _.forEach(temData, (value, key) => {
          if (key === item[1]) {
            item[2] = value;
          }
          item[2] = "";
        });
      }
    });
    return data;
  }

  /**
   * 添加一种语言的表
   * @param name 表名
   * @param path 语言路径
   */
  public async appendSheet(name: string, path: string) {
    try {
      console.log(`正在导出${name}...`);
      const isExist = await super.isPathExist(path);
      let temData: string[][];
      if (!isExist) {
        super.copy(this.defaultLanguagePath, path);
        temData = _.cloneDeep(this.aoaData);
        temData[0].push(name);
      } else {
        const data = require(path);
        const aoaData = this.transformData(data);
        temData = this.mergeAoaData(this.aoaData, aoaData);
        // 表名
        temData[0].push(name);
      }
      this.aoaToSheet(temData, name);
    } catch (error) {
      console.error(`导出${name}时：${error}`);
    }
  }

  /**
   * 生成 Excel
   */
  public createXlsx(path: string) {
    const time = dayjs().format("YYYYMMDD-HH-mm-ss");
    xlsx.writeFile(
      this.workbook,
      super.getPath([path, `translate-${time}.xlsx`])
    );
  }
}
