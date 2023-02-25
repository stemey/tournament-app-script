const SHEET_PLAYERS = "Player Group";
const SHEET_BRACKET = "Bracket";
const SHEET_GROUP = "Group";

/**
 * Adds a custom menu item to run the script.
 */

class AllGroups {
  getGroupByName(name) {
    return this.groups.find(g => g.name === name);
  }
  constructor(groups) {
    this.groups = groups;
  }
  get players() {
    return this.groups.reduce((players, group) => {
      players = players.concat(group.players);
      return players;
    }, []);
  }
}
class PlayerGroup {
  constructor(players, name) {
    this.players = players;
    this.name = name;
  }
}
function getPlayerGroups() {
  const groups = [];
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let firstCell = ss.getRange(SHEET_PLAYERS + "!A1");
  let sheetControl = ss.getSheetByName(SHEET_PLAYERS);
  let firstColumn = firstCell.offset(0, 0, sheetControl.getMaxRows(), 1);
  let players = firstColumn.getValues();
  let currentGroup = undefined;
  for (let i = 0; i < players.length; i++) {
    if (!players[i][0] || players[i][0].length == 0) {
      currentGroup = undefined;
      continue;
    }
    if (!currentGroup) {
      currentGroup = new PlayerGroup([], players[i][0]);
      groups.push(currentGroup);
    } else {
      currentGroup.players.push(players[i][0]);
    }
  }
  return new AllGroups(groups);
}

class Result {
  constructor(sets) {
    this.sets = sets;
  }
  get valid() {
    return this.sets.length >= 2 && this.sets.every(s => s[0] > 0 && s[1] > 0);
  }
  reverse() {
    return new Result(this.sets.map(s => [s[1], s[0]]));
  }
  get setsWonLost() {
    const setsWon = this.sets.reduce((sets, s) => {
      if (s[0] > s[1]) sets++;
      return sets;
    }, 0);
    const setsLost = this.sets.reduce((sets, s) => {
      if (s[0] < s[1]) sets++;
      return sets;
    }, 0);
    return [setsWon, setsLost];
  }
  get setpoints() {
    const setpointsWon = this.sets.reduce((sets, s) => {
      sets += s[0];
      return sets;
    }, 0);
    const setpointsLost = this.sets.reduce((sets, s) => {
      sets += s[1];
      return sets;
    }, 0);
    return [setpointsWon, setpointsLost];
  }
  get win() {
    return this.sets.filter(s => s[0] > s[1]).length == 2;
  }
  asString() {
    return this.sets.map(s => `${s[0]}:${s[1]}`).join(" ");
  }
  static fromString(result) {
    const setsAsStrings = result.split(/[ ,]+/);
    const sets = setsAsStrings.map(s => s.split(":")).map(s => [parseInt(s[0]), parseInt(s[1])]);
    return new Result(sets);
  }
}

function getMetaData(sheet, key) {
  const metaData = sheet.getDeveloperMetadata().find(d => d.getKey() === key);
  return metaData ? metaData.getValue() : undefined;
}

