const DB = firebase.firestore();
const EXPIRATION_TIME = 30;
const CLEAN_UP_TIME = 15;

let USER = null;
let TIMER = null;

let connecter_snapshot = null;
let connectee_snapshot = null;

async function main() {
  // start auth listener
  InitializeAuth(authenticatedCallback, [], () => {}, []);
}

function authenticatedCallback(user) {
  USER = user;
}

function not_authenticatedCallback() {
  location.href = getCurrentOrigin() + "/sign-in.html";
}

function changeView(view) {
  uninitializeConnectee();
  uninitializeConnecter();

  switch(view) {
    case 'choice':
      document.getElementById('connecter').classList.add('hide');
      document.getElementById('connectee').classList.add('hide');

      document.getElementById('choice').classList.remove('hide');
      break;

    case 'connecter':
      document.getElementById('choice').classList.add('hide');
      document.getElementById('connectee').classList.add('hide');

      document.getElementById('connecter').classList.remove('hide');

      initializeConnecter();
      break;

    case 'connectee':
      document.getElementById('choice').classList.add('hide');
      document.getElementById('connecter').classList.add('hide');

      document.getElementById('connectee').classList.remove('hide');

      initializeConnectee();
      break;

    default:
  }
}

async function initializeConnecter() {
  // stop listening to any other docs
  if (connecter_snapshot) {
    connecter_snapshot();
    connecter_snapshot = null;
  }

  const {code, expiration} = setupCode();
  const collectionDocRef = await setupConnectionDoc(code, expiration);
  console.log(collectionDocRef.id);

  // start to listen to this new doc
  connecter_snapshot = collectionDocRef.onSnapshot(async (doc) => {
    // if we have a handshake and a connectee
    if (doc.data().handshake && doc.data().connectee) {
      // unsubscribe
      connecter_snapshot();
      connecter_snapshot = null;

      // add connectee to friends list
      await addToFriendList(doc.data().connectee);

      Dialog.toastMessage('Added Friend!')

      changeView('choice');
    }

    // if we got a confirmation handshake
    else if (doc.data().handshake) {
      // stop the timer
      if (TIMER) {
        TIMER.cleanUp();
        TIMER = null;
      }

      // set our UID to the connecter
      await doc.ref.update({
        connecter: USER.uid
      })
    }
  })
}

function uninitializeConnecter() {
  if (TIMER) {
    TIMER.cleanUp();
    TIMER = null;
  }
  if (connecter_snapshot) {
    connecter_snapshot();
    connecter_snapshot = null;
  }
}

function setupCode() {
  // set a new timer
  const now = new Date();
  const expiration = new Date(new Date().setSeconds(now.getSeconds() + EXPIRATION_TIME));
  TIMER = new Timer(expiration, initializeConnecter);

  // show the timer
  TIMER.attach(document.querySelector('#connecter .timer'));

  // set the code
  const code = getRandomSixDigitCode();
  renderCode(code);
  return {
    code,
    expiration
  }
}

async function setupConnectionDoc(code, expiration) {
  // we want to grab one doc where the cleanup date is set to some time in the past
  let connectionQuery = await DB.collection('connections')
  .where('cleanup', '<', new Date())
  .limit(1)
  .get();

  if (connectionQuery.size == 1) {
    connectionDoc = connectionQuery.docs[0];
    // we want to reserve this doc quickly so write to it immediately
    await connectionDoc.ref.set({
      code,
      expiration,
      cleanup: new Date(expiration.getTime() + (CLEAN_UP_TIME * 1000))
    })

    return connectionDoc.ref;

  } else {
    // we can create a new one
    const newRef = DB.collection('connections').doc();
    await newRef.set({
      code,
      expiration,
      cleanup: new Date(expiration.getTime() + (CLEAN_UP_TIME * 1000))
    });
    return newRef;
  }
}

function initializeConnectee() {
  Array.from(document.querySelectorAll("#connectee .code span")).forEach((span) => {
    span.textContent = '';
  })

  document.querySelector("#connectee .code span").focus();
}

function uninitializeConnectee() {
  if (connectee_snapshot) {
    connectee_snapshot();
    connectee_snapshot = null;
  }
}

function getRandomSixDigitCode() {
  return Math.floor(Math.random() * 999999).toString().padEnd(6, '0');
}

function renderCode(code) {
  Array.from(document.querySelectorAll("#connecter .code span")).forEach((span, index) => {
    span.textContent = code[index];
  })
}

function keyupCode(e) {
  const numbers = '1234567890';

  // cut the length down to 1
  if (e.target.textContent.length > 1) {
    e.target.textContent = e.target.textContent[0];
    selectElementContents(e.target);
  }

  if (e.key == 'Backspace') {
    if (e.target.previousElementSibling) {
      e.target.previousElementSibling.focus();
      selectElementContents(e.target.previousElementSibling);
    }
  } else if (numbers.includes(e.key)) {
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.focus();
    } else {
      submitCode();
    }
  } else {
    e.preventDefault();
    e.target.textContent = '';
  }
}

function selectElementContents(el) {
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

async function submitCode() {
  const code = getFullCode();

  // find the connection doc with this code
  const connectionQuery = await DB.collection('connections')
  .where('code', '==', code)
  .where('expiration', '>=', new Date())
  .limit(1)
  .get();

  // we found the connection so listen and make the handshake
  if (connectionQuery.size == 1) {
    const connectionDoc = connectionQuery.docs[0];
    connectee_snapshot = connectionDoc.ref.onSnapshot(async (doc) => {
      // if the handshake is made and the connecter has responded
      if (doc.data().handshake && doc.data().connecter) {
        // unsubscribe
        connectee_snapshot();
        connectee_snapshot = null;

        // respond to the connecter
        await doc.ref.update({
          connectee: USER.uid
        });
  
        // add connecter to friends list
        await addToFriendList(doc.data().connecter);

        Dialog.toastMessage('Added Friend!')

        changeView('choice');
      }
    })

    await connectionDoc.ref.update({
      handshake: true
    });
  } else {
    // show an error to the user
    Dialog.toastError('Invalid Code');

    initializeConnectee();
  }
}

function getFullCode() {
  return Array.from(document.querySelectorAll("#connectee .code span")).map(span => span.textContent).join('');
}

async function addToFriendList(userUID) {
  await DB.collection('users').doc(USER.uid)
  .collection('friends').doc(userUID).set({
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
}