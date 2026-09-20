/* ==========================================================================
   BUS WAVE — Admin Dashboard Logic (demo, localStorage-backed)
   ========================================================================== */

const Admin = {
  getBuses() {
    let list = BW.store.get("bw_admin_buses", null);
    if (!list) { list = JSON.parse(JSON.stringify(BUSES)); BW.store.set("bw_admin_buses", list); }
    return list;
  },
  saveBuses(list) { BW.store.set("bw_admin_buses", list); },
  getOffers() {
    let list = BW.store.get("bw_admin_offers", null);
    if (!list) { list = JSON.parse(JSON.stringify(OFFERS)); BW.store.set("bw_admin_offers", list); }
    return list;
  },
  saveOffers(list) { BW.store.set("bw_admin_offers", list); },
  getBookings() { return BW.store.get("bw_bookings", []); },
  getUsers() { return BW.store.get("bw_users", []); }
};

/* ---------- Sidebar mobile toggle (shared across admin pages) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".navToggleAdmin");
  const sidebar = document.querySelector(".adminSidebar");
  if (toggle && sidebar) toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
});

/* ---------- Dashboard (admin/index.html) ---------- */
function initAdminDashboard() {
  const buses = Admin.getBuses();
  const bookings = Admin.getBookings();
  const today = new Date().toDateString();
  const todayBookings = bookings.filter(b => new Date(b.bookedAt).toDateString() === today);
  const revenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.fare.total, 0);

  document.getElementById("kpiBuses").textContent = buses.length;
  document.getElementById("kpiBookings").textContent = bookings.length;
  document.getElementById("kpiToday").textContent = todayBookings.length;
  document.getElementById("kpiRevenue").textContent = BW.fmtPrice(revenue);

  const recentBox = document.getElementById("recentBookingsTable");
  const recent = bookings.slice(0, 6);
  recentBox.innerHTML = recent.length ? recent.map(b => `
    <tr>
      <td>${b.id}</td><td>${b.from} → ${b.to}</td><td>${b.passengers[0]?.name || "—"}</td>
      <td>${BW.fmtPrice(b.fare.total)}</td><td><span class="badge ${b.status === "cancelled" ? "badge--red" : "badge--green"}">${b.status}</span></td>
    </tr>`).join("") : `<tr><td colspan="5" style="text-align:center;color:var(--ink-500)">No bookings yet</td></tr>`;
}

/* ---------- Manage Buses (admin/buses.html) ---------- */
function initAdminBuses() {
  let buses = Admin.getBuses();
  const tbody = document.getElementById("busesTable");
  const modal = document.getElementById("busModal");
  const form = document.getElementById("busForm");

  function render() {
    buses = Admin.getBuses();
    tbody.innerHTML = buses.map((b, i) => `
      <tr>
        <td>${b.id}</td><td>${b.operator}</td><td>${b.from} → ${b.to}</td>
        <td>${b.busType}</td><td>${BW.fmtPrice(b.price)}</td>
        <td>${b.totalSeats - b.bookedCount}/${b.totalSeats}</td>
        <td>${b.rating} ★</td>
        <td class="tableActions">
          <button class="iconBtn" data-edit="${i}">Edit</button>
          <button class="iconBtn iconBtn--danger" data-del="${i}">Delete</button>
        </td>
      </tr>`).join("");

    tbody.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => openModal(Number(btn.dataset.edit))));
    tbody.querySelectorAll("[data-del]").forEach(btn => btn.addEventListener("click", () => {
      if (!confirm("Delete this bus?")) return;
      buses.splice(Number(btn.dataset.del), 1);
      Admin.saveBuses(buses);
      render();
      BW.toast("Bus deleted", "success");
    }));
  }

  function openModal(idx) {
    form.reset();
    form.dataset.idx = idx === undefined ? "" : idx;
    document.getElementById("busModalTitle").textContent = idx === undefined ? "Add Bus" : "Edit Bus";
    if (idx !== undefined) {
      const b = buses[idx];
      document.getElementById("bfOperator").value = b.operator;
      document.getElementById("bfFrom").value = b.from;
      document.getElementById("bfTo").value = b.to;
      document.getElementById("bfType").value = b.busType;
      document.getElementById("bfPrice").value = b.price;
      document.getElementById("bfSeats").value = b.totalSeats;
      document.getElementById("bfAvailable").value = b.totalSeats - b.bookedCount;
      document.getElementById("bfDeparture").value = b.departure;
    }
    modal.classList.add("open");
  }

  document.getElementById("addBusBtn").addEventListener("click", () => openModal(undefined));
  document.querySelectorAll("[data-close-modal]").forEach(x => x.addEventListener("click", () => modal.classList.remove("open")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const totalSeats = Number(document.getElementById("bfSeats").value);
    const available = Number(document.getElementById("bfAvailable").value);
    const data = {
      operator: document.getElementById("bfOperator").value.trim(),
      from: document.getElementById("bfFrom").value.trim(),
      to: document.getElementById("bfTo").value.trim(),
      busType: document.getElementById("bfType").value,
      price: Number(document.getElementById("bfPrice").value),
      totalSeats,
      bookedCount: Math.max(0, totalSeats - available),
      departure: document.getElementById("bfDeparture").value || "09:00"
    };
    const idx = form.dataset.idx;
    if (idx === "") {
      const durMin = 300;
      buses.push({
        id: "BW" + (3000 + buses.length), ...data,
        ac: data.busType.includes("AC") && !data.busType.includes("Non"),
        seater: data.busType.toLowerCase().includes("seater"),
        arrival: addMinutes(data.departure, durMin), durationMin: durMin,
        rating: 4.2, ratingCount: 10,
        boardingPoints: CITY_POINTS[data.from] || ["Main Bus Stand"],
        droppingPoints: CITY_POINTS[data.to] || ["Main Bus Stand"],
        amenities: ["Charging Point", "Water Bottle"]
      });
    } else {
      buses[Number(idx)] = { ...buses[Number(idx)], ...data };
    }
    Admin.saveBuses(buses);
    modal.classList.remove("open");
    render();
    BW.toast("Bus saved", "success");
  });

  render();
}

