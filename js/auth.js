// js/auth.js
import { auth, db } from './firebase.js'; 
import { 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elements
const loginForm = document.getElementById('login-form');
const googleBtn = document.querySelector('.google-auth');
const authMessage = document.getElementById('auth-message');

// Password Toggle Elements
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');

// --- 1. Password Show/Hide Functionality ---
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        // Type check karein: Password hai toh Text karein, Text hai toh Password
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Icon change karein (Eye vs Eye-Slash)
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// --- Status Message Function ---
const showStatus = (text, isError = true) => {
    if (!authMessage) {
        console.log("Status:", text); 
        return;
    }
    authMessage.textContent = text;
    authMessage.className = `auth-message ${isError ? 'error' : 'success'}`; 
    authMessage.classList.remove('hidden');
};

// --- 2. GOOGLE LOGIN ---
if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
        e.preventDefault(); 
        console.log("Google Button Clicked"); 

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Database update
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                lastLogin: serverTimestamp()
            }, { merge: true });

            showStatus(`Welcome ${user.displayName}! Redirecting...`, false);
            
            setTimeout(() => {
                // ✅ FIXED PATH HERE (Sirf index.html)
                window.location.href = "index.html"; 
            }, 1500);

        } catch (error) {
            console.error("Google Error:", error);
            showStatus(`Google Login Failed: ${error.message}`);
        }
    });
}

// --- 3. EMAIL/PASSWORD LOGIN ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form Submitted"); 

        const emailField = document.getElementById('email');
        const passField = document.getElementById('password');
        const loginBtn = loginForm.querySelector('button[type="submit"]');

        if (!emailField || !passField) {
            console.error("Inputs not found");
            return;
        }

        try {
            // Button loading state
            const originalBtnText = loginBtn.innerHTML;
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';

            // Firebase Login Call
            await signInWithEmailAndPassword(auth, emailField.value, passField.value);
            
            showStatus("Login Successful! Redirecting...", false);
            
            setTimeout(() => {
                // ✅ FIXED PATH HERE TOO (Sirf index.html)
                window.location.href = "index.html"; 
            }, 1000);

        } catch (error) {
            console.error("Login Error Full Object:", error); 
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = `<span>Sign In to Account</span> <i class="fas fa-arrow-right"></i>`;

            // User friendly errors
            let msg = "Login failed.";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
                msg = "Incorrect Email or Password.";
            } else if (error.code === 'auth/too-many-requests') {
                msg = "Too many failed attempts. Try again later.";
            } else if (error.code === 'auth/network-request-failed') {
                msg = "Network error. Check your internet.";
            }
            
            showStatus(msg);
        }
    });
}
