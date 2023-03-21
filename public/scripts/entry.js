// TODO: we can add a class to the body to show a page wide error message
// TODO: we can add a class to the body to show a page wide loading screen

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const DB = firebase.firestore();
let USER = null;
let ENTRY_DOC = null;

async function main() {
  _console.log("In main")
  // get the Entry Doc
  ENTRY_DOC = await getEntryDoc();

  // start auth listener
  InitializeAuth(authenticatedCallback, [], () => {}, []);
}

function authenticatedCallback(user) {
  _console.log('Auth callback called')
  USER = user;
  // we really only need the user if we are creating a new entry
  // firestore rules should stop unauthorized access to entries not owned by user
}

function not_authenticatedCallback() {
  // the user is signed out so send them back to the sign in page
  location.href = getCurrentOrigin() + "/sign-in.html";
}

async function getEntryDoc() {
  const entryID = params.entry;
  if (!entryID) {
    // this happens for new entries
    // do nothing we will create and save one later
    return null;
  }

  try {
    const doc = await DB.collection('entries').doc(params.entry).get();
    if (doc.exists) {
      return doc;
    } else {
      return null;
    }
  } catch (error) {
    // failed to fetch doc
    // either an unauthorized request
    // or a server issue
    // either way give an error
    _console.log(error, false);
    document.body.classList.add('error');
  }
}

async function saveEntry(e) {
  e.preventDefault();
  // get the form entries
  const form = e.target;

  const formData = Object.fromEntries(new FormData(form).entries());
  formData.user = USER.uid;
  _console.log(formData, false);

  // if we have the document then update it
  // if not then create a new 
  try {
    if (ENTRY_DOC) {
      await ENTRY_DOC.ref.update(formData);
    } else {
      await DB.collection('entries').doc().set(formData);
    }
    Dialog.toastMessage('Entry Saved!')
  } catch (error) {
    _console.log(error, false);
    Dialog.toastError('We are having an issue saving this entry.');
  }

}

function cancelEntry() {
  // close the page and go back to the home page
  location.href = getCurrentOrigin() + `/home/${USER.uid}`;
}