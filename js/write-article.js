import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- 1. DOM ELEMENTS (HTML se connection) ---
const articleForm = document.getElementById('article-form');
const titleInput = document.getElementById('article-title');
const categoryInput = document.getElementById('article-category');
const tagsInput = document.getElementById('article-tags');
const contentInput = document.getElementById('article-content');
const imageInput = document.getElementById('final-cover-base64'); // Hidden Base64 field
const publishBtn = document.getElementById('publish-btn');
const userInfo = document.getElementById('user-info');

let currentUser = null;

// --- 2. AUTH CHECK (Login hai ya nahi?) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // User ka naam dikhao top right corner mein
        if(userInfo) {
            userInfo.innerHTML = `<i class="fas fa-user-circle"></i> ${user.displayName || 'Writer'}`;
        }
    } else {
        // Agar login nahi hai, toh login page par bhejo
        alert("Session Expired. Please Login first.");
        window.location.href = "login.html";
    }
});

// --- 3. TOOLBAR FUNCTIONS (Bold, Italic, etc.) ---
// Hum buttons ko unke icon class se dhoond kar click event lagayenge
const formatButtons = [
    { selector: '.fa-bold', tag: 'b' },
    { selector: '.fa-italic', tag: 'i' },
    { selector: '.fa-underline', tag: 'u' },
    { selector: '.fa-list-ul', tag: 'li' }, 
    { selector: '.fa-quote-right', tag: 'blockquote' }
];

formatButtons.forEach(item => {
    // Button dhoondo jo is icon ko contain karta ho
    const btnIcon = document.querySelector(item.selector);
    const btn = btnIcon ? btnIcon.closest('button') : null;

    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Button click se form submit na ho jaye
            insertTag(item.tag);
        });
    }
});

// Text Area mein Tag Insert karne ka Logic
function insertTag(tag) {
    const start = contentInput.selectionStart;
    const end = contentInput.selectionEnd;
    const text = contentInput.value;
    const selectedText = text.substring(start, end);

    let replacement = '';

    if (tag === 'li') {
        // List ke liye special formatting
        replacement = `\n<ul>\n  <li>${selectedText || 'List Item'}</li>\n</ul>\n`;
    } else {
        // Normal formatting (Bold, Italic etc)
        replacement = `<${tag}>${selectedText}</${tag}>`;
    }

    // Textarea update karo
    contentInput.value = text.substring(0, start) + replacement + text.substring(end);
    
    // Cursor ko wapas sahi jagah focus karo
    contentInput.focus();
    contentInput.selectionEnd = start + replacement.length;
}


// --- 4. PUBLISH LOGIC (Database Save) ---
if (articleForm) {
    articleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // A. Validation
        if (!currentUser) { alert("You must be logged in!"); return; }
        if (!titleInput.value.trim()) { alert("Please write a Title!"); return; }
        if (!contentInput.value.trim()) { alert("Content cannot be empty!"); return; }
        if (!categoryInput.value) { alert("Please select a Category!"); return; }

        // B. Loading State (Button ko disable karo)
        const originalBtnText = publishBtn.innerHTML;
        publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
        publishBtn.disabled = true;
        publishBtn.style.opacity = "0.7";

        try {
            // C. Data Preparation
            const articleData = {
                title: titleInput.value.trim(),
                content: contentInput.value, // HTML tags ke sath save hoga
                category: categoryInput.value,
                // Tags ko comma se tod kar array banao (e.g., "tech, ai" -> ["tech", "ai"])
                tags: tagsInput.value ? tagsInput.value.split(',').map(tag => tag.trim()) : [],
                image: imageInput.value || null, // Base64 Image string
                
                // Author Details
                authorName: currentUser.displayName || "Anonymous",
                authorUid: currentUser.uid,
                authorPhoto: currentUser.photoURL || null,
                
                // Meta Data
                timestamp: serverTimestamp(),
                views: 0,
                likes: 0
            };

            // D. Firestore Save
            await addDoc(collection(db, "articles"), articleData);

            // E. Success Message & Reset
            alert("🎉 Article Published Successfully!");
            window.location.href = "index.html"; // Home page par bhejo

        } catch (error) {
            console.error("Error publishing article:", error);
            
            // Error Handling
            if (error.code === 'permission-denied') {
                alert("Error: Permission Denied. You don't have rights to publish.");
            } else if (error.message && error.message.includes("string too long")) {
                alert("Error: Image is too big! Please crop it smaller.");
            } else {
                alert("Something went wrong: " + error.message);
            }

            // Error aane par button wapas normal karo
            publishBtn.innerHTML = originalBtnText;
            publishBtn.disabled = false;
            publishBtn.style.opacity = "1";
        }
    });
}