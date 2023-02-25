namespace Module {
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
  const updateMenu = { name: "Update Sheets", functionName: "updateSheets" };

  export type Phase = "INITIAL" | "REGISTRATION" | "GROUP" | "KO";

  export class TournamentState {
    private _phase: Phase;
    constructor() {
      this._phase =
        Module.getMetaData(SpreadsheetApp.getActiveSpreadsheet(), "PHASE") ||
        "INITIAL";
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
          this.createMenu([startKoPhaseMenu, updateMenu, startGroupPhaseMenu]);
          break;
        case "KO":
          this.createMenu([updateMenu, startGroupPhaseMenu]);
          break;
      }
    }

    set phase(phase) {
      this._phase = phase;
      SpreadsheetApp.getActiveSpreadsheet().addDeveloperMetadata(
        "PHASE",
        phase
      );
      this.updateMenu();
    }

    get phase() {
      return this._phase;
    }

    createMenu(items) {
      SpreadsheetApp.getActiveSpreadsheet().addMenu("Turnier", items);
    }

    static getInstance() {
      return new TournamentState();
    }
  }

}
