/* ==========================================================================
   BUS WAVE — Demo Data
   All data here is fictional and for demonstration purposes only.
   ========================================================================== */

const CITIES = [
  "Bengaluru", "Kochi", "Chennai", "Hyderabad", "Mumbai", "Pune",
  "Delhi", "Jaipur", "Ahmedabad", "Goa", "Trivandrum", "Coimbatore",
  "Mangalore", "Mysuru"
];

/* Boarding / dropping points per city */
const CITY_POINTS = {
  "Bengaluru": ["Majestic", "Silk Board", "Electronic City", "Hebbal", "Marathahalli"],
  "Kochi": ["Vyttila", "Edappally", "Aluva", "Kakkanad"],
  "Chennai": ["Koyambedu", "Tambaram", "Guindy", "T. Nagar"],
  "Hyderabad": ["Miyapur", "LB Nagar", "Uppal", "Secunderabad"],
  "Mumbai": ["Borivali", "Dadar", "Andheri", "Thane"],
  "Pune": ["Shivajinagar", "Swargate", "Hinjewadi", "Wakad"],
  "Delhi": ["Kashmere Gate", "Anand Vihar", "Dhaula Kuan", "Dwarka"],
  "Jaipur": ["Sindhi Camp", "Vaishali Nagar", "Tonk Road"],
  "Ahmedabad": ["Geeta Mandir", "Paldi", "Naroda"],
  "Goa": ["Panaji", "Margao", "Mapusa", "Vasco"],
  "Trivandrum": ["Kesavadasapuram", "Pappanamcode", "East Fort"],
  "Coimbatore": ["Gandhipuram", "Ukkadam", "Peelamedu"],
  "Mangalore": ["Bejai", "Pandeshwar", "Kankanady"],
  "Mysuru": ["Bannimantap", "Hebbal (Mysuru)", "Ramanuja Road"]
};

const OPERATORS = [
  "KSRTC Express", "VRL Travels", "SRS Travels", "Orange Tours",
  "Parveen Travels", "National Travels", "Kallada Travels",
  "Sharma Travels", "Neeta Volvo", "Jabbar Travels", "GreenLine",
  "IntrCity SmartBus", "Kaveri Travels", "Sugama Tourists"
];

