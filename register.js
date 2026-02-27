// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZvzVnOYhbMqFm35Lj0lGvJYbIky8skHw",
  authDomain: "login-signup-215c4.firebaseapp.com",
  projectId: "login-signup-215c4",
  storageBucket: "login-signup-215c4.firebasestorage.app",
  messagingSenderId: "326038254841",
  appId: "1:326038254841:web:8689010aea49e2db939e28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle signup
const submit = document.getElementById('submit');
submit.addEventListener("click", function(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("✅ Account created successfully!");
      window.location.href="login.html";
    })
    .catch((error) => {
      alert("❌ " + error.message);
    });
});
