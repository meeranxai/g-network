// ==========================================
// 1. IMPORTS
// ==========================================
import { auth, db } from './firebase.js'; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 2. DOM ELEMENTS CONFIGURATION
// ==========================================
const UI = {
    // Display Elements (Sidebar/Header)
    displayName: document.getElementById('display-name'),
    displayEmail: document.getElementById('display-email'),
    displayAvatar: document.getElementById('display-avatar'),
    joinDate: document.getElementById('join-date'),
    
    // Form Inputs
    form: document.getElementById('profile-edit-form'),
    inputs: {
        name: document.getElementById('edit-name'),
        bio: document.getElementById('edit-bio'),
        location: document.getElementById('edit-location'), // New Field
        github: document.getElementById('edit-github'),     // New Field
        linkedin: document.getElementById('edit-linkedin')  // New Field
    },
    
    // Actions
    logoutBtn: document.getElementById('danger-logout')
};

// ==========================================
// 3. MAIN LOGIC (Auth & Data Loading)
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Authorized User:", user.email);

        // A. Basic Info Setup
        if (UI.displayEmail) UI.displayEmail.textContent = user.email;
        
        // B. Smart Avatar System (Agar photo nahi hai to Naam ka letter use karega)
        if (UI.displayAvatar) {
            const avatarUrl = user.photoURL 
                ? user.photoURL 
                : `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=6366f1&color=fff&size=128`;
            UI.displayAvatar.src = avatarUrl;
        }

        // C. Fetch Advanced Data from Firestore
        try {
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                populateProfile(data); // Data ko form mein bharo
            } else {
                // First Time User: Auto Create Profile
                console.log("Creating fresh profile...");
                const newProfile = {
                    uid: user.uid,
                    displayName: user.displayName || "New Member",
                    email: user.email,
                    bio: "",
                    location: "",
                    socials: { github: "", linkedin: "" },
                    createdAt: serverTimestamp()
                };
                await setDoc(userDocRef, newProfile);
                populateProfile(newProfile);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            alert("Failed to load profile data.");
        }

    } else {
        // Not Logged In -> Redirect
        window.location.href = "./login.html";
    }
});

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

// Form aur Sidebar mein data bharne ka function
function populateProfile(data) {
    // Sidebar Update
    if (UI.displayName) UI.displayName.textContent = data.displayName || "G-Network User";
    
    // Form Fields Update
    if (UI.inputs.name) UI.inputs.name.value = data.displayName || "";
    if (UI.inputs.bio) UI.inputs.bio.value = data.bio || "";
    if (UI.inputs.location) UI.inputs.location.value = data.location || "";
    
    // Social Links (Nested Object Check)
    const socials = data.socials || {};
    if (UI.inputs.github) UI.inputs.github.value = socials.github || "";
    if (UI.inputs.linkedin) UI.inputs.linkedin.value = socials.linkedin || "";

    // Join Date Formatting
    if (UI.joinDate && data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date();
        UI.joinDate.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
}

// ==========================================
// 5. SAVE DATA (Form Submission)
// ==========================================
if (UI.form) {
    UI.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) return;

        const saveBtn = UI.form.querySelector('.btn-save');
        const originalBtnText = saveBtn.innerHTML;

        try {
            // 1. UI Loading State
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // 2. Prepare Data Object
            const updatedData = {
                displayName: UI.inputs.name.value.trim(),
                bio: UI.inputs.bio.value.trim(),
                location: UI.inputs.location.value.trim(),
                socials: {
                    github: UI.inputs.github.value.trim(),
                    linkedin: UI.inputs.linkedin.value.trim()
                },
                lastUpdated: serverTimestamp()
            };

            // 3. Update Firestore
            await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });

            // 4. Update Sidebar Immediately (Without Refresh)
            if (UI.displayName) UI.displayName.textContent = updatedData.displayName;
            
            // 5. Avatar Refresh (In case name changed)
            if (UI.displayAvatar && !user.photoURL) {
                UI.displayAvatar.src = `https://ui-avatars.com/api/?name=${updatedData.displayName}&background=6366f1&color=fff&size=128`;
            }

            alert("Profile updated successfully!");

        } catch (error) {
            console.error("Save Error:", error);
            alert("Error saving profile: " + error.message);
        } finally {
            // Reset Button
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
        }
    });
}

// ==========================================
// 6. LOGOUT LOGIC
// ==========================================
if (UI.logoutBtn) {
    UI.logoutBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to log out?")) {
            signOut(auth).then(() => {
                window.location.href = "./index.html";
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        }
    });
}