/* ---------- Manage Bookings (admin/bookings.html) ---------- */
function initAdminBookings() {
  const tbody = document.getElementById("adminBookingsTable");
  function render() {
    const bookings = Admin.getBookings();
    tbody.innerHTML = bookings.length ? bookings.map((b, i) => `
      <tr>
        <td>${b.id}</td><td>${b.passengers.map(p => p.name).join(", ")}</td>
        <td>${b.from} → ${b.to}</td><td>${new Date(b.date + "T00:00:00").toDateString()}</td>
        <td>${b.seats.map(s => s.number).join(", ")}</td>
        <td>${BW.fmtPrice(b.fare.total)}</td>
        <td><span class="badge ${b.status === "cancelled" ? "badge--red" : "badge--green"}">${b.status}</span></td>
        <td>${b.status !== "cancelled" ? `<button class="iconBtn iconBtn--danger" data-cancel="${i}">Cancel</button>` : "—"}</td>
      </tr>`).join("") : `<tr><td colspan="8" style="text-align:center;color:var(--ink-500)">No bookings yet</td></tr>`;

    tbody.querySelectorAll("[data-cancel]").forEach(btn => btn.addEventListener("click", () => {
      const bookings = Admin.getBookings();
      bookings[Number(btn.dataset.cancel)].status = "cancelled";
      BW.store.set("bw_bookings", bookings);
      render();
      BW.toast("Booking cancelled", "success");
    }));
  }
  render();
}

/* ---------- Manage Users (admin/users.html) ---------- */
function initAdminUsers() {
  const tbody = document.getElementById("adminUsersTable");
  const users = Admin.getUsers();
  tbody.innerHTML = users.length ? users.map(u => `
    <tr><td>${u.name}</td><td>${u.email}</td><td>${u.phone}</td></tr>
  `).join("") : `<tr><td colspan="3" style="text-align:center;color:var(--ink-500)">No registered users yet — try Register on the main site</td></tr>`;
}

/* ---------- Manage Offers (admin/offers.html) ---------- */
function initAdminOffers() {
  let offers = Admin.getOffers();
  const tbody = document.getElementById("adminOffersTable");
  const modal = document.getElementById("offerModal");
  const form = document.getElementById("offerForm");

  function render() {
    offers = Admin.getOffers();
    tbody.innerHTML = offers.map((o, i) => `
      <tr>
        <td><b>${o.code}</b></td><td>${o.type}</td><td>${o.value}</td><td>${BW.fmtPrice(o.minAmount)}</td><td>${BW.fmtPrice(o.cap)}</td>
        <td class="tableActions">
          <button class="iconBtn" data-editOffer="${i}">Edit</button>
          <button class="iconBtn iconBtn--danger" data-delOffer="${i}">Delete</button>
        </td>
      </tr>`).join("");
    tbody.querySelectorAll("[data-editOffer]").forEach(btn => btn.addEventListener("click", () => openModal(Number(btn.dataset.editoffer ?? btn.dataset.editOffer))));
    tbody.querySelectorAll("[data-delOffer]").forEach(btn => btn.addEventListener("click", () => {
      if (!confirm("Delete this offer?")) return;
      offers.splice(Number(btn.dataset.deloffer ?? btn.dataset.delOffer), 1);
      Admin.saveOffers(offers);
      render();
      BW.toast("Offer deleted", "success");
    }));
  }

  function openModal(idx) {
    form.reset();
    form.dataset.idx = idx === undefined ? "" : idx;
    document.getElementById("offerModalTitle").textContent = idx === undefined ? "Add Offer" : "Edit Offer";
    if (idx !== undefined) {
      const o = offers[idx];
      document.getElementById("ofCode").value = o.code;
      document.getElementById("ofType").value = o.type;
      document.getElementById("ofValue").value = o.value;
      document.getElementById("ofMin").value = o.minAmount;
      document.getElementById("ofCap").value = o.cap;
      document.getElementById("ofDesc").value = o.desc;
    }
    modal.classList.add("open");
  }

  document.getElementById("addOfferBtn").addEventListener("click", () => openModal(undefined));
  document.querySelectorAll("[data-close-modal]").forEach(x => x.addEventListener("click", () => modal.classList.remove("open")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      code: document.getElementById("ofCode").value.trim().toUpperCase(),
      type: document.getElementById("ofType").value,
      value: Number(document.getElementById("ofValue").value),
      minAmount: Number(document.getElementById("ofMin").value),
      cap: Number(document.getElementById("ofCap").value),
      desc: document.getElementById("ofDesc").value.trim()
    };
    const idx = form.dataset.idx;
    if (idx === "") offers.push(data); else offers[Number(idx)] = data;
    Admin.saveOffers(offers);
    modal.classList.remove("open");
    render();
    BW.toast("Offer saved", "success");
  });

  render();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("kpiBuses")) initAdminDashboard();
  if (document.getElementById("busesTable")) initAdminBuses();
  if (document.getElementById("adminBookingsTable")) initAdminBookings();
  if (document.getElementById("adminUsersTable")) initAdminUsers();
  if (document.getElementById("adminOffersTable")) initAdminOffers();
});
