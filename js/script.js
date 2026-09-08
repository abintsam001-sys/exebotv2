document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-btn");
  const nav = document.querySelector("nav");
  if (menu) menu.addEventListener("click", () => nav.classList.toggle("open"));

  const episodeGrid = document.getElementById("episodeGrid");
  if (episodeGrid && typeof episodes !== "undefined") {
    episodeGrid.innerHTML = episodes.map(e => `
      <article class="episode-card">
        <div class="thumb"><span>EP ${String(e.id).padStart(2,"0")}</span><div class="play small">▶</div></div>
        <div class="card-body"><span class="muted">${e.date}</span><h3>${e.title}</h3><p>${e.description}</p>
        <a class="btn btn-gold full" href="watch.html?ep=${e.id}">Watch Now</a></div>
      </article>`).join("");
  }

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

  const contestantGrid = document.getElementById("contestantGrid");
  if (contestantGrid && typeof contestants !== "undefined") {
    contestantGrid.innerHTML = contestants.map((c,i) => `
      <article class="contestant-card"><div class="avatar">${String(i+1).padStart(2,"0")}</div>
      <div><span class="muted">${c.role}</span><h3>${c.name}</h3><p>${c.bio}</p></div></article>`).join("");
  }

  const updateBox = document.getElementById("updates");
  if (updateBox && typeof updates !== "undefined") {
    updateBox.innerHTML = updates.map(u => `
      <article class="update-card"><span class="tag">${u.date}</span><h3>${u.title}</h3><p>${u.text}</p></article>`).join("");
  }
});