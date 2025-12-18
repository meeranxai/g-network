import { auth, db } from './firebase.js'; 
import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. SARE ELEMENTS SELECT KIYE
// ==========================================

// --- HTML Elements (Display) ---
const displayNameEl = document.getElementById('display-name');
const displayEmailEl = document.getElementById('display-email');
const displayAvatarEl = document.getElementById('display-avatar');

// --- New Stats Elements (Views/Articles - YE NAYA HAI) ---
const viewsCountEl = document.getElementById('total-views-count');
const articlesCountEl = document.getElementById('total-articles-count');
const followersCountEl = document.getElementById('total-followers-count');

// --- Form Inputs (Edit Profile) ---
const editNameInput = document.getElementById('edit-name');
const editLocationInput = document.getElementById('edit-location');
const editBioInput = document.getElementById('edit-bio');
const editGithubInput = document.getElementById('edit-github');
const editLinkedinInput = document.getElementById('edit-linkedin');

// --- Buttons ---
const profileForm = document.getElementById('profile-edit-form');
const logoutBtn = document.getElementById('danger-logout');
const avatarUpload = document.getElementById('avatar-upload');

// --- Cropper Elements (YE RAHA CROPPER KA SAMAAN) ---
const cropModal = document.getElementById('crop-modal');
const imageToCrop = document.getElementById('image-to-crop');
const cropBtn = document.getElementById('crop-upload-btn');
const cancelBtn = document.getElementById('cancel-crop');

let currentUserUid = null;
let cropper = null; 

// ==========================================
// 2. AUTHENTICATION & DATA LOADING
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        displayEmailEl.textContent = user.email;
        displayNameEl.textContent = user.displayName || "User";
        
        // Purana Profile Data Load (Bio, Links, Image)
        await loadUserProfile(user.uid);

        // Naya Realtime Stats Load (Views & Articles) -> YE NAYA HAI
        loadRealtimeStats(user.uid);

    } else {
        window.location.href = "../login.html";
    }
});

// --- Function: Database se purana data lana ---
async function loadUserProfile(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Input boxes mein data bharna
            editNameInput.value = data.displayName || "";
            editLocationInput.value = data.location || "";
            editBioInput.value = data.bio || "";
            editGithubInput.value = data.github || "";
            editLinkedinInput.value = data.linkedin || "";
            
            if (data.displayName) displayNameEl.textContent = data.displayName;
            
            // Image Load Logic (Purana wala)
            if (data.photoBase64) {
                displayAvatarEl.src = data.photoBase64;
            } else if (data.photoURL) {
                displayAvatarEl.src = data.photoURL;
            }
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// ==========================================
// 3. TEXT DATA SAVE KARNA (BIO, NAME ETC)
// ==========================================
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = profileForm.querySelector('.btn-save');
        saveBtn.innerText = "Saving...";
        
        try {
            await updateDoc(doc(db, "users", currentUserUid), {
                displayName: editNameInput.value,
                location: editLocationInput.value,
                bio: editBioInput.value,
                github: editGithubInput.value,
                linkedin: editLinkedinInput.value,
            });

            // Firebase Auth Name bhi update karein
            await updateProfile(auth.currentUser, { displayName: editNameInput.value });
            displayNameEl.textContent = editNameInput.value;
            alert("Profile Updated!");

        } catch (error) {
            console.error(error);
        } finally {
            saveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Update Profile';
        }
    });
}

// ==========================================
// 4. IMAGE CROP & UPLOAD LOGIC (YE RAHA PURANA CODE)
// ==========================================
if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Image modal mein dikhana
                imageToCrop.src = e.target.result;
                cropModal.classList.remove('hidden');
                
                // Cropper start karna
                if (cropper) cropper.destroy();
                cropper = new Cropper(imageToCrop, { aspectRatio: 1, viewMode: 1 });
            };
            reader.readAsDataURL(file);
        }
        avatarUpload.value = '';
    });
}

// Cancel Button
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        cropModal.classList.add('hidden');
        if (cropper) cropper.destroy();
    });
}

// Save & Upload Button
if (cropBtn) {
    cropBtn.addEventListener('click', () => {
        if (!cropper) return;

        cropBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        cropBtn.disabled = true;

        // Image Crop karke Base64 banana
        const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
        const base64Image = canvas.toDataURL('image/jpeg', 0.6); 

        try {
            // Database mein save karna
            const userRef = doc(db, "users", currentUserUid);
            updateDoc(userRef, { 
                photoBase64: base64Image 
            }).then(() => {
                displayAvatarEl.src = base64Image;
                cropModal.classList.add('hidden');
                alert("Profile Picture Updated!");
            });

        } catch (error) {
            console.error("Save failed:", error);
            alert("Error: " + error.message);
        } finally {
            cropBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Crop & Upload';
            cropBtn.disabled = false;
            if (cropper) cropper.destroy();
        }
    });
}

// ==========================================
// 5. LOGOUT BUTTON
// ==========================================
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = "../login.html";
    });
}

// ==========================================
// 6. REALTIME STATS (VIEWS & ARTICLES) - YE NAYA HAI
// ==========================================
function loadRealtimeStats(uid) {
    // Database query: Is user ke saare articles dhundo
    const q = query(
        collection(db, "articles"), 
        where("authorUid", "==", uid)
    );

    // Live Listener: Jab bhi views badhenge, ye chalega
    onSnapshot(q, (snapshot) => {
        let totalArticles = 0;
        let totalViews = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            totalArticles++; // Article gino
            totalViews += (data.views || 0); // Views jodo
        });

        // HTML Update karna
        if(articlesCountEl) articlesCountEl.innerText = totalArticles;
        if(viewsCountEl) viewsCountEl.innerText = formatViews(totalViews);
        if(followersCountEl) followersCountEl.innerText = "0"; 
    });
}

// Helper: 1200 ko 1.2k banana
function formatViews(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
}