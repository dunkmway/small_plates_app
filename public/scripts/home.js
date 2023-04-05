const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const DB = firebase.firestore();
let USER = null;

async function main() {
  console.log("In main")
  
  // start auth listener
  InitializeAuth(authenticatedCallback, [], () => {}, []);

  // get the user entries
  const userFromURL = window.location.pathname.split('/')[2];
  const entries = await getListOfEntries(userFromURL);
  entries.forEach(entryDoc => renderEntryElement(entryDoc));

  // get shared entries
}

function authenticatedCallback(user) {
  console.log('Auth callback called')
  USER = user;
  // firestore rules should stop unauthorized access to entries not owned by user
}

function not_authenticatedCallback() {
  // the user is signed out so send them back to the sign in page
  location.href = getCurrentOrigin() + "/sign-in.html";
}

async function getListOfEntries(userUID) {
  try {
    return (await DB.collection('entries')
    .where('user', '==', userUID)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get()).docs;
  }
  catch(error) {
    console.log(error);
    return [];
  }
}

function renderEntryElement(entryDoc) {
  const wrapper = document.getElementById('entryList');

  const entryID = entryDoc.id;
  const entryData = entryDoc.data();
  
  const entry = document.createElement('a');
  entry.href = `../entry?entry=${entryID}`;
  entry.id = `entry_${entryID}`;
  entry.className = 'entry';
  entry.innerHTML = `
    <div>
      <p class="title">${entryData.title}</p>
      <p class="date">Enscribed at ${new Time(entryData.createdAt.toDate()).toFormat('{MM}/{dd}/{yy} {hh}:{mm} {A}')}</p>
    </div>
  `;

  wrapper.appendChild(entry);
}