/* ==========================================================================
   BUS WAVE — Search Results Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const from = BW.qs("from") || "Bengaluru";
  const to = BW.qs("to") || "Kochi";
  const date = BW.qs("date") || new Date().toISOString().split("T")[0];
  const pax = BW.qs("pax") || "1";

  document.getElementById("routeTitle").textContent = `${from} → ${to}`;
  document.getElementById("routeMeta").textContent =
    `${new Date(date + "T00:00:00").toDateString()} · ${pax} passenger${pax > 1 ? "s" : ""}`;
  document.getElementById("fromInput").value = from;
  document.getElementById("toInput").value = to;
  document.getElementById("dateInput").value = date;

  let results = BUSES.filter(b => b.from === from && b.to === to);
  if (results.length === 0) {
    /* fallback: show buses from same origin so the demo never looks empty */
    results = BUSES.filter(b => b.from === from).slice(0, 6);
  }
  if (results.length === 0) {
    /* final fallback: show a handful of buses so the demo always has something to display */
    results = BUSES.slice(0, 6);
  }

  const state = {
    sort: "recommended",
    maxPrice: 3000,
    ac: null, /* true/false/null */
    seatType: null, /* 'seater'/'sleeper'/null */
    departureWindow: new Set(),
    minRating: 0
  };

  function seatsLeft(bus) { return bus.totalSeats - bus.bookedCount; }

  function inDepartureWindow(bus) {
    if (state.departureWindow.size === 0) return true;
    const h = Number(bus.departure.split(":")[0]);
    const win = h < 6 ? "early" : h < 12 ? "morning" : h < 18 ? "afternoon" : "night";
    return state.departureWindow.has(win);
  }

  function applyFiltersAndSort() {
    let list = results.filter(b => {
      if (b.price > state.maxPrice) return false;
      if (state.ac !== null && b.ac !== state.ac) return false;
      if (state.seatType === "seater" && !b.seater) return false;
      if (state.seatType === "sleeper" && b.seater) return false;
      if (b.rating < state.minRating) return false;
      if (!inDepartureWindow(b)) return false;
      return true;
    });

    if (state.sort === "price") list.sort((a, b) => a.price - b.price);
    else if (state.sort === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (state.sort === "departure") list.sort((a, b) => a.departure.localeCompare(b.departure));
    else list.sort((a, b) => (b.rating * 10 - b.price / 200) - (a.rating * 10 - a.price / 200));

    render(list);
  }

  function render(list) {
    const box = document.getElementById("resultsBox");
    document.getElementById("resultCount").textContent = `${list.length} buses found`;
    if (list.length === 0) {
      box.innerHTML = `<div class="noResults"><h3>No buses match your filters</h3><p>Try adjusting price, type or rating filters.</p></div>`;
      return;
    }
    box.innerHTML = list.map(bus => `
      <div class="busResultCard">
        <div class="busResultTop">
          <div>
            <div class="busResultOperator">${bus.operator}</div>
            <div class="busResultType">${bus.busType} ${bus.ac ? "· AC" : "· Non-AC"}</div>
            <div class="mt8">${bus.amenities.slice(0,3).map(a => `<span class="badge badge--gray">${a}</span>`).join(" ")}</div>
          </div>
          <div class="busResultTimes">
            <div><div class="time">${to12h(bus.departure)}</div><div class="busResultType">${bus.from}</div></div>
            <div class="dur"><span>${fmtDuration(bus.durationMin)}</span><div class="durLine"></div></div>
            <div><div class="time">${to12h(bus.arrival)}</div><div class="busResultType">${bus.to}</div></div>
          </div>
          <div>
            <div class="busResultRating"><span class="badge badge--gold">${bus.rating} ★</span><span class="busResultType">(${bus.ratingCount})</span></div>
          </div>
          <div class="busResultPrice">
            <div class="amt">${BW.fmtPrice(bus.price)}</div>
            <div class="seatsLeft">${seatsLeft(bus)} seats available</div>
            <a class="btn btn--primary btn--sm" href="seats.html?busId=${bus.id}&date=${date}&pax=${pax}">View Seats</a>
          </div>
        </div>
      </div>
    `).join("");
  }

  /* filter UI wiring */
  document.getElementById("priceRange").addEventListener("input", (e) => {
    state.maxPrice = Number(e.target.value);
    document.getElementById("priceRangeVal").textContent = BW.fmtPrice(state.maxPrice);
    applyFiltersAndSort();
  });
  document.querySelectorAll("input[name='acFilter']").forEach(r => r.addEventListener("change", (e) => {
    state.ac = e.target.value === "all" ? null : e.target.value === "ac";
    applyFiltersAndSort();
  }));
  document.querySelectorAll("input[name='seatTypeFilter']").forEach(r => r.addEventListener("change", (e) => {
    state.seatType = e.target.value === "all" ? null : e.target.value;
    applyFiltersAndSort();
  }));
  document.querySelectorAll("input[name='depWindow']").forEach(cb => cb.addEventListener("change", (e) => {
    if (e.target.checked) state.departureWindow.add(e.target.value);
    else state.departureWindow.delete(e.target.value);
    applyFiltersAndSort();
  }));
  document.getElementById("ratingFilter").addEventListener("change", (e) => {
    state.minRating = Number(e.target.value);
    applyFiltersAndSort();
  });
  document.querySelectorAll(".sortChip").forEach(chip => chip.addEventListener("click", () => {
    document.querySelectorAll(".sortChip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.sort = chip.dataset.sort;
    applyFiltersAndSort();
  }));

  document.getElementById("modifySearchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = document.getElementById("fromInput").value;
    const t = document.getElementById("toInput").value;
    const d = document.getElementById("dateInput").value;
    window.location.href = `search.html?from=${f}&to=${t}&date=${d}&pax=${pax}`;
  });

  applyFiltersAndSort();
});
