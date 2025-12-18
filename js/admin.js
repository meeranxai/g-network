import { db, auth } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 1. Selectors
const adminForm = document.getElementById('add-article-form');

// 2. Security Check (Admin Only)
const ADMIN_EMAIL = "meeran01110rafiq@gmail.com"; 

onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log("No user detected, redirecting to login...");
        window.location.href = "/G-Network/log-signup-system/login.html";
    } else if (user.email !== ADMIN_EMAIL) {
        alert("Access Denied! Sirf Admin (Meeran) hi articles post kar sakta hai.");
        window.location.href = "/G-Network/index.html";
    } else {
        console.log("Welcome Meeran! Admin access granted.");
    }
});

// 3. Publish Logic
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = adminForm.querySelector('button');
        const title = document.getElementById('art-title').value;
        const category = document.getElementById('art-category').value;
        const desc = document.getElementById('art-desc').value;
        const link = document.getElementById('art-link').value;

        // Search keywords logic
        const keywords = title.toLowerCase().split(" ").filter(w => w.length > 2);
        keywords.push(category.toLowerCase());

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = "Publishing...";

            // Firestore mein Article save karna
            await addDoc(collection(db, "articles"), {
                title: title,
                category: category,
                description: desc,
                link: link || "#",
                keywords: keywords,
                createdAt: serverTimestamp(),
                author: auth.currentUser.email
            });

            alert("✅ Article Published Successfully!");
            adminForm.reset();
        } catch (err) {
            console.error("Firebase Error:", err);
            alert("❌ Error: " + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Publish Article";
        }
    });
}