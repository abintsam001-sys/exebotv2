document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-btn");
  const nav = document.querySelector("nav");
  if (menu) menu.addEventListener("click", () => nav.classList.toggle("open"));

  /* ---------- Navbar shrink-on-scroll ---------- */
  const navbar = document.querySelector(".navbar");
  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scrolling updates ticker ---------- */
  const tickerTrack = document.getElementById("tickerTrack");
  if (tickerTrack && typeof updates !== "undefined" && updates.length) {
    const items = updates.map(u => `<span><b>${u.date}</b>${u.title || u.text}</span>`);
    // duplicate the list so the CSS marquee (translateX -50%) loops seamlessly
    tickerTrack.innerHTML = items.concat(items).join("");
  }

  /* ---------- Episodes grid ---------- */
  const episodeGrid = document.getElementById("episodeGrid");
  if (episodeGrid && typeof episodes !== "undefined") {
    episodeGrid.innerHTML = episodes.map(e => `
      <article class="episode-card reveal">
        <div class="thumb"><span>EP ${String(e.id).padStart(2,"0")}</span><div class="play small">▶</div></div>
        <div class="card-body"><span class="muted">${e.date}</span><h3>${e.title}</h3><p>${e.description}</p>
        <a class="btn btn-gold full" href="watch.html?ep=${e.id}">Watch Now</a></div>
      </article>`).join("");
  }

  /* ---------- Watch page ---------- */
  const watch = document.getElementById("watchContent");
  if (watch && typeof episodes !== "undefined") {
    const id = Number(new URLSearchParams(location.search).get("ep")) || 1;
    const e = episodes.find(x => x.id === id) || episodes[0];
    watch.innerHTML = `
      <p class="eyebrow">EPISODE ${String(e.id).padStart(2,"0")}</p>
      <h1>${e.title}</h1>
      <p class="muted">${e.date}</p>
      <div class="video-box">
        ${e.videoUrl ? `<iframe src="${e.videoUrl}" title="${e.title}" allowfullscreen></iframe>` :
        `<div class="video-placeholder"><div class="play">▶</div><h3>Video link not added yet</h3><p>Open <b>js/data.js</b> and paste the video URL into this episode's <b>videoUrl</b>.</p></div>`}
      </div>
      <div class="watch-description"><h2>About this episode</h2><p>${e.description}</p></div>`;
  }

  /* ---------- Contestants grid (with add-photo option) ---------- */
  const contestantGrid = document.getElementById("contestantGrid");
  if (contestantGrid && typeof contestants !== "undefined") {

    const storageKey = name => `bbm8_photo_${name}`;
    const getSavedPhoto = name => {
      try { return localStorage.getItem(storageKey(name)); } catch (err) { return null; }
    };
    const savePhoto = (name, dataUrl) => {
      try { localStorage.setItem(storageKey(name), dataUrl); } catch (err) { /* storage full or blocked - ignore */ }
    };

    const avatarInnerHTML = (name, photo, num) => photo ? `
      <img class="avatar-photo" src="${photo}" alt="${name}">
      <label class="avatar-upload">
        <span class="upload-label">Change photo</span>
        <input type="file" accept="image/*" class="avatar-input" data-name="${name}">
      </label>` : `
      <span class="avatar-num">${num}</span>
      <label class="avatar-upload avatar-upload-empty">
        <span class="upload-label">＋ Add photo</span>
        <input type="file" accept="image/*" class="avatar-input" data-name="${name}">
      </label>`;

    contestantGrid.innerHTML = contestants.map((c, i) => {
      const num = String(i + 1).padStart(2, "0");
      const photo = c.image || getSavedPhoto(c.name);
      return `
      <article class="contestant-card reveal">
        <div class="avatar ${photo ? "has-photo" : ""}" data-name="${c.name}" data-num="${num}">
          ${avatarInnerHTML(c.name, photo, num)}
        </div>
        <div><span class="muted">${c.role}</span><h3>${c.name}</h3><p>${c.bio}</p></div>
      </article>`;
    }).join("");

    // Delegated listener: works for inputs re-rendered after a photo is added.
    contestantGrid.addEventListener("change", (ev) => {
      const input = ev.target.closest(".avatar-input");
      if (!input) return;
      const file = input.files && input.files[0];
      if (!file) return;
      const name = input.dataset.name;
      const avatarEl = input.closest(".avatar");
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        savePhoto(name, dataUrl);
        avatarEl.classList.add("has-photo");
        avatarEl.innerHTML = avatarInnerHTML(name, dataUrl, avatarEl.dataset.num);
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Updates list ---------- */
  const updateBox = document.getElementById("updates");
  if (updateBox && typeof updates !== "undefined") {
    updateBox.innerHTML = updates.map(u => `
      <article class="update-card reveal"><span class="tag">${u.date}</span><h3>${u.title}</h3><p>${u.text}</p></article>`).join("");
  }

  /* ---------- Scroll-reveal animation for cards/sections ---------- */
  const revealTargets = document.querySelectorAll(
    ".reveal, .grid-3, .feature-card, .page-title, .section-head"
  );
  revealTargets.forEach(el => el.classList.add("reveal"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${(idx % 6) * 60}ms`;
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  /* ---------- Subtle hero logo tilt on mouse move ---------- */
  const heroLogo = document.querySelector(".hero-logo");
  const heroLogoImg = heroLogo ? heroLogo.querySelector("img") : null;
  if (heroLogo && heroLogoImg && window.matchMedia("(pointer:fine)").matches) {
    heroLogo.addEventListener("mousemove", (e) => {
      const rect = heroLogo.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroLogoImg.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    });
    heroLogo.addEventListener("mouseleave", () => {
      heroLogoImg.style.transform = "rotateY(0) rotateX(0)";
    });
  }
});
