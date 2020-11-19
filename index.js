var refernce, uid, database, selectedRegion, selectedSeason,
    selectedEventName, selectedEventKey;
var seasonSelect, regionSelect, eventSelect, configSnapshot, eventsSnapshot,
    eventAdditionDialog, eventsP, autoP, teleOpP, penaltyP,
    fieldAdditionDialog, fieldType, fieldKind, fieldAdd, fieldSave, fieldName,
    fieldScore, fieldScoreContainer, fieldIntOnly, fieldMin, fieldMax,
    fieldEntries, fieldEntriesContainer, fieldIndex, fieldDependency,
    autoDependencies, teleOpDependencies, penaltyDependencies,
    auth, app;

const selfScoringEvent = "__SelfScoring__";

const Modes = {
  EVENTS: 0,
  CONFIG: 1
};

function getDependencies(kind){
  switch(kind) {
    case auto:
      return autoDependencies;
    case teleOp:
      return teleOpDependencies;
    case penalty:
      return penaltyDependencies;
  }
  return null;
}

function addDependecy(kind, dependency){
  switch(kind) {
    case auto:
      autoDependencies += dependency;
      break;
    case teleOp:
      teleOpDependencies += dependency;
      break;
    case penalty:
      penaltyDependencies += dependency;
  }
}

function getFieldsP(kind) {
  switch(kind) {
    case auto:
      return autoP;
    case teleOp:
      return teleOpP;
    case penalty:
      return penaltyP;
  }
  return null;
}

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
  fieldSave = document.getElementById("saveField");
  fieldAdd = document.getElementById("addField");
  fieldName = document.getElementById("fieldName");
  fieldScore = document.getElementById("fieldScore");
  fieldScoreContainer = document.getElementById("fieldScoreContainer");
  fieldIntOnly = document.getElementById("fieldIntOnly");
  fieldEntries = document.getElementById("fieldEntries");
  fieldEntriesContainer = document.getElementById("fieldEntriesContainer");
  fieldMax = document.getElementById("fieldMax");
  fieldMin = document.getElementById("fieldMin");
  fieldDependency = document.getElementById("fieldDependency");
  eventAdditionDialog = document.getElementById("eventAddition");
  eventsP = document.getElementById("events");
  autoP = document.getElementById("auto");
  teleOpP = document.getElementById("teleop");
  penaltyP = document.getElementById("penalty");
  auth = document.getElementById("auth");
  app = document.getElementById("app");
}

function getNewFieldConf(){
  let fieldConf = {}
  fieldConf.name = fieldName.value;
  fieldConf.type = fieldType.value;
  fieldConf.dependency = fieldDependency.value;

  switch (fieldType.value){
    case Type.INTEGER:
      fieldConf.min = parseInt(fieldMin.value);
      fieldConf.max = parseInt(fieldMax.value);
      fieldConf.step = parseInt(fieldStep.value);
    case Type.BOOLEAN:
      fieldConf.score = parseInt(fieldScore.value);
      break;
    case Type.CHOICE:
      fieldConf.entries = fieldEntries.value;
  }
  return fieldConf;
}

function addField(kind){
  if (kind == undefined){
    let index = fieldKind == auto ? autoFields.length : teleOpFields.length;
    configSnapshot[fieldKind][index] = getNewFieldConf();
    closeFieldAddition();
    refernce.child("config").update(configSnapshot);
    return;
  }
  if (!fieldKinds.includes(kind)) return;
  fieldKind = kind;
  fieldDependency.innerHTML = getDependencies(kind);
  fieldAdditionDialog.style.display = "block";
  fieldAdd.style.display = "block";
}

function saveField(){
  let newConf = getNewFieldConf();
  let newName = newConf.name, prevName = configSnapshot[fieldKind][fieldIndex].name
  if (newName != prevName && newConf.type != Type.TITLE){
     // only update events if name changed and the field is not title (obviously)
    for (eventName of Object.keys(eventsSnapshot)){
      for (teamName of Object.keys(eventsSnapshot[eventName])){
        // take the previous value of this field
        let prevValue = eventsSnapshot[eventName][teamName][fieldKind][prevName];
        // assign it to the new name
        eventsSnapshot[eventName][teamName][fieldKind][newName] = prevValue;
        // and delete the previous
        eventsSnapshot[eventName][teamName][fieldKind][prevName] = null;
      }
    }
  }
  configSnapshot[fieldKind][fieldIndex] = newConf;
  closeFieldAddition();
  // update configuration before events so the repair mechanism doesn't delete
  // the seemingly redundent field and then reinitiate it with default values
  refernce.child("config").update(configSnapshot);
  refernce.child("Events").update(eventsSnapshot);
}


function editField(kind, index){
  fieldKind = kind;
  fieldIndex = index;
  field = getFieldByIndex(kind, index);
  fieldName.value = field.attrs.name;
  fieldType.value = field.type;
  switch (field.type){
    case Type.INTEGER:
      fieldMin.value = field.attrs.min;
      fieldMax.value = field.attrs.max;
      fieldStep.value = field.attrs.step;
    case Type.BOOLEAN:
      fieldScore.value = field.attrs.score;
      break;
    case Type.CHOICE:
      fieldEntries.value = field.attrs.entries;
  }
  fieldDependency.innerHTML = getDependencies(kind);
  fieldDependency.value = field.attrs.dependency;
  fieldAdditionDialog.style.display = fieldSave.style.display = "block";
  fieldTypeChanged(field.type);
}

