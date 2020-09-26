var refernce, uid, database, selectedRegion, selectedSeason, selectedEventName, selectedEventKey;
var seasonSelect, regionSelect, eventSelect, configSnapshot;

const Modes = {
  EVENTS: 0,
  CONFIG: 1
};

function removeEvent(event){
  if (window.confirm("Are you sure you want to delete " + event + "?")){
    refernce.child("Events").child(event).remove();
  }
}

document.body.onload = function() {
  seasonSelect = document.getElementById("seasonSelect");
  regionSelect = document.getElementById("regionSelect");
  eventSelect  = document.getElementById("eventSelect");
}

function addEvent(){
  document.getElementById("myModal").style.display = "block";
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
  fetchOrange(eventsReq + eventKey + "/matches")
    .then(data => {
      closeModal();
      for (match of Object.values(data)){
        let participants = [];
        for (team of Object.values(match.participants)){
          participants.push(team.team.team_name_short + " #" + team.team.team_number);
        }
        registerMatch(match.match_name, participants);
      }
      console.log(teams[0].getMatches());
      teams = [];
    })
}

function updateUI(snapshot, mode){
  if (mode == Modes.EVENTS){
    // remove all events from the <div>
    document.getElementById("events").innerHTML = "";
    for (key of Object.keys(snapshot)){
      // add the events
      document.getElementById("events").innerHTML += "<div class='deleteable'>" + key + "<span class='x' onclick=\"removeEvent('" + key + "')\">&#10006;</span></div>";
    }
  } else if (mode == Modes.CONFIG){
    configSnapshot = snapshot;
    readConfig();
  } else {
    console.error("Wrong mode wtf");
  }
}

function onInitialized(){
  // update the UI when something changes
  refernce.child("Events").on("value", function (snapshot) {
    updateUI(snapshot.val(), Modes.EVENTS);
  })
  refernce.child("config").on("value", function (snapshot) {
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
    document.getElementById("auth").style.display = "none";
    // show the acual UI
    document.getElementById("app").style.display = "block";
    onInitialized();
  } else {
    // show the authentication part
    document.getElementById("auth").style.display = "inline-block";
    // hide the app
    document.getElementById("app").style.display = "none";
    // User is signed out.
  }
});

function signIn(email, password){
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(function(error) {
      // error codes start with "auth/", and supstring removes it
      window.alert(error.code.substr(5) + ": " + error.message);
    });
}

function closeModal(){
  document.getElementById('myModal').style.display = 'none';
  seasonSelect.innerHTML = regionSelect.innerHTML = '<option>Loading from TOA...</option>';
  eventSelect.innerHTML = '<option>Choose season and region</option>';
  selectedRegion = selectedSeason = selectedEventName = selectedEventKey = undefined
}
