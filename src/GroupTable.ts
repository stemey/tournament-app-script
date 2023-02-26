import { AllGroups, getPlayerGroups, SHEET_GROUP } from "./code";
import { formatTuple, GroupResult } from "./GroupResult";
import { Result } from "./Result";
import { VirtualRange } from "./VirtualRange";

export class GroupTable {
  private declare allGroups: AllGroups;
  constructor(private readonly sheet, private readonly name: String) {
    this.sheet = sheet;
    this.name = name;
    this.allGroups = getPlayerGroups();
  }

  get players() {
    return this.group.players;
  }

  get group() {
    return this.allGroups.getGroupByName(this.name);
  }

  get groupIndex() {
    return this.group ? this.allGroups.groups.indexOf(this.group) : -1;
  }

  getStartCell() {
    const startRow = this.allGroups.groups
      .filter((_g, idx) => idx < this.groupIndex)
      .reduce((acc, curr) => {
        acc += curr.players.length + 5;
        return acc;
      }, 1);
    return this.sheet.getRange(startRow, 1, 1, 1).getCell(1, 1);
  }

  getResultCells(player1, player2) {
    const startCell = this.getStartCell();
    const p1index = this.players.indexOf(player1) + 1;
    const p2index = this.players.indexOf(player2) + 1;
    return [
      startCell.offset(1 + p2index, p1index),
      startCell.offset(1 + p1index, p2index),
    ];
  }

  addResult(player1, player2, result) {
    const cells = this.getResultCells(player1, player2);
    cells[0].setValue(result.reverse().asString());
    cells[1].setValue(result.asString());
  }

  format(values) {
    return `${values[0]}:${values[1]}`;
  }

  getResultStartCell() {
    return this.getStartCell().offset(0, this.players.length + 2);
  }

  addGroupResult(result:GroupResult) {
    let groupStartCell = this.getResultStartCell();
    const groupRange = new VirtualRange(groupStartCell.getRow()+1,groupStartCell.getColumn(),this.players.length,5);
    this.players.forEach((name) => {
      const stats = result.getPlayerStats(name);
      const row = stats.ranking;
      groupRange.setValue("value",row, 0,String(stats.ranking+1)+".");
      groupRange.setValue("value",row, 1,name);
      groupRange.setValue("value",row, 2,formatTuple(stats.setpoints));
      groupRange.setValue("value",row, 3,formatTuple(stats.sets));
      groupRange.setValue("value",row, 4,formatTuple(stats.matches));
    });
    groupRange.render(this.sheet);
  }

  getPublishUrl(col, row, width, height) {
    const id = SpreadsheetApp.getActiveSpreadsheet().getId();
    const rangeAsString = SpreadsheetApp.getActiveSpreadsheet()
      .getSheets()[0]
      .getRange(col, row, width, height)
      .getA1Notation();
    const sheetId = SpreadsheetApp.getActiveSpreadsheet()
      .getActiveSheet()
      .getSheetId();
    return `https://docs.google.com/spreadsheet/pub?key=${id}&chrome=false&gid=${sheetId}&widget=false&range=${rangeAsString}`;
  }

  private renderStats() {
    let groupStartCell = this.getResultStartCell();

    const statsRange = new VirtualRange(
      groupStartCell.getRow(),
      groupStartCell.getColumn(),
      this.players.length + 1,
      5
    );

    this.players.forEach((name, idx) => {
      const row = idx + 1;
      statsRange.setValue("background", row, 0, "red");
      statsRange.setValue("fontcolor", row, 0, "white");
      statsRange.setValue("numberformat", row, 0, "@STRING@");
      statsRange.setValue("background", row, 1, "yellow");
      statsRange.setValue("background", row, 2, "lightcyan");
      statsRange.setValue("numberformat", row, 2, "@STRING@");
      statsRange.setValue("background", row, 3, "lightgrey");
      statsRange.setValue("numberformat", row, 2, "@STRING@");
      statsRange.setValue("background", row, 4, "lightyellow");
      statsRange.setValue("numberformat", row, 2, "@STRING@");
    });
    statsRange.render(this.sheet);
  }

  render() {
    let groupStartCell = this.getStartCell();
    groupStartCell.setValue(this.name);
    groupStartCell = groupStartCell.offset(1, 0);

    for (
      let playerColumnIdx = 0;
      playerColumnIdx < this.players.length;
      playerColumnIdx++
    ) {
      const cell = groupStartCell.offset(0, playerColumnIdx + 1);
      cell.setValue(this.players[playerColumnIdx]);
      cell.setBackgroundColor("yellow").setWrap(true);
    }
    for (
      let playerRowIdx = 0;
      playerRowIdx < this.players.length;
      playerRowIdx++
    ) {
      const cell = groupStartCell.offset(playerRowIdx + 1, 0);
      cell.setValue(this.players[playerRowIdx]).setBackgroundColor("yellow");
    }

    const bgRange = new VirtualRange(
      groupStartCell.getRow() + 1,
      groupStartCell.getColumn() + 1,
      this.players.length,
      this.players.length
    );
    for (let idx = 0; idx < this.players.length; idx++) {
      for (let idy = 0; idy < this.players.length; idy++) {
        if (idx == idy) {
          bgRange.setValue("background", idy, idx, "lightgreen");
        } else {
          bgRange.setValue("background", idy, idx, "lightyellow");
        }
      }
    }

    bgRange.render(groupStartCell.getSheet());

    const url = this.getPublishUrl(
      groupStartCell.getRowIndex(),
      groupStartCell.getColumnIndex(),
      this.players.length + 1,
      this.players.length + 1
    );

    groupStartCell
      .offset(this.players.length + 1, 0)
      .setRichTextValue(getUrlAsRichtextValue("link", url));

    const resultStartCell = this.getResultStartCell();

    resultStartCell.offset(0, 2).setValue("Satzpunkte");
    resultStartCell.offset(0, 3).setValue("Sätze");
    resultStartCell.offset(0, 4).setValue("Spiele");
    const urlResult = this.getPublishUrl(
      resultStartCell.getRowIndex(),
      resultStartCell.getColumnIndex(),
      5,
      this.players.length + 1
    );

    resultStartCell
      .offset(this.players.length + 1, 0)
      .setRichTextValue(getUrlAsRichtextValue("link", urlResult));

    this.renderStats();
  }
}

function getUrlAsRichtextValue(name, url) {
  return SpreadsheetApp.newRichTextValue()
    .setText(name)
    .setLinkUrl(url)
    .build();
}

export function getGroupName(playerName: string) {
  const group = getPlayerGroups().groups.find(
    (g) => g.players.indexOf(playerName) >= 0
  );
  return group ? group.name : undefined;
}

export function getGroupTable(spreadSheet, name) {
  let sheetGroup = spreadSheet.getSheetByName(SHEET_GROUP);
  return new GroupTable(sheetGroup, name);
}

export function renderGroupStage() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();

  // Figures out how many players there are by skipping the empty cells.
  const allGroups = getPlayerGroups();

  let sheetGroup = ss.getSheetByName(SHEET_GROUP);
  sheetGroup.clear();
  allGroups.groups.forEach((group) => {
    console.log("group", group.name, group.players.length);
    const groupTable = new GroupTable(sheetGroup, group.name);
    groupTable.render();
  });
}
