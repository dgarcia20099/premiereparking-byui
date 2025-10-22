import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ---- Your Firebase Config ----
const firebaseConfig = {
  apiKey: "AIzaSyCeplZekSipbWNkqHb-RKkx_Mf1ej6Vw94",
  authDomain: "premiereparking-byui.firebaseapp.com",
  projectId: "premiereparking-byui",
  storageBucket: "premiereparking-byui.firebasestorage.app",
  messagingSenderId: "647803420973",
  appId: "1:647803420973:web:e16053d1097b5de25513a4",
  measurementId: "G-5LSD89X6QT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const parkingLot = document.getElementById('parkingLot');

// --- Create 15 parking spots ---
for (let i = 1; i <= 15; i++) {
  const spot = document.createElement('div');
  spot.classList.add('spot');
  spot.textContent = i;
  spot.id = `spot-${i}`;
  parkingLot.appendChild(spot);
}

// --- Auth ---
loginBtn.onclick = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    userInfo.textContent = `Logged in as: ${user.displayName}`;
  } else {
    currentUser = null;
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
  }
});

// --- Firestore real-time updates ---
for (let i = 1; i <= 15; i++) {
  const spotRef = doc(db, "parkingSpots", `spot-${i}`);
  onSnapshot(spotRef, (docSnap) => {
    const spotDiv = document.getElementById(`spot-${i}`);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.occupiedBy) {
        if (currentUser && data.occupiedBy === currentUser.uid) {
          spotDiv.className = "spot mine";
          spotDiv.textContent = `#${i}\nYour Car`;
        } else {
          spotDiv.className = "spot occupied";
          spotDiv.textContent = `#${i}\nTaken`;
        }
      } else {
        spotDiv.className = "spot";
        spotDiv.textContent = i;
      }
    } else {
      // initialize document
      setDoc(spotRef, { occupiedBy: null });
    }
  });
}

// --- Click Handling ---
parkingLot.addEventListener('click', async (e) => {
  if (!currentUser) {
    alert("Please sign in first.");
    return;
  }

  if (!e.target.classList.contains('spot')) return;

  const spotId = e.target.id;
  const spotRef = doc(db, "parkingSpots", spotId);
  const docSnap = await getDoc(spotRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    if (data.occupiedBy === null) {
      // take the spot
      await updateDoc(spotRef, { occupiedBy: currentUser.uid });
    } else if (data.occupiedBy === currentUser.uid) {
      // free the spot
      await updateDoc(spotRef, { occupiedBy: null });
    } else {
      alert("This spot is taken!");
    }
  }
});
