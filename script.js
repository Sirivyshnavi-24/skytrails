/* ------------------ FIREBASE IMPORTS ------------------ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

/* ------------------ NEW FIREBASE CONFIG ------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyCwjgHF3npknP4--hI0e4-UWpigpWOCGK0",
  authDomain: "sky-trails.firebaseapp.com",
  projectId: "sky-trails",
  storageBucket: "sky-trails.firebasestorage.app",
  messagingSenderId: "727863482182",
  appId: "1:727863482182:web:202d78f661d5a602ec3747"
};

/* ------------------ INITIALIZE ------------------ */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const ADMIN_EMAIL = "yourgmail@gmail.com"; // Replace with your actual admin email

/* ------------------ GLOBAL VARIABLES ------------------ */
let currentUser = null;
let selectedFlight = null;
let activeCategory = "all";
let wishlist = JSON.parse(localStorage.getItem("skytrails_wishlist")) || [];
let appliedCoupon = null;

const coupons = {
  "SKY10": { type: "percent", value: 10 },    // 10% off
  "FLAT500": { type: "fixed", value: 500 },   // ₹500 off
  "WELCOME25": { type: "percent", value: 25 } // 25% off
};

/* ------------------ DATA ------------------ */
const destinations = [
  { id: 1, name: "Bali", country: "Indonesia", category: "Beach", price: 42000, icon: "🏝️", recommended: true,
    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",
    famous: "Bali is a tropical island paradise known for its stunning beaches, ancient temples, and vibrant culture.",
    enjoy: "Explore ancient temples like Tanah Lot, relax on pristine beaches, and discover rice terraces in Ubud.",
    itinerary: ["Day 1: Arrival & beachside dinner","Day 2: Ubud rice terraces","Day 3: Tanah Lot temple","Day 4: Beach clubs","Day 5: Shopping","Day 6: Spa","Day 7: Fly back"],
    airline: "Garuda Indonesia" },
  { id: 2, name: "Tokyo", country: "Japan", category: "City", price: 70000, icon: "🗼", popular: true,
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800",
    famous: "Tokyo is a mesmerizing blend of ultra-modern technology and ancient traditions.",
    enjoy: "Walk through Shibuya Crossing, explore Akihabara, and visit TeamLab digital museums.",
    itinerary: ["Day 1: Shibuya Crossing","Day 2: Harajuku & Meiji Shrine","Day 3: TeamLab Borderless","Day 4: Mount Fuji trip","Day 5: Akihabara","Day 6: Temples","Day 7: Fly back"],
    airline: "Japan Airlines" },
  { id: 3, name: "Paris", country: "France", category: "City", price: 78000, icon: "🥖", recommended: true,
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",
    famous: "Paris, the City of Light, is renowned for its iconic landmarks, art, and cuisine.",
    enjoy: "Visit the Eiffel Tower, Louvre Museum, and cruise the Seine river.",
    itinerary: ["Day 1: Eiffel Tower","Day 2: Seine cruise","Day 3: Louvre Museum","Day 4: Versailles","Day 5: Montmartre","Day 6: Shopping","Day 7: Fly back"],
    airline: "Air France" },
  { id: 4, name: "Dubai", country: "UAE", category: "City", price: 45000, icon: "🏜️", popular: true,
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800",
    famous: "Dubai features futuristic architecture, luxury shopping, and desert adventures.",
    enjoy: "Visit Burj Khalifa, Desert Safari, and Palm Jumeirah.",
    itinerary: ["Day 1: Burj Khalifa","Day 2: Dubai Mall","Day 3: Desert Safari","Day 4: Palm Jumeirah","Day 5: Marina cruise","Day 6: Gold Souk","Day 7: Fly back"],
    airline: "Emirates" },
  { id: 5, name: "Swiss Alps", country: "Switzerland", category: "Nature", price: 99000, icon: "🏔️",
    img: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800",
    famous: "Breathtaking mountain scenery, skiing, and charming villages.",
    enjoy: "Ski on world-renowned slopes and ride scenic mountain trains.",
    itinerary: ["Day 1: Zurich","Day 2: Lucerne","Day 3: Mount Titlis","Day 4: Skiing/Hiking","Day 5: Interlaken","Day 6: Chocolate factory","Day 7: Fly back"],
    airline: "Swiss Air" },
  { id: 6, name: "Maldives", country: "Maldives", category: "Beach", price: 120000, icon: "🏖️", recommended: true,
    img: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=800",
    famous: "Turquoise lagoons, pristine reefs, and luxury overwater bungalows.",
    enjoy: "Snorkel with marine life and relax in overwater villas.",
    itinerary: ["Day 1: Arrival","Day 2: Snorkeling","Day 3: Island hopping","Day 4: Water sports","Day 5: Spa","Day 6: Sunset cruise","Day 7: Fly back"],
    airline: "Qatar Airways" },
  { id: 7, name: "Iceland", country: "Iceland", category: "Nature", price: 88000, icon: "🌋",
    img: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800",
    famous: "Land of fire and ice with geysers, waterfalls, and Northern Lights.",
    enjoy: "Bathe in the Blue Lagoon and hunt for the Northern Lights.",
    itinerary: ["Day 1: Golden Circle","Day 2: Blue Lagoon","Day 3: National Park","Day 4: Waterfalls","Day 5: Glacier hike","Day 6: Northern Lights","Day 7: Fly back"],
    airline: "Icelandair" },
  { id: 8, name: "Rome", country: "Italy", category: "City", price: 65000, icon: "🏛️",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800",
    famous: "The Eternal City, a living museum of history and art.",
    enjoy: "Explore the Colosseum, Vatican City, and Trevi Fountain.",
    itinerary: ["Day 1: Colosseum","Day 2: Roman Forum","Day 3: Vatican City","Day 4: Trevi Fountain","Day 5: Cooking class","Day 6: Museums","Day 7: Fly back"],
    airline: "ITA Airways" },
  { id: 9, name: "New York", country: "USA", category: "City", price: 85000, icon: "🗽", popular: true,
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800",
    famous: "The city that never sleeps, featuring iconic landmarks and Broadway.",
    enjoy: "Times Square, Statue of Liberty, and Central Park.",
    itinerary: ["Day 1: Times Square","Day 2: Statue of Liberty","Day 3: Central Park","Day 4: Brooklyn Bridge","Day 5: Broadway","Day 6: Museums","Day 7: Fly back"],
    airline: "United Airlines" },
  { id: 10, name: "Bora Bora", country: "Polynesia", category: "Beach", price: 140000, icon: "🥥", popular: true,
    img: "https://images.unsplash.com/photo-1505881402582-c5bc11054f91?q=80&w=800",
    famous: "A dream destination with turquoise lagoons and luxury resorts.",
    enjoy: "Swim with sharks and rays, and relax in paradise.",
    itinerary: ["Day 1: Arrival","Day 2: Lagoon tour","Day 3: Shark encounter","Day 4: Hiking","Day 5: Diving","Day 6: Spa","Day 7: Fly back"],
    airline: "Air Tahiti Nui" },
  { id: 11, name: "Machu Picchu", country: "Peru", category: "Nature", price: 95000, icon: "🗿",
    img: "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800",
    famous: "Ancient Inca citadel set high in the Andes mountains.",
    enjoy: "Trek the Inca Trail and explore Sacred Valley ruins.",
    itinerary: ["Day 1: Cusco","Day 2: Sacred Valley","Day 3: Trek start","Day 4: Camping","Day 5: Machu Picchu","Day 6: Local markets","Day 7: Fly back"],
    airline: "LATAM" },
  { id: 12, name: "Kyoto", country: "Japan", category: "City", price: 72000, icon: "⛩️",
    img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800",
    famous: "Japan's ancient capital with thousands of temples and gardens.",
    enjoy: "Fushimi Inari gates, bamboo groves, and geisha districts.",
    itinerary: ["Day 1: Kiyomizu-dera","Day 2: Bamboo grove","Day 3: Fushimi Inari","Day 4: Tea ceremony","Day 5: Gion","Day 6: Crafts","Day 7: Fly back"],
    airline: "ANA" },
  { id: 13, name: "Cairo", country: "Egypt", category: "Nature", price: 55000, icon: "🐪",
    img: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=800",
    famous: "Home to the Pyramids of Giza and the Sphinx.",
    enjoy: "Explore Pyramids, cruise the Nile, and visit museums.",
    itinerary: ["Day 1: Museum","Day 2: Pyramids","Day 3: Saqqara","Day 4: Nile Cruise","Day 5: Bazaar","Day 6: Mosques","Day 7: Fly back"],
    airline: "EgyptAir" },
  { id: 14, name: "Rio", country: "Brazil", category: "Beach", price: 80000, icon: "🎭",
    img: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800",
    famous: "Famous for Christ the Redeemer, Copacabana, and Carnival.",
    enjoy: "Visit Christ the Redeemer, beaches, and Sugarloaf Mountain.",
    itinerary: ["Day 1: Copacabana","Day 2: Christ Redeemer","Day 3: Sugarloaf","Day 4: Ipanema","Day 5: Samba","Day 6: Gardens","Day 7: Fly back"],
    airline: "GOL" },
  { id: 15, name: "London", country: "UK", category: "City", price: 78000, icon: "🚌", popular: true,
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800",
    famous: "Historic capital with royal heritage and modern culture.",
    enjoy: "London Eye, Big Ben, and Buckingham Palace.",
    itinerary: ["Day 1: Tower Bridge","Day 2: London Eye","Day 3: Big Ben","Day 4: Buckingham Palace","Day 5: Museums","Day 6: Shopping","Day 7: Fly back"],
    airline: "British Airways" },
];

