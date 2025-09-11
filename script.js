/* script.js
   - localStorage persistence
   - render stats
   - render donor list cards
   - live search & filter
   - registration panel and form handling
*/

const LS_KEY = "donors_v1";

// elements
const donorGrid = document.getElementById("donorGrid");
const totalCountEl = document.getElementById("totalCount");
const bloodCountEl = document.getElementById("bloodCount");
const organCountEl = document.getElementById("organCount");
const emptyMsg = document.getElementById("emptyMsg");

const btnRegister = document.getElementById("btnRegister");
const btnFind = document.getElementById("btnFind");
const heroRegister = document.getElementById("heroRegister");
const heroFind = document.getElementById("heroFind");

const registerPanel = document.getElementById("registerPanel");
const closePanel = document.getElementById("closePanel");
const donorForm = document.getElementById("donorForm");
const cancelBtn = document.getElementById("cancelBtn");

const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const clearSearch = document.getElementById("clearSearch");

const toast = document.getElementById("toast");
const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

// helper: get donors from localStorage
function loadDonors() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      // Seed demo entry for nicer initial look (optional). Comment out if you don't want seeds.
      const seed = [
        { id: uid(), name: "Harsha Vardhan", blood: "O+", organ: "Kidney", location: "Mumbai", contact: "amit@example.com", created: Date.now() }
      ];
      localStorage.setItem(LS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) || [];
  } catch (e) {
    console.error("Load donors error", e);
    return [];
  }
}

function saveDonors(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// id generator
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// render functions
function renderStats(list) {
  const total = list.length;
  const bloodCount = list.filter(d => d.blood && d.blood.trim() !== "").length;
  const organCount = list.filter(d => d.organ && d.organ.trim() !== "").length;
  totalCountEl.textContent = total;
  bloodCountEl.textContent = bloodCount;
  organCountEl.textContent = organCount;
}

function createDonorCard(donor) {
  const card = document.createElement("div");
  card.className = "donor-card show";
  // avatar initials
  const initials = (donor.name || "A").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

  card.innerHTML = `
    <div class="donor-avatar">${initials}</div>
    <div class="donor-body">
      <div class="donor-name">${escapeHtml(donor.name)}</div>
      <div class="donor-meta">
        <span class="badge">${escapeHtml(donor.blood || "—")}</span>
        &nbsp;•&nbsp; ${escapeHtml(donor.organ || "No organ listed")} &nbsp;•&nbsp; ${escapeHtml(donor.location)}
      </div>
      <div class="card-actions">
        <button class="btn ghost small contact-btn">Contact</button>
        <button class="btn ghost small copy-btn">Copy</button>
        <button class="btn ghost small remove-btn">Remove</button>
      </div>
    </div>
  `;

  // actions
  card.querySelector(".contact-btn").addEventListener("click", () => {
    const c = donor.contact || "";
    if (validateEmail(c)) {
      window.location.href = `mailto:${encodeURIComponent(c)}?subject=Regarding%20Donation`;
    } else if (validatePhone(c)) {
      window.location.href = `tel:${c}`;
    } else {
      showToast("Contact saved: " + c);
    }
  });

  card.querySelector(".copy-btn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(`${donor.name} — ${donor.contact}`);
      showToast("Contact copied to clipboard");
    } catch (e) {
      showToast("Unable to copy");
    }
  });

  card.querySelector(".remove-btn").addEventListener("click", () => {
    if (confirm(`Remove donor ${donor.name}?`)) {
      removeDonor(donor.id);
    }
  });

  return card;
}

function renderDonorGrid(list) {
  donorGrid.innerHTML = "";
  if (!list || !list.length) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";
  list.forEach(d => {
    donorGrid.appendChild(createDonorCard(d));
  });
}

// remove donor
function removeDonor(id) {
  const data = loadDonors().filter(d => d.id !== id);
  saveDonors(data);
  applyFilters();
  showToast("Donor removed");
}

// search & filter logic
function applyFilters() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const bloodFilter = (filterType.value || "").trim();
  let data = loadDonors();

  if (bloodFilter) {
    data = data.filter(d => (d.blood || "").toLowerCase() === bloodFilter.toLowerCase());
  }

  if (q) {
    data = data.filter(d => {
      return (d.name || "").toLowerCase().includes(q)
        || (d.blood || "").toLowerCase().includes(q)
        || (d.organ || "").toLowerCase().includes(q)
        || (d.location || "").toLowerCase().includes(q)
        || (d.contact || "").toLowerCase().includes(q);
    });
  }

  renderStats(loadDonors());
  renderDonorGrid(data);
}

// panel open/close
function openRegister() {
  registerPanel.classList.remove("hidden");
  setTimeout(() => {
    registerPanel.querySelector("input,select").focus();
  }, 120);
}

function closeRegister() {
  registerPanel.classList.add("hidden");
  donorForm.reset();
}

// toast
let toastTimer = null;
function showToast(msg = "Saved") {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

// utilities
function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function validateEmail(v){
  return /\S+@\S+\.\S+/.test(v);
}
function validatePhone(v){
  return /^[\d\s()+-]{6,20}$/.test(v);
}

// setup listeners
btnRegister.addEventListener("click", openRegister);
heroRegister.addEventListener("click", openRegister);
closePanel.addEventListener("click", closeRegister);
cancelBtn.addEventListener("click", closeRegister);

btnFind.addEventListener("click", () => {
  document.getElementById("searchInput").focus();
});
heroFind.addEventListener("click", () => {
  document.getElementById("searchInput").focus();
});

searchInput.addEventListener("input", () => applyFilters());
filterType.addEventListener("change", () => applyFilters());
clearSearch.addEventListener("click", () => {
  searchInput.value = ""; filterType.value = "";
  applyFilters();
});

// form submit
donorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("donorName").value.trim();
  const blood = document.getElementById("donorBlood").value.trim();
  const organ = document.getElementById("donorOrgan").value.trim();
  const location = document.getElementById("donorLocation").value.trim();
  const contact = document.getElementById("donorContact").value.trim();

  if (!name || !blood || !location || !contact) {
    alert("Please fill required fields (Name, Blood Type, Location, Contact).");
    return;
  }

  const list = loadDonors();
  const newDonor = { id: uid(), name, blood, organ, location, contact, created: Date.now() };
  list.unshift(newDonor);
  saveDonors(list);
  showToast("Registered successfully");
  closeRegister();
  applyFilters();
});

// initial render
(function init(){
  // reveal animations for cards on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  }, {threshold: 0.15});

  document.querySelectorAll(".stat-card, .donor-card").forEach(el => observer.observe(el));

  // initial load
  const data = loadDonors();
  renderStats(data);
  applyFilters();
})();
