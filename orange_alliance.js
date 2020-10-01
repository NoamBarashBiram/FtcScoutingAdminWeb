const apiUrl = "https://theorangealliance.org/api/",
    eventsReq = "event/",
    regionsReq = "regions",
    seasonsReq = "seasons",
    apiKey = "4b556f6ea48ead7cd14b6208256ff681aba10cb2c224ae41ec9a720a89aaaa38",
    appName = "FtcScoutingAdmin",
    header = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-TOA-Key": apiKey,
        "X-Application-Origin": appName
      }
    };

async function fetchOrange(orangeReq, quarries){
    /**
    * communicate with TOA api @link https://theorangealliance.org/apidocs
    * @param orangeReq sets the location to request
    * @param quarries an array of [key, value]s to pass in GET
    * @returns the response in JSON format
    **/

  let url = apiUrl + orangeReq;

  if (quarries != undefined){
    // Yay, quarries are present
    let first = true;
    for (quarry of quarries){
      if (first) {
        url += "?";
        // has to start with ?
        first = false;
      } else {
        url += "&";
        // there's already a quarry behind, so add &
      }
      url += quarry[0] + "=" + quarry[1];
      // here we actually add the quarry
    }
  }
  console.log("fetching " + url);
  // fetching...
  response = await fetch(url, header);
  // done
  return response.json();
}


var teams = [];

class Team {
  // an object to hold team data
  constructor(name) {
    this.name = name;
    this.quals = [];
    this.semis = [];
    this.finals = [];
  }

  addMatch(match){
    // add the match to the right list
    if (match.startsWith("Quals")){
      this.quals.push(match);
    } else if (match.startsWith("Semis")){
      this.semis.push(match);
    } else if (match.startsWith("Finals")){
      this.finals.push(match);
    } else {
      // that's not a match of any kind
      error = "An invalid match '" + match + "' detected. Aborting...";
      window.alert(error);
      throw error;
    }
  }

  getMatches(){
    /**
    * @returns all the matches played by this Team in the following order:
        quals, semi-finals, finals and scouting-pit
    **/
    let matches = this.quals; // add quals
    matches = matches.concat(this.semis); // then semis
    matches = matches.concat(this.finals); // finals
    matches = matches.concat(["Scouting Pit"]); // and scouting pit

    return matches;
  }
}

function registerMatch(matchName, participants) {
  /**
  * Registers a match with the name @param matchName to the participants
  * @param matchName - the match's Name
  * @param participants - an array with the names of the teams
  *                       that participate in the match
  **/
  let exists = [];
  // an array that holds for each participant whether it exists or not
  for (p in participants){
    exists.push(false);
    // initialize all values as false
  }
  for (i in participants){
    for (team of teams){
      if (team != undefined /* happens when the array is empty */){
        if (participants[i] == team.name){
          exists[i] = true;
          team.addMatch(matchName);
          break;
        }
      }
    }
  }
  /* psuedo code for the loop:
     for each participant, check whether it is one of the known teams
     if it is, set the corresponding index in exists to true and
     add the current match to the right team
  */

  for (i in exists){
    if (!exists[i]){
      team = new Team(participants[i]);
      team.addMatch(matchName);
      teams.push(team)
    }
  }
  // for each non-existing team, create it, add the current match to it
  // and append it to the teams array
}