const CONNECTOR_WIDTH = 15;
const PLAYER_WIDTH = 100;
class Bracket {
  constructor(playerCount) {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetResults = ss.getSheetByName(SHEET_BRACKET);
    this.playerCount = playerCount || getMetaData(sheetResults, "PLAYER_COUNT");
  }
  addResults(results) {
    const updatedItems = [];
    results.forEach(r => {
      const item = this.findItem(r.player1, r.player2);
      if (item) {
        item.setResult(r);
        updatedItems.push(item);
      }
    });
    updatedItems.forEach(item => this.updateChild(item));
  }
  updateChild(item) {
    if (item.child && !item.child.result.valid) {
      const cellIndex = item.index % 2;
      item.child.setPlayer(cellIndex, item.winner);
    }
  }
  findItem(player1, player2) {
    return this.items.find(i => i.match(player1, player2));
  }
  get items() {
    const items = [];
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetResults = ss.getSheetByName(SHEET_BRACKET);
    let upperPower = Math.ceil(Math.log(this.playerCount) / Math.log(2));
    for (let i = upperPower - 1; i >= 0; i--) {
      let count = Math.pow(2, upperPower - i - 1);
      let distance = Math.pow(2, i) * 4;
      let first = distance / 2 - 1;
      for (let j = 0; j < count; j++) {
        const child = items.find(itm => itm.round === i + 1 && itm.index == Math.trunc(j / 2));
        const item = new Item(i, j, child, sheetResults.getRange(j * distance + first, i * 6 + 1, 2, 3));
        items.push(item);
      }
    }
    return items;
  }
}
function parseInteger(value) {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    return undefined;
  }
  return num;
}
class Item {
  constructor(round, index, child, rng) {
    this.round = round;
    this.index = index;
    this.child = child;
    this.rng = rng;
    this.player1 = rng.offset(0, 0, 1, 1).getValue();
    this.player2 = rng.offset(1, 0, 1, 1).getValue();
    const sets = [1, 2, 3].filter(col => {
      const a = parseInteger(rng.offset(0, col, 1, 1).getValue());
      const b = parseInteger(rng.offset(0, col, 1, 1).getValue());
      return typeof a === "number" && typeof b === "number";
    }).map(col => [parseInteger(rng.offset(0, col, 1, 1).getValue()), parseInteger(rng.offset(0, col, 1, 1).getValue())]);
    this.result = new Result(sets);
  }
  get winner() {
    if (this.result.win) {
      return this.player1;
    } else {
      return this.player2;
    }
  }
  setPlayer(index, player) {
    this.rng.offset(index, 0, 1, 1).setValue(player);
  }
  match(player1, player2) {
    return this.player1 === player1 && this.player2 == player2 || this.player1 === player2 && this.player2 == player1;
  }
  setResult(matchResult) {
    if (this.player1 == matchResult.player1) {
      this.result = matchResult.result;
    } else {
      this.result = matchResult.result.reverse();
    }
    [1, 2, 3].forEach(col => {
      if (this.result.sets.length >= col) {
        let winnerIndex = this.result.win ? 0 : 1;
        this.rng.offset(0, 0, 1, 4).setFontWeight(winnerIndex === 0 ? "bold" : "normal");
        this.rng.offset(1, 0, 1, 4).setFontWeight(winnerIndex === 1 ? "bold" : "normal");
        this.rng.offset(0, col, 1, 1).setValue(this.result.sets[col - 1][0]);
        this.rng.offset(1, col, 1, 1).setValue(this.result.sets[col - 1][1]);
      } else {
        this.rng.offset(0, col, 1, 1).setValue("");
        this.rng.offset(1, col, 1, 1).setValue("");
      }
    });
  }
}
function createBracket() {
  return new Bracket();
}

/**
 * Creates the brackets based on the data provided on the players.
 */
