const SHEET_PLAYERS = "Player Group";
const SHEET_BRACKET = "Bracket";
const SHEET_GROUP = "Group";
namespace Module {
  /**
   * Adds a custom menu item to run the script.
   */
  function onOpen() {
    TournamentState.getInstance().updateMenu();
  }

  export class AllGroups {
    getGroupByName(name: String) {
      return this.groups.find((g) => g.name === name);
    }
    constructor(readonly groups: PlayerGroup[]) {}
    get players() {
      return this.groups.reduce((players, group) => {
        players = players.concat(group.players);
        return players;
      }, [] as string[]);
    }
  }

  export class PlayerGroup {
    constructor(readonly players: string[], readonly name: string) {}
  }

  export function getPlayerGroups(): AllGroups {
    const groups: PlayerGroup[] = [];
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    let firstCell = ss.getRange(SHEET_PLAYERS + "!A1");
    let sheetControl = ss.getSheetByName(SHEET_PLAYERS);

    let firstColumn = firstCell.offset(0, 0, sheetControl.getMaxRows(), 1);
    let players = firstColumn.getValues();

    let numPlayers = 0;
    let currentGroup: PlayerGroup | undefined = undefined;
    for (let i = 0; i < players.length; i++) {
      if (!players[i][0] || players[i][0].length == 0) {
        currentGroup = undefined;
        continue;
      }
      if (!currentGroup) {
        console.log("new group", players[i][0]);
        currentGroup = new PlayerGroup([], players[i][0]);
        groups.push(currentGroup);
      } else {
        currentGroup.players.push(players[i][0]);
      }
    }
    return new AllGroups(groups);
  }
}
