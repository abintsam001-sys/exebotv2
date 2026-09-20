/* ==========================================================================
   BUS WAVE — Demo Authentication (localStorage only, NOT secure/production)
   ========================================================================== */

function getUsers() { return BW.store.get("bw_users", []); }
function saveUsers(list) { BW.store.set("bw_users", list); }

function initRegisterPage() {
  const form = document.getElementById("registerForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value;

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^[0-9]{10}$/.test(phone) || password.length < 4) {
      BW.toast("Please fill all fields correctly (password min 4 chars)", "error");
      return;
    }
    const users = getUsers();
    if (users.find(u => u.email === email)) {
      BW.toast("An account with this email already exists", "error");
      return;
    }
    users.push({ name, email, phone, password });
    saveUsers(users);
    BW.store.set("bw_current_user", { name, email, phone });
    BW.toast("Account created! Welcome to BUS WAVE.", "success");
    setTimeout(() => window.location.href = "profile.html", 700);
  });
}

function initLoginPage() {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) { BW.toast("Invalid email or password", "error"); return; }
    BW.store.set("bw_current_user", { name: user.name, email: user.email, phone: user.phone });
    BW.toast(`Welcome back, ${user.name.split(" ")[0]}!`, "success");
    setTimeout(() => window.location.href = "profile.html", 600);
  });

  document.getElementById("demoLoginBtn")?.addEventListener("click", () => {
    let users = getUsers();
    let demo = users.find(u => u.email === "demo@buswave.test");
    if (!demo) {
      demo = { name: "Demo Rider", email: "demo@buswave.test", phone: "9876543210", password: "demo1234" };
      users.push(demo); saveUsers(users);
    }
    BW.store.set("bw_current_user", { name: demo.name, email: demo.email, phone: demo.phone });
    BW.toast("Logged in as Demo Rider", "success");
    setTimeout(() => window.location.href = "profile.html", 600);
  });
}

function initProfilePage() {
  const user = BW.currentUser();
  if (!user) { window.location.href = "login.html"; return; }
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("profileAvatar").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("profilePhone").value = user.phone || "";
  document.getElementById("profileNameInput").value = user.name || "";
  document.getElementById("profileEmailInput").value = user.email || "";

  const bookings = BW.store.get("bw_bookings", []);
  document.getElementById("statBookings").textContent = bookings.length;
  document.getElementById("statUpcoming").textContent = bookings.filter(b => b.status !== "cancelled" && new Date(b.date) >= new Date(new Date().toDateString())).length;
  document.getElementById("statSpend").textContent = BW.fmtPrice(bookings.reduce((s, b) => s + (b.status !== "cancelled" ? b.fare.total : 0), 0));

  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const updated = { ...user, name: document.getElementById("profileNameInput").value.trim(), phone: document.getElementById("profilePhone").value.trim() };
    BW.store.set("bw_current_user", updated);
    BW.toast("Profile updated", "success");
    setTimeout(() => window.location.reload(), 500);
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("bw_current_user");
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("registerForm")) initRegisterPage();
  if (document.getElementById("loginForm")) initLoginPage();
  if (document.getElementById("profileForm")) initProfilePage();
});