function renderBracket() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  const numPlayers = parseInt(Browser.inputBox("Wieviele Spieler nehmen an der KO Runde teile?")) || 16;
  const sheetResults = ss.getSheetByName(SHEET_BRACKET);
  sheetResults.addDeveloperMetadata("PLAYER_COUNT", numPlayers);

  // Clears the 'Bracket' sheet and all formatting.
  sheetResults.clear();
  let upperPower = Math.ceil(Math.log(numPlayers) / Math.log(2));
  let lastFirst = 1;
  let lastDistance = 0;
  for (let i = 0; i < upperPower; i++) {
    let count = Math.pow(2, upperPower - i - 1);
    let distance = Math.pow(2, i) * 4;
    let first = distance / 2 - 1;
    for (let j = 0; j < count; j++) {
      setBracketItem_(sheetResults.getRange(j * distance + first, i * 6 + 1));
      if (lastDistance > 0) setConnector_(sheetResults.getRange(j * distance + lastFirst + 1, i * 6 - 1, lastDistance, 2));
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
function setBracketItem_(cell) {
  cell.setBackground("yellow");
  const opponent = cell.offset(1, 0);
  opponent.setBackground("yellow");
  const players = getPlayerGroups().players;
  var dropdown = cell.offset(0, 0, 2, 1);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(players).build();
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
  Logger.log("rng" + rng.getWidth() + " " + rng.getHeight());
  rng.getSheet().setColumnWidth(rng.getColumnIndex(), CONNECTOR_WIDTH);
  //rng.setBackgroundColor('green');
  const centre = Math.trunc(rng.getHeight() / 2);
  rng.offset(centre, 1, 1, 1).setBorder(true, true, false, false, false, false, "#000000", SpreadsheetApp.BorderStyle.SOLID_THICK);
  rng.offset(0, 0, 1, 1).setBorder(true, false, false, true, false, false, "#000000", SpreadsheetApp.BorderStyle.SOLID_THICK);
  rng.offset(rng.getHeight() - 1, 0, 1, 1).setBorder(false, false, false, true, false, false, "#000000", SpreadsheetApp.BorderStyle.SOLID_THICK);
  rng.offset(1, 0, rng.getHeight() - 1, 1).setBorder(false, false, true, true, false, false, "#000000", SpreadsheetApp.BorderStyle.SOLID_THICK);
}

class GroupResult {
  constructor(players) {
    this.players = players;
    this.players = players;
    this.matches = {};
    this.resultMap = {};
  }
  addMatch(player1, player2, result) {
    const key = [player1, player2].sort().join("-");
    this.matches[key];
    this.matches[key] = {
      player1,
      player2,
      result
    };
  }
  get allMatches() {
    return Object.values(this.matches);
  }
  addResult(player, result) {
    if (!this.resultMap[player]) {
      this.resultMap[player] = [];
    }
    this.resultMap[player].push(result);
  }
  init() {
    Object.values(this.matches).forEach(m => {
      this.addResult(m.player1, m.result);
      this.addResult(m.player2, m.result.reverse());
    });
    this.playerStats = this.players.reduce((acc, p) => {
      const stats = this.calculateStats(p);
      acc.push({
        stats,
        player: p
      });
      return acc;
    }, []).sort((x1, x2) => {
      const matches = x2.stats.matches[0] - x1.stats.matches[0];
      return matches;
    }).map((x, idx) => {
      return {
        stats: {
          ...x.stats,
          ranking: idx
        },
        player: x.player
      };
    });
  }
  calculate(player) {
    //this.init();
    const stats = this.calculateStats(player);
    this.players.reduce((acc, p) => {
      const stats = this.calculateStats(p);
      acc.push({
        stats,
        player: p
      });
      return acc;
    }, []).sort((x1, x2) => {
      const matches = x2.stats.matches[0] - x1.stats.matches[0];
      return matches;
    }).forEach((x, idx) => {
      if (player === x.player) {
        stats.ranking = idx + 1;
      }
    });
    return stats;
  }
  calculateStats(player) {
    const results = this.resultMap[player];
    if (!results) {
      return {
        setpoints: [0, 0],
        sets: [0, 0],
        matches: [0, 0],
        ranking: -1
      };
    }
    return results.reduce((acc, result) => {
      acc.setpoints[0] += result.setpoints[0];
      acc.setpoints[1] += result.setpoints[1];
      acc.sets[0] += result.setsWonLost[0];
      acc.sets[1] += result.setsWonLost[1];
      if (result.win) {
        acc.matches[0]++;
      } else {
        acc.matches[1]++;
      }
      return acc;
    }, {
      setpoints: [0, 0],
      sets: [0, 0],
      matches: [0, 0],
      ranking: -1
    });
  }
}

class GroupTable {
  constructor(sheet, name) {
    this.sheet = sheet;
    this.name = name;
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
    const startRow = this.allGroups.groups.filter((_g, idx) => idx < this.groupIndex).reduce((acc, curr) => {
      acc += curr.players.length + 5;
      return acc;
    }, 1);
    return this.sheet.getRange(startRow, 1, 1, 1).getCell(1, 1);
  }
  getResultCells(player1, player2) {
    const startCell = this.getStartCell();
    const p1index = this.players.indexOf(player1) + 1;
    const p2index = this.players.indexOf(player2) + 1;
    return [startCell.offset(1 + p2index, p1index), startCell.offset(1 + p1index, p2index)];
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
      groupStartCell.offset(row, 0).setValue(row).setBackgroundColor("red").setFontColor("white)");
      groupStartCell.offset(row, 1).setValue(name).setBackgroundColor("yellow");
      groupStartCell.offset(row, 2).setNumberFormat("@STRING@").setValue(this.format(stats.setpoints)).setBackgroundColor("lightcyan");
      groupStartCell.offset(row, 3).setNumberFormat("@STRING@").setValue(this.format(stats.sets)).setBackgroundColor("lightgrey");
      groupStartCell.offset(row, 4).setNumberFormat("@STRING@").setValue(this.format(stats.matches)).setBackgroundColor("lightyellow");
      //groupStartCell.offset(row, 4).setValue(stats.ranking).setBackgroundColor("red").setFontColor("white")
    });
  }

  getPublishUrl(col, row, width, height) {
    const id = SpreadsheetApp.getActiveSpreadsheet().getId();
    const rangeAsString = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getRange(col, row, width, height).getA1Notation();
    const sheetId = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getSheetId();
    return `https://docs.google.com/spreadsheet/pub?key=${id}&chrome=false&gid=${sheetId}&widget=false&range=${rangeAsString}`;
  }
  initialize() {
    let groupStartCell = this.getStartCell();
    groupStartCell.setValue(this.name);
    groupStartCell = groupStartCell.offset(1, 0);
    for (let playerColumnIdx = 0; playerColumnIdx < this.players.length; playerColumnIdx++) {
      const cell = groupStartCell.offset(0, playerColumnIdx + 1);
      cell.setValue(this.players[playerColumnIdx]);
      cell.setBackgroundColor("yellow").setWrap(true);
    }
    for (let playerRowIdx = 0; playerRowIdx < this.players.length; playerRowIdx++) {
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
    const url = this.getPublishUrl(groupStartCell.getRowIndex(), groupStartCell.getColumnIndex(), this.players.length + 1, this.players.length + 1);
    groupStartCell.offset(this.players.length + 1, 0).setRichTextValue(getUrlAsRichtextValue("link", url));
    const resultStartCell = this.getResultStartCell();
    resultStartCell.offset(0, 2).setValue("Satzpunkte");
    resultStartCell.offset(0, 3).setValue("Sätze");
    resultStartCell.offset(0, 4).setValue("Spiele");
    const urlResult = this.getPublishUrl(resultStartCell.getRowIndex(), resultStartCell.getColumnIndex(), 5, this.players.length + 1);
    resultStartCell.offset(this.players.length + 1, 0).setRichTextValue(getUrlAsRichtextValue("link", urlResult));
    onMatchFormSubmit();
  }
}
function getUrlAsRichtextValue(name, url) {
  return SpreadsheetApp.newRichTextValue().setText(name).setLinkUrl(url).build();
}
function getGroupName(playerName) {
  const group = getPlayerGroups().groups.find(g => g.players.indexOf(playerName) >= 0);
  return group ? group.name : undefined;
}
function getGroupTable(spreadSheet, name) {
  let sheetGroup = spreadSheet.getSheetByName(SHEET_GROUP);
  return new GroupTable(sheetGroup, name);
}
function renderGroupStage() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();

  // Figures out how many players there are by skipping the empty cells.
  const allGroups = getPlayerGroups();
  let sheetGroup = ss.getSheetByName(SHEET_GROUP);
  sheetGroup.clear();
  allGroups.groups.forEach(group => {
    console.log("group", group.name, group.players.length);
    const groupTable = new GroupTable(sheetGroup, group.name);
    groupTable.initialize();
  });
}

