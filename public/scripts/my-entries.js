const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let last_doc = null;

const DB = firebase.firestore();
let USER = null;

async function main() {
  // start auth listener
  InitializeAuth(authenticatedCallback, [], () => {}, []);
}

function authenticatedCallback(user) {
  USER = user;
  // firestore rules should stop unauthorized access to entries not owned by user
  // _console.log(user)

  getListOfEntries(user.uid)
  .then(entries => {
    entries.forEach(entryDoc => renderEntryElement(entryDoc, null, 'entryList'));
  })
}

function not_authenticatedCallback() {
  // the user is signed out so send them back to the sign in page
  location.href = getCurrentOrigin() + "/sign-in.html";
}

async function getListOfEntries(userUID) {
  try {
    let docs = [];
    if (last_doc) {
      docs = (await DB.collection('entries')
      .where('user', '==', userUID)
      .orderBy('createdAt', 'desc')
      .startAfter(last_doc)
      .limit(10)
      .get()).docs;
    } else {
      docs = (await DB.collection('entries')
      .where('user', '==', userUID)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()).docs;
    }

    if (docs.length > 0) {
      last_doc = docs[docs.length - 1];
    }

    return docs;
  }
  catch(error) {
    console.log(error);
    return [];
  }
}

function renderEntryElement(entryDoc, author, parent) {
  const wrapper = document.getElementById(parent);

  const entryID = entryDoc.id;
  const entryData = entryDoc.data();
  
  const entry = document.createElement('a');
  entry.href = `../entry?entry=${entryID}`;
  entry.id = `entry_${entryID}`;
  entry.className = 'entry';
  entry.innerHTML = `
    <div>
      <p class="title">${entryData.title}${author ? ' by ' + author: ''}</p>
      <p class="date">Enscribed at ${new Time(entryData.createdAt.toDate()).toFormat('{MM}/{dd}/{yy} {hh}:{mm} {A}')}</p>
    </div>
  `;

  wrapper.appendChild(entry);
}

async function loadMore() {
  const entryDocs = await getListOfEntries(USER.uid);
  entryDocs.forEach(doc => renderEntryElement(doc, null, 'entryList'))
}