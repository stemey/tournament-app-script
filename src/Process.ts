import { MatchForm } from "./MatchForm";

export const FORM_TYPE = "FORM_TYPE";
export const FORM_TYPE_MATCH = "FORM_TYPE_MATCH";
export const FORM_TYPE_REGISTRATION = "FORM_TYPE_REGISTRATION";

export function installTournamentTriggers() {
  const existingTrigger = ScriptApp.getProjectTriggers().find(
    (t) => t.getHandlerFunction() === "onTournamentFormSubmit"
  );
  if (!existingTrigger) {
    ScriptApp.newTrigger("onTournamentFormSubmit")
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onFormSubmit()
      .create();
  }
}


export function onMatchFormSubmit() {
  MatchForm.getInstance().onMatchFormSubmit();
}
