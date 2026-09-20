/* ==========================================================================
   BUS WAVE — Seat Selection Logic
   ========================================================================== */

const FEES = { convenience: 49, gst: 20 };

document.addEventListener("DOMContentLoaded", () => {
  const busId = BW.qs("busId");
  const date = BW.qs("date") || new Date().toISOString().split("T")[0];
  const pax = Number(BW.qs("pax") || 1);
  const bus = findBusById(busId);

  if (!bus) {
    document.getElementById("seatApp").innerHTML = `<div class="noResults"><h3>Bus not found</h3><p><a href="search.html">Go back to search</a></p></div>`;
    return;
  }

  document.getElementById("busOperatorName").textContent = bus.operator;
  document.getElementById("busSubInfo").textContent = `${bus.busType} · ${bus.from} → ${bus.to} · ${new Date(date + "T00:00:00").toDateString()}`;
  document.getElementById("depArr").textContent = `${to12h(bus.departure)} → ${to12h(bus.arrival)} (${fmtDuration(bus.durationMin)})`;

  const seats = getSeatLayout(bus);
  let selected = [];

  function seatClass(seat) {
    if (seat.booked) return "seat--booked";
    if (selected.find(s => s.id === seat.id)) return "seat--selected";
    return "seat--available";
  }

  function renderSeats() {
    const grid = document.getElementById("seatGrid");
    if (bus.seater) {
      grid.className = "seatGridSeater";
      grid.innerHTML = seats.map(s => s.gap
        ? `<div class="seat gap"></div>`
        : `<button type="button" class="seat ${seatClass(s)}" data-id="${s.id}" ${s.booked ? "disabled" : ""}>${s.number}</button>`
      ).join("");
    } else {
      grid.className = "seatGridSleeper";
      const lower = seats.filter(s => s.deck === "lower");
      const upper = seats.filter(s => s.deck === "upper");
      grid.innerHTML = `
        <div>
          <div class="busResultType mb0" style="margin-bottom:8px">Lower Deck</div>
          <div style="display:grid;gap:8px">${lower.map(s => `<button type="button" class="seat seat--sleeper ${seatClass(s)}" data-id="${s.id}" ${s.booked?"disabled":""}>${s.number}</button>`).join("")}</div>
        </div>
        <div>
          <div class="busResultType mb0" style="margin-bottom:8px">Upper Deck</div>
          <div style="display:grid;gap:8px">${upper.map(s => `<button type="button" class="seat seat--sleeper ${seatClass(s)}" data-id="${s.id}" ${s.booked?"disabled":""}>${s.number}</button>`).join("")}</div>
        </div>`;
    }
    grid.querySelectorAll("button.seat:not([disabled])").forEach(btn => {
      btn.addEventListener("click", () => toggleSeat(btn.dataset.id));
    });
  }

  function toggleSeat(id) {
    const seat = seats.find(s => s.id === id);
    const idx = selected.findIndex(s => s.id === id);
    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      if (selected.length >= pax) {
        BW.toast(`You can select up to ${pax} seat${pax > 1 ? "s" : ""}`, "error");
        return;
      }
      selected.push(seat);
    }
    renderSeats();
    updateSummary();
  }

  function updateSummary() {
    const base = selected.length * bus.price;
    const conv = selected.length ? FEES.convenience : 0;
    const gst = selected.length ? FEES.gst : 0;
    const total = base + conv + gst;

    document.getElementById("selectedCount").textContent = selected.length;
    document.getElementById("selectedChips").innerHTML = selected.length
      ? selected.map(s => `<span class="seatChip">${s.number}</span>`).join("")
      : `<span class="busResultType">No seats selected</span>`;
    document.getElementById("baseFare").textContent = BW.fmtPrice(base);
    document.getElementById("convFee").textContent = BW.fmtPrice(conv);
    document.getElementById("gstFee").textContent = BW.fmtPrice(gst);
    document.getElementById("totalFare").textContent = BW.fmtPrice(total);

    const continueBtn = document.getElementById("continueBtn");
    continueBtn.disabled = selected.length !== pax;
    continueBtn.textContent = selected.length === pax
      ? `Continue with ${selected.length} seat${selected.length > 1 ? "s" : ""}`
      : `Select ${pax - selected.length} more seat${pax - selected.length !== 1 ? "s" : ""}`;

    /* mirror to mobile sticky bar */
    document.getElementById("mSelectedCount").textContent = selected.length;
    document.getElementById("mTotalFare").textContent = BW.fmtPrice(total);
    document.getElementById("mContinueBtn").disabled = selected.length !== pax;
  }

  function goNext() {
    if (selected.length !== pax) return;
    const base = selected.length * bus.price;
    const draft = {
      busId: bus.id, date, pax,
      seats: selected.map(s => ({ id: s.id, number: s.number })),
      fare: { base, convenience: FEES.convenience, gst: FEES.gst },
      passengers: [], boarding: bus.boardingPoints[0], dropping: bus.droppingPoints[0], coupon: null
    };
    BW.store.set("bw_draft", draft);
    window.location.href = "passenger.html";
  }

  document.getElementById("continueBtn").addEventListener("click", goNext);
  document.getElementById("mContinueBtn").addEventListener("click", goNext);

  renderSeats();
  updateSummary();
});
