
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const STORE_PROFILE = "freelancehubProfile";
  const STORE_SERVICES = "freelancehubServices";

  const defaultProfile = {
    fullName: "Ayesha Khan",
    professionalTitle: "UI/UX Designer",
    location: "Karachi, Pakistan",
    experience: "3 years",
    bio: "I am a creative UI/UX designer who creates clean, accessible and user-friendly digital experiences. I enjoy turning complex problems into simple interfaces.",
    skills: "Figma, UI Design, Wireframing, Prototyping"
  };
  const defaultServices = [{
    id: "sample-1",
    title: "I will design a modern mobile app UI in Figma",
    category: "UI/UX Design",
    price: 8000,
    delivery: "5 days",
    description: "I will design a clean, modern and user-friendly mobile app interface in Figma. The service includes key screens, reusable components and a clickable prototype.",
    tags: ["Figma", "UI Design", "Mobile App", "Prototyping"],
    image: "🎨"
  }];

  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
  }
  function profile() { return read(STORE_PROFILE, defaultProfile); }
  function services() { return read(STORE_SERVICES, defaultServices); }
  function saveServices(items) { localStorage.setItem(STORE_SERVICES, JSON.stringify(items)); }
  function initials(name) {
    return (name || "Freelancer").trim().split(/\s+/).slice(0,2).map(x => x[0]).join("").toUpperCase();
  }
  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message; el.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  const menuToggle = $("menuToggle"), navLinks = $("navLinks");
  if (menuToggle && navLinks) menuToggle.addEventListener("click", () => navLinks.classList.toggle("active"));

  // Retain Week 2 homepage search behaviour.
  const searchForm = $("searchForm");
  if (searchForm) searchForm.addEventListener("submit", e => {
    e.preventDefault(); const q = $("searchInput")?.value.trim();
    if (q) location.href = `freelancers.html?search=${encodeURIComponent(q)}`;
  });
  document.querySelectorAll(".popular-searches [data-search]").forEach(btn => btn.addEventListener("click", () => {
    location.href = `freelancers.html?search=${encodeURIComponent(btn.dataset.search)}`;
  }));

  // Profile page.
  const p = profile();
  if ($("profileName")) {
    $("profileName").textContent = p.fullName; $("profileTitle").textContent = p.professionalTitle;
    $("profileLocation").textContent = p.location || "Location not added";
    $("profileInitials").textContent = initials(p.fullName);
    $("profileBio").textContent = p.bio; $("profileExperience").textContent = p.experience || "Experience not added";
    $("profileSkills").innerHTML = (p.skills || "").split(",").map(s=>s.trim()).filter(Boolean).map(s=>`<span class="pill">${safe(s)}</span>`).join("");
    $("serviceCount").textContent = services().length;
    renderPreview();
  }
  if ($("publicName")) {
    $("publicName").textContent = p.fullName; $("publicNameSide").textContent = p.fullName;
    $("publicTitle").textContent = `${p.professionalTitle} · ${p.location}`;
    $("publicTitleSide").textContent = p.professionalTitle; $("publicInitials").textContent = initials(p.fullName);
    $("publicBio").textContent = p.bio;
    $("publicSkills").innerHTML = (p.skills || "").split(",").map(s=>s.trim()).filter(Boolean).map(s=>`<span class="pill">${safe(s)}</span>`).join("");
    renderCards($("publicServices"), services().slice(0,3), false);
  }

  // Edit profile: browser-side required-field validation + localStorage.
  const profileForm = $("profileForm");
  if (profileForm) {
    const current = profile();
    $("fullName").value = current.fullName; $("professionalTitle").value = current.professionalTitle;
    $("location").value = current.location; $("experience").value = current.experience;
    $("bio").value = current.bio; $("skills").value = current.skills;
    profileForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!profileForm.reportValidity()) return;
      const updated = {
        fullName: $("fullName").value.trim(), professionalTitle: $("professionalTitle").value.trim(),
        location: $("location").value.trim(), experience: $("experience").value.trim(),
        bio: $("bio").value.trim(), skills: $("skills").value.trim()
      };
      if (updated.bio.length < 20) { $("profileFormMessage").innerHTML = '<div class="notice error">Please write at least 20 characters in your bio.</div>'; return; }
      localStorage.setItem(STORE_PROFILE, JSON.stringify(updated));
      toast("Profile updated successfully!");
      setTimeout(() => location.href = "profile.html", 500);
    });
  }

  // Service form supports both create and edit.
  const serviceForm = $("serviceForm");
  if (serviceForm) {
    const editId = new URLSearchParams(location.search).get("edit");
    if (editId) {
      const found = services().find(s => s.id === editId);
      if (found) {
        $("serviceId").value = found.id; $("serviceTitle").value = found.title;
        $("serviceCategory").value = found.category; $("servicePrice").value = found.price;
        $("deliveryTime").value = found.delivery; $("serviceDescription").value = found.description;
        $("serviceTags").value = found.tags.join(", "); $("serviceImage").value = found.image || "";
        $("serviceSubmit").textContent = "Save Service Changes";
        document.querySelector(".page-heading h1").textContent = "Edit Service";
      }
    }
    serviceForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!serviceForm.reportValidity()) return;
      const title = $("serviceTitle").value.trim(), description = $("serviceDescription").value.trim();
      const price = Number($("servicePrice").value), tags = $("serviceTags").value.split(",").map(x=>x.trim()).filter(Boolean);
      if (title.length < 10 || description.length < 30 || !Number.isFinite(price) || price < 500 || tags.length === 0) {
        $("serviceFormMessage").innerHTML = '<div class="notice error">Check your title, description, price (minimum PKR 500) and add at least one skill tag.</div>'; return;
      }
      const all = services(), id = $("serviceId").value || `service-${Date.now()}`;
      const item = { id, title, category: $("serviceCategory").value, price,
        delivery: $("deliveryTime").value, description, tags, image: $("serviceImage").value.trim() || "💼" };
      const index = all.findIndex(s => s.id === id);
      if (index >= 0) all[index] = item; else all.unshift(item);
      saveServices(all); toast(index >= 0 ? "Service updated!" : "Service published!");
      setTimeout(() => location.href = "my-services.html", 500);
    });
  }

  function renderCards(container, items, actions) {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🧩</div><h3>No services yet</h3><p class="muted">Create your first service to show clients what you offer.</p><a class="btn btn-primary" href="create-service.html">Create a Service</a></div>'; return;
    }
    container.innerHTML = items.map(s => `<article class="service-card">
      <div class="service-art">${safe(s.image || "💼")}</div><div class="service-card-body">
      <span class="eyebrow">${safe(s.category)}</span><h3>${safe(s.title)}</h3>
      <p class="muted">${safe((s.description || "").slice(0,105))}${s.description?.length>105?"…":""}</p>
      <div class="service-meta"><span>${safe(s.delivery)} delivery</span><strong class="service-price">PKR ${Number(s.price).toLocaleString("en-PK")}</strong></div>
      <div class="action-row"><a class="btn btn-outline btn-small" href="service-details.html?id=${encodeURIComponent(s.id)}">View</a>
      ${actions ? `<a class="btn btn-outline btn-small" href="create-service.html?edit=${encodeURIComponent(s.id)}">Edit</a><button class="btn btn-danger btn-small" data-delete="${safe(s.id)}" type="button">Delete</button>` : ""}</div>
      </div></article>`).join("");
  }
  function renderPreview() { renderCards($("profileServicePreview"), services().slice(0,1), false); }
  const list = $("myServicesList");
  if (list) {
    renderCards(list, services(), true);
    list.addEventListener("click", e => {
      const btn = e.target.closest("[data-delete]");
      if (!btn) return;
      const id = btn.dataset.delete;
      if (confirm("Delete this service? This action cannot be undone.")) {
        saveServices(services().filter(s => s.id !== id));
        renderCards(list, services(), true); toast("Service deleted.");
      }
    });
  }

  // Service details page.
  const details = $("serviceDetails");
  if (details) {
    const id = new URLSearchParams(location.search).get("id");
    const item = services().find(s => s.id === id) || services()[0];
    if (!item) details.innerHTML = '<div class="empty-state"><h2>Service not found</h2><a class="inline-link" href="my-services.html">Return to My Services</a></div>';
    else details.innerHTML = `<div class="detail-layout"><section class="panel"><div class="detail-visual">${safe(item.image || "💼")}</div><p class="eyebrow">${safe(item.category)}</p><h1 style="font-family:Manrope,sans-serif;margin-bottom:14px">${safe(item.title)}</h1><p>${safe(item.description)}</p><div class="tag-list">${item.tags.map(t=>`<span class="tag">${safe(t)}</span>`).join("")}</div></section><aside class="panel"><p class="muted">Starting price</p><p class="service-price" style="font-size:30px">PKR ${Number(item.price).toLocaleString("en-PK")}</p><p style="margin:14px 0">⏱ ${safe(item.delivery)} delivery</p><p class="muted">Offered by ${safe(profile().fullName)}</p><div class="form-actions"><a class="btn btn-primary" href="freelancer-profile.html">View Freelancer</a><a class="btn btn-outline" href="my-services.html">Back to Services</a></div></aside></div>`;
  }
});
