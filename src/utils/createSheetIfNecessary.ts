export function createSheetIfNecessary(name: string) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);

  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(name);
  }
}
