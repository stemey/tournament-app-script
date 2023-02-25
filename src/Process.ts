import { MatchForm } from "./MatchForm";
import { getMetaData } from "./utils/getMetaData";

export const FORM_TYPE = "FORM_TYPE";
export const FORM_TYPE_MATCH = "FORM_TYPE_MATCH";
export const FORM_TYPE_REGISTRATION = "FORM_TYPE_REGISTRATION";

export function onFormSubmit(e: any) {
  var range = e.range as GoogleAppsScript.Spreadsheet.Range;
  const sheetType = getMetaData(range.getSheet(), FORM_TYPE);

  if (sheetType == FORM_TYPE_MATCH) {
    onMatchFormSubmit();
  }
  Logger.log("form submit for " + range.getSheet().getName());
}

export function onMatchFormSubmit() {
  MatchForm.getInstance().onMatchFormSubmit();
}
