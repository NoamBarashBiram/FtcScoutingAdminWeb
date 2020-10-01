var refernce, uid, database, selectedRegion, selectedSeason,
    selectedEventName, selectedEventKey;
var seasonSelect, regionSelect, eventSelect, configSnapshot,
    modal, eventsDiv, auth, app;

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

document.body.onload = function() {
  // initialize variables that hold key objects
  seasonSelect = document.getElementById("seasonSelect");
  regionSelect = document.getElementById("regionSelect");
  eventSelect  = document.getElementById("eventSelect");
  modal = document.getElementById("myModal");
  eventsDiv = document.getElementById("events");
  auth = document.getElementById("auth");
  app = document.getElementById("app");
}

function addEvent(){
  modal.style.display = "block";
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
          event += "- " + division;
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
  // get the matches of selected event
  fetchOrange(eventsReq + eventKey + "/matches")
    .then(data => {
      closeModal();
      for (match of Object.values(data)){
        let participants = [];
        for (team of Object.values(match.participants)){
          // for each participant, create the name 'TEAMNAME #NUMBER'
          participants.push(team.team.team_name_short + " #" + team.team.team_number);
        }
        // register the match in the teams
        registerMatch(match.match_name, participants);
      }
      // reset teams for next event addition
      teams = [];
    })
}

function updateUI(snapshot, mode){
  if (mode == Modes.EVENTS){
    // remove all events from the events <div>
    eventsDiv.innerHTML = "";
    for (key of Object.keys(snapshot)){
      // add the events
      eventsDiv.innerHTML += "<div class='deleteable'>" + key + "<span class='x' onclick=\"removeEvent('" + key + "')\">&#10006;</span></div>";
    }
  } else if (mode == Modes.CONFIG){
    configSnapshot = snapshot;
    if (readConfig()){
      console.log("Proceeding to UI");
      for (autoField of autoFields){
        
      }
    } else {
      console.log("Updateing Config");
      refernce.child("config").update(configSnapshot);
    }
  } else {
    console.error("Wrong mode, that's wierd");
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

function closeModal(){
  // close modal and reset it
  modal.style.display = 'none';
  seasonSelect.innerHTML = regionSelect.innerHTML = '<option>Loading from TOA...</option>';
  eventSelect.innerHTML = '<option>Choose season and region</option>';
  selectedRegion = selectedSeason = selectedEventName = selectedEventKey = undefined;
}
