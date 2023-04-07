const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

let last_doc = {};

const DB = firebase.firestore();
let USER = null;

async function main() {
  // start auth listener
  InitializeAuth(authenticatedCallback, [], () => {}, []);
}

function authenticatedCallback(user) {
  USER = user;
  
  getFriendList(user.uid)
  .then(friendList => {
    // go through the list of friends
    friendList.forEach(friend => {
      // render the accordion
      renderFriendAccordian(friend);
      // get the list of entires for the friend
      getListOfEntries(friend.id)
      .then(entries => {
        // render the friend entries
        entries.forEach(entryDoc => renderEntryElement(entryDoc, `entryList_${friend.id}`));
      })
    })
  })
}

function renderFriendAccordian(friend) {
  const div = document.createElement('div');
  div.classList.add('ui', 'styled', 'fluid', 'accordion');
  div.innerHTML = `
    <div class="title">
      <i class="dropdown icon"></i>
      ${friend.name}
    </div>
    <div class="content">
      <div id="entryList_${friend.id}"></div>
      <button id="${friend.id}_button" style="margin-top: 1em;">Load More</button>
    </div>
  `
  document.getElementById('accordions').appendChild(div);
  document.querySelector(`#${friend.id}_button`).addEventListener('click', () => loadMore(friend.id))
  $('.ui.accordion').accordion();

}

function not_authenticatedCallback() {
  // the user is signed out so send them back to the sign in page
  location.href = getCurrentOrigin() + "/sign-in.html";
}

async function getFriendList(userUID) {
  // get the friends UIDs
  const friendQuery = await DB
  .collection('users').doc(userUID)
  .collection('friends')
  .get()

  const friendUIDs = friendQuery.docs.map(doc => doc.id);

  // connect to the the person's name
  const friendList = await Promise.all(friendUIDs.map(uid => {
    return DB.collection('users').doc(uid).get()
    .then(userDoc => {
      return {
        name: userDoc.data().firstName + ' ' + userDoc.data().lastName,
        id: userDoc.id
      }
    })
  }))

  friendList.sort((a,b) => {
    return a.name - b.name;
  })

  return friendList;
}

async function getListOfEntries(userUID) {
  try {
    let docs = [];
    if (last_doc[userUID]) {
      docs = (await DB.collection('entries')
      .where('user', '==', userUID)
      .where('friends', 'array-contains', USER.uid)
      .orderBy('createdAt', 'desc')
      .startAfter(last_doc[userUID])
      .limit(10)
      .get()).docs;
    } else {
      docs = (await DB.collection('entries')
      .where('user', '==', userUID)
      .where('friends', 'array-contains', USER.uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()).docs;
    }

    if (docs.length > 0) {
      last_doc[userUID] = docs[docs.length - 1];
    }

    return docs;
  }
  catch(error) {
    console.log(error);
    return [];
  }
}

function renderEntryElement(entryDoc, parent) {
  const wrapper = document.getElementById(parent);

  const entryID = entryDoc.id;
  const entryData = entryDoc.data();
  
  const entry = document.createElement('a');
  entry.href = `../entry?entry=${entryID}`;
  entry.id = `entry_${entryID}`;
  entry.className = 'entry';
  entry.innerHTML = `
    <div>
      <p class="entry_title">${entryData.title}</p>
      <p class="date">Enscribed at ${new Time(entryData.createdAt.toDate()).toFormat('{MM}/{dd}/{yy} {hh}:{mm} {A}')}</p>
    </div>
  `;

  wrapper.appendChild(entry);
}

async function loadMore(userUID) {
  const entryDocs = await getListOfEntries(userUID);
  entryDocs.forEach(doc => renderEntryElement(doc, `entryList_${userUID}`))
}