function setMetaData(sheet, key, value) {
  const metaData = sheet.getDeveloperMetadata().find(d => d.getKey() === key);
  if (metaData) {
    metaData.setValue(value);
  }
  sheet.addDeveloperMetadata(key, value);
}

const startRegistrationMenu = {
  name: "Starte Registrierung",
  functionName: "startRegistrationPhase"
};
const startGroupPhaseMenu = {
  name: "Starte Gruppen Phase",
  functionName: "startGroupPhase"
};
const startKoPhaseMenu = {
  name: "Starte Ko Phase",
  functionName: "startKoPhase"
};
const updateSheet = {
  name: "Update Sheets",
  functionName: "updateSheets"
};
class TournamentState {
  constructor() {
    this._phase = getMetaData(SpreadsheetApp.getActiveSpreadsheet(), "PHASE") || "INITIAL";
  }
  updateMenu() {
    switch (this.phase) {
      case "INITIAL":
        this.createMenu([startRegistrationMenu]);
        break;
      case "REGISTRATION":
        this.createMenu([startGroupPhaseMenu, startKoPhaseMenu]);
        break;
      case "GROUP":
        this.createMenu([startKoPhaseMenu, updateSheet, startGroupPhaseMenu]);
        break;
      case "KO":
        this.createMenu([updateSheet, startGroupPhaseMenu]);
        break;
    }
  }
  set phase(phase) {
    this._phase = phase;
    setMetaData(SpreadsheetApp.getActiveSpreadsheet(), "PHASE", phase);
    this.updateMenu();
  }
  get phase() {
    return this._phase;
  }
  createMenu(items) {
    const menu = SpreadsheetApp.getUi().createAddonMenu();
    items.forEach(item => menu.addItem(item.name, item.functionName));
    menu.addToUi();
  }
  static getInstance() {
    return new TournamentState();
  }
}

