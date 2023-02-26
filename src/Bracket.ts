import { getPlayerGroups, SHEET_BRACKET } from "./code";
import { MatchResult } from "./MatchResult";
import { Result } from "./Result";
import { getMetaData } from "./utils/getMetaData";

const CONNECTOR_WIDTH = 15;

const PLAYER_WIDTH = 100;
export class Bracket {
  private declare playerCount: number;

  constructor(playerCount?: number) {
    let ss = SpreadsheetApp.getActiveSpreadsheet();

    const sheetResults = ss.getSheetByName(SHEET_BRACKET);

    this.playerCount = playerCount || getMetaData(sheetResults, "PLAYER_COUNT");
  }

  addResults(results: MatchResult[]) {
    const updatedItems: Item[] = [];

    results.forEach((r) => {
      const item = this.findItem(r.player1, r.player2);
      if (item) {
        item.setResult(r);
        updatedItems.push(item);
      }
    });
    updatedItems.forEach((item) => this.updateChild(item));
  }

  updateChild(item: Item) {
    if (item.child && !item.child.result.valid) {
      const cellIndex = item.index % 2;
      item.child.setPlayer(cellIndex, item.winner);
    }
  }

  findItem(player1, player2): Item | undefined {
    return this.items.find((i) => i.match(player1, player2));
  }

  get items(): Item[] {
    const items: Item[] = [];

    let ss = SpreadsheetApp.getActiveSpreadsheet();

    const sheetResults = ss.getSheetByName(SHEET_BRACKET);

    let upperPower = Math.ceil(Math.log(this.playerCount) / Math.log(2));

    // Calculates the number that is a power of 2 and lower than numPlayers.
    let countNodesUpperBound = Math.pow(2, upperPower);

    // Calculates the number that is a power of 2 and higher than numPlayers.
    let countNodesLowerBound = countNodesUpperBound / 2;

    for (let i = upperPower - 1; i >= 0; i--) {
      let count = Math.pow(2, upperPower - i - 1);
      let distance = Math.pow(2, i) * 4;
      let first = distance / 2 - 1;
      for (let j = 0; j < count; j++) {
        const child = items.find(
          (itm) => itm.round === i + 1 && itm.index == Math.trunc(j / 2)
        );

        const item = new Item(
          i,
          j,
          child,
          sheetResults.getRange(j * distance + first, i * 6 + 1, 2, 3)
        );
        items.push(item);
      }
    }
    return items;
  }
}

function parseInteger(value: string): number | undefined {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    return undefined;
  }

  return num;
}

export class Item {
  declare result: Result;
  declare player1: string;
  declare player2: string;
  constructor(
    public readonly round: number,
    public readonly index: number,
    public readonly child: Item,
    private readonly rng: GoogleAppsScript.Spreadsheet.Range
  ) {
    this.player1 = rng.offset(0, 0, 1, 1).getValue();
    this.player2 = rng.offset(1, 0, 1, 1).getValue();
    const sets = [1, 2, 3]
      .filter((col) => {
        const a = parseInteger(rng.offset(0, col, 1, 1).getValue());
        const b = parseInteger(rng.offset(0, col, 1, 1).getValue());
        return typeof a === "number" && typeof b === "number";
      })
      .map((col) => [
        parseInteger(rng.offset(0, col, 1, 1).getValue()),
        parseInteger(rng.offset(0, col, 1, 1).getValue()),
      ]);
    this.result = new Result(sets);
  }
  get winner() {
    if (this.result.win) {
      return this.player1;
    } else {
      return this.player2;
    }
  }

  setPlayer(index: number, player: string) {
    this.rng.offset(index, 0, 1, 1).setValue(player);
  }

  match(player1, player2) {
    return (
      (this.player1 === player1 && this.player2 == player2) ||
      (this.player1 === player2 && this.player2 == player1)
    );
  }
  setResult(matchResult: MatchResult) {
    if (this.player1 == matchResult.player1) {
      this.result = matchResult.result;
    } else {
      this.result = matchResult.result.reverse();
    }
    [1, 2, 3].forEach((col) => {
      if (this.result.sets.length >= col) {
        let winnerIndex = this.result.win ? 0 : 1;
        this.rng.offset(0, 0, 1, 4).setFontWeight(winnerIndex===0?"bold":"normal");
        this.rng.offset(1, 0, 1, 4).setFontWeight(winnerIndex===1?"bold":"normal");

        this.rng.offset(0, col, 1, 1).setValue(this.result.sets[col - 1][0]);
        this.rng.offset(1, col, 1, 1).setValue(this.result.sets[col - 1][1]);
      } else {
        this.rng.offset(0, col, 1, 1).setValue("");
        this.rng.offset(1, col, 1, 1).setValue("");
      }
    });
  }
}

