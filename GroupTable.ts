namespace Module {
  export class GroupTable {
    private allGroups: AllGroups;
    constructor(private readonly sheet, private readonly name: String) {
      this.sheet = sheet;
      this.name = name;
      this.allGroups = getPlayerGroups();
    }

    get players() {
      return this.allGroups.players;
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

    addGroupResult(result) {
      let groupStartCell = this.getResultStartCell();
      this.players.forEach((name, idx) => {
        const stats = result.calculate(name);
        const row = stats.ranking;
        groupStartCell
          .offset(row, 0)
          .setValue(row)
          .setBackgroundColor("red")
          .setFontColor("white)");
        groupStartCell
          .offset(row, 1)
          .setValue(name)
          .setBackgroundColor("yellow");
        groupStartCell
          .offset(row, 2)
          .setNumberFormat("@STRING@")
          .setValue(this.format(stats.setpoints))
          .setBackgroundColor("lightcyan");
        groupStartCell
          .offset(row, 3)
          .setNumberFormat("@STRING@")
          .setValue(this.format(stats.sets))
          .setBackgroundColor("lightgrey");
        groupStartCell
          .offset(row, 4)
          .setNumberFormat("@STRING@")
          .setValue(this.format(stats.matches))
          .setBackgroundColor("lightyellow");
        //groupStartCell.offset(row, 4).setValue(stats.ranking).setBackgroundColor("red").setFontColor("white")
      });
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

    initialize() {
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

      for (let idx = 0; idx < this.players.length; idx++) {
        for (let idy = 0; idy < this.players.length; idy++) {
          const cell = groupStartCell.offset(idy + 1, idx + 1);
          if (idx == idy) {
            cell.setBackgroundColor("lightgreen");
          } else {
            cell.setBackgroundColor("lightyellow");
          }
        }
      }

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

      onMatchFormSubmit();
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

  export function createGroupStage() {
    let ss = SpreadsheetApp.getActiveSpreadsheet();

    // Figures out how many players there are by skipping the empty cells.
    const groups = getPlayerGroups();

    let sheetGroup = ss.getSheetByName(SHEET_GROUP);
    sheetGroup.clear();
    this.allGroups.groups.forEach((group) => {
      console.log("group", group.name, group.players.length);
      const groupTable = new GroupTable(sheetGroup, group.name);
      groupTable.initialize();
    });
  }
}
