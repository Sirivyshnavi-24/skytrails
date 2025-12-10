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

const firebaseConfig = {
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

  apiKey: "AIzaSyB-BMPgbh09kIpr_ZCrV-4uCiytc2vfwaM",
  authDomain: "vanderlust-app.firebaseapp.com",
  projectId: "vanderlust-app",
  storageBucket: "vanderlust-app.firebasestorage.app",
  messagingSenderId: "837244433268",
  appId: "1:837244433268:web:7638a14330c8bd7d217221",
  measurementId: "G-FGZVYNJSZP"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// storage removed: reviews are now text-only (no photo uploads)
const provider = new GoogleAuthProvider();

const ADMIN_EMAIL = "yourgmail@gmail.com";

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

/* ------------ DATA ------------- */
const destinations = [
  { id: 1, name: "Bali", country: "Indonesia", category: "Beach", price: 42000, icon: "🏝️", recommended: true,
    img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800",
    famous: "Bali is a tropical island paradise known for its stunning beaches, ancient temples, and vibrant culture. Experience the spiritual essence of Indonesia with lush rice paddies and world-class resorts.",
    enjoy: "Explore ancient temples like Tanah Lot, relax on pristine beaches, discover rice terraces in Ubud, enjoy spa treatments, and experience the bustling nightlife of Seminyak.",
    itinerary: ["Day 1: Arrival & beachside dinner at Seminyak","Day 2: Ubud rice terraces & traditional village","Day 3: Tanah Lot temple & waterfalls","Day 4: Beach clubs & water sports","Day 5: Shopping & cultural tours","Day 6: Spa & relaxation","Day 7: Fly back"],
    airline: "Garuda Indonesia" },
  { id: 2, name: "Tokyo", country: "Japan", category: "City", price: 70000, icon: "🗼", popular: true,
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800",
    famous: "Tokyo is a mesmerizing blend of ultra-modern technology and ancient traditions. The bustling metropolis features neon-lit streets, anime culture, cutting-edge technology, and world-class cuisine.",
    enjoy: "Walk through the iconic Shibuya Crossing, explore anime paradise in Akihabara, visit TeamLab digital museums, climb Mount Fuji, enjoy karaoke nights, and taste authentic Japanese street food.",
    itinerary: ["Day 1: Arrival & Shibuya Crossing exploration","Day 2: Harajuku fashion district & Meiji Shrine","Day 3: TeamLab Borderless museum","Day 4: Mount Fuji day trip & hot springs","Day 5: Akihabara anime & tech stores","Day 6: Traditional temples & gardens","Day 7: Fly back"],
    airline: "Japan Airlines" },
  { id: 3, name: "Paris", country: "France", category: "City", price: 78000, icon: "🥖", recommended: true,
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800",
    famous: "Paris, the City of Light, is renowned for its iconic landmarks, world-class museums, romantic atmosphere, and exquisite cuisine. Every corner tells a story of art, culture, and elegance.",
    enjoy: "Visit the majestic Eiffel Tower, explore the Louvre Museum, stroll through Versailles Palace gardens, wander charming streets of Montmartre, enjoy Seine river cruises, and savor French pastries.",
    itinerary: ["Day 1: Arrival & Eiffel Tower at sunset","Day 2: Seine river cruise & Notre-Dame","Day 3: Louvre Museum & art galleries","Day 4: Versailles Palace & gardens","Day 5: Montmartre & Sacré-Cœur Basilica","Day 6: Shopping on Champs-Élysées","Day 7: Fly back"],
    airline: "Air France" },
  { id: 4, name: "Dubai", country: "UAE", category: "City", price: 45000, icon: "🏜️", popular: true,
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800",
    famous: "Dubai is a ultramodern desert oasis featuring futuristic architecture, luxury shopping, desert adventures, and pristine beaches. It's a perfect blend of Arabian heritage and contemporary innovation.",
    enjoy: "Visit Burj Khalifa for panoramic views, experience desert safaris with traditional BBQ, explore Palm Jumeirah, enjoy yacht rides, shop at world-class malls, and relax on golden beaches.",
    itinerary: ["Day 1: Arrival & Burj Khalifa visit","Day 2: Dubai Mall shopping & Fountain show","Day 3: Desert Safari with BBQ dinner","Day 4: Palm Jumeirah & Atlantis Resort","Day 5: Marina yacht cruise & Jumeirah Beach","Day 6: Gold Souk & traditional markets","Day 7: Fly back"],
    airline: "Emirates" },
  { id: 5, name: "Swiss Alps", country: "Switzerland", category: "Nature", price: 99000, icon: "🏔️",
    img: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800",
    famous: "The Swiss Alps offer breathtaking mountain scenery, pristine alpine lakes, world-class skiing, and charming mountain villages. Experience nature at its most dramatic and pristine.",
    enjoy: "Ski on world-renowned slopes, ride scenic mountain trains, explore Lucerne's lakeside charm, trek through alpine meadows, visit crystal-clear mountain lakes, and enjoy authentic Swiss cuisine.",
    itinerary: ["Day 1: Arrival in Zurich & city tour","Day 2: Lucerne lake & mountain views","Day 3: Mount Titlis & Jungfrau train","Day 4: Skiing or hiking adventures","Day 5: Interlaken & adventure sports","Day 6: Swiss chocolate & watch factories","Day 7: Fly back"],
    airline: "Swiss Air" },
  { id: 6, name: "Maldives", country: "Maldives", category: "Beach", price: 120000, icon: "🏖️", recommended: true,
    img: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=800",
    famous: "The Maldives is a tropical paradise with turquoise lagoons, pristine coral reefs, and luxury overwater bungalows. Experience unparalleled beach luxury and world-class diving.",
    enjoy: "Stay in overwater villas, snorkel with tropical fish and sea turtles, explore vibrant coral reefs, enjoy water sports, relax at luxury spas, and witness stunning sunset dinners.",
    itinerary: ["Day 1: Arrival at island resort","Day 2: Snorkeling & reef exploration","Day 3: Island hopping adventure","Day 4: Water sports & diving","Day 5: Spa treatments & relaxation","Day 6: Sunset dolphin cruise","Day 7: Fly back"],
    airline: "Qatar Airways" },
  { id: 7, name: "Iceland", country: "Iceland", category: "Nature", price: 88000, icon: "🌋",
    img: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=800",
    famous: "Iceland is a land of fire and ice featuring dramatic geysers, powerful waterfalls, black sand beaches, and the mesmerizing Northern Lights. A truly otherworldly destination.",
    enjoy: "Bathe in the Blue Lagoon's geothermal waters, witness the Northern Lights, explore massive waterfalls, hike volcanic landscapes, relax in natural hot springs, and discover ice caves.",
    itinerary: ["Day 1: Arrival & Golden Circle tour","Day 2: Blue Lagoon geothermal spa","Day 3: Thingvellir National Park","Day 4: Waterfalls & black sand beaches","Day 5: Glacier hiking & ice caves","Day 6: Northern Lights hunting","Day 7: Fly back"],
    airline: "Icelandair" },
  { id: 8, name: "Rome", country: "Italy", category: "City", price: 65000, icon: "🏛️",
    img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800",
    famous: "Rome, the Eternal City, is a living museum of ancient history, Renaissance art, and timeless architecture. Every street reveals centuries of human civilization and culture.",
    enjoy: "Explore the iconic Colosseum and Roman Forum, visit Vatican City and St. Peter's Basilica, throw coins in Trevi Fountain, wander through charming cobblestone streets, and enjoy authentic Italian cuisine.",
    itinerary: ["Day 1: Arrival & Colosseum tour","Day 2: Roman Forum & Palatine Hill","Day 3: Vatican City & St. Peter's Basilica","Day 4: Trevi Fountain & Spanish Steps","Day 5: Italian cooking class & wine tasting","Day 6: Museum tours & art galleries","Day 7: Fly back"],
    airline: "ITA Airways" },
  { id: 9, name: "New York", country: "USA", category: "City", price: 85000, icon: "🗽", popular: true,
    img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800",
    famous: "New York City is the city that never sleeps, featuring iconic landmarks, world-class museums, Broadway shows, diverse neighborhoods, and limitless dining and entertainment options.",
    enjoy: "Experience Times Square energy, visit the Statue of Liberty, stroll through Central Park, walk the Brooklyn Bridge, watch Broadway shows, explore diverse neighborhoods, and taste global cuisines.",
    itinerary: ["Day 1: Arrival & Times Square exploration","Day 2: Statue of Liberty & Ellis Island","Day 3: Central Park & Museum of Natural History","Day 4: Brooklyn Bridge & Brooklyn","Day 5: Broadway show & 5th Avenue shopping","Day 6: Museums & galleries","Day 7: Fly back"],
    airline: "United Airlines" },
  { id: 10, name: "Bora Bora", country: "Polynesia", category: "Beach", price: 140000, icon: "🥥", popular: true,
    img: "https://images.unsplash.com/photo-1505881402582-c5bc11054f91?q=80&w=800",
    famous: "Bora Bora is a dream destination with turquoise lagoons, lush volcanic peaks, pristine beaches, and exclusive luxury resorts. Perfect for honeymoons and romantic getaways.",
    enjoy: "Swim with tropical fish, encounter sharks and rays in shallow waters, enjoy water sports, relax at exclusive resorts, snorkel pristine reefs, and experience ultimate tropical paradise.",
    itinerary: ["Day 1: Arrival & resort settlement","Day 2: Lagoon tour & snorkeling","Day 3: Shark & ray encounter","Day 4: Island exploration & hiking","Day 5: Water sports & diving","Day 6: Spa & beach relaxation","Day 7: Fly back"],
    airline: "Air Tahiti Nui" },
  { id: 11, name: "Machu Picchu", country: "Peru", category: "Nature", price: 95000, icon: "🗿",
    img: "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800",
    famous: "Machu Picchu is an ancient Inca citadel set high in the Andes mountains, mysterious and magnificent. This UNESCO World Heritage site is one of the New Seven Wonders of the World.",
    enjoy: "Trek to Machu Picchu through spectacular mountain scenery, explore Sacred Valley ruins, ride scenic trains through mountains, visit local Quechua communities, and experience Inca history.",
    itinerary: ["Day 1: Arrival in Cusco & acclimatization","Day 2: Sacred Valley tours & Ollantaytambo","Day 3: Inca Trail trekking begins","Day 4: Mountain trekking & camping","Day 5: Machu Picchu sunrise visit","Day 6: Local markets & artisan villages","Day 7: Fly back"],
    airline: "LATAM" },
  { id: 12, name: "Kyoto", country: "Japan", category: "City", price: 72000, icon: "⛩️",
    img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800",
    famous: "Kyoto is Japan's ancient capital, preserved as a window into traditional Japanese culture. With thousands of temples, traditional gardens, and geishas, it represents the soul of Japan.",
    enjoy: "Walk through thousands of red torii gates at Fushimi Inari, explore bamboo groves in Arashiyama, visit ancient temples, participate in tea ceremonies, and experience geisha performances.",
    itinerary: ["Day 1: Arrival & Kiyomizu-dera temple","Day 2: Arashiyama bamboo grove & hiking","Day 3: Fushimi Inari thousands of torii gates","Day 4: Traditional tea ceremony & gardens","Day 5: Gion district & geisha spotting","Day 6: Philosopher's Path & local crafts","Day 7: Fly back"],
    airline: "ANA" },
  { id: 13, name: "Cairo", country: "Egypt", category: "Nature", price: 55000, icon: "🐪",
    img: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=800",
    famous: "Cairo is the gateway to ancient Egypt, home to the legendary Pyramids of Giza, the Great Sphinx, and treasures of pharaonic civilization. The Nile River is the lifeblood of this timeless city.",
    enjoy: "Explore the colossal Pyramids of Giza and the Great Sphinx, cruise the majestic Nile River, visit ancient museums with mummy collections, shop in bustling Khan El-Khalili bazaar, and experience vibrant Egyptian culture.",
    itinerary: ["Day 1: Arrival & Egyptian Museum tour","Day 2: Pyramids of Giza & Great Sphinx","Day 3: Saqqara & Memphis ancient sites","Day 4: Nile River dinner cruise","Day 5: Khan El-Khalili bazaar shopping","Day 6: Local culture & mosque visits","Day 7: Fly back"],
    airline: "EgyptAir" },
  { id: 14, name: "Rio", country: "Brazil", category: "Beach", price: 80000, icon: "🎭",
    img: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800",
    famous: "Rio de Janeiro is a vibrant coastal city famous for its iconic Christ the Redeemer statue, stunning beaches, world-renowned carnival festival, and lively Brazilian culture and music.",
    enjoy: "Visit the iconic Christ the Redeemer statue, relax on Copacabana and Ipanema beaches, take cable car to Sugarloaf Mountain, experience live samba music, enjoy tropical fruit smoothies, and witness Rio's infectious energy.",
    itinerary: ["Day 1: Arrival & Copacabana beach","Day 2: Christ the Redeemer & Corcovado Mountain","Day 3: Sugarloaf Mountain cable car","Day 4: Ipanema beach & local cafes","Day 5: Samba shows & nightlife","Day 6: Botanical gardens & local markets","Day 7: Fly back"],
    airline: "GOL" },
  { id: 15, name: "London", country: "UK", category: "City", price: 78000, icon: "🚌", popular: true,
    img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800",
    famous: "London, the historic capital of the United Kingdom, is a blend of royal heritage, iconic landmarks, world-class museums, modern culture, and charming neighborhoods. A city that has captivated the world for centuries.",
    enjoy: "Ride the London Eye for panoramic views, visit iconic Big Ben and Houses of Parliament, explore Buckingham Palace, discover world-class museums, shop on Oxford Street, and experience British pub culture.",
    itinerary: ["Day 1: Arrival & Tower Bridge","Day 2: London Eye & Thames cruise","Day 3: Big Ben & Houses of Parliament","Day 4: Buckingham Palace & Royal Parks","Day 5: British Museum & National Gallery","Day 6: Shopping & West End theater","Day 7: Fly back"],
    airline: "British Airways" },
];

/* ------------ TOAST ------------- */
window.showToast = (msg, type = "success") => {
  const container = document.getElementById("toast-container");
  const div = document.createElement("div");
  div.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;
  div.innerHTML = `<span>${type === "error" ? "❌" : "✅"}</span><span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3000);
};

/* ------------ NAVIGATION ------------- */
window.navigateTo = (view) => {
  ["view-home","view-explore","view-wallet","view-admin","view-profile","view-planner","view-flights"]
    .forEach(id => document.getElementById(id).classList.add("hidden"));

  document.getElementById("view-" + view).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("nav-active"));
  document.getElementById("nav-" + view)?.classList.add("nav-active");

  if (view === "home") startHeroSlideshow();
  if (view === "home") renderCouponShelf();
  if (view === "home") renderHomeHighlights();
  if (view === "explore") renderDestinations();
  if (view === "wallet") loadWallet();
  if (view === "profile") loadProfile();
  if (view === "planner") loadAIPlanner();
  if (view === "flights") populateFlightDropdown();
  if (view === "admin") loadAdminTrips();
};

/* ------------ HERO ------------- */
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
  if (heroInterval) clearInterval(heroInterval);
  hero.style.backgroundImage = `url('${images[0]}')`;
  heroInterval = setInterval(() => {
    i = (i+1) % images.length;
    hero.style.backgroundImage = `url('${images[i]}')`;
  }, 5000);
}

/* ------------ HOME HIGHLIGHTS ------------- */
window.renderHomeHighlights = () => {
  const recContainer = document.getElementById('recommended-list');
  const popContainer = document.getElementById('popular-list');
  if (!recContainer || !popContainer) return;

  const recommended = destinations.filter(d => d.recommended).slice(0,8);
  const popular = destinations.filter(d => d.popular).slice(0,3);

  const makeCard = (d) => `
    <div class="highlight-card" onclick="openDestModal(${d.id})">
      <img src="${d.img}" alt="${d.name}">
      <div class="highlight-body">
        <div class="flex items-center justify-between">
          <div>
            <div class="highlight-title">${d.name} <span class="text-xs">${d.icon||''}</span></div>
            <div class="highlight-sub">${d.country}</div>
          </div>
          <div class="text-right">
            <div class="highlight-price">₹${d.price.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  recContainer.innerHTML = recommended.length ? recommended.map(makeCard).join('') : '<p class="text-slate-400">No recommended destinations right now.</p>';
  popContainer.innerHTML = popular.length ? popular.map(makeCard).join('') : '<p class="text-slate-400">No popular destinations right now.</p>';
};

/* ------------ EXPLORE ------------- */
window.setCategory = (cat) => {
  activeCategory = cat;
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`cat-${cat}`).classList.add("active");
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
    <div class="dest-card group" style="animation-delay:${index * 80}ms"
         onclick="openDestModal(${d.id})">
      <button onclick="toggleWishlist(event, ${d.id})"
              class="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white">
        <i id="heart-${d.id}" class="${wishlist.includes(d.id) ? 'fas' : 'far'} fa-heart"></i>
      </button>
      <img src="${d.img}" class="dest-img">
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

window.openDestModal = (id) => {
  const trip = destinations.find(d => d.id === id);
  if (!trip) return;
  document.getElementById("modal-img").src = trip.img;
  document.getElementById("modal-destination").innerText = trip.name;
  document.getElementById("modal-country").innerText = trip.country;
  document.getElementById("modal-famous").innerText = trip.famous;
  document.getElementById("modal-enjoy").innerText = trip.enjoy;
  document.getElementById("modal-timeline").innerHTML = trip.itinerary
    .map((step, i) => `
      <div class="relative">
        <div class="absolute -left-[21px] top-1 w-4 h-4 bg-fuchsia-500 rounded-full border-4 border-black"></div>
        <p class="text-sm text-slate-300 mb-4">
          <span class="font-bold text-fuchsia-400">${step}</span>
        </p>
      </div>
    `).join("");
  // set base price (per booking / per guest)
  document.getElementById("modal-base-price").innerText = trip.price;
  // reset booking inputs and coupon state
  document.getElementById("booking-guests").value = 1;
  document.getElementById("passenger-name").value = "";
  document.getElementById("booking-coupon").value = "";
  document.getElementById("coupon-feedback").innerText = "";
  appliedCoupon = null;
  updateTotalPrice();
  document.getElementById("booking-modal").classList.remove("hidden");
};

/* ------------------ Reviews: load and submit ------------------ */
window.loadReviews = async (destinationName) => {
  const list = document.getElementById('reviews-list');
  if (!list) return;
  list.innerHTML = '<p class="text-sm text-slate-400">Loading reviews...</p>';
  try {
    const q = query(collection(db, 'reviews'), where('destination', '==', destinationName));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = '<p class="text-sm text-slate-400">No reviews yet. Be the first to leave feedback!</p>';
      return;
    }
    list.innerHTML = snap.docs
      .sort((a,b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
      .map(d => {
          const r = d.data();
          const user = (r.userEmail || 'Guest').split('@')[0];
          const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
          return `
            <div class="glass-card p-3 border border-white/5">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm font-bold">${user}</p>
                  <p class="text-xs text-slate-400">${new Date((r.createdAt?.seconds||0) * 1000).toLocaleString()}</p>
                </div>
                <div class="text-amber-300">${stars}</div>
              </div>
              <p class="text-sm text-slate-300 mt-2">${r.content}</p>
            </div>
          `;
        }).join('');
  } catch (e) {
    console.error(e);
    list.innerHTML = '<p class="text-sm text-rose-400">Error loading reviews.</p>';
  }
};

window.submitReview = async () => {
  if (!currentUser) return showToast('Login to submit review', 'error');
  const destName = document.getElementById('modal-destination').innerText;
  const content = (document.getElementById('review-text').value || '').trim();
  const rating = parseInt(document.getElementById('review-rating').value) || 5;
  if (!content) return showToast('Please enter feedback text', 'error');
  document.getElementById('review-feedback').innerText = 'Submitting...';
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
    document.getElementById('review-feedback').innerText = 'Thanks — your review is posted.';
    loadReviews(destName);
  } catch (err) {
    console.error(err);
    showToast('Error submitting review', 'error');
    document.getElementById('review-feedback').innerText = '';
  }
};

window.applyCoupon = () => {
  const code = (document.getElementById("booking-coupon").value || "").toUpperCase().trim();
  if (!code) return showToast("Enter a coupon code", "error");
  const c = coupons[code];
  const feedback = document.getElementById("coupon-feedback");
  if (!c) {
    appliedCoupon = null;
    feedback.innerText = "Invalid or expired coupon.";
    feedback.classList.remove("text-emerald-400");
    feedback.classList.add("text-rose-400");
    updateTotalPrice();
    return;
  }
  appliedCoupon = { code, ...c };
  feedback.innerText = c.type === "percent" ? `${c.value}% off applied` : `₹${c.value} off applied`;
  feedback.classList.remove("text-rose-400");
  feedback.classList.add("text-emerald-400");
  updateTotalPrice();
};

window.renderCouponShelf = () => {
  const container = document.getElementById('coupon-list');
  if (!container) return;
  container.innerHTML = Object.keys(coupons).map((code, i) => {
    const c = coupons[code];
    const label = c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`;
    // add animated chip with staggered delays so users notice them
    return `<button aria-label="Coupon ${code}" class="coupon-chip pulse" style="animation-delay: ${i * 120}ms" onclick="copyCoupon('${code}')">${code} • ${label}</button>`;
  }).join('');
};

window.copyCoupon = async (code) => {
  try {
    await navigator.clipboard.writeText(code);
    // if booking modal open, prefill and apply
    const input = document.getElementById('booking-coupon');
    if (input) {
      input.value = code;
      applyCoupon();
    }
    showToast(`Coupon ${code} copied! Use in booking (or applied automatically if booking open)`);
  } catch (e) {
    console.error(e);
    showToast('Could not copy coupon', 'error');
  }
};

window.closeBookingModal = () =>
  document.getElementById("booking-modal").classList.add("hidden");

window.switchTab = (tab) => {
  document.getElementById("content-info").classList.toggle("hidden", tab !== "info");
  document.getElementById("content-plan").classList.toggle("hidden", tab !== "plan");
  document.getElementById("tab-info").classList.toggle("border-fuchsia-500", tab === "info");
  document.getElementById("tab-info").classList.toggle("border-transparent", tab !== "info");
  document.getElementById("tab-info").classList.toggle("text-white", tab === "info");
  document.getElementById("tab-info").classList.toggle("text-slate-500", tab !== "info");
  document.getElementById("tab-plan").classList.toggle("border-fuchsia-500", tab === "plan");
  document.getElementById("tab-plan").classList.toggle("border-transparent", tab !== "plan");
  document.getElementById("tab-plan").classList.toggle("text-white", tab === "plan");
  document.getElementById("tab-plan").classList.toggle("text-slate-500", tab !== "plan");
};

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

window.handlePayment = async () => {
  if (!currentUser) return showToast("Login first!", "error");
  const name = document.getElementById("passenger-name").value;
  const date = document.getElementById("booking-date").value;
  if (!name || !date) return showToast("Enter all details!", "error");
  
  const overlay = document.getElementById("payment-overlay");
  document.getElementById("pay-spinner").classList.remove("hidden");
  document.getElementById("pay-success").classList.add("hidden");
  overlay.classList.remove("hidden");

  setTimeout(async () => {
    document.getElementById("pay-spinner").classList.add("hidden");
    document.getElementById("pay-success").classList.remove("hidden");

    try {
      const destName = document.getElementById("modal-destination").innerText;
      const price = parseInt(document.getElementById("modal-price").innerText.replace("₹","").replace(/,/g,""));
      const guests = parseInt(document.getElementById("booking-guests").value) || 1;
      
      await addDoc(collection(db, "trips"), {
        userEmail: currentUser.email,
        userId: currentUser.uid,
        destination: destName,
        price: price,
        guests,
        date,
        status: "Paid",
        type: "Stay",
        passenger: name,
        createdAt: serverTimestamp()
      });
      
      setTimeout(() => {
        overlay.classList.add("hidden");
        document.getElementById("booking-modal").classList.add("hidden");
        showToast("Booking Confirmed!");
        navigateTo("wallet");
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast("Error booking stay", "error");
      overlay.classList.add("hidden");
    }
  }, 2000);
};

window.toggleWishlist = (e, id) => {
  e.stopPropagation();
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(x => x !== id);
  } else {
    wishlist.push(id);
  }
  localStorage.setItem("skytrails_wishlist", JSON.stringify(wishlist));
  renderDestinations();
};

/* ------------ AI PLANNER ------------- */
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
  if (!budget) return showToast("Enter budget!", "error");
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
    <p class="mb-3">${trip.enjoy}</p>
    <p class="text-[10px] text-slate-500 uppercase mb-1">Estimated Total</p>
    <p class="text-xl font-bold text-white">
      ₹${Math.floor(budget * 0.95).toLocaleString()}
      <span class="text-xs text-slate-500 font-normal">(approx)</span>
    </p>
  `;
};

/* ------------ FLIGHTS ------------- */
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
  if (!date) return showToast("Select Date!", "error");

  const dest = destinations.find(d => d.name === toCity);
  const resultsArea = document.getElementById("flight-results-area");
  const list = document.getElementById("flight-results-list");
  resultsArea.classList.remove("hidden");

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
                class="bg-fuchsia-600 text-xs font-bold px-4 py-2 rounded mt-1 hover:bg-fuchsia-500">
          BOOK
        </button>
      </div>
    </div>
  `).join("");
};

window.bookSpecificFlight = (airline, price, city, date) => {
  selectedFlight = { airline, price, dest: city, date };
  document.getElementById("f-modal-info").innerText =
    `${airline} to ${city} • ${date}`;
  document.getElementById("f-passenger-name").value = "";
  document.getElementById("f-passport-num").value = "";
  document.getElementById("f-guests").value = 1;
  updateFlightTotal();
  document.getElementById("flight-booking-modal").classList.remove("hidden");
};

window.updateFlightTotal = () => {
  if (!selectedFlight) return;
  const guests = parseInt(document.getElementById("f-guests").value) || 1;
  document.getElementById("f-total-price").innerText =
    "₹" + (selectedFlight.price * guests).toLocaleString();
};

window.closeFlightModal = () =>
  document.getElementById("flight-booking-modal").classList.add("hidden");

window.confirmFlightBooking = async () => {
  if (!currentUser) return showToast("Login first!", "error");

  const name = document.getElementById("f-passenger-name").value;
  const pass = document.getElementById("f-passport-num").value;
  const guests = parseInt(document.getElementById("f-guests").value) || 1;

  if (!name || !pass) return showToast("Enter details!", "error");

  const overlay = document.getElementById("payment-overlay");
  document.getElementById("pay-spinner").classList.remove("hidden");
  document.getElementById("pay-success").classList.add("hidden");
  overlay.classList.remove("hidden");

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
        showToast("Flight Booked!");
        navigateTo("wallet");
      }, 1500);
    } catch (e) {
      console.error(e);
      showToast("Error booking flight", "error");
      overlay.classList.add("hidden");
    }
  }, 2000);
};

/* ------------ WALLET ------------- */
async function loadWallet() {
  if (!currentUser) return;
  const container = document.getElementById("wallet-grid");
  container.innerHTML = "<p class='text-slate-400'>Loading...</p>";

  const q = query(collection(db, "trips"), where("userId", "==", currentUser.uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p class='text-slate-500'>No tickets yet.</p>";
    return;
  }

  const sortedDocs = snap.docs.sort(
    (a,b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0)
  );

  container.innerHTML = sortedDocs.map(d => {
    const t = d.data();
    return `
      <div class="ticket-container group relative">
        <div class="ticket-left">
          <div class="text-4xl bg-white/5 p-4 rounded-xl flex items-center justify-center">
            ✈️
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
                <p class="text-[10px] text-slate-500 uppercase">PAX</p>
                <p class="text-sm font-mono text-cyan-400">
                  ${t.passenger || "Guest"}
                </p>
              </div>
            </div>
            <div class="flex justify-between mt-2 border-t border-white/5 pt-2">
              <div>
                <p class="text-[9px] text-slate-500 uppercase">Date</p>
                <p class="text-xs font-bold text-white">${t.date}</p>
              </div>
              <div>
                <p class="text-[9px] text-slate-500 uppercase">Amount</p>
                <p class="text-xs font-bold text-emerald-400">
                  ₹${(t.price || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="ticket-right flex flex-col gap-2">
          <div class="stamp-paid">${(t.status || "PAID").toUpperCase()}</div>
        </div>
      </div>
    `;
  }).join("");
}

/* 🔥 FIXED: delete from Firestore + refresh */
window.cancelBooking = async (id, e) => {
  e.stopPropagation();
  if (!confirm("Cancel this trip?")) return;
  try {
    await deleteDoc(doc(db, "trips", id));
    showToast("Trip cancelled", "success");
    loadWallet();
  } catch (err) {
    console.error(err);
    showToast("Error cancelling", "error");
  }
};

/* ------------ PROFILE ------------- */
async function loadProfile() {
  if (!currentUser) return;
  document.getElementById("profile-email").innerText = currentUser.email;

  const userSnap = await getDocs(
    query(collection(db, "users"), where("uid","==", currentUser.uid))
  );
  let userData = {};
  userSnap.forEach(d => userData = d.data());
  const displayName = (userData.displayName || currentUser.email.split("@")[0]).toUpperCase();
  document.getElementById("profile-name").innerText = displayName;

  if (userData.photoURL) {
    document.getElementById("profile-img").src = userData.photoURL;
  }

  const tripsSnap = await getDocs(
    query(collection(db, "trips"), where("userId","==", currentUser.uid))
  );
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
  const photo = document.getElementById("edit-photo").value;
  if (!name) return showToast("Enter name!", "error");
  await setDoc(doc(db,"users",currentUser.uid), {
    displayName: name,
    ...(photo && { photoURL: photo })
  }, { merge: true });
  showToast("Profile Updated!");
  document.getElementById("edit-profile-form").classList.add("hidden");
  loadProfile();
};

/* ------------ ADMIN ------------- */
async function loadAdminTrips() {
  const snap = await getDocs(collection(db,"trips"));
  const body = document.getElementById("adminTripsTableBody");
  body.innerHTML = snap.docs.map(d => {
    const t = d.data();
    return `
      <tr class="border-b border-white/5">
        <td class="px-6 py-3">${t.userEmail}</td>
        <td class="px-6 py-3">${t.destination}</td>
        <td class="px-6 py-3 text-emerald-400">${t.status}</td>
        <td class="px-6 py-3">
          <button onclick="adminCancelTrip('${d.id}')"
                  class="text-xs text-red-400 underline">
            Mark Cancelled
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.adminCancelTrip = async (id) => {
  await updateDoc(doc(db,"trips",id), { status:"Cancelled" });
  showToast("Marked cancelled","success");
  loadAdminTrips();
};

/* ------------ AUTH ------------- */
window.handleGoogleLogin = async () => {
  try {
    const res = await signInWithPopup(auth, provider);
    await registerUser(res.user);
  } catch (e) {
    console.error(e);
    showToast("Login failed","error");
  }
};

window.handleEmailLogin = async () => {
  try {
    const res = await signInWithEmailAndPassword(
      auth,
      document.getElementById("login-email").value,
      document.getElementById("login-password").value
    );
    await registerUser(res.user);
  } catch (e) {
    showToast(e.message,"error");
  }
};

window.handleEmailSignup = async () => {
  try {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const code = document.getElementById("signup-code").value;

    if (!email || !password || !code) {
      return showToast("All fields required!", "error");
    }

    // Simple code validation - you can change this to match your requirement
    const validCodes = ["SKYTRAILS2024", "TRAVEL2025", "VTRIP123", "ADVENTURE"];
    if (!validCodes.includes(code.toUpperCase())) {
      return showToast("Invalid registration code!", "error");
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);
    await registerUser(res.user);
    
    // Clear signup form and switch back to login
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-password").value = "";
    document.getElementById("signup-code").value = "";
    toggleSignupForm();
    
    showToast("Account created successfully!");
  } catch (e) {
    showToast(e.message, "error");
  }
};

window.toggleSignupForm = () => {
  document.getElementById("login-form").classList.toggle("hidden");
  document.getElementById("signup-form").classList.toggle("hidden");
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
};

window.handleLogout = () => signOut(auth);

async function registerUser(user) {
  await setDoc(doc(db,"users",user.uid), {
    uid: user.uid,
    email: user.email,
    role: user.email === ADMIN_EMAIL ? "admin" : "user"
  }, { merge:true });
}

/* ------------ AUTH STATE ------------- */
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    document.getElementById("landing-view").classList.add("hidden");
    document.getElementById("app-view").classList.remove("hidden");
    if (user.email === ADMIN_EMAIL) {
      document.getElementById("nav-admin").classList.remove("hidden");
    }
    navigateTo("home");
    showToast("Welcome back!");
  } else {
    document.getElementById("landing-view").classList.remove("hidden");
    document.getElementById("app-view").classList.add("hidden");
  }
});