function hasMetaData(sheet, key, value) {
  return getMetaData(sheet, key) === value;
}

const GROUP_MATCH_COUNT = "GROUP_MATCH_COUNT";
class MatchForm {
  switchToKo() {
    const results = this.createMatchResults();
    SpreadsheetApp.getActiveSpreadsheet();
    const sheet = this.getSheet();
    setMetaData(sheet, GROUP_MATCH_COUNT, results.length);
    const range = this.getSheet().getRange(1, 1, results.length, 4);
    range.setBackground("lightgreen");
  }
  get groupMatchCount() {
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
    Object.keys(groupResults).forEach(groupName => {
      const groupResult = groupResults[groupName];
      const groupTable = getGroupTable(ss, groupName);
      groupResult.allMatches.forEach(r => groupTable.addResult(r.player1, r.player2, r.result));
      getGroupTable(SpreadsheetApp.getActiveSpreadsheet(), groupName).addGroupResult(groupResult);
    });
  }
  getSheet() {
    return SpreadsheetApp.getActiveSpreadsheet().getSheets().find(s => hasMetaData(s, FORM_TYPE, FORM_TYPE_MATCH));
  }
  createMatchResults() {
    const sheet = this.getSheet();
    const range = sheet.getDataRange();
    const rows = range.getHeight();
    const startRow = TournamentState.getInstance().phase === "KO" ? this.groupMatchCount + 2 : 2;
    const matches = {};
    for (let row = startRow; row <= rows; row++) {
      const player1 = range.getCell(row, 2).getValue();
      const player2 = range.getCell(row, 3).getValue();
      const resultAsString = range.getCell(row, 4).getValue();
      const result = Result.fromString(resultAsString);
      if (result && result.valid) {
        matches[[player1, player2].sort().join("-")] = {
          player1,
          player2,
          result
        };
      }
    }
    return Object.values(matches);
  }
  createGroupResult() {
    const sheet = this.getSheet();
    const range = sheet.getDataRange();
    const rows = range.getHeight();
    const groupResults = {};
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
            const players = getPlayerGroups().getGroupByName(groupName1).players;
            groupResults[groupName1] = new GroupResult(players);
          }
          const groupResult = groupResults[groupName1];
          groupResult.addMatch(player1, player2, result);
        }
      }
    }
    Object.values(groupResults).forEach(g => g.init());
    return groupResults;
  }
  static getInstance() {
    return INSTANCE;
  }
}
const INSTANCE = new MatchForm();

const FORM_TYPE = "FORM_TYPE";
const FORM_TYPE_MATCH = "FORM_TYPE_MATCH";
const FORM_TYPE_REGISTRATION = "FORM_TYPE_REGISTRATION";
function onMatchFormSubmit() {
  MatchForm.getInstance().onMatchFormSubmit();
}

