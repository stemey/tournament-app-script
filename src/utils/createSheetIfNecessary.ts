import { VirtualRange } from "../VirtualRange";

export function createSheetIfNecessary(name: string) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);

}
