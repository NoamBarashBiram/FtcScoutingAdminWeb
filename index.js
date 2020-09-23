var refernce, uid, database;
function onInitialized(){
  refernce.on("value", function (snapshot) {
    console.log(snapshot.val());
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

firebase.auth().signOut();

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    uid = user.uid;
    refernce = database.ref(uid);
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "inline-block";
    onInitialized();
  } else {
    // User is signed out.
  }
});

function signIn(email, password){
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(function(error) {
      // Handle Errors here.
      window.alert(error.code.substr(5) + ": " + error.message);
    });
}
