import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD8Sg8rBwkCS4BYwgVrb_V_KQ4eMd0PkZ0",
  authDomain: "g-network-community.firebaseapp.com",
  projectId: "g-network-community",
  storageBucket: "g-network-community.firebasestorage.app",
  messagingSenderId: "358032029950",
  appId: "1:358032029950:web:a8dc470de9d85ead240daf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Ready
document.addEventListener("DOMContentLoaded", async () => {

  const articlesContainer = document.getElementById("articles-container");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("article-search");

  // Fetch all articles from Firestore
  const articlesCol = collection(db, "articles"); // Firestore collection name
  const articlesSnapshot = await getDocs(articlesCol);
  const articles = articlesSnapshot.docs.map(doc => doc.data());

  // Render Firestore articles into the container
  articles.forEach(a => {
    const card = document.createElement("article");
    card.className = "article-card";
    card.dataset.title = a.title.toLowerCase();
    card.innerHTML = `
      <img src="${a.image}" alt="${a.title}">
      <h3>${a.title}</h3>
      <p>${a.description}</p>
      <a href="${a.link}">Read More</a>
    `;
    articlesContainer.appendChild(card);
  });

  // Search form
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    // Find matching article
    const allArticles = articlesContainer.querySelectorAll(".article-card");
    let found = false;
    allArticles.forEach(card => {
      const title = card.dataset.title;
      if (title.includes(query)) {
        // Scroll to article
        card.scrollIntoView({ behavior: "smooth", block: "start" });
        // Optional: highlight
        card.style.background = "#ffffcc";
        setTimeout(() => { card.style.background = ""; }, 2000);
        found = true;
      }
    });

    if (!found) {
      alert("No article found for: " + query);
    }
  });

});
