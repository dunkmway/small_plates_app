function signOut() {
  firebase.auth().signOut().then(() => {
    window.location.href = location.origin + `/sign-in.html`;
  }).catch((error) => {
    console.log(error);
  });
}