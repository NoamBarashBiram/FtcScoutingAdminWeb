var refernce, uid, database, selectedRegion, selectedSeason,
    selectedEventName, selectedEventKey;
var seasonSelect, regionSelect, eventSelect, configSnapshot, eventsSnapshot,
    eventAdditionDialog, eventsP, autoP, telOpP,
    fieldAdditionDialog, fieldType, fieldKind, fieldAdd, fieldName,
    fieldScore, fieldScoreContainer, fieldMinMax, fieldMin, fieldMax,
    fieldEntries, fieldEntriesContainer,
    auth, app;

const Modes = {
  EVENTS: 0,
  CONFIG: 1
};

function removeEvent(event){
  // removes an event with the name @param event
  if (window.confirm("Are you sure you want to delete " + event + "?")){
    refernce.child("Events").child(event).remove();
  }
}

function removeField(kind, index){
  // removes an event with the name @param event
  if (window.confirm("Are you sure you want to delete " + configSnapshot[kind][index].name + "?")){
    refernce.child("config").child(kind).child(index).remove();
  }
}

document.body.onload = function() {
  // initialize variables that hold key objects
  seasonSelect = document.getElementById("seasonSelect");
  regionSelect = document.getElementById("regionSelect");
  eventSelect  = document.getElementById("eventSelect");
  fieldAdditionDialog = document.getElementById("fieldAddition");
  fieldType = document.getElementById("fieldType");
  fieldAdd = document.getElementById("addField");
  fieldName = document.getElementById("fieldName");
  fieldScore = document.getElementById("fieldScore");
  fieldScoreContainer = document.getElementById("fieldScoreContainer");
  fieldMinMax = document.getElementById("fieldMinMax");
  fieldEntries = document.getElementById("fieldEntries");
  fieldEntriesContainer = document.getElementById("fieldEntriesContainer");
  fieldMax = document.getElementById("fieldMax");
  fieldMin = document.getElementById("fieldMin");
  eventAdditionDialog = document.getElementById("eventAddition");
  eventsP = document.getElementById("events");
  autoP = document.getElementById("auto");
  telOpP = document.getElementById("telop");
  auth = document.getElementById("auth");
  app = document.getElementById("app");
}

function addField(kind){
  if (![auto, telOp].includes(kind)) return;
  fieldKind = kind;
  fieldAdditionDialog.style.display = "block";
}

function validateMinMax(caller){
  max = parseInt(fieldMax.value);
  switch (caller){
    case 'min':
      if ( <= fieldMin.value){
        fieldMax.value += 1;
      }
  }
}

function validateField(){

}

function fieldTypeChanged(type){
  fieldMinMax.style.display = "none";
  fieldScoreContainer.style.display = "none";
  fieldEntriesContainer.style.display = "none"
  switch (type) {
    case Type.INTEGER:
      fieldMinMax.style.display = "block";
    case Type.BOOLEAN:
      fieldScoreContainer.style.display = "block";
      break;
    case Type.CHOICE:
      fieldEntriesContainer.style.display = "block";
  }
  validateField();
}

function closeFieldAddition(){
  // close modal and reset it
  fieldAdditionDialog.style.display = 'none';
  fieldName.value = "";
  fieldType.value = "tit"
}

function addEvent(){
  eventAdditionDialog.style.display = "block";
  fetchOrange(seasonsReq).then(data => {
    seasonSelect.innerHTML = "<option style='display: none'>Select Season</option>";
    for (season of Object.keys(data)){
      seasonKey = data[season].season_key;
      season = data[season].description;
      seasonSelect.innerHTML += "<option value='" + seasonKey + "'>" + season + "</option>";
    }
  });

  fetchOrange(regionsReq).then(data => {
    regionSelect.innerHTML = "<option style='display: none'>Select Region</option>";
    for (region of Object.keys(data)){
      regionKey = data[region].region_key;
      region = data[region].description;
      regionSelect.innerHTML += "<option value='" + regionKey + "'>" + region + "</option>";
    }
  });
}

function selected(){
  if (selectedRegion != undefined && selectedSeason != undefined){
    eventSelect.innerHTML = "<option>Loading from TOA...</option>";
    fetchOrange(eventsReq, [["season_key", selectedSeason], ["region_key", selectedRegion]])
    .then(data => {
      eventSelect.innerHTML = "<option style='display: none'>Select Event</option>";
      for (event of Object.keys(data)){
        eventKey = data[event].event_key;
        division = data[event].division_name;
        event = data[event].event_name;
        if (division != null){
          event += "- " + division + " Division";
        }
        eventSelect.innerHTML += "<option value='" + eventKey + "|" + event + "'>" + event + "</option>";
      }
    })
  }
}

function eventSelected(value){
  value = value.split("|");
  selectedEventName = value[1];
  selectedEventKey = value[0];
  document.getElementById("addEvent").disabled = false;
}

