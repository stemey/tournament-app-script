namespace Module {
  const DEV_DATA_FORM_ID = "FORM_ID";
  function getCurrentSheets(ss) {
    return ss.getSheets().map((s) => s.getName());
  }

  function getNewSheet(ss, currentSheets) {
    return ss.getSheets().find((s) => currentSheets.indexOf(s.getName()) < 0);
  }

  function deleteFormSheet(ss, name) {
    const sheet = ss.getSheetByName(name);

    if (sheet) {
      const formIdData = sheet
        .getDeveloperMetadata()
        .find((m) => m.getKey() == DEV_DATA_FORM_ID);
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

  export function createMatchForm() {
    let ss = SpreadsheetApp.getActiveSpreadsheet();

    const sheetName = ss.getName() + " Match Formular";

    deleteFormSheet(ss, sheetName);
    const currentSheets = getCurrentSheets(ss);

    const playerGroups = getPlayerGroups();
    let players = playerGroups.players;

    var form = FormApp.create(ss.getName() + " Match Formular");
    form.setDescription("Melde ein Ergebnis oder einen Spieltermin");
    form.addListItem().setTitle("Spieler/Team 1").setChoiceValues(players);
    form.addListItem().setTitle("Spieler/Team 2").setChoiceValues(players);

    var textValidation = FormApp.createTextValidation()
      .requireTextMatchesPattern(
        "[0-7]:[0-7][ ,]+[0-7]:[0-7]([ ,]+[0-9]+:[0-9]+)?"
      )
      .setHelpText("Ergebnis ist nicht richtig formatiert:  0:6 6:0 11:9")
      .build();
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

  export function createRegistrationForm() {
    let ss = SpreadsheetApp.getActiveSpreadsheet();

    const sheetName = ss.getName() + " Registrierungs Formular";

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
}
