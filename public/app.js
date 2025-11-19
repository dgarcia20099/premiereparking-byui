import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const parkingLot = document.getElementById("parkingLot");

// --- Create 15 parking spots ---
for (let i = 1; i <= 15; i++) {
  const spot = document.createElement("div");
  spot.classList.add("spot");
  spot.textContent = i;
  spot.id = `spot-${i}`;
  parkingLot.appendChild(spot);
}

// --- Auth ---
loginBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
    localStorage.setItem("justLoggedIn", "true");
  } catch (error) {
    console.error("Login error:", error);
  }
};

logoutBtn.onclick = () => signOut(auth);

let currentUser = null;

// --- Handle login/logout state ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    userInfo.textContent = `Logged in as: ${user.displayName}`;

    if (localStorage.getItem("justLoggedIn") === "true") {
      localStorage.removeItem("justLoggedIn");
      location.reload();
    }
  } else {
    currentUser = null;
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
  }
});

// ---------------------------------------------------------------------
// 🚦 FUNCTION: Ensure each user can only occupy ONE parking spot
// ---------------------------------------------------------------------
async function tryOccupySpot(spotNumber, currentUser) {
  if (!currentUser) {
    alert("You must be logged in to reserve a spot.");
    return;
  }

  const spotsRef = collection(db, "parkingSpots");

  // Check if user already has a spot
  const q = query(spotsRef, where("occupiedBy", "==", currentUser.uid));
  const snap = await getDocs(q);

  if (!snap.empty) {
    alert("You already have a reserved parking spot.");
    return;
  }

  // OK to take the spot
  const spotRef = doc(db, "parkingSpots", `spot-${spotNumber}`);
  await updateDoc(spotRef, { occupiedBy: currentUser.uid });
}

// ---------------------------------------------------------------------
// 🔁 REAL-TIME LISTENERS FOR SPOTS
// ---------------------------------------------------------------------
for (let i = 1; i <= 15; i++) {
  const spotRef = doc(db, "parkingSpots", `spot-${i}`);

  onSnapshot(spotRef, (docSnap) => {
    const spotDiv = document.getElementById(`spot-${i}`);
    if (!spotDiv) return;

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
        // empty
        spotDiv.className = "spot empty";
        spotDiv.textContent = i;

        // Click to take spot
        spotDiv.onclick = () => tryOccupySpot(i, currentUser);
      }
    } else {
      setDoc(spotRef, { occupiedBy: null });
    }
  });
}