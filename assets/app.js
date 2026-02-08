const DAYS = [7,8,9,10,11,12,13,14];

// Get today's date in Bangladesh timezone (UTC+6)
function getTodayInBangladesh(){
  const now = new Date();
  // Convert to Bangladesh timezone (UTC+6)
  const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  return bangkokTime.getDate();
}

const storage = {
  key: "vw_unlocks_v1",
  orderKey: "vw_order_required_v1",
  playableKey: "vw_playable_v1",
  visitorKey: "vw_visitors_v1",
  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
    catch { return {}; }
  },
  save(obj) { localStorage.setItem(this.key, JSON.stringify(obj)); },
  reset() { 
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.playableKey);
    localStorage.removeItem(this.orderKey);
  },
  getOrderRequired(){
    return localStorage.getItem(this.orderKey) === "1";
  },
  setOrderRequired(v){
    localStorage.setItem(this.orderKey, v ? "1" : "0");
  },
  trackVisitor(name) {
    try {
      const visitors = JSON.parse(localStorage.getItem(this.visitorKey)) || {};
      const now = new Date().toISOString();
      
      if (!visitors[name]) {
        visitors[name] = {
          name: name,
          firstVisit: now,
          lastVisit: now,
          clickCount: 1,
          visits: [now]
        };
      } else {
        visitors[name].lastVisit = now;
        visitors[name].clickCount++;
        visitors[name].visits.push(now);
      }
      localStorage.setItem(this.visitorKey, JSON.stringify(visitors));
    } catch { }
  },
  getVisitors() {
    try { return JSON.parse(localStorage.getItem(this.visitorKey)) || {}; }
    catch { return {}; }
  },
  clearVisitors() {
    localStorage.removeItem(this.visitorKey);
  }
};

function countUnlocked(unlocks){
  const today = getTodayInBangladesh();
  return DAYS.filter(d => unlocks[String(d)] || d < today).length;
}

function maxUnlockedDay(unlocks){
  const unlocked = DAYS.filter(d => unlocks[String(d)]);
  return unlocked.length ? Math.max(...unlocked) : null;
}

function canOpenDay(day, unlocks, requireOrder){
  if (!requireOrder) return true;
  // require day 7 first, then 8, ...
  const idx = DAYS.indexOf(day);
  if (idx === 0) return true;
  const prevDay = DAYS[idx - 1];
  return !!unlocks[String(prevDay)];
}

function render(){
  const datesEl = document.getElementById("dates");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const streakPill = document.getElementById("streakPill");

  const unlocks = storage.load();
  const unlockedCount = countUnlocked(unlocks);
  const pct = Math.round((unlockedCount / DAYS.length) * 100);

  progressText.textContent = `${unlockedCount}/${DAYS.length} unlocked`;
  progressFill.style.width = `${pct}%`;

  streakPill.textContent =
    unlockedCount === 0 ? "Start with Day 7 ❤" :
    unlockedCount < 8 ? "Keep going ✨" :
    "All unlocked! 💞";

  datesEl.innerHTML = "";

  const requireOrder = storage.getOrderRequired();
  document.getElementById("orderToggle").checked = requireOrder;

  const today = getTodayInBangladesh();

  DAYS.forEach(day => {
    // Mark as unlocked if it's been unlocked OR if it's a past day
    const isUnlockedInStorage = !!unlocks[String(day)];
    const isPastDay = day < today;
    const unlocked = isUnlockedInStorage || isPastDay;
    
    const allowed = canOpenDay(day, unlocks, requireOrder);

    const tile = document.createElement("div");
    tile.className = "dayTile";

    tile.innerHTML = `
      <h4>Feb ${day}</h4>
      <div class="meta">
        <span class="badge ${unlocked ? "ok" : "lock"}">${unlocked ? "✨ Unlocked" : "🔒 Locked"}</span>
        <span class="badge">${allowed ? "Open" : "In order"}</span>
      </div>
      <div class="tiny muted" style="margin-top:10px">
        ${unlocked ? "Revisit your wish anytime." : "Beat the challenge to reveal the wish."}
      </div>
    `;

    tile.addEventListener("click", () => {
      if (!allowed) {
        alert("Unlock the previous day first (Order mode is ON).");
        return;
      }
      window.location.href = `day.html?d=${day}`;
    });

    datesEl.appendChild(tile);
  });
}

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Reset all unlocked days?")) {
    storage.reset();
    render();
  }
});

document.getElementById("orderToggle").addEventListener("change", (e) => {
  storage.setOrderRequired(e.target.checked);
  render();
});

// Optional ambience toggle (you can add your own audio file)
document.getElementById("musicBtn").addEventListener("click", () => {
  const a = document.getElementById("ambience");
  if (!a.src) {
    alert("Add an audio file path inside index.html <audio> tag to use ambience.");
    return;
  }
  if (a.paused) a.play(); else a.pause();
});

// Track visitor on page load
function getOrCreateDeviceId() {
  const deviceKey = "device_id_v1";
  let deviceId = localStorage.getItem(deviceKey);
  
  if (!deviceId) {
    // Generate unique device ID using browser fingerprinting
    const ua = navigator.userAgent;
    const lang = navigator.language;
    const cores = navigator.hardwareConcurrency || "unknown";
    const memory = navigator.deviceMemory || "unknown";
    const timestamp = Date.now();
    deviceId = btoa(`${ua}|${lang}|${cores}|${memory}|${timestamp}`).substring(0, 16);
    localStorage.setItem(deviceKey, deviceId);
  }
  
  return deviceId;
}

function initVisitorTracking() {
  const deviceId = getOrCreateDeviceId();
  storage.trackVisitor(deviceId);
}

initVisitorTracking();
render();
