export type FieldName = keyof FieldData;

export interface FieldData {
  background?: string[][];
  value?: any[][];
  fontcolor?: string[][];
  numberformat?: string[][];
}

export class VirtualRange {
  declare data: FieldData;
  constructor(
    readonly row: number,
    readonly col: number,
    readonly height: number,
    readonly width: number
  ) {
    this.data = {};
  }

  init(name: FieldName) {
    const currData = this.data[name];
    if (!currData) {
      const currData = new Array(this.height);
      for (let i = 0; i < this.height; i++) {
        const col = new Array(this.width);
        col.fill("");
        currData[i] = col;
      }
      this.data[name] = currData;
    }
  }

  setValue(name: FieldName, row: number, col: number, value: any) {
    this.init(name);
    this.data[name][row][col] = value;
  }

  render(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
    const range = sheet.getRange(this.row, this.col, this.height, this.width);
    Object.keys(this.data).forEach((name: FieldName) => {
      switch (name) {
        case "background":
          range.setBackgrounds(this.data[name]);
          break;
        case "value":
          range.setValues(this.data[name]);
          break;
        case "fontcolor":
          range.setFontColors(this.data[name]);
          break;
        case "numberformat":
          range.setNumberFormats(this.data[name]);
          break;
      }
    });
  }
}
