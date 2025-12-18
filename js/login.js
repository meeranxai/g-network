import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log("Login button clicked!"); // Check karne ke liye

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful:", userCredential.user);
            
            // Redirect to home or profile
            window.location.href = "../index.html"; 

        } catch (error) {
            console.error("Login Error:", error.code);
            loginBtn.disabled = false;
            loginBtn.innerHTML = "Login";

            // Error alerts
            if (error.code === 'auth/invalid-credential') {
                alert("Ghalat Email ya Password!");
            } else if (error.code === 'auth/user-not-found') {
                alert("Is email par koi account nahi hai.");
            } else {
                alert("Login fail: " + error.message);
            }
        }
    });
} else {
    console.error("Login form not found! ID 'login-form' check karein.");
}