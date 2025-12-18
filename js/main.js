// ==========================================
// 1. IMPORTS & CONFIGURATION
// ==========================================
import { auth, db } from './firebase.js'; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    collection, 
    getDocs, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 2. DOM ELEMENTS SELECTION
// ==========================================
// Auth Elements
const loggedInView = document.getElementById('logged-in-view');
const loggedOutView = document.getElementById('logged-out-view');
const userNameDisplay = document.getElementById('user-name');
const userAvatarDisplay = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logout-btn');

// Article & Search Elements
const articlesContainer = document.querySelector('.articles-container');
const searchForm = document.querySelector('.search-form'); // Agar header mein search bar hai
const searchInput = document.querySelector('input[type="search"]');

// ==========================================
// 3. AUTHENTICATION LOGIC (Login/Logout Check)
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // --- USER IS LOGGED IN ---
        console.log("User Active:", user.email);

        // UI Toggle
        if (loggedOutView) loggedOutView.style.display = 'none';
        if (loggedInView) loggedInView.style.display = 'flex';

        // Fetch User Data from Firestore for better details
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let finalName = user.displayName || "Member";
            let finalPhoto = user.photoURL;

            if (userDoc.exists()) {
                const data = userDoc.data();
                finalName = data.displayName || finalName;
            }

            // Update Header Name
            if (userNameDisplay) userNameDisplay.textContent = finalName;

            // Update Avatar (Use UI Avatars if no photo exists)
            if (userAvatarDisplay) {
                userAvatarDisplay.src = finalPhoto || 
                    `https://ui-avatars.com/api/?name=${finalName}&background=0D8ABC&color=fff`;
            }

        } catch (error) {
            console.error("Profile Load Error:", error);
        }

    } else {
        // --- USER IS LOGGED OUT ---
        console.log("No User Logged In");
        if (loggedOutView) loggedOutView.style.display = 'flex';
        if (loggedInView) loggedInView.style.display = 'none';
    }
});

// Logout Functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.reload(); // Refresh page to reset UI
        } catch (error) {
            console.error("Logout Failed:", error);
        }
    });
}

// ==========================================
// 4. ARTICLES LOGIC (Latest & Search)
// ==========================================
async function loadArticles(searchTerm = "") {
    if (!articlesContainer) return;

    try {
        let q;
        const articlesRef = collection(db, "articles");

        // Logic: Agar search term hai to search karo, warna latest dikhao
        if (searchTerm) {
            // Note: Search ke liye Firestore mein 'keywords' array hona zaroori hai
            q = query(articlesRef, where("keywords", "array-contains", searchTerm.toLowerCase()));
        } else {
            // Default: Latest 6 articles
            q = query(articlesRef, orderBy("createdAt", "desc"), limit(6));
        }

        const querySnapshot = await getDocs(q);
        articlesContainer.innerHTML = ""; // Container clear karo

        if (querySnapshot.empty) {
            articlesContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No articles found.</p>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // HTML Card Template
            const card = `
                <article class="article-card">
                    <img src="${data.imageUrl || '/G-Network/images/java-script.avif'}" alt="${data.title}" onerror="this.src='/G-Network/images/java-script.avif'">
                    <div class="article-content">
                        <span style="color: #007bff; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom:5px; display:block;">
                            ${data.category || 'Tech'}
                        </span>
                        <h3>${data.title}</h3>
                        <p>${data.description ? data.description.substring(0, 80) + '...' : 'No description available.'}</p>
                        <a href="${data.link || '#'}" class="read-more">Read More</a>
                    </div>
                </article>`;
            
            articlesContainer.insertAdjacentHTML('beforeend', card);
        });

    } catch (error) {
        console.error("Error loading articles:", error);
        articlesContainer.innerHTML = `<p>Error loading content.</p>`;
    }
}

// Search Listener (Agar search form exist karta hai)
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (searchInput) {
            loadArticles(searchInput.value.trim());
        }
    });
}

// Initial Load (Page khulte hi articles laye)
loadArticles();

// ==========================================
// 5. NEWSLETTER SUBSCRIPTION
// ==========================================
document.querySelectorAll('.subscribe-form, footer form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        
        if (emailInput && emailInput.value) {
            const submitBtn = form.querySelector('button');
            const originalText = submitBtn.innerText;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerText = "Joining...";
                
                await addDoc(collection(db, "subscribers"), { 
                    email: emailInput.value, 
                    createdAt: serverTimestamp() 
                });
                
                alert("Thanks for subscribing to G-Network!");
                form.reset();
            } catch (err) {
                console.error("Newsletter Error:", err);
                alert("Something went wrong. Please try again.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        }
    });
});