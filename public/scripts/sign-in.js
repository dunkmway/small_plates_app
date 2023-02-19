//form submission
document.getElementById('sign-in').addEventListener('submit', async (event) => {
  isLoading(true);
  event.preventDefault();
  const target = event.target;
  const signInData = Object.fromEntries(new FormData(target).entries())
  const errorMsg = document.getElementById('error');

  errorMsg.innerText = '';
  errorMsg.hidden = true;

  firebase.auth().signInWithEmailAndPassword(signInData.email, signInData.password)
  .then((userCredential) => {
    // Signed in
    const user = userCredential.user;
    window.location.href = location.origin + `/home/${user.uid}`;
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode, errorMessage);
    errorMsg.textContent = error.message;
    errorMsg.hidden = false;
    isLoading(false);
  });
})

function isLoading(bool) {
  document.querySelector('main').className = bool ? 'loading' : '';
  document.querySelectorAll('button').forEach(button => button.disabled = bool);
}