/* helper: minutes to "Xh Ym" */
function fmtDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}h ${m}m`;
}

/* helper: add minutes to "HH:MM" time string, returns "HH:MM" */
function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + mins) % (24 * 60);
  const hh = Math.floor(total / 60).toString().padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function to12h(time) {
  let [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/* Seeded pseudo-random for deterministic demo data */
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ROUTE_PAIRS = [
  ["Bengaluru", "Kochi", 460, 8, 20],
  ["Kochi", "Bengaluru", 460, 8, 20],
  ["Bengaluru", "Chennai", 340, 6, 0],
  ["Chennai", "Bengaluru", 340, 6, 0],
  ["Bengaluru", "Hyderabad", 480, 8, 30],
  ["Mumbai", "Pune", 180, 3, 15],
  ["Delhi", "Jaipur", 300, 5, 0],
  ["Kochi", "Trivandrum", 130, 2, 15],
  ["Bengaluru", "Mysuru", 190, 3, 10],
  ["Bengaluru", "Goa", 560, 9, 20],
  ["Mumbai", "Goa", 540, 9, 0],
  ["Chennai", "Coimbatore", 300, 5, 0],
  ["Bengaluru", "Mangalore", 420, 7, 0],
  ["Hyderabad", "Chennai", 480, 8, 0],
  ["Ahmedabad", "Mumbai", 420, 7, 0],
  ["Delhi", "Ahmedabad", 660, 11, 0],
  ["Pune", "Goa", 360, 6, 0],
  ["Coimbatore", "Trivandrum", 300, 5, 0],
  ["Mysuru", "Kochi", 360, 6, 0],
  ["Bengaluru", "Trivandrum", 540, 9, 0]
];

const BUS_TYPES = [
  { type: "AC Sleeper", ac: true, seater: false },
  { type: "Non-AC Sleeper", ac: false, seater: false },
  { type: "AC Seater", ac: true, seater: true },
  { type: "Non-AC Seater", ac: false, seater: true },
  { type: "AC Semi-Sleeper", ac: true, seater: false }
];

const DEP_TIMES = ["06:00", "07:30", "09:00", "13:00", "15:30", "18:00", "20:00", "21:30", "22:30", "23:00"];

/* Build 20+ demo buses */
const BUSES = ROUTE_PAIRS.map((r, i) => {
  const rand = seededRandom(i + 101);
  const [from, to, durMin] = r;
  const operator = OPERATORS[i % OPERATORS.length];
  const bt = BUS_TYPES[i % BUS_TYPES.length];
  const dep = DEP_TIMES[i % DEP_TIMES.length];
  const arr = addMinutes(dep, durMin);
  const basePrice = 400 + Math.round(rand() * 1200);
  const totalSeats = bt.seater ? 45 : 30;
  const bookedCount = Math.round(rand() * (totalSeats * 0.5));
  const rating = (3.5 + rand() * 1.5).toFixed(1);
  return {
    id: `BW${1000 + i}`,
    operator,
    from, to,
    busType: bt.type,
    ac: bt.ac,
    seater: bt.seater,
    departure: dep,
    arrival: arr,
    durationMin: durMin,
    price: basePrice,
    rating: Number(rating),
    ratingCount: 50 + Math.round(rand() * 900),
    totalSeats,
    bookedCount,
    boardingPoints: CITY_POINTS[from] || ["Main Bus Stand"],
    droppingPoints: CITY_POINTS[to] || ["Main Bus Stand"],
    amenities: ["Charging Point", "Water Bottle", "Blanket", "Reading Light", "CCTV"].filter(() => rand() > 0.25)
  };
});

/* add a few extra buses on the same top routes for richer results */
["Bengaluru|Kochi", "Bengaluru|Chennai", "Mumbai|Pune", "Delhi|Jaipur"].forEach((pairKey, idx) => {
  const [from, to] = pairKey.split("|");
  const rand = seededRandom(500 + idx);
  const operator = OPERATORS[(idx + 7) % OPERATORS.length];
  const bt = BUS_TYPES[(idx + 2) % BUS_TYPES.length];
  const dep = DEP_TIMES[(idx + 4) % DEP_TIMES.length];
  const base = ROUTE_PAIRS.find(r => r[0] === from && r[1] === to);
  const durMin = base ? base[2] : 300;
  const arr = addMinutes(dep, durMin);
  const totalSeats = bt.seater ? 45 : 30;
  BUSES.push({
    id: `BW${2000 + idx}`,
    operator, from, to,
    busType: bt.type,
    ac: bt.ac,
    seater: bt.seater,
    departure: dep,
    arrival: arr,
    durationMin: durMin,
    price: 350 + Math.round(rand() * 1100),
    rating: Number((3.5 + rand() * 1.5).toFixed(1)),
    ratingCount: 40 + Math.round(rand() * 700),
    totalSeats,
    bookedCount: Math.round(rand() * (totalSeats * 0.4)),
    boardingPoints: CITY_POINTS[from] || ["Main Bus Stand"],
    droppingPoints: CITY_POINTS[to] || ["Main Bus Stand"],
    amenities: ["Charging Point", "Water Bottle", "Blanket", "Reading Light", "CCTV"].filter(() => rand() > 0.3)
  });
});

const POPULAR_ROUTES = [
  ["Bengaluru", "Kochi"], ["Kochi", "Bengaluru"], ["Bengaluru", "Chennai"],
  ["Chennai", "Bengaluru"], ["Bengaluru", "Hyderabad"], ["Mumbai", "Pune"],
  ["Delhi", "Jaipur"], ["Kochi", "Trivandrum"]
];

const OFFERS = [
  { code: "FIRSTBUS", type: "percent", value: 20, cap: 250, desc: "20% off on your first BUS WAVE booking", minAmount: 300 },
  { code: "WAVE100", type: "flat", value: 100, cap: 100, desc: "Flat ₹100 off on bookings above ₹800", minAmount: 800 },
  { code: "WEEKEND", type: "percent", value: 10, cap: 150, desc: "10% off on weekend getaways", minAmount: 400 }
];

const REVIEWS = [
  { name: "Ananya R.", rating: 5, text: "Smooth booking experience and the bus was exactly on time. Loved the seat map!" },
  { name: "Rahul K.", rating: 4, text: "Comfortable sleeper seats and easy coupon application. Will book again." },
  { name: "Meera S.", rating: 5, text: "The e-ticket with QR code made boarding so quick. Great UI too." },
  { name: "Farhan A.", rating: 4, text: "Good range of buses and clear pricing breakdown at checkout." }
];

function findBusById(id) {
  return BUSES.find(b => b.id === id);
}

function getSeatLayout(bus) {
  /* Deterministic seat map based on bus id */
  const rand = seededRandom(bus.id.replace(/\D/g, "") * 1 + 7);
  const seats = [];
  if (bus.seater) {
    /* 2+2 seater layout, rows */
    const rows = Math.ceil(bus.totalSeats / 4);
    let n = 1;
    for (let r = 0; r < rows; r++) {
      ["A", "B", null, "C", "D"].forEach(col => {
        if (col === null) { seats.push({ gap: true }); return; }
        if (n > bus.totalSeats) return;
        seats.push({ id: `${r + 1}${col}`, number: n, deck: "lower", booked: rand() < (bus.bookedCount / bus.totalSeats) });
        n++;
      });
    }
  } else {
    /* Sleeper: lower + upper deck, single seats each side */
    const perDeck = Math.ceil(bus.totalSeats / 2);
    ["lower", "upper"].forEach(deck => {
      for (let i = 1; i <= perDeck; i++) {
        const num = deck === "lower" ? i : perDeck + i;
        if (num > bus.totalSeats) return;
        seats.push({
          id: `${deck === "lower" ? "L" : "U"}${i}`,
          number: num,
          deck,
          booked: rand() < (bus.bookedCount / bus.totalSeats)
        });
      }
    });
  }
  return seats;
}
