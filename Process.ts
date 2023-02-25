const FORM_TYPE = "FORM_TYPE";
const FORM_TYPE_MATCH = "FORM_TYPE_MATCH";
const FORM_TYPE_REGISTRATION = "FORM_TYPE_REGISTRATION";
namespace Module {
  export function onFormSubmit(e: any) {
    var range = e.range as GoogleAppsScript.Spreadsheet.Range;
    const sheetType = getMetaData(range.getSheet(), FORM_TYPE);

    if (sheetType == FORM_TYPE_MATCH) {
      onMatchFormSubmit();
    }
    Logger.log("form submit for " + range.getSheet().getName());
  }

  export function onMatchFormSubmit() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (TournamentState.getInstance().phase === "KO") {
      const bracket = createBracket();
      bracket.addResults(createKoResult());
      return;
    }
    //return

    const groupResults = createGroupResult();

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

  export function createKoResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheets()
      .find((s) => hasMetaData(s, FORM_TYPE, FORM_TYPE_MATCH));

    const range = sheet.getDataRange();
    const rows = range.getHeight();
    const matches: { [key: string]: MatchResult } = {};
    for (let row = 2; row <= rows; row++) {
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

  function createGroupResult() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheets()
      .find((s) => hasMetaData(s, FORM_TYPE, FORM_TYPE_MATCH));

    const range = sheet.getDataRange();
    const rows = range.getHeight();
    const columns = range.getWidth();
    const groupResults: {[name:string]:GroupResult} = {};
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
            const players = getPlayerGroups().getGroupByName(g.name).players;
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
}
