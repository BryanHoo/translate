import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import * as _ from "lodash";
const fsPromises = fs.promises;

/**
 * 文件处理对象
 */
export class FileHandle {
  constructor() {}

  /**
   * 生成真实路径
   * @param paths 需要合成的路径数组
   */
  protected getPath(paths: string[]) {
    return path.resolve(__dirname, ...paths);
  }

  /**
   * 复制文件或者目录下所有内容
   * @param sourcePath 被文件或者目录地址
   * @param targetPath 生成文件或者目录地址
   */
  protected async copy(sourcePath: string, targetPath: string) {
    try {
      await fse.copy(this.getPath([sourcePath]), this.getPath([targetPath]));
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 删除文件或者目录下所有内容
   * @param path 文件或者目录地址
   */
  protected async remove(path: string) {
    const src = this.getPath([path]);
    try {
      await fse.remove(src);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 新建文件夹
   * @param path 写入路径
   */
  protected async mkdirp(path: string) {
    const src = this.getPath([path]);
    try {
      await fse.mkdirp(src);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 同时新建多个文件夹
   * @param paths 文件夹路径数组
   */
  protected mltMkdirp(paths: string[]) {
    const pros = paths.map(path => {
      return fse.mkdirp(this.getPath([path]));
    });
    return Promise.all(pros);
  }

  /**
   * 新建文件
   * @param path 文件路径
   * @param data 写入文件的数据
   */
  protected async outputFile(path: string, data: string) {
    const src = this.getPath([path]);
    try {
      await fse.outputFile(src, data);
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  /**
   * 检查目录是否存在
   * @param src 查询目录地址
   */
  protected async isPathExist(src: string) {
    const parsePath = this.getPath([src]);
    try {
      await fsPromises.access(parsePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 查询目录地址文件类型
   * @param src 查询目录地址
   */
  protected async isFileType(src: string) {
    const parsePath = this.getPath([src]);
    return await fsPromises.stat(parsePath);
  }

  protected async outputJson(path: string, data: {}) {
    const src = this.getPath([path]);
    try {
      await fse.outputJSON(src, data);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 文件路径转为小写，用于比较
   * @param path 文件路径
   */
  protected pathToLower(path: string) {
    let paths = path.split("/");
    paths = paths.map((item, index) => {
      if (index === paths.length - 1) return item;
      return _.toLower(item);
    });
    return paths.join("/");
  }
}
