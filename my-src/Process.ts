import { getPlayerGroups } from "./Code";
import { getMetaData } from "./utils/getMetaData";
import { hasMetaData } from "./utils/hasMetaData";
import { Result } from "./Result";


const FORM_TYPE ="FORM_TYPE";
const FORM_TYPE_MATCH ="FORM_TYPE_MATCH";
const FORM_TYPE_REGISTRATION ="FORM_TYPE_REGISTRATION";

export function onFormSubmit(e) {
  
  var range = e.range;
  const sheetType = getMetaData(range.getSheet(),FORM_TYPE)

  if (sheetType==FORM_TYPE_MATCH) {
    onMatchFormSubmit(e.range.getSheet())
  }
  Logger.log("form submit for "+range.getSheet().getName())

}

export function onMatchFormSubmit(submittedSheet) {

  const ss = SpreadsheetApp.getActiveSpreadsheet()

if (TOurnament.getInstance().phase==="KO") {
   const bracket = createBracket();
   bracket.addResults(createKoResult())
   return;
}
   //return

      const groupResults = createGroupResult();



   Object.keys(groupResults).forEach(groupName => {
     const groupResult = groupResults[groupName];
     const groupTable = getGroupTable(ss,groupName)
     groupResult.allMatches.forEach(r => groupTable.addResult(r.player1,r.player2,r.result))
     getGroupTable(SpreadsheetApp.getActiveSpreadsheet(),groupName).addGroupResult(groupResult);
   })
   
}

function createKoResult() {
    const sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheets().find(s => hasMetaData(s,FORM_TYPE,FORM_TYPE_MATCH));

   const range = sheet.getDataRange();
   const rows = range.getHeight();
  const matches = {}
   for (let row=2;row<=rows;row++) {
     const player1 = range.getCell(row,2).getValue();
     const player2 = range.getCell(row,3).getValue();
     const resultAsString = range.getCell(row,4).getValue();
     const result = Result.fromString(resultAsString);
     if (result && result.valid) {

       matches[[player1,player2].sort().join("-")]= {player1,player2,result};
       
     }
   }
   return Object.values(matches)
}


function createGroupResult() {
    const sheet =  SpreadsheetApp.getActiveSpreadsheet().getSheets().find(s => hasMetaData(s,FORM_TYPE,FORM_TYPE_MATCH));

   const range = sheet.getDataRange();
   const rows = range.getHeight();
   const columns = range.getWidth();
  const groupResults = {}
   for (let row=2;row<=rows;row++) {
     const player1 = range.getCell(row,2).getValue();
     const player2 = range.getCell(row,3).getValue();
     const resultAsString = range.getCell(row,4).getValue();
     const result = Result.fromString(resultAsString);
     if (result && result.valid) {
       
       const groupName1 = getGroupName(player1);
       const groupName2 = getGroupName(player2);
       if (groupName1===groupName2) {
         if (!groupResults[groupName1]) {
           const players = getPlayerGroups().find(g => g.name==groupName1).players;
           groupResults[groupName1]=new GroupResult(players);
         }
         const groupResult = groupResults[groupName1];
         groupResult.addMatch(player1,player2,result);
       }
     }
   }
   Object.values(groupResults).forEach(g => g.init());
   return groupResults
}




