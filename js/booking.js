/* ==========================================================================
   BUS WAVE — Passenger / Checkout / Ticket / My Bookings Logic
   ========================================================================== */

function getDraft() { return BW.store.get("bw_draft", null); }
function getBookings() { return BW.store.get("bw_bookings", []); }
function saveBookings(list) { BW.store.set("bw_bookings", list); }

/* ---------------------------------------------------------------------- */
/* PASSENGER DETAILS PAGE                                                  */
/* ---------------------------------------------------------------------- */
function initPassengerPage() {
  const draft = getDraft();
  if (!draft) { window.location.href = "search.html"; return; }
  const bus = findBusById(draft.busId);

  document.getElementById("passRouteInfo").textContent =
    `${bus.operator} · ${bus.from} → ${bus.to} · Seats: ${draft.seats.map(s => s.number).join(", ")}`;

  const form = document.getElementById("passengerForm");
  const wrap = document.getElementById("passengerFields");
  wrap.innerHTML = draft.seats.map((s, i) => `
    <div class="passengerCard">
      <h4>Passenger ${i + 1} — Seat ${s.number}</h4>
      <div class="formRow2">
        <div class="formGroup"><label>Full Name</label><input required data-p="${i}" data-f="name" type="text" placeholder="e.g. Ananya Rao"></div>
        <div class="formGroup"><label>Age</label><input required data-p="${i}" data-f="age" type="number" min="1" max="110" placeholder="e.g. 28"></div>
      </div>
      <div class="formRow2">
        <div class="formGroup">
          <label>Gender</label>
          <select required data-p="${i}" data-f="gender"><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option></select>
        </div>
        <div class="formGroup"><label>Phone Number</label><input required data-p="${i}" data-f="phone" type="tel" placeholder="10-digit mobile number"></div>
      </div>
      <div class="formGroup"><label>Email</label><input required data-p="${i}" data-f="email" type="email" placeholder="name@example.com"></div>
    </div>
  `).join("");

  /* boarding / dropping points */
  const boardBox = document.getElementById("boardingPoints");
  boardBox.innerHTML = bus.boardingPoints.map((p, i) => `
    <label class="pointOption ${i === 0 ? "selected" : ""}"><input type="radio" name="boarding" value="${p}" ${i === 0 ? "checked" : ""}>${p}</label>
  `).join("");
  const dropBox = document.getElementById("droppingPoints");
  dropBox.innerHTML = bus.droppingPoints.map((p, i) => `
    <label class="pointOption ${i === 0 ? "selected" : ""}"><input type="radio" name="dropping" value="${p}" ${i === 0 ? "checked" : ""}>${p}</label>
  `).join("");
  [boardBox, dropBox].forEach(box => {
    box.querySelectorAll(".pointOption").forEach(opt => {
      opt.addEventListener("click", () => {
        box.querySelectorAll(".pointOption").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
      });
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    const passengers = draft.seats.map(() => ({}));
    wrap.querySelectorAll("input, select").forEach(el => {
      const group = el.closest(".formGroup");
      const p = Number(el.dataset.p), f = el.dataset.f;
      let ok = el.value.trim() !== "";
      if (ok && f === "phone") ok = /^[0-9]{10}$/.test(el.value.trim());
      if (ok && f === "email") ok = /^\S+@\S+\.\S+$/.test(el.value.trim());
      if (ok && f === "age") ok = Number(el.value) > 0 && Number(el.value) < 111;
      group.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
      passengers[p][f] = el.value.trim();
    });
    if (!valid) { BW.toast("Please fill all passenger fields correctly", "error"); return; }

    draft.passengers = passengers;
    draft.boarding = document.querySelector("input[name='boarding']:checked").value;
    draft.dropping = document.querySelector("input[name='dropping']:checked").value;
    BW.store.set("bw_draft", draft);
    window.location.href = "checkout.html";
  });
}

/* ---------------------------------------------------------------------- */
/* CHECKOUT PAGE                                                          */
/* ---------------------------------------------------------------------- */
function initCheckoutPage() {
  const draft = getDraft();
  if (!draft || !draft.passengers || !draft.passengers.length) { window.location.href = "search.html"; return; }
  const bus = findBusById(draft.busId);

  document.getElementById("coBusInfo").innerHTML = `<b>${bus.operator}</b> · ${bus.busType}<br>${bus.from} → ${bus.to} · ${new Date(draft.date + "T00:00:00").toDateString()}`;
  document.getElementById("coTimes").textContent = `${to12h(bus.departure)} → ${to12h(bus.arrival)} (${fmtDuration(bus.durationMin)})`;
  document.getElementById("coSeats").textContent = draft.seats.map(s => s.number).join(", ");
  document.getElementById("coBoarding").textContent = draft.boarding;
  document.getElementById("coDropping").textContent = draft.dropping;
  document.getElementById("coPassengers").innerHTML = draft.passengers.map((p, i) =>
    `<div class="flexBetween" style="font-size:.88rem;padding:6px 0"><span>${p.name} (${p.age}, ${p.gender})</span><span class="busResultType">Seat ${draft.seats[i].number}</span></div>`
  ).join("");

  function computeFare() {
    const base = draft.fare.base;
    let discount = 0;
    if (draft.coupon) {
      const o = OFFERS.find(x => x.code === draft.coupon);
      if (o && base >= o.minAmount) {
        discount = o.type === "percent" ? Math.min(base * o.value / 100, o.cap) : o.value;
      }
    }
    const total = Math.max(0, base + draft.fare.convenience + draft.fare.gst - discount);
    return { base, convenience: draft.fare.convenience, gst: draft.fare.gst, discount, total };
  }

  function renderFare() {
    const f = computeFare();
    document.getElementById("fareBase").textContent = BW.fmtPrice(f.base);
    document.getElementById("fareConv").textContent = BW.fmtPrice(f.convenience);
    document.getElementById("fareGst").textContent = BW.fmtPrice(f.gst);
    document.getElementById("fareDiscount").textContent = f.discount ? "-" + BW.fmtPrice(f.discount) : "₹0";
    document.getElementById("fareTotal").textContent = BW.fmtPrice(f.total);
    document.getElementById("fareTotalBtn").textContent = BW.fmtPrice(f.total);
  }
  renderFare();

  document.getElementById("applyCouponBtn").addEventListener("click", () => {
    const code = document.getElementById("couponInput").value.trim().toUpperCase();
    const o = OFFERS.find(x => x.code === code);
    if (!o) { BW.toast("Invalid coupon code", "error"); return; }
    if (draft.fare.base < o.minAmount) { BW.toast(`Minimum booking of ${BW.fmtPrice(o.minAmount)} required for ${code}`, "error"); return; }
    draft.coupon = code;
    BW.store.set("bw_draft", draft);
    renderFare();
    BW.toast(`Coupon ${code} applied!`, "success");
  });

  document.querySelectorAll(".offerTag").forEach(tag => tag.addEventListener("click", () => {
    document.getElementById("couponInput").value = tag.dataset.code;
  }));

  /* payment method selection */
  let selectedMethod = "upi";
  document.querySelectorAll(".payMethod").forEach(m => m.addEventListener("click", () => {
    document.querySelectorAll(".payMethod").forEach(x => x.classList.remove("selected"));
    m.classList.add("selected");
    selectedMethod = m.dataset.method;
    document.querySelectorAll(".payDetailBox").forEach(b => b.style.display = "none");
    const box = document.getElementById("payDetail-" + selectedMethod);
    if (box) box.style.display = "block";
  }));

  document.getElementById("payNowBtn").addEventListener("click", () => {
    const btn = document.getElementById("payNowBtn");
    btn.disabled = true;
    btn.textContent = "Processing payment…";
    setTimeout(() => {
      const fare = computeFare();
      const booking = {
        id: BW.bookingId(),
        busId: bus.id, operator: bus.operator, busType: bus.busType,
        from: bus.from, to: bus.to, date: draft.date,
        departure: bus.departure, arrival: bus.arrival,
        seats: draft.seats, passengers: draft.passengers,
        boarding: draft.boarding, dropping: draft.dropping,
        fare, coupon: draft.coupon,
        paymentMethod: selectedMethod,
        status: "upcoming",
        bookedAt: new Date().toISOString()
      };
      const bookings = getBookings();
      bookings.unshift(booking);
      saveBookings(bookings);
      localStorage.removeItem("bw_draft");
      window.location.href = `ticket.html?id=${booking.id}`;
    }, 1400);
  });
}

/* ---------------------------------------------------------------------- */
/* TICKET / CONFIRMATION PAGE                                             */
/* ---------------------------------------------------------------------- */
function initTicketPage() {
  const id = BW.qs("id");
  const booking = getBookings().find(b => b.id === id);
  if (!booking) { document.getElementById("ticketApp").innerHTML = `<div class="noResults"><h3>Booking not found</h3><a href="index.html">Back to home</a></div>`; return; }

  document.getElementById("tkBookingId").textContent = booking.id;
  document.getElementById("tkFrom").textContent = booking.from;
  document.getElementById("tkTo").textContent = booking.to;
  document.getElementById("tkDepTime").textContent = to12h(booking.departure);
  document.getElementById("tkArrTime").textContent = to12h(booking.arrival);
  document.getElementById("tkOperator").textContent = booking.operator;
  document.getElementById("tkBusType").textContent = booking.busType;
  document.getElementById("tkDate").textContent = new Date(booking.date + "T00:00:00").toDateString();
  document.getElementById("tkSeats").textContent = booking.seats.map(s => s.number).join(", ");
  document.getElementById("tkBoarding").textContent = booking.boarding;
  document.getElementById("tkDropping").textContent = booking.dropping;
  document.getElementById("tkPassenger").textContent = booking.passengers.map(p => p.name).join(", ");
  document.getElementById("tkTotal").textContent = BW.fmtPrice(booking.fare.total);

  if (window.QRCode) {
    new QRCode(document.getElementById("qrCode"), {
      text: `BUSWAVE-BOOKING:${booking.id}`,
      width: 110, height: 110, colorDark: "#111827", colorLight: "#ffffff"
    });
  }

  document.getElementById("downloadTicketBtn").addEventListener("click", () => window.print());
  document.getElementById("printTicketBtn").addEventListener("click", () => window.print());
}

/* ---------------------------------------------------------------------- */
/* MY BOOKINGS PAGE                                                       */
/* ---------------------------------------------------------------------- */
function initBookingsPage() {
  const tabs = document.querySelectorAll(".bookingTab");
  const list = document.getElementById("bookingsList");

  function classify(b) {
    if (b.status === "cancelled") return "cancelled";
    const journeyDate = new Date(b.date + "T00:00:00");
    return journeyDate < new Date(new Date().toDateString()) ? "completed" : "upcoming";
  }

  function render(tab) {
    const bookings = getBookings().filter(b => classify(b) === tab);
    if (!bookings.length) {
      list.innerHTML = `<div class="emptyState"><h3>No ${tab} trips</h3><p>Your ${tab} bookings will show up here.</p><a href="search.html" class="btn btn--primary btn--sm mt16">Search Buses</a></div>`;
      return;
    }
    list.innerHTML = bookings.map(b => `
      <div class="bookingCard">
        <div>
          <div class="route">${b.from} → ${b.to}</div>
          <div class="meta">${b.operator} · ${b.busType} · Seat ${b.seats.map(s => s.number).join(", ")} · ${new Date(b.date + "T00:00:00").toDateString()}</div>
          <div class="meta">Booking ID: ${b.id} · <span class="badge ${b.status === "cancelled" ? "badge--red" : "badge--green"}">${classify(b)}</span></div>
        </div>
        <div class="bookingActions">
          <a class="btn btn--ghost btn--sm" href="ticket.html?id=${b.id}">View Ticket</a>
          ${tab === "upcoming" ? `<button class="btn btn--outline btn--sm" data-cancel="${b.id}">Cancel</button>` : ""}
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-cancel]").forEach(btn => btn.addEventListener("click", () => {
      if (!confirm("Cancel this booking?")) return;
      const all = getBookings();
      const idx = all.findIndex(x => x.id === btn.dataset.cancel);
      if (idx > -1) { all[idx].status = "cancelled"; saveBookings(all); }
      BW.toast("Booking cancelled", "success");
      render(document.querySelector(".bookingTab.active").dataset.tab);
    }));
  }

  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    render(t.dataset.tab);
  }));

  render("upcoming");
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("passengerForm")) initPassengerPage();
  if (document.getElementById("payNowBtn")) initCheckoutPage();
  if (document.getElementById("ticketApp")) initTicketPage();
  if (document.getElementById("bookingsList")) initBookingsPage();
});
