const firebaseConfig = {
  apiKey: "AIzaSyCkewoeiIFGfcBO8BYog7o6-7yXWaXGbaw",
  authDomain: "my-small-plates.firebaseapp.com",
  projectId: "my-small-plates",
  storageBucket: "my-small-plates.appspot.com",
  messagingSenderId: "1066308350703",
  appId: "1:1066308350703:web:0b8b26f09c58fd0a60a11a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

if (location.hostname === "localhost") {
    // firebase.firestore && firebase.firestore().useEmulator("localhost", 8080);
    // firebase.functions && firebase.functions().useEmulator("localhost", 5001);
    // firebase.auth && firebase.auth().useEmulator("http://localhost:9099");
}