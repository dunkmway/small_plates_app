// include this file if the page requires the firebase user
// the authenticatedCallback and the not_authenticatedCallback need to be set

let _FIREBASE_AUTH_UNSUBSCRIBE = null;

function InitializeAuth(
  authenticatedCallback = () => {},
  args1,
  not_authenticatedCallback = () => {},
  args2
) {
  // clean up any listeners set up before this
  CleanUpAuth();

  // set the new listener with the given callbacks
  _FIREBASE_AUTH_UNSUBSCRIBE = firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      authenticatedCallback(user, ...args1);
    } else {
      not_authenticatedCallback(...args2);
    }
  });
}

function CleanUpAuth() {
  if (_FIREBASE_AUTH_UNSUBSCRIBE) {
    _FIREBASE_AUTH_UNSUBSCRIBE();
    _FIREBASE_AUTH_UNSUBSCRIBE = null;
  }
}

function signOut() {
  firebase.auth().signOut().then(() => {
    window.location.href = getCurrentOrigin() + `/sign-in.html`;
  }).catch((error) => {
    console.log(error);
  });
}