// ===== Helper: render one card's inner HTML (supports multiple flags)
function ensureCardContent(card){
  if (card.dataset.ready) return;

  const name = card.dataset.name || "";
  const flags = (card.dataset.flags || "").split(",").map(s => s.trim()).filter(Boolean);

  // Build flags row
  const flagsHTML = flags.map(code =>
    `<img src="https://flagcdn.com/w40/${code}.png" alt="${code.toUpperCase()} flag" >`
  ).join("");

  card.innerHTML = `
    <div class="flags">${flagsHTML}</div>
    <div class="country">${name}</div>
    <div class="time">--:--</div>
    <div class="utc">UTC--</div>
    <div class="date">---</div>
  `;

  card.dataset.ready = "1";
}

// ===== Format: "Sun, Aug 24, 2025"
function formatCardDate(d, tz){
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const wd = map.weekday;    // Sun
  const mon = map.month;     // Aug
  const day = map.day;       // 24
  const yr = map.year;       // 2025
  return `${wd}, ${mon} ${day}, ${yr}`;
}

// ===== Always return strict UTC±hh:mm for any timezone
function getUTCLabel(d, tz) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset"
  });

  const parts = dtf.formatToParts(d);
  const offsetToken = parts.find(p => p.type === "timeZoneName")?.value || "UTC+0";

  let out = offsetToken.replace(/^GMT/i, "UTC");

  const match = out.match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if (match) {
    const sign = match[1];
    const hh = match[2].padStart(2, "0");
    const mm = (match[3] || "00").padStart(2, "0");
    out = `UTC${sign}${hh}:${mm}`;
  }
  return out;
}

function updateAllCards() {
  const now = new Date();

  document.querySelectorAll(".card").forEach(card => {
    ensureCardContent(card);

    const tz = card.dataset.tz;
    if (!tz) return;

    // Time in 12-hour format
    const timeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(now);

    // UTC offset
    const utcStr = getUTCLabel(now, tz);

    // Date
    const dateStr = formatCardDate(now, tz);

    const timeElem = card.querySelector(".time");
    card.querySelector(".time").textContent = timeStr;
    card.querySelector(".utc").textContent = utcStr;
    card.querySelector(".date").textContent = dateStr;

    // ===== Day/Night logic (6 AM – 6 PM considered "day")
    const hourNum = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false
    }).format(now));

    const isDay = hourNum >= 6 && hourNum < 18;

    // ===== Weekday / Weekend logic with GCC override
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short"
    }).format(now); // "Mon"..."Sun"

    let weekends = ["Sat", "Sun"];
    const name = (card.dataset.name || "").toLowerCase();
    // GCC override: Fri–Sat weekend
    if (name.includes("saudi arabia") || name.includes("bahrain") ||
        name.includes("kuwait") || name.includes("oman") ||
        name.includes("qatar") || name.includes("uae")) {
      weekends = ["Fri", "Sat"];
    }
    const isWeekend = weekends.includes(weekday);

    // ===== Red-time rule
    // Weekends -> red all day
    // Weekdays -> red between 5:00 PM and 7:59 AM (inclusive window)
    let redTime = false;
    if (isWeekend) {
      redTime = true;
    } else {
      if (hourNum >= 17 || hourNum < 8) redTime = true;
    }

    // Apply time color (India time stays white when not red)
    timeElem.style.color = redTime ? "red" : (tz === "Asia/Kolkata" ? "white" : "");

    // ===== Card background (India always green; others change by day/night)
    if (tz === "Asia/Kolkata") {
      card.style.backgroundColor = "#008000";
      card.style.color = "white";
    } else {
      if (isDay) {
        card.style.background = "var(--card-bg)";
        card.style.color = "var(--text)";
      } else {
        card.style.background =
          "linear-gradient(145deg, rgba(210, 210, 210, 0.95), rgba(170, 170, 170, 0.9))";
        card.style.color = "#1a1a1a";
      }
    }
  });
}

// Start
updateAllCards();
setInterval(updateAllCards, 10000);
