/* ==========================================================================
   BUS WAVE — Core App Utilities
   ========================================================================== */

const BW = {
  fmtPrice(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  },
  qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  },
  store: {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch (e) { return fallback; }
    },
    set(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  },
  toast(msg, type = "info") {
    let box = document.getElementById("bw-toast-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "bw-toast-box";
      box.className = "bw-toast-box";
      document.body.appendChild(box);
    }
    const t = document.createElement("div");
    t.className = `bw-toast bw-toast--${type}`;
    t.textContent = msg;
    box.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, 3000);
  },
  currentUser() {
    return BW.store.get("bw_current_user", null);
  },
  bookingId() {
    return "BW" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
  }
};

/* ---------- Mobile nav + header auth state (runs on every page) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".navToggle");
  const menu = document.querySelector(".navMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
      toggle.classList.toggle("active");
    });
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.classList.remove("active");
    }));
  }

  const authSlot = document.querySelector("[data-auth-slot]");
  if (authSlot) {
    const user = BW.currentUser();
    if (user) {
      authSlot.innerHTML = `
        <div class="navUserMenu">
          <a href="profile.html" class="navUserBtn"><span class="avatarDot">${user.name.charAt(0).toUpperCase()}</span> ${user.name.split(" ")[0]}</a>
        </div>`;
    } else {
      authSlot.innerHTML = `<a href="login.html" class="btn btn--ghost btn--sm">Log In</a><a href="register.html" class="btn btn--primary btn--sm">Sign Up</a>`;
    }
  }

  const yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach(el => el.textContent = new Date().getFullYear());
});
