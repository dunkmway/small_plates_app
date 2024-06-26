const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const DB = firebase.firestore();
let USER = null;

async function main() {
  console.log("In main")
  
  // start auth listener
  InitializeAuth(authenticatedCallback, [], () => {}, []);

  // user entires rendered after the auth callback ahs run

  // get shared entries
}

function authenticatedCallback(user) {
  console.log('Auth callback called')
  USER = user;
  // firestore rules should stop unauthorized access to entries not owned by user
  // _console.log(user)

  getListOfEntries(user.uid)
  .then(entries => {
    entries.forEach(entryDoc => renderEntryElement(entryDoc, null, 'entryList'));
  })

  getListOfFriendEntries(user.uid)
  .then(entries => {
    entries.forEach(entryDoc => {
      DB.collection('users').doc(entryDoc.data().user).get()
      .then(userDoc => {
        renderEntryElement(
          entryDoc,
          userDoc.data().firstName + ' ' + userDoc.data().lastName,
          'friendEntryList'
        )
      })
    });
  })
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

async function getListOfFriendEntries(userUID) {
  try {
    return (await DB.collection('entries')
    .where('friends', 'array-contains', userUID)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get()).docs;
  }
  catch(error) {
    _console.log(error);
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
      <p class="date">Enscribed on ${new Time(entryData.createdAt.toDate()).toFormat('{MM}/{dd}/{yy}')}</p>
    </div>
  `;

  wrapper.appendChild(entry);
}