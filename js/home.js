import { db } from './firebase.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const articlesContainer = document.getElementById('articles-grid'); // Apne HTML mein grid ka ID ye rakhein

// Query: Latest articles sabse upar
const q = query(collection(db, "articles"), orderBy("timestamp", "desc"));

// REALTIME LISTENER (Home Page ke liye)
// Koi bhi naya article likhega, yahan bina refresh ke aa jayega
onSnapshot(q, (snapshot) => {
    articlesContainer.innerHTML = ''; // Purana clear karo

    snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;
        
        // Card HTML Create
        const card = `
            <div class="article-card" onclick="window.location.href='read-article.html?id=${id}'">
                <img src="${data.image || 'https://via.placeholder.com/400'}" alt="Cover">
                <div class="card-content">
                    <span class="category">${data.category}</span>
                    <h3>${data.title}</h3>
                    <div class="card-footer">
                        <span><i class="fas fa-user"></i> ${data.authorName}</span>
                        <span><i class="fas fa-eye"></i> ${data.views || 0}</span>
                    </div>
                </div>
            </div>
        `;
        
        articlesContainer.innerHTML += card;
    });
});