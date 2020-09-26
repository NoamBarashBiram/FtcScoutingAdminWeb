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
  let url = apiUrl + orangeReq;
  if (quarries != undefined){
    let first = true;
    for (quarry of quarries){
      if (first) {
        url += "?";
        first = false;
      } else {
        url += "&";
      }
      url += quarry[0] + "=" + quarry[1];
    }
  }
  console.log("fetching " + url);
  response = await fetch(url, header);
  return response.json();
}


var teams = [];

class Team {
  constructor(name) {
    this.name = name;
    this.quals = [];
    this.semis = [];
    this.finals = [];
  }

  addMatch(match){
    if (match.startsWith("Quals")){
      this.quals.push(match);
    } else if (match.startsWith("Semis")){
      this.semis.push(match);
    } else if (match.startsWith("Finals")){
      this.finals.push(match);
    } else {
      error = "An invalid match '" + match + "' detected. Aborting...";
      window.alert(error);
      throw error;
    }
  }

  getMatches(){
    return this.quals.concat(this.semis.concat(this.finals.concat(["Scouting Pit"])));
  }
}

function registerMatch(matchName, participants) {
  let exists = [];
  for (p in participants){
    exists.push(false);
  }
  for (team of teams){
    if (team != undefined){
      for (i in participants){
        if (participants[i] == team.name){
          exists[i] = true;
          team.addMatch(matchName);
          break;
        }
      }
    }
  }

  for (i in exists){
    if (!exists[i]){
      team = new Team(participants[i]);
      team.addMatch(matchName);
      teams.push(team)
    }
  }
}