/* ------------------ TOAST HELPER ------------------ */
window.showToast = (msg, type = "success") => {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const div = document.createElement("div");
  div.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;
  div.innerHTML = `<span>${type === "error" ? "❌" : "✅"}</span><span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3000);
};

/* ------------------ NAVIGATION ------------------ */
window.navigateTo = (view) => {
  ["view-home", "view-explore", "view-wallet", "view-admin", "view-profile", "view-planner", "view-flights"]
    .forEach(id => document.getElementById(id).classList.add("hidden"));

  const target = document.getElementById("view-" + view);
  if (target) target.classList.remove("hidden");

  // Update Nav State
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("nav-active"));
  const navBtn = document.getElementById("nav-" + view);
  if (navBtn) navBtn.classList.add("nav-active");

  // Scroll to top
  window.scrollTo(0, 0);

  // Initialize View Specific Logic
  if (view === "home") {
    startHeroSlideshow();
    renderCouponShelf();
    renderHomeHighlights();
  }
  if (view === "explore") renderDestinations();
  if (view === "wallet") loadWallet();
  if (view === "profile") loadProfile();
  if (view === "planner") loadAIPlanner();
  if (view === "flights") populateFlightDropdown();
  if (view === "admin") loadAdminTrips();
};

/* ------------------ HERO SLIDESHOW ------------------ */
let heroInterval;
function startHeroSlideshow() {
  const images = [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2000",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2000"
  ];
  let i = 0;
  const hero = document.getElementById("hero-bg");
  if (!hero) return;
  
  // Clear existing interval to prevent speeding up
  if (heroInterval) clearInterval(heroInterval);
  
  hero.style.backgroundImage = `url('${images[0]}')`;
  heroInterval = setInterval(() => {
    i = (i + 1) % images.length;
    hero.style.backgroundImage = `url('${images[i]}')`;
  }, 5000);
}

/* ------------------ HOME SECTION ------------------ */
window.renderHomeHighlights = () => {
  const recContainer = document.getElementById('recommended-list');
  const popContainer = document.getElementById('popular-list');
  if (!recContainer || !popContainer) return;

  const recommended = destinations.filter(d => d.recommended).slice(0, 8);
  const popular = destinations.filter(d => d.popular).slice(0, 3);

  const makeCard = (d) => `
    <div class="highlight-card" onclick="openDestModal(${d.id})">
      <img src="${d.img}" alt="${d.name}">
      <div class="highlight-body">
        <div class="flex items-center justify-between">
          <div>
            <div class="highlight-title">${d.name} <span class="text-xs">${d.icon || ''}</span></div>
            <div class="highlight-sub">${d.country}</div>
          </div>
          <div class="text-right">
            <div class="highlight-price">₹${d.price.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  recContainer.innerHTML = recommended.length ? recommended.map(makeCard).join('') : '<p class="text-slate-400">No recommended destinations.</p>';
  popContainer.innerHTML = popular.length ? popular.map(makeCard).join('') : '<p class="text-slate-400">No popular destinations.</p>';
};

window.renderCouponShelf = () => {
  const container = document.getElementById('coupon-list');
  if (!container) return;
  container.innerHTML = Object.keys(coupons).map((code, i) => {
    const c = coupons[code];
    const label = c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`;
    return `<button aria-label="Coupon ${code}" class="coupon-chip pulse" style="animation-delay: ${i * 120}ms" onclick="copyCoupon('${code}')">${code} • ${label}</button>`;
  }).join('');
};

/* ------------------ EXPLORE SECTION ------------------ */
window.setCategory = (cat) => {
  activeCategory = cat;
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById(`cat-${cat}`);
  if (btn) btn.classList.add("active");
  renderDestinations();
};

function renderDestinations(search = "") {
  const grid = document.getElementById("destinations-grid");
  if (!grid) return;

  let filtered = destinations.filter(d =>
    activeCategory === "all" || (activeCategory === "favorites"
      ? wishlist.includes(d.id)
      : d.category === activeCategory)
  );

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(s) || d.country.toLowerCase().includes(s)
    );
  }

  grid.innerHTML = filtered.map((d, index) => `
    <div class="dest-card group" style="animation-delay:${index * 80}ms" onclick="openDestModal(${d.id})">
      <button onclick="toggleWishlist(event, ${d.id})"
              class="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-rose-500/20 transition">
        <i id="heart-${d.id}" class="${wishlist.includes(d.id) ? 'fas text-rose-500' : 'far'} fa-heart"></i>
      </button>
      <img src="${d.img}" class="dest-img" loading="lazy">
      <div class="dest-overlay">
        <h3 class="text-2xl font-bold text-white mb-1">${d.name}</h3>
        <div class="flex justify-between items-end w-full">
          <p class="text-xs text-slate-300 uppercase tracking-widest">${d.country}</p>
          <p class="text-lg font-bold text-emerald-400">₹${d.price.toLocaleString()}</p>
        </div>
      </div>
    </div>
  `).join("");
}

window.toggleWishlist = (e, id) => {
  e.stopPropagation();
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(x => x !== id);
  } else {
    wishlist.push(id);
  }
  localStorage.setItem("skytrails_wishlist", JSON.stringify(wishlist));
  
  // Re-render to update UI
  renderDestinations(); 
  
  // Visual feedback
  const heart = document.getElementById(`heart-${id}`);
  if(heart) {
      heart.className = wishlist.includes(id) ? 'fas text-rose-500 fa-heart' : 'far fa-heart';
  }
};

/* ------------------ MODAL & REVIEWS ------------------ */
window.openDestModal = (id) => {
  const trip = destinations.find(d => d.id === id);
  if (!trip) return;

  document.getElementById("modal-img").src = trip.img;
  document.getElementById("modal-destination").innerText = trip.name;
  document.getElementById("modal-country").innerText = trip.country;
  document.getElementById("modal-famous").innerText = trip.famous;
  document.getElementById("modal-enjoy").innerText = trip.enjoy;
  
  document.getElementById("modal-timeline").innerHTML = trip.itinerary
    .map((step) => `
      <div class="relative pl-6 pb-4 border-l border-white/10 last:border-0">
        <div class="absolute -left-[5px] top-2 w-2 h-2 bg-fuchsia-500 rounded-full shadow-[0_0_8px_#d946ef]"></div>
        <p class="text-sm text-slate-300">
          <span class="font-bold text-fuchsia-400">${step}</span>
        </p>
      </div>
    `).join("");

  document.getElementById("modal-base-price").innerText = trip.price;
  document.getElementById("booking-guests").value = 1;
  document.getElementById("passenger-name").value = "";
  document.getElementById("booking-coupon").value = "";
  document.getElementById("coupon-feedback").innerText = "";
  
  appliedCoupon = null;
  updateTotalPrice();
  
  // Load reviews specifically for this destination
  loadReviews(trip.name);

  document.getElementById("booking-modal").classList.remove("hidden");
};

window.closeBookingModal = () => document.getElementById("booking-modal").classList.add("hidden");

window.loadReviews = async (destinationName) => {
  const list = document.getElementById('reviews-list');
  if (!list) return;
  list.innerHTML = '<p class="text-sm text-slate-400 animate-pulse">Loading reviews...</p>';
  
  try {
    const q = query(collection(db, 'reviews'), where('destination', '==', destinationName));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      list.innerHTML = '<p class="text-sm text-slate-500 italic">No reviews yet. Be the first!</p>';
      return;
    }
    
    list.innerHTML = snap.docs
      .sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
      .map(d => {
          const r = d.data();
          const user = (r.userEmail || 'Guest').split('@')[0];
          const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
          return `
            <div class="bg-white/5 p-4 rounded-xl border border-white/5 mb-3">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="text-xs font-bold text-cyan-400 uppercase tracking-wider">${user}</p>
                  <p class="text-[10px] text-slate-500">${new Date((r.createdAt?.seconds||0) * 1000).toLocaleDateString()}</p>
                </div>
                <div class="text-amber-400 text-xs tracking-widest">${stars}</div>
              </div>
              <p class="text-sm text-slate-300 leading-relaxed">${r.content}</p>
            </div>
          `;
        }).join('');
  } catch (e) {
    console.error(e);
    list.innerHTML = '<p class="text-sm text-rose-400">Unable to load reviews.</p>';
  }
};

window.submitReview = async () => {
  if (!currentUser) return showToast('Please login to review', 'error');
  
  const destName = document.getElementById('modal-destination').innerText;
  const content = (document.getElementById('review-text').value || '').trim();
  const rating = parseInt(document.getElementById('review-rating').value) || 5;
  
  if (!content) return showToast('Please write something!', 'error');
  
  const feedbackBtn = document.getElementById('review-feedback');
  feedbackBtn.innerText = 'Publishing...';
  
  try {
    await addDoc(collection(db, 'reviews'), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      destination: destName,
      content,
      rating,
      createdAt: serverTimestamp()
    });
    
    document.getElementById('review-text').value = '';
    feedbackBtn.innerText = 'Review Posted!';
    setTimeout(() => feedbackBtn.innerText = 'Thanks for helping others!', 2000);
    
    // Reload reviews to show new one
    loadReviews(destName);
  } catch (err) {
    console.error(err);
    showToast('Error posting review', 'error');
    feedbackBtn.innerText = 'Error occurred';
  }
};

window.switchTab = (tab) => {
  const info = document.getElementById("content-info");
  const plan = document.getElementById("content-plan");
  const tabInfo = document.getElementById("tab-info");
  const tabPlan = document.getElementById("tab-plan");

  if(tab === 'info') {
      info.classList.remove("hidden");
      plan.classList.add("hidden");
      tabInfo.classList.add("border-fuchsia-500", "text-white");
      tabInfo.classList.remove("border-transparent", "text-slate-500");
      tabPlan.classList.remove("border-fuchsia-500", "text-white");
      tabPlan.classList.add("border-transparent", "text-slate-500");
  } else {
      info.classList.add("hidden");
      plan.classList.remove("hidden");
      tabPlan.classList.add("border-fuchsia-500", "text-white");
      tabPlan.classList.remove("border-transparent", "text-slate-500");
      tabInfo.classList.remove("border-fuchsia-500", "text-white");
      tabInfo.classList.add("border-transparent", "text-slate-500");
  }
};

/* ------------------ BOOKING LOGIC ------------------ */
window.updateTotalPrice = () => {
  const guests = parseInt(document.getElementById("booking-guests").value) || 1;
  const basePerGuest = parseInt(document.getElementById("modal-base-price").innerText) || 0;
  let subtotal = basePerGuest * guests;

  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      subtotal = Math.max(0, Math.round(subtotal * (1 - appliedCoupon.value / 100)));
    } else if (appliedCoupon.type === "fixed") {
      subtotal = Math.max(0, subtotal - appliedCoupon.value);
    }
  }
  document.getElementById("modal-price").innerText = "₹" + subtotal.toLocaleString();
};

window.applyCoupon = () => {
  const code = (document.getElementById("booking-coupon").value || "").toUpperCase().trim();
  if (!code) return showToast("Enter a coupon code", "error");
  
  const c = coupons[code];
  const feedback = document.getElementById("coupon-feedback");
  
  if (!c) {
    appliedCoupon = null;
    feedback.innerText = "Invalid or expired coupon.";
    feedback.className = "text-[10px] mt-2 text-rose-400";
    updateTotalPrice();
    return;
  }
  
  appliedCoupon = { code, ...c };
  feedback.innerText = c.type === "percent" ? `${c.value}% discount applied!` : `₹${c.value} discount applied!`;
  feedback.className = "text-[10px] mt-2 text-emerald-400";
  updateTotalPrice();
};

window.copyCoupon = async (code) => {
  try {
    await navigator.clipboard.writeText(code);
    const input = document.getElementById('booking-coupon');
    if (input && !document.getElementById('booking-modal').classList.contains('hidden')) {
      input.value = code;
      applyCoupon();
    }
    showToast(`Code ${code} copied!`);
  } catch (e) {
    showToast('Failed to copy', 'error');
  }
};

window.handlePayment = async () => {
  if (!currentUser) return showToast("Please login to book", "error");
  
  const name = document.getElementById("passenger-name").value;
  const date = document.getElementById("booking-date").value;
  
  if (!name || !date) return showToast("Please enter Name and Date", "error");
  
  const overlay = document.getElementById("payment-overlay");
  overlay.classList.remove("hidden");
  document.getElementById("pay-spinner").classList.remove("hidden");
  document.getElementById("pay-success").classList.add("hidden");

  setTimeout(async () => {
    document.getElementById("pay-spinner").classList.add("hidden");
    document.getElementById("pay-success").classList.remove("hidden");

    try {
      const destName = document.getElementById("modal-destination").innerText;
      const priceStr = document.getElementById("modal-price").innerText.replace("₹","").replace(/,/g,"");
      const price = parseInt(priceStr);
      const guests = parseInt(document.getElementById("booking-guests").value) || 1;
      
      await addDoc(collection(db, "trips"), {
        userEmail: currentUser.email,
        userId: currentUser.uid,
        destination: destName,
        price: price,
        guests: guests,
        date: date,
        status: "Paid",
        type: "Stay",
        passenger: name,
        createdAt: serverTimestamp()
      });
      
      setTimeout(() => {
        overlay.classList.add("hidden");
        document.getElementById("booking-modal").classList.add("hidden");
        showToast("Booking Confirmed! ✈️");
        navigateTo("wallet");
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast("Booking failed. Try again.", "error");
      overlay.classList.add("hidden");
    }
  }, 2000);
};

/* ------------------ FLIGHTS ------------------ */
function populateFlightDropdown() {
  const select = document.getElementById("flight-to-search");
  if (!select) return;
  select.innerHTML = destinations
    .map(d => `<option value="${d.name}">${d.name} (${d.country})</option>`)
    .join("");
}

window.searchFlights = () => {
  const toCity = document.getElementById("flight-to-search").value;
  const date = document.getElementById("flight-date-search").value;
  if (!date) return showToast("Select a travel date", "error");

  const dest = destinations.find(d => d.name === toCity);
  document.getElementById("flight-results-area").classList.remove("hidden");
  const list = document.getElementById("flight-results-list");

  // Mock Flights
  const flights = [
    { id: 101, airline: "IndiGo", time: "06:00 - 09:30", price: 15000, logo: "✈️" },
    { id: 102, airline: dest?.airline || "Air India", time: "11:00 - 15:00", price: 28000, logo: "🛫" },
    { id: 103, airline: "Emirates", time: "20:00 - 23:45", price: 45000, logo: "👑" }
  ];

  list.innerHTML = flights.map(f => `
    <div class="flight-item">
      <div class="flex items-center gap-4">
        <div class="text-3xl bg-white/10 p-3 rounded-lg">${f.logo}</div>
        <div>
          <h4 class="font-bold text-white">${f.airline}</h4>
          <p class="text-xs text-slate-400">${f.time} • Direct</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xl font-bold text-emerald-400">₹${f.price.toLocaleString()}</p>
        <button onclick="bookSpecificFlight('${f.airline}', ${f.price}, '${toCity}', '${date}')"
                class="bg-fuchsia-600 text-xs font-bold px-4 py-2 rounded mt-1 hover:bg-fuchsia-500 transition">
          BOOK
        </button>
      </div>
    </div>
  `).join("");
};

window.bookSpecificFlight = (airline, price, city, date) => {
  selectedFlight = { airline, price, dest: city, date };
  document.getElementById("f-modal-info").innerText = `${airline} to ${city} • ${date}`;
  document.getElementById("f-passenger-name").value = "";
  document.getElementById("f-passport-num").value = "";
  document.getElementById("f-guests").value = 1;
  updateFlightTotal();
  document.getElementById("flight-booking-modal").classList.remove("hidden");
};

window.updateFlightTotal = () => {
  if (!selectedFlight) return;
  const guests = parseInt(document.getElementById("f-guests").value) || 1;
  document.getElementById("f-total-price").innerText = "₹" + (selectedFlight.price * guests).toLocaleString();
};

window.closeFlightModal = () => document.getElementById("flight-booking-modal").classList.add("hidden");

window.confirmFlightBooking = async () => {
  if (!currentUser) return showToast("Login first!", "error");

  const name = document.getElementById("f-passenger-name").value;
  const pass = document.getElementById("f-passport-num").value;
  const guests = parseInt(document.getElementById("f-guests").value) || 1;

  if (!name || !pass) return showToast("Enter passenger details", "error");

  const overlay = document.getElementById("payment-overlay");
  overlay.classList.remove("hidden");
  document.getElementById("pay-spinner").classList.remove("hidden");
  document.getElementById("pay-success").classList.add("hidden");

  setTimeout(async () => {
    document.getElementById("pay-spinner").classList.add("hidden");
    document.getElementById("pay-success").classList.remove("hidden");

    try {
      await addDoc(collection(db, "trips"), {
        userEmail: currentUser.email,
        userId: currentUser.uid,
        destination: selectedFlight.dest,
        country: "International",
        price: selectedFlight.price * guests,
        guests,
        date: selectedFlight.date,
        status: "Paid",
        type: "Flight",
        flightDetails: selectedFlight.airline,
        passenger: name,
        createdAt: serverTimestamp()
      });
      setTimeout(() => {
        overlay.classList.add("hidden");
        document.getElementById("flight-booking-modal").classList.add("hidden");
        showToast("Flight Booked Successfully!");
        navigateTo("wallet");
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast("Booking Error", "error");
      overlay.classList.add("hidden");
    }
  }, 2000);
};

/* ------------------ WALLET ------------------ */
async function loadWallet() {
  if (!currentUser) return;
  const container = document.getElementById("wallet-grid");
  if(!container) return;
  container.innerHTML = "<p class='text-slate-400'>Loading tickets...</p>";

  try {
      const q = query(collection(db, "trips"), where("userId", "==", currentUser.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        container.innerHTML = "<p class='text-slate-500'>No upcoming trips.</p>";
        return;
      }

      const sortedDocs = snap.docs.sort(
        (a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0)
      );

      container.innerHTML = sortedDocs.map(d => {
        const t = d.data();
        return `
          <div class="ticket-container group relative">
            <div class="ticket-left">
              <div class="text-4xl bg-white/5 p-4 rounded-xl flex items-center justify-center">
                ${t.type === 'Flight' ? '✈️' : '🏨'}
              </div>
              <div class="flex flex-col justify-between w-full">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-[10px] text-fuchsia-400 uppercase tracking-widest font-bold">
                      ${t.type || "Trip"}
                    </p>
                    <h3 class="text-xl font-bold text-white leading-none mt-1">
                      ${t.destination}
                    </h3>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] text-slate-500 uppercase">GUESTS</p>
                    <p class="text-sm font-mono text-cyan-400">
                      ${t.guests || 1}
                    </p>
                  </div>
                </div>
                <div class="flex justify-between mt-2 border-t border-white/5 pt-2">
                  <div>
                    <p class="text-[9px] text-slate-500 uppercase">Date</p>
                    <p class="text-xs font-bold text-white">${t.date}</p>
                  </div>
                  <div>
                    <p class="text-[9px] text-slate-500 uppercase">Paid</p>
                    <p class="text-xs font-bold text-emerald-400">
                      ₹${(t.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="ticket-right flex flex-col items-center justify-center gap-2">
              <div class="stamp-paid text-[10px] font-bold border border-emerald-500 text-emerald-500 px-2 py-1 rounded uppercase">
                  ${t.status || "PAID"}
              </div>
              <button onclick="cancelBooking('${d.id}', event)" class="text-[10px] text-rose-500 hover:text-rose-400 underline">Cancel</button>
            </div>
          </div>
        `;
      }).join("");
  } catch(e) {
      container.innerHTML = "<p class='text-rose-400'>Error loading wallet.</p>";
  }
}

window.cancelBooking = async (id, e) => {
  e.stopPropagation();
  if (!confirm("Are you sure you want to cancel this booking?")) return;
  try {
    await deleteDoc(doc(db, "trips", id));
    showToast("Booking cancelled", "success");
    loadWallet();
  } catch (err) {
    console.error(err);
    showToast("Could not cancel", "error");
  }
};

/* ------------------ PROFILE ------------------ */
async function loadProfile() {
  if (!currentUser) return;
  document.getElementById("profile-email").innerText = currentUser.email;

  const userSnap = await getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)));
  let userData = {};
  userSnap.forEach(d => userData = d.data());
  
  const displayName = (userData.displayName || currentUser.email.split("@")[0]).toUpperCase();
  document.getElementById("profile-name").innerText = displayName;

  // Calculate stats
  const tripsSnap = await getDocs(query(collection(db, "trips"), where("userId", "==", currentUser.uid)));
  let totalSpent = 0;
  tripsSnap.forEach(d => totalSpent += (d.data().price || 0));
  
  document.getElementById("profile-trips").innerText = tripsSnap.size;
  document.getElementById("profile-spent").innerText = "₹" + totalSpent.toLocaleString();
}

window.toggleEditProfile = () => {
  document.getElementById("edit-profile-form").classList.toggle("hidden");
};

window.saveProfile = async () => {
  const name = document.getElementById("edit-name").value;
  
  if (!name) return showToast("Enter a name", "error");
  
  try {
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: name
      }, { merge: true });
      
      showToast("Profile Updated!");
      document.getElementById("edit-profile-form").classList.add("hidden");
      loadProfile();
  } catch(e) {
      showToast("Update failed", "error");
  }
};

/* ------------------ AI PLANNER ------------------ */
function loadAIPlanner() {
  const select = document.getElementById("ai-country");
  if (!select) return;
  select.innerHTML = destinations
    .map(d => `<option value="${d.name}">${d.name} (${d.country})</option>`)
    .join("");
}

window.generateAIPlan = () => {
  const destName = document.getElementById("ai-country").value;
  const budget = parseInt(document.getElementById("ai-budget").value);
  if (!budget) return showToast("Please enter your budget!", "error");
  
  const trip = destinations.find(d => d.name === destName);
  if (!trip) return;

  const result = document.getElementById("ai-result");
  const content = document.getElementById("ai-plan-content");
  result.classList.remove("hidden");

  let style = "Budget Backpacker";
  let flightClass = "Economy";
  let stay = "Hostel / 3★";

  if (budget > 150000) {
    style = "Ultra Luxury";
    flightClass = "First Class";
    stay = "5★ Resorts / Villas";
  } else if (budget > 80000) {
    style = "Premium Comfort";
    flightClass = "Business Class";
    stay = "4★ Boutique";
  }

  const daily = Math.floor(budget / 10);

  content.innerHTML = `
    <p class="text-lg font-bold text-white border-b border-white/10 pb-2 mb-2">
      Trip to ${trip.name}
    </p>
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p class="text-[10px] text-slate-500 uppercase">Travel Style</p>
        <p class="text-emerald-400 font-mono">${style}</p>
      </div>
      <div>
        <p class="text-[10px] text-slate-500 uppercase">Flight Class</p>
        <p class="text-emerald-400 font-mono">${flightClass}</p>
      </div>
      <div>
        <p class="text-[10px] text-slate-500 uppercase">Stay</p>
        <p class="text-emerald-400 font-mono">${stay}</p>
      </div>
      <div>
        <p class="text-[10px] text-slate-500 uppercase">Daily Spend</p>
        <p class="text-emerald-400 font-mono">₹${daily.toLocaleString()}</p>
      </div>
    </div>
    <p class="text-[10px] text-slate-500 uppercase mb-1">Must Do</p>
    <p class="mb-3 text-sm text-slate-300">${trip.enjoy}</p>
    <p class="text-[10px] text-slate-500 uppercase mb-1">Estimated Total</p>
    <p class="text-xl font-bold text-white">
      ₹${Math.floor(budget * 0.95).toLocaleString()}
      <span class="text-xs text-slate-500 font-normal">(approx)</span>
    </p>
  `;
};

/* ------------------ ADMIN ------------------ */
async function loadAdminTrips() {
  const tableBody = document.getElementById("adminTripsTableBody");
  if(!tableBody) return;
  
  try {
      const snap = await getDocs(collection(db, "trips"));
      
      if(snap.empty) {
          tableBody.innerHTML = "<tr><td colspan='4' class='p-4 text-center text-slate-500'>No bookings found.</td></tr>";
          return;
      }
      
      tableBody.innerHTML = snap.docs.map(d => {
        const t = d.data();
        return `
          <tr class="border-b border-white/5 hover:bg-white/5 transition">
            <td class="px-6 py-3 font-mono text-xs">${t.userEmail}</td>
            <td class="px-6 py-3">${t.destination}</td>
            <td class="px-6 py-3 text-emerald-400 font-bold text-xs uppercase">${t.status}</td>
            <td class="px-6 py-3">
              <button onclick="adminCancelTrip('${d.id}')"
                      class="text-xs text-rose-400 hover:text-white border border-rose-400/30 px-2 py-1 rounded">
                Cancel
              </button>
            </td>
          </tr>
        `;
      }).join("");
  } catch(e) {
      console.error(e);
  }
}

window.adminCancelTrip = async (id) => {
  if(!confirm("Cancel this user's trip?")) return;
  await updateDoc(doc(db, "trips", id), { status: "Cancelled" });
  showToast("Trip status updated", "success");
  loadAdminTrips();
};

/* ------------------ AUTH LOGIC ------------------ */
window.handleGoogleLogin = async () => {
  try {
    const res = await signInWithPopup(auth, provider);
    await registerUser(res.user);
  } catch (e) {
    console.error(e);
    showToast("Login failed", "error");
  }
};

window.handleEmailLogin = async () => {
  try {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;
    if(!email || !pass) return showToast("Enter credentials", "error");
    
    const res = await signInWithEmailAndPassword(auth, email, pass);
    await registerUser(res.user);
  } catch (e) {
    showToast("Invalid email or password", "error");
  }
};

window.handleEmailSignup = async () => {
  try {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const code = document.getElementById("signup-code").value;

    if (!email || !password || !code) return showToast("All fields required!", "error");

    const validCodes = ["SKYTRAILS2024", "TRAVEL2025", "VTRIP123", "ADVENTURE"];
    if (!validCodes.includes(code.toUpperCase())) {
      return showToast("Invalid registration code!", "error");
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);
    await registerUser(res.user);
    
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-password").value = "";
    document.getElementById("signup-code").value = "";
    toggleSignupForm();
    
    showToast("Account Created! Please Login.");
  } catch (e) {
    showToast(e.message, "error");
  }
};

window.toggleSignupForm = () => {
  document.getElementById("login-form").classList.toggle("hidden");
  document.getElementById("signup-form").classList.toggle("hidden");
};

window.handleLogout = () => signOut(auth);

async function registerUser(user) {
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role: user.email === ADMIN_EMAIL ? "admin" : "user"
  }, { merge: true });
}

/* ------------------ AUTH STATE OBSERVER ------------------ */
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  
  if (user) {
    document.getElementById("landing-view").classList.add("hidden");
    document.getElementById("app-view").classList.remove("hidden");
    
    // Check if nav-admin exists before accessing classList
    const adminNav = document.getElementById("nav-admin");
    if (user.email === ADMIN_EMAIL && adminNav) {
      adminNav.classList.remove("hidden");
    }
    
    navigateTo("home");
    showToast(`Welcome, ${user.displayName || 'Traveler'}!`);
  } else {
    document.getElementById("landing-view").classList.remove("hidden");
    document.getElementById("app-view").classList.add("hidden");
  }
});




