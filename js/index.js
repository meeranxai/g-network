import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 1. Sahi IDs Target Karein (Jo aapke HTML mein hain) ---
const navbarAvatar = document.getElementById('user-avatar'); // Aapka img id
const navbarName = document.getElementById('user-name');     // Aapka span id

// --- 2. Check User & Load Image ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Step A: Auth se naam dikhao (fast loading ke liye)
        if(navbarName) navbarName.textContent = user.displayName || "User";
        
        // Step B: Database se saved Photo (Base64) laao
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // --- IMAGE UPDATE ---
                if (navbarAvatar) {
                    // Pehle Base64 (jo crop karke save ki thi) check karo
                    if (data.photoBase64) {
                        navbarAvatar.src = data.photoBase64;
                    } 
                    // Agar wo nahi hai, to purani Google photoURL
                    else if (data.photoURL) {
                        navbarAvatar.src = data.photoURL;
                    }
                }
                
                // --- NAME UPDATE ---
                // Agar database mein naya display name hai to wo lagao
                if (data.displayName && navbarName) {
                    navbarName.textContent = data.displayName;
                }
            }
        } catch (error) {
            console.error("Error loading profile data:", error);
        }
    } else {
        // Agar user login nahi hai
        if (navbarName) navbarName.textContent = "Login";
        // window.location.href = "login.html"; // Redirect optional
    }
});