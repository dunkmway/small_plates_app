//form submission
document.getElementById('sign-up').addEventListener('submit', async (event) => {
  isLoading(true);
  event.preventDefault();
  const target = event.target;
  const registrationData = Object.fromEntries(new FormData(target).entries())
  const errorMsg = document.getElementById('error');

  Dialog.alert(JSON.stringify(registrationData, null, 2));

  errorMsg.innerText = '';
  errorMsg.hidden = true;

  //verify that the passwords match
  if (registrationData.password != registrationData.confirmPassword) {
    errorMsg.textContent = 'Your password does not match';
    errorMsg.hidden = false;
    isLoading(false);
    return;
  }

  isLoading(false);
  return;

  //create the user account
  firebase.auth().createUserWithEmailAndPassword(registrationData.email.trim().toLowerCase(), registrationData.password)
  .then(async (userCredential) => {
    // Signed in 
    const user = userCredential.user;

    //update user profile
    user.updateProfile({
      displayName: registrationData.firstName.trim() + ' ' + registrationData.lastName.trim()
    })

    //set up their user profile
    await firebase.firestore().collection('Users').doc(user.uid).set({
      firstName: registrationData.firstName.trim(),
      lastName: registrationData.lastName.trim(),
      email: registrationData.email.trim().toLowerCase(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })

    // refresh the user token
    await user.getIdTokenResult(true);

    target.reset();

    isLoading(false);
    window.location.href = location.origin + `/${user.uid}`;
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage);

    Dialog.alert(error.message)
    isLoading(false);
  });
})

function isLoading(bool) {
  document.querySelector('main').className = bool ? 'loading' : '';
  document.querySelectorAll('button').forEach(button => button.disabled = bool);
}