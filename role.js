// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3MRQClXo8PLY6ru636Rc3o2VpxvdmLKg",
  authDomain: "rcdnet.firebaseapp.com",
  projectId: "rcdnet",
  storageBucket: "rcdnet.appspot.com",
  messagingSenderId: "655017761227",
  appId: "1:655017761227:web:5a253c0328c5b67464be4e",
  measurementId: "G-XKJ9FNH4QW"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const auth = firebase.auth();
const db = firebase.firestore();

// Current user data
let currentUser = null;
let currentUserData = null;

// DOM elements
const loginModal = document.getElementById('loginModal');
const createAccountModal = document.getElementById('createAccountModal');
const loginForm = document.getElementById('loginForm');
const createAccountForm = document.getElementById('createAccountForm');
const loginError = document.getElementById('loginError');
const createAccountError = document.getElementById('createAccountError');
const showCreateAccount = document.getElementById('showCreateAccount');
const cancelCreateAccount = document.getElementById('cancelCreateAccount');

// Check auth state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // User is signed in
    currentUser = user;
    try {
      // Get additional user data from Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        currentUserData = userDoc.data();
        updateUIForUser(currentUserData);
        hideLoginModal();
        showMainContent();
        
        // Initialize the rest of your app
        initializeAppFeatures();
      } else {
        // User document doesn't exist - sign them out
        await auth.signOut();
        showLoginError("Your account is not properly configured. Please contact the director.");
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      await auth.signOut();
      showLoginError("Error loading your account. Please try again.");
    }
  } else {
    // No user is signed in
    currentUser = null;
    currentUserData = null;
    showLoginModal();
    hideMainContent();
  }
});

// Login form handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginError.style.display = 'none';
  } catch (error) {
    showLoginError(error.message);
  }
});

// Create account form handler (only for director)
createAccountForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('newUserEmail').value;
  const password = document.getElementById('newUserPassword').value;
  const role = document.getElementById('newUserRole').value;
  const name = document.getElementById('newUserName').value;
  
  try {
    // Verify the current user is a director
    if (!currentUserData || currentUserData.role !== 'director') {
      throw new Error('Only directors can create new accounts');
    }
    
    // First create the user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    
    // Then store additional user data in Firestore
    await db.collection('users').doc(userCredential.user.uid).set({
      email: email,
      role: role,
      name: name,
      createdBy: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    
    // Hide the create account modal and show success message
    hideCreateAccountModal();
    showLoginModal();
    alert('Account created successfully!');
    
    // Reset the form
    createAccountForm.reset();
  } catch (error) {
    showCreateAccountError(error.message);
  }
});

// Show create account modal (only for director)
showCreateAccount.addEventListener('click', (e) => {
  e.preventDefault();
  hideLoginModal();
  showCreateAccountModal();
});

// Cancel create account
cancelCreateAccount.addEventListener('click', () => {
  hideCreateAccountModal();
  showLoginModal();
});

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });
}

// Helper functions
function updateUIForUser(userData) {
  // Update user profile in the header
  document.querySelector('.user-name').textContent = userData.name;
  document.querySelector('.user-role').textContent = userData.role;
  
  // Show/hide features based on role
  if (userData.role === 'director') {
    document.getElementById('createAccountSection').style.display = 'block';
    // Show any director-only UI elements
  } else {
    document.getElementById('createAccountSection').style.display = 'none';
    // Hide director-only UI elements
  }
  
  // You can add more role-based UI updates here
}

function showLoginModal() {
  loginModal.style.display = 'block';
  loginForm.reset();
  loginError.style.display = 'none';
}

function hideLoginModal() {
  loginModal.style.display = 'none';
}

function showCreateAccountModal() {
  createAccountModal.style.display = 'block';
  createAccountForm.reset();
  createAccountError.style.display = 'none';
}

function hideCreateAccountModal() {
  createAccountModal.style.display = 'none';
}

function showMainContent() {
  document.querySelector('.container').style.display = 'flex';
}

function hideMainContent() {
  document.querySelector('.container').style.display = 'none';
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = 'block';
}

function showCreateAccountError(message) {
  createAccountError.textContent = message;
  createAccountError.style.display = 'block';
}

// Initialize app features after successful login
function initializeAppFeatures() {
  // Initialize all your other app functionality here
  // This will only run after successful authentication
  
  // Example: Load dashboard data
  loadDashboardData();
  
  // Example: Set up event listeners for your main app
  setupEventListeners();
}

function loadDashboardData() {
  // Your dashboard loading logic here
  console.log("Loading dashboard data for user:", currentUserData);
}

function setupEventListeners() {
  // Set up all your main app event listeners here
  console.log("Setting up app event listeners");
}

// Initialize the auth state check when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // This will trigger the onAuthStateChanged listener
});
