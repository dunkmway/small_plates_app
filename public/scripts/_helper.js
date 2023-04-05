function getCurrentOrigin() {
  if (location.host == "code.moraisfamily.com") {
    // add in the proxy
    return location.origin + "/proxy/5000";
  } else {
    return location.origin;
  }
}

function goHome() {
  window.location.href = `${getCurrentOrigin()}/home/${firebase.auth().currentUser.uid}`
}