function setEvent(){
  closeEventAddition();
  // get the matches of selected event
  fetchOrange(eventsReq + selectedEventKey + "/matches")
    .then(data => {
      for (match of Object.values(data)){
        let participants = [];
        for (team of Object.values(match.participants)){
          // for each participant, create the name 'TEAMNAME #NUMBER'
          participants.push(team.team.team_name_short + " #" + team.team.team_number);
        }
        // register the match in the teams
        registerMatch(match.match_name, participants);
      }
      eventJSON = {};
      eventExists = Object.keys(eventsSnapshot).includes(selectedEventName);
      for (team of teams){
        let teamConfig = undefined;
        let fireTeam = fireKey(team.name);
        let unplayed = "";
        if (eventExists && Object.keys(eventsSnapshot[selectedEventName]).includes(fireTeam)){
          teamConfig = eventsSnapshot[selectedEventName][fireTeam];
          unplayed = teamConfig["unplayed"];
        }
        matches = team.getMatches();
        teamConfig = getNewConfig(matches.length, teamConfig);
        teamConfig["matches"] = matches.join(";");
        teamConfig["unplayed"] = unplayed;
        eventJSON[fireTeam] = teamConfig;

      }

      refernce.child("Events").child(selectedEventName).update(eventJSON);

      // reset teams for next event addition
      teams = [];
      selectedEventName = selectedEventKey = undefined;
    })
}

function closeEventAddition(){
  // close modal and reset it
  eventAdditionDialog.style.display = 'none';
  seasonSelect.innerHTML = regionSelect.innerHTML = '<option>Loading from TOA...</option>';
  eventSelect.innerHTML = '<option>Choose season and region</option>';
  selectedRegion = selectedSeason = undefined;
}

function updateUI(snapshot, mode){
  if (mode == Modes.EVENTS){
    // remove all events from the events, auto and telOp <p>
    eventsP.innerHTML = "";
    for (event of Object.keys(snapshot)){
      // add the events
      eventsP.innerHTML += "<div class='deleteable'>" + event +
                            "<span class='x' onclick=\"removeEvent('" + event + "')\">&#10006;</span>\
                            </div>";
    }
    eventsSnapshot = snapshot;
  } else if (mode == Modes.CONFIG){
    autoP.innerHTML = telOpP.innerHTML = "";
    configSnapshot = snapshot;
    if (readConfig()){
      console.log("Proceeding to UI");
      for (autoField of autoFields){
        autoP.innerHTML += "<div class='deleteable editable'>" + autoField.attrs.name +
                           ", "+ longTypes[autoField.type] +
                           stringify(autoField) +
                           "<span class='edit' onclick=\"editField(auto, " + autoField.index + ")\">&#x270E;</span>" +
                           "<span class='x' onclick=\"removeField(auto, " +autoField.index + ")\">&#10006;</span>\
                           </div>"
      }
      for (telOpField of telOpFields){
        telOpP.innerHTML += "<div class='deleteable editable'>" + telOpField.attrs.name +
                           ", "+ longTypes[telOpField.type] +
                           stringify(telOpField) +
                           "<span class='edit' onclick=\"editField(telOp, " + telOpField.index + ")\">&#x270E;</span>" +
                           "<span class='x' onclick=\"removeField(telOp, " +telOpField.index + ")\">&#10006;</span>\
                           </div>"
      }
    } else {
      console.log("Updateing Config");
      refernce.child("config").update(configSnapshot);
      return;
    }
  } else {
    console.error("Wrong mode, that's wierd");
  }
  if (configSnapshot != undefined){
    repair();
  }
}

function onInitialized(){
  // update the UI when something changes
  refernce.child("Events").on("value", function (snapshot) {
    // events changed
    updateUI(snapshot.val(), Modes.EVENTS);
  })
  refernce.child("config").on("value", function (snapshot) {
    // configuraton changed
    updateUI(snapshot.val(), Modes.CONFIG);
  })
}

// Web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCNrCAamjZKhf7q0Zras9vq3p1ZVnzu5BI",
    authDomain: "plantech-scouting.firebaseapp.com",
    databaseURL: "https://plantech-scouting.firebaseio.com",
    projectId: "plantech-scouting",
    storageBucket: "plantech-scouting.appspot.com",
    messagingSenderId: "181854697666",
    appId: "1:181854697666:web:a4c46a1b50b3906484a35b",
    measurementId: "G-PXCGFYP3HQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
database = firebase.database();

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    uid = user.uid;
    refernce = database.ref(uid);
    // hide the authentication part
    auth.style.display = "none";
    // show the acual UI
    app.style.display = "block";
    onInitialized();
  } else {
    // show the authentication part
    auth.style.display = "inline-block";
    // hide the app
    app.style.display = "none";
    // User is signed out.
  }
});

function signIn(email, password){
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(function(error) {
      // authentication failed
      // error codes start with "auth/", and supstring removes it
      window.alert(error.code.substr(5) + ": " + error.message);
    });
}