const DEV_DATA_FORM_ID = "FORM_ID";
function getCurrentSheets(ss) {
  return ss.getSheets().map(s => s.getName());
}
function getNewSheet(ss, currentSheets) {
  return ss.getSheets().find(s => currentSheets.indexOf(s.getName()) < 0);
}
function deleteFormSheet(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (sheet) {
    const formIdData = sheet.getDeveloperMetadata().find(m => m.getKey() == DEV_DATA_FORM_ID);
    if (formIdData) {
      const formId = formIdData.getValue();
      const form = FormApp.openById(formId);
      form.removeDestination();
      DriveApp.getFileById(formId).setTrashed(true);
      Logger.log("deleted  form " + formId);
    }
    ss.deleteSheet(sheet);
    Logger.log("deleted sheet" + name);
  } else {
    Logger.log("cannot find sheet with form by name " + name);
  }
}
function createMatchForm() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = ss.getName() + " Match Formular";
  const sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    return;
  }

  // deleteFormSheet(ss, sheetName);
  const currentSheets = getCurrentSheets(ss);
  const playerGroups = getPlayerGroups();
  let players = playerGroups.players;
  var form = FormApp.create(ss.getName() + " Match Formular");
  form.setDescription("Melde ein Ergebnis oder einen Spieltermin");
  form.addListItem().setTitle("Spieler/Team 1").setChoiceValues(players);
  form.addListItem().setTitle("Spieler/Team 2").setChoiceValues(players);
  var textValidation = FormApp.createTextValidation().requireTextMatchesPattern("[0-7]:[0-7][ ,]+[0-7]:[0-7]([ ,]+[0-9]+:[0-9]+)?").setHelpText("Ergebnis ist nicht richtig formatiert:  0:6 6:0 11:9").build();
  form.addTextItem().setValidation(textValidation).setTitle("Ergebnis");
  form.addDateTimeItem().setTitle("Spieldatum");
  Logger.log("Published URL: " + form.getPublishedUrl());
  Logger.log("Editor URL: " + form.getEditUrl());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  const newSheet = getNewSheet(ss, currentSheets);
  newSheet.setName(sheetName);
  newSheet.addDeveloperMetadata(DEV_DATA_FORM_ID, form.getId());
  newSheet.addDeveloperMetadata(FORM_TYPE, FORM_TYPE_MATCH);
}
function createRegistrationForm() {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = ss.getName() + " Registrierungs Formular";
  const sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    return;
  }
  deleteFormSheet(ss, sheetName);
  const currentSheets = getCurrentSheets(ss);
  var form = FormApp.create(ss.getName() + " Registrierungs Formular");
  var item = form.addTextItem();
  item.setTitle("Name");
  form.addCheckboxItem().setTitle("Abmelden");
  form.setAllowResponseEdits(true);
  Logger.log("Published URL: " + form.getPublishedUrl());
  Logger.log("Editor URL: " + form.getEditUrl());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  const newSheet = getNewSheet(ss, currentSheets);
  newSheet.setName(sheetName);
  newSheet.addDeveloperMetadata(DEV_DATA_FORM_ID, form.getId());
  newSheet.addDeveloperMetadata(FORM_TYPE, FORM_TYPE_REGISTRATION);
}

function createSheetIfNecessary(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(name);
  }
}

function onInstall(e) {
  start();
}
function start() {
  Logger.log("start");
  TournamentState.getInstance().updateMenu();
  Logger.log("end");
}
function onOpen() {
  // PROBABLY NEVER CALLED
  TournamentState.getInstance().updateMenu();
}
function startRegistrationPhase() {
  createRegistrationForm();
  TournamentState.getInstance().phase = "REGISTRATION";
}
function startGroupPhase() {
  createSheetIfNecessary(SHEET_GROUP);
  createSheetIfNecessary(SHEET_PLAYERS);
  createMatchForm();
  renderGroupStage();
  TournamentState.getInstance().phase = "GROUP";
}
function startKoPhase() {
  createSheetIfNecessary(SHEET_BRACKET);
  MatchForm.getInstance().switchToKo();

  // mark position in player group when ko starts

  renderBracket();
  TournamentState.getInstance().phase = "KO";
}
function updateSheets() {
  MatchForm.getInstance().onMatchFormSubmit();
}