function validateMinMax(caller){
  let max = parseInt(fieldMax.value);
  let min = parseInt(fieldMin.value);
  if (fieldMax.value != ""){
    fieldMax.value = max;
  }
  if (fieldMin.value != ""){
    fieldMin.value = min;
  }

  switch (caller){
    case 'min':
      if (max <= min){
        fieldMax.value = min + 1;
      }
      break;
    case 'max':
      if (min >= max){
        fieldMin.value = max - 1;
      }
  }
  validateField();
}

function validateField(){
  let valid = fieldName.value != "";
  switch (fieldType.value) {
    case Type.INTEGER:
      let min = fieldMin.value, max = fieldMax.value, step = fieldStep.value;
      valid = !(isNaN(min) || isNaN(max) || min == "" || max == "") && valid;
      valid = parseInt(max) >= parseInt(min) && valid
      valid = !(isNaN(step) || step == "") && valid;
      valid = parseInt(step) >= 1 && valid;
    case Type.BOOLEAN:
      valid = !(isNaN(fieldScore.value) || fieldScore.value == "") && valid;
      break;
    case Type.CHOICE:
      valid = fieldEntries.value.split(",").length > 1 && valid;
  }
  fieldSave.disabled = !(valid);
  valid &= getField(fieldKind, fieldName.value) == null;
  fieldAdd.disabled = !(valid);
}

function fieldTypeChanged(type){
  fieldIntOnly.style.display = "none";
  fieldScoreContainer.style.display = "none";
  fieldEntriesContainer.style.display = "none"
  switch (type) {
    case Type.INTEGER:
      fieldIntOnly.style.display = "block";
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
  fieldName.value = fieldEntries.value = "";
  fieldType.value = "tit";
  fieldMax.value = 1;
  fieldMin.value = fieldScore.value = 0;
  fieldScoreContainer.style.display = fieldEntriesContainer.style.display =
    fieldIntOnly.style.display = fieldAdd.style.display = fieldSave.style.display = "none";
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
  eventAdditionDialog.style.display = fieldAdd.style.display = 'none';
  seasonSelect.innerHTML = regionSelect.innerHTML = '<option>Loading from TOA...</option>';
  eventSelect.innerHTML = '<option>Choose season and region</option>';
  selectedRegion = selectedSeason = undefined;
}

function addSelfScoring(){
  teamName = fireKey(window.prompt("Set team name e.g. Plantech #17106"));
  if (teamName == ""){
    alert("No name was given. Aborting");
    return;
  }
  selfScoring = {};
  selfScoring[teamName] = {matches: ""};
  eventsSnapshot[selfScoringEvent] = selfScoring;
  refernce.child("Events").update(eventsSnapshot);
}

function updateUI(snapshot, mode){
  if (mode == Modes.EVENTS){
    // remove all events from the events, auto and teleOp <p>
    eventsP.innerHTML = "";
    hasSelfScoring = false;
    for (event of Object.keys(snapshot)){
      // add the events
      if (event == selfScoringEvent){
        // add the self-scoring event
        hasSelfScoring = true;
      } else {
        // add the regular event
        eventsP.innerHTML += "<div class='deleteable'>" + event +
                             "<span class='x' onclick=\"removeEvent('" + event + "')\">&#10006;</span>\
                              </div>";
      }
    }
    if (hasSelfScoring){
      eventsP.innerHTML += "<div class='deleteable'>Self Scoring- " + unFireKey(Object.keys(snapshot[selfScoringEvent])[0]) +
                           "<span class='x' onclick=\"removeEvent('" + selfScoringEvent + "')\">&#10006;</span>\
                            </div>";
    } else {
      eventsP.innerHTML += '<br><button onclick="addSelfScoring()" style="color:red" title="You haven\'t enabled the Self Scoring">Add Self Scoring</button>';
    }
    eventsSnapshot = snapshot;
  } else if (mode == Modes.CONFIG){
    autoP.innerHTML = teleOpP.innerHTML = penaltyP.innerHTML = "";
    configSnapshot = snapshot;
    autoDependencies = teleOpDependencies = penaltyDependencies = "<option value=''>Nothing</option>";
    if (readConfig()){
      console.log("Proceeding to UI");
      for (kind of fieldKinds) {
        let len = autoFields.length;
        fields = getFields(kind);
        for (field of fields){
          if (field.type == Type.BOOLEAN){
             addDependecy(kind, "<option value='_" + field.attrs.name + "'>" + field.attrs.name + "</option>" +
                             "<option value='!" + field.attrs.name + "'>Not " + field.attrs.name + "</option>")
          }
          getFieldsP(kind).innerHTML += "<div class='deleteable editable'>" + field.attrs.name +
                             ", "+ longTypes[field.type] +
                             stringify(field) +
                             (field.index == len - 1 ? "" :
                             "<span class='updown' onclick='moveDown(\"" + kind  + "\", " + field.index + ")'>&darr;</span>") +
                             (field.index == 0 ? "" :
                             "<span class='updown' onclick='moveUp(\"" + kind  + "\", " + field.index + ")'>&uarr;</span>") +
                             "<span class='edit' onclick='editField(\"" + kind  + "\", " + field.index + ")'>&#x270E;</span>" +
                             "<span class='x' onclick='removeField(\"" + kind  + "\", " +field.index + ")'>&#10006;</span>\
                             </div>"
        }
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
