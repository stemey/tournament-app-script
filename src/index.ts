import { renderBracket } from "./Bracket";
import { SHEET_BRACKET, SHEET_GROUP, SHEET_PLAYERS } from "./code";
import { createMatchForm, createRegistrationForm } from "./form";
import { renderGroupStage } from "./GroupTable";
import { TournamentState } from "./State";
import { createSheetIfNecessary } from "./utils/createSheetIfNecessary";

function onOpen() {
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


  // mark position in player group when ko starts


  renderBracket();
  TournamentState.getInstance().phase = "KO";
}

function updateSheets() {
  const phase = TournamentState.getInstance().phase;
  switch (phase) {
    case "GROUP":
      renderGroupStage();
      break;
    case "KO":
      renderBracket();
      break;
  }
}