export function createBracket() {
  return new Bracket();
}

/**
 * Creates the brackets based on the data provided on the players.
 */
export function renderBracket() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();

  const numPlayers =
    parseInt(
      Browser.inputBox("Wieviele Spieler nehmen an der KO Runde teile?")
    ) || 16;

  const sheetResults = ss.getSheetByName(SHEET_BRACKET);
  sheetResults.addDeveloperMetadata("PLAYER_COUNT", numPlayers);

  // Clears the 'Bracket' sheet and all formatting.
  sheetResults.clear();

  let upperPower = Math.ceil(Math.log(numPlayers) / Math.log(2));

  // Calculates the number that is a power of 2 and lower than numPlayers.
  let countNodesUpperBound = Math.pow(2, upperPower);

  // Calculates the number that is a power of 2 and higher than numPlayers.
  let countNodesLowerBound = countNodesUpperBound / 2;

  // Determines the number of nodes that will not show in the 1st level.
  let countNodesHidden = numPlayers - countNodesLowerBound;

  // Fills in the rest of the bracket.
  upperPower;

  let lastFirst = 1;
  let lastDistance = 0;
  for (let i = 0; i < upperPower; i++) {
    let count = Math.pow(2, upperPower - i - 1);

    let distance = Math.pow(2, i) * 4;
    let first = distance / 2 - 1;

    for (let j = 0; j < count; j++) {
      setBracketItem_(sheetResults.getRange(j * distance + first, i * 6 + 1));
      if (lastDistance > 0)
        setConnector_(
          sheetResults.getRange(
            j * distance + lastFirst + 1,
            i * 6 - 1,
            lastDistance,
            2
          )
        );
    }

    lastFirst = first;
    lastDistance = distance;
  }
}

/**
 * Sets the value of an item in the bracket and the color.
 * @param {Range} rng The Spreadsheet Range.
 * @param {string[]} players The list of players.
 */
function setBracketItem_(cell: GoogleAppsScript.Spreadsheet.Range) {
  cell.setBackground("yellow");
  const opponent = cell.offset(1, 0);

  opponent.setBackground("yellow");

  const players = getPlayerGroups().players;
  var dropdown = cell.offset(0, 0, 2, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(players)
    .build();
  dropdown.setDataValidation(rule);

  cell.offset(0, 1, 2, 3).setBackground("lightgrey");

  cell.getSheet().setColumnWidth(cell.getColumn() + 0, PLAYER_WIDTH);
  cell.getSheet().setColumnWidth(cell.getColumn() + 1, CONNECTOR_WIDTH);
  cell.getSheet().setColumnWidth(cell.getColumn() + 2, CONNECTOR_WIDTH);
  cell.getSheet().setColumnWidth(cell.getColumn() + 3, CONNECTOR_WIDTH);
}

/**
 * Sets the color and width for connector cells.
 * @param {Sheet} sheet The spreadsheet to setup.
 * @param {Range} rng The spreadsheet range.
 */
function setConnector_(rng) {
  rng.getSheet().setColumnWidth(rng.getColumnIndex(), CONNECTOR_WIDTH);
  //rng.setBackgroundColor('green');
  const centre = Math.trunc(rng.getHeight() / 2);
  rng
    .offset(centre, 1, 1, 1)
    .setBorder(
      true,
      true,
      false,
      false,
      false,
      false,
      "#000000",
      SpreadsheetApp.BorderStyle.SOLID_THICK
    );
  rng
    .offset(0, 0, 1, 1)
    .setBorder(
      true,
      false,
      false,
      true,
      false,
      false,
      "#000000",
      SpreadsheetApp.BorderStyle.SOLID_THICK
    );
  rng
    .offset(rng.getHeight() - 1, 0, 1, 1)
    .setBorder(
      false,
      false,
      false,
      true,
      false,
      false,
      "#000000",
      SpreadsheetApp.BorderStyle.SOLID_THICK
    );
  rng
    .offset(1, 0, rng.getHeight() - 1, 1)
    .setBorder(
      false,
      false,
      true,
      true,
      false,
      false,
      "#000000",
      SpreadsheetApp.BorderStyle.SOLID_THICK
    );
}
