function onOpen() {
  Module.TournamentState.getInstance().updateMenu();
}

function startRegistrationPhase() {
  Module.createRegistrationForm();
  Module.TournamentState.getInstance().phase = "REGISTRATION";
}

function startGroupPhase() {
  Module.createGroupStage();
  Module.TournamentState.getInstance().phase = "GROUP";
}

function startKoPhase() {
  Module.renderBracket();
  Module.TournamentState.getInstance().phase = "KO";
}

function updateSheets() {
    
}
