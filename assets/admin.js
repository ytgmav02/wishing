// Admin panel for tracking visitors
const DAYS = [7,8,9,10,11,12,13,14];
const adminStorage = {
  visitorKey: "vw_visitors_v1",
  unlocksKey: "vw_unlocks_v1",
  playableKey: "vw_playable_v1",
  getVisitors() {
    try { return JSON.parse(localStorage.getItem(this.visitorKey)) || {}; }
    catch { return {}; }
  },
  clearVisitors() {
    if (confirm("Are you sure you want to delete all visitor data? This cannot be undone.")) {
      localStorage.removeItem(this.visitorKey);
      renderAdmin();
      alert("Visitor data cleared.");
    }
  },
  unlockAll() {
    if (confirm("Make all days playable? Users will still need to complete challenges to see wishes.")) {
      const playable = {};
      DAYS.forEach(day => {
        playable[String(day)] = true;
      });
      localStorage.setItem(this.playableKey, JSON.stringify(playable));
      if (confirm("All days are now playable! Go check?")) {
        window.location.href = "index.html";
      }
    }
  }
};

let currentSort = "recent"; // recent, name, clicks

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFullDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function sortVisitors(visitors) {
  const arr = Object.values(visitors);

  if (currentSort === "name") {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === "clicks") {
    arr.sort((a, b) => b.clickCount - a.clickCount);
  } else {
    // recent (default)
    arr.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
  }

  return arr;
}

function renderStats() {
  const visitors = adminStorage.getVisitors();
  const visitorList = Object.values(visitors);
  const totalVisitors = visitorList.length;
  const totalClicks = visitorList.reduce((sum, v) => sum + v.clickCount, 0);
  const uniqueVisits = visitorList.reduce((sum, v) => sum + v.visits.length, 0);

  const statsGrid = document.getElementById("statsGrid");
  statsGrid.innerHTML = `
    <div class="card statCard">
      <div class="statNumber">${totalVisitors}</div>
      <div class="statLabel">Total Visitors</div>
    </div>
    <div class="card statCard">
      <div class="statNumber">${totalClicks}</div>
      <div class="statLabel">Total Clicks</div>
    </div>
    <div class="card statCard">
      <div class="statNumber">${totalVisitors > 0 ? (totalClicks / totalVisitors).toFixed(1) : 0}</div>
      <div class="statLabel">Avg Clicks/Visitor</div>
    </div>
    <div class="card statCard">
      <div class="statNumber">${uniqueVisits}</div>
      <div class="statLabel">Total Visits</div>
    </div>
  `;
}

function renderTable() {
  const visitors = adminStorage.getVisitors();
  const visitorList = sortVisitors(visitors);
  const tableBody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");
  const visitorContainer = document.getElementById("visitorContainer");

  if (visitorList.length === 0) {
    visitorContainer.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  visitorContainer.style.display = "block";
  emptyState.style.display = "none";

  tableBody.innerHTML = visitorList
    .map(
      (v, idx) => `
    <tr>
      <td class="nameBadge">Device #${idx + 1}</td>
      <td>${formatFullDate(v.firstVisit)}</td>
      <td>${formatDate(v.lastVisit)}</td>
      <td><span class="countBadge">${v.clickCount} click${v.clickCount !== 1 ? "s" : ""}</span></td>
    </tr>
  `
    )
    .join("");
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function renderAdmin() {
  renderStats();
  renderTable();
}

// Sort button handlers
document.getElementById("sortRecent").addEventListener("click", (e) => {
  currentSort = "recent";
  updateSortButtons(e.target);
  renderTable();
});

document.getElementById("sortName").addEventListener("click", (e) => {
  currentSort = "name";
  updateSortButtons(e.target);
  renderTable();
});

document.getElementById("sortClicks").addEventListener("click", (e) => {
  currentSort = "clicks";
  updateSortButtons(e.target);
  renderTable();
});

function updateSortButtons(activeBtn) {
  document.querySelectorAll(".sortBtn").forEach((btn) => btn.classList.remove("active"));
  activeBtn.classList.add("active");
}

// Unlock all button
document.getElementById("unlockAllBtn").addEventListener("click", () => {
  adminStorage.unlockAll();
});

// Clear data button
document.getElementById("clearBtn").addEventListener("click", () => {
  adminStorage.clearVisitors();
});

// Export CSV button
document.getElementById("exportBtn").addEventListener("click", () => {
  const visitors = adminStorage.getVisitors();
  const visitorList = sortVisitors(visitors);

  if (visitorList.length === 0) {
    alert("No data to export.");
    return;
  }

  let csv =
    "Device ID,First Visit,Last Visit,Total Clicks,All Visits\n";
  for (let i = 0; i < visitorList.length; i++) {
    const v = visitorList[i];
    const firstVisit = formatFullDate(v.firstVisit);
    const lastVisit = formatFullDate(v.lastVisit);
    const allVisits = v.visits.map((visit) => formatFullDate(visit)).join(" | ");
    csv += `"Device #${i + 1}","${firstVisit}","${lastVisit}",${v.clickCount},"${allVisits}"\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "visitor_tracking.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Initial render
renderAdmin();

// Auto-refresh every 5 seconds
setInterval(() => {
  renderAdmin();
}, 5000);
