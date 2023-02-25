import { createBracket } from "./Bracket";
import { getPlayerGroups } from "./code";
import { GroupResult } from "./GroupResult";
import { getGroupName, getGroupTable } from "./GroupTable";
import { MatchResult } from "./MatchResult";
import { FORM_TYPE, FORM_TYPE_MATCH } from "./Process";
import { Result } from "./Result";
import { TournamentState } from "./State";
import { getMetaData } from "./utils/getMetaData";
import { hasMetaData } from "./utils/hasMetaData";
import { setMetaData } from "./utils/setMetaData";
const GROUP_MATCH_COUNT = "GROUP_MATCH_COUNT";

export class MatchForm {
  switchToKo() {
    const results = this.createMatchResults();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = this.getSheet();
    setMetaData(sheet, GROUP_MATCH_COUNT, results.length);
    const range = this.getSheet().getRange(1,1,results.length,4)
    range.setBackground("lightgreen")
  }

  get groupMatchCount(): number {
    return parseInt(getMetaData(this.getSheet(), GROUP_MATCH_COUNT));
  }

  onMatchFormSubmit() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (TournamentState.getInstance().phase === "KO") {
      const results = this.createMatchResults();
      const bracket = createBracket();
      bracket.addResults(results);
      return;
    }

    const groupResults = this.createGroupResult();

    Object.keys(groupResults).forEach((groupName) => {
      const groupResult = groupResults[groupName];
      const groupTable = getGroupTable(ss, groupName);
      groupResult.allMatches.forEach((r) =>
        groupTable.addResult(r.player1, r.player2, r.result)
      );
      getGroupTable(
        SpreadsheetApp.getActiveSpreadsheet(),
        groupName
      ).addGroupResult(groupResult);
    });
  }

  getSheet() {
    return SpreadsheetApp.getActiveSpreadsheet()
      .getSheets()
      .find((s) => hasMetaData(s, FORM_TYPE, FORM_TYPE_MATCH));
  }

  createMatchResults() {
    const sheet = this.getSheet();

    const range = sheet.getDataRange();
    const rows = range.getHeight();

    const startRow =
      TournamentState.getInstance().phase === "KO"
        ? this.groupMatchCount + 2
        : 2;

    const matches: { [key: string]: MatchResult } = {};
    for (let row = startRow; row <= rows; row++) {
      const player1 = range.getCell(row, 2).getValue();
      const player2 = range.getCell(row, 3).getValue();
      const resultAsString = range.getCell(row, 4).getValue();
      const result = Result.fromString(resultAsString);
      if (result && result.valid) {
        matches[[player1, player2].sort().join("-")] = {
          player1,
          player2,
          result,
        };
      }
    }
    return Object.values(matches);
  }

  createGroupResult() {
    const sheet = this.getSheet();

    const range = sheet.getDataRange();
    const rows = range.getHeight();
    const groupResults: { [name: string]: GroupResult } = {};
    for (let row = 2; row <= rows; row++) {
      const player1 = range.getCell(row, 2).getValue();
      const player2 = range.getCell(row, 3).getValue();
      const resultAsString = range.getCell(row, 4).getValue();
      const result = Result.fromString(resultAsString);
      if (result && result.valid) {
        const groupName1 = getGroupName(player1);
        const groupName2 = getGroupName(player2);
        if (groupName1 === groupName2) {
          if (!groupResults[groupName1]) {
            const players =
              getPlayerGroups().getGroupByName(groupName1).players;
            groupResults[groupName1] = new GroupResult(players);
          }
          const groupResult = groupResults[groupName1];
          groupResult.addMatch(player1, player2, result);
        }
      }
    }
    Object.values(groupResults).forEach((g) => g.init());
    return groupResults;
  }

  static getInstance() {
    return INSTANCE;
  }
}

const INSTANCE = new MatchForm();
