// TODO: we can add a class to the body to show a page wide error message
// TODO: we can add a class to the body to show a page wide loading screen

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const DB = firebase.firestore();
let USER = null;
let ENTRY_DOC = null;

async function main() {
  console.log("In main")
  // start auth listener
  InitializeAuth(authenticatedCallback, [], () => {}, []);

  // get the Entry Doc
  ENTRY_DOC = await getEntryDoc();

  // fill in the entry doc
  if (ENTRY_DOC) {
    document.getElementById('title').value = ENTRY_DOC.data().title;
    document.getElementById('content').value = ENTRY_DOC.data().content;

    updateFormDisabled(ENTRY_DOC, USER);
  }
}

function authenticatedCallback(user) {
  console.log('Auth callback called')
  USER = user;
  // we really only need the user if we are creating a new entry
  // firestore rules should stop unauthorized access to entries not owned by user

  // we will now set the access to the form depending on the user
  updateFormDisabled(ENTRY_DOC, USER);
}

function not_authenticatedCallback() {
  // the user is signed out so send them back to the sign in page
  location.href = getCurrentOrigin() + "/sign-in.html";
}

function updateFormDisabled(entry, user) {
  if (entry && user) {
    document.getElementById('title').disabled = entry.data().user != user.uid;
    document.getElementById('content').disabled = entry.data().user != user.uid;
  }
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
    console.log(error, false);
    document.body.classList.add('error');
    return null;
  }
}

async function saveEntry(e) {
  e.preventDefault();
  // get the form entries
  const form = e.target;

  const formData = Object.fromEntries(new FormData(form).entries());
  formData.user = USER.uid;
  console.log(formData);

  // if we have the document then update it
  // if not then create a new 
  try {
    if (ENTRY_DOC) {
      console.log('update')
      formData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await ENTRY_DOC.ref.update(formData);
    } else {
      console.log('create')
      formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      const newRef = DB.collection('entries').doc();
      await newRef.set(formData);
      window.location = getCurrentOrigin() + `/entry?entry=${newRef.id}`
    }
    Dialog.toastMessage('Entry Saved!')
  } catch (error) {
    console.log(error);
    Dialog.toastError('We are having an issue saving this entry.');
  }

}

function cancelEntry() {
  // close the page and go back to the home page
  location.href = getCurrentOrigin() + `/home/${USER.uid}`;
}