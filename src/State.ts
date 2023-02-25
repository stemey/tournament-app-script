import { getMetaData } from "./utils/getMetaData";
import { setMetaData } from "./utils/setMetaData";

const startRegistrationMenu = {
  name: "Starte Registrierung",
  functionName: "startRegistrationPhase",
};
const startGroupPhaseMenu = {
  name: "Starte Gruppen Phase",
  functionName: "startGroupPhase",
};
const startKoPhaseMenu = {
  name: "Starte Ko Phase",
  functionName: "startKoPhase",
};
const updateSheet = { name: "Update Sheets", functionName: "updateSheets" };

export type Phase = "INITIAL" | "REGISTRATION" | "GROUP" | "KO";

export class TournamentState {
  private declare _phase: Phase;
  constructor() {
    this._phase =
      getMetaData(SpreadsheetApp.getActiveSpreadsheet(), "PHASE") || "INITIAL";
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
    items.forEach((item) => menu.addItem(item.name, item.functionName));
    menu.addToUi();
  }

  static getInstance() {
    return new TournamentState();
  }
}
