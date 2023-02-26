import { renderBracket } from "./Bracket";
import {
  getPlayerGroups,
  invalidatePlayerGroups,
  SHEET_BRACKET,
  SHEET_GROUP,
  SHEET_PLAYERS,
} from "./code";
import { createMatchForm, createRegistrationForm } from "./form";
import { renderGroupStage } from "./GroupTable";
import { MatchForm } from "./MatchForm";
import {
  FORM_TYPE,
  FORM_TYPE_MATCH,
  installTournamentTriggers,
  onMatchFormSubmit,
} from "./Process";
import { TournamentState } from "./State";
import { createSheetIfNecessary } from "./utils/createSheetIfNecessary";
import { getMetaData } from "./utils/getMetaData";
import { VirtualRange } from "./VirtualRange";

function onInstall(e) {
  Logger.log("called install");
  start();
}

function onSidebar() {
  Logger.log("called onSidebar");
  var htmlOutput = HtmlService.createHtmlOutput(
    "<p>A change of speed, a change of style...</p>"
  );
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function start() {
  Logger.log("start");
  TournamentState.getInstance().updateMenu();
  onSidebar();
  Logger.log("end");
  installTournamentTriggers();
}

function onEdit(e) {
  if (e.range.getSheet().getName()===SHEET_PLAYERS) {
    Logger.log("edited players")
    rerenderSheets();
  }
}

function rerenderSheets() {
  startGroupPhase();
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

  const groups = getPlayerGroups();
  if (groups.groups.length===0) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PLAYERS);
    const players = new VirtualRange(1, 1, 7, 1);
    players.setValue("value", 0, 0, "Gruppe A");
    players.setValue("value", 1, 0, "Willi");
    players.setValue("value", 2, 0, "Hajo");
    players.setValue("value", 3, 0, "");
    players.setValue("value", 4, 0, "Gruppe B");
    players.setValue("value", 5, 0, "Albert");
    players.setValue("value", 6, 0, "Frank");
    players.render(sheet);
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet)
    Browser.msgBox("Bitte passe die Spielergruppen an");
    invalidatePlayerGroups();
  }


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

function onTournamentFormSubmit(e) {
  const range = e.range as GoogleAppsScript.Spreadsheet.Range;
  SpreadsheetApp.setActiveSpreadsheet(range.getSheet().getParent());
  const sheetType = getMetaData(range.getSheet(), FORM_TYPE);

  if (sheetType == FORM_TYPE_MATCH) {
    onMatchFormSubmit();
  }
  Logger.log("form submit for " + range.getSheet().getName());
}
