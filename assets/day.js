const DAYS = [7,8,9,10,11,12,13,14];

const storeKey = "vw_unlocks_v1";
const visitorKey = "vw_visitors_v1";
const playableKey = "vw_playable_v1";

function loadUnlocks(){
  try { return JSON.parse(localStorage.getItem(storeKey)) || {}; }
  catch { return {}; }
}
function saveUnlocks(obj){
  localStorage.setItem(storeKey, JSON.stringify(obj));
}
function loadPlayable(){
  try { return JSON.parse(localStorage.getItem(playableKey)) || {}; }
  catch { return {}; }
}

function trackVisitor(name) {
  try {
    const visitors = JSON.parse(localStorage.getItem(visitorKey)) || {};
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
    localStorage.setItem(visitorKey, JSON.stringify(visitors));
  } catch { }
}

function qs(name){
  return new URLSearchParams(location.search).get(name);
}

// Get today's date in Bangladesh timezone (UTC+6)
function getTodayInBangladesh(){
  const now = new Date();
  // Convert to Bangladesh timezone (UTC+6)
  const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  return bangkokTime.getDate();
}

// Check if a given day (7-14) matches today's date in Bangladesh
function isToday(day){
  return getTodayInBangladesh() === day;
}

const CONFIG = {
  7: {
    name: "Rose Day",
    challenge: { type: "tap", target: 10 },
    hint: "Click the hearts as fast as you can inside the box.",
    wish: "🌹 Rose Day Wish: Like a rose, you make my life more beautiful. Today, I’m sending you a bouquet of good vibes and love."
  },
  8: {
    name: "Propose Day",
    challenge: { type: "scramble", answer: "you are cute", scramble: "rae teuc ouy" },
    hint: "Unscramble the phrase (spaces matter).",
    wish: "💍 Propose Day Wish: Sorry onek bar korchi🙂"
  },
  9: {
    name: "Chocolate Day",
    challenge: { type: "quiz", question: "Which is the most sweetest thing?", options: ["Dairy Milk", "KitKat", "CadBury", "Milk Candy🤭"], correctIndex: 3 },
    hint: "how can you think these things are sweeter than you?😜",
    wish: "🍫 Chocolate Day Wish: Life is sweeter with you in it. May your day be wrapped in smiles and sprinkled with joy."
  },
  10: {
    name: "Teddy Day",
    challenge: { type: "code", pin: "1430" },
    hint: "Try a romantic number combo 😉 (1-4-3 means something).",
    wish: "🧸 Teddy Day Wish: If I could, I’d send you a teddy to hug whenever you miss me. Until then—consider this wish your warm hug."
  },
  11: {
    name: "Promise Day",
    challenge: { type: "sequence", prompt: "Find the next number: 2, 6, 12, 20, ?", answer: "30" },
    hint: "Look at how the differences change: +4, +6, +8...",
    wish: "🤝 Promise Day Wish: I promise to cheer for you, support you, and celebrate you—today and always."
  },
  12: {
    name: "Hug Day",
    challenge: { type: "memory" },
    hint: "Match all pairs. Take your time—love isn’t rushed.",
    wish: "🤗 Hug Day Wish: Here’s a hug in words: you’re safe, valued, and cared for more than you know."
  },
  13: {
    name: "Kiss Day",
    challenge: { type: "riddle", question: "I’m yours but others use me more than you do. What am I?", answer: "your name" },
    hint: "It’s something people say when they want your attention.",
    wish: "😘 Kiss Day Wish: If kisses were stars, I’d give you the whole sky. Until then, take this one: *mwah!*"
  },
  14: {
    name: "Valentine’s Day",
    challenge: { type: "final", text: "Type: I choose you" , answer: "i choose you" },
    hint: "It’s a simple sentence. Powerful, honest, final.",
    wish: "💖 Valentine’s Day Wish: You’re my favorite person—my calm, my chaos, my comfort. Happy Valentine’s Day."
  }
};

let selectedOption = null;
let tapState = null;
let memoryState = null;
let day9QuizAttempts = 0;

function setModal(open, title="", body=""){
  const modal = document.getElementById("modal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").textContent = body;
  modal.hidden = !open;
}

function confettiBurst(){
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  function resize(){
    canvas.width = Math.floor(innerWidth * DPR);
    canvas.height = Math.floor(innerHeight * DPR);
  }
  resize();

  const particles = Array.from({length: 160}, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.2,
    r: 3 + Math.random()*4,
    vx: (-1 + Math.random()*2) * 2.2,
    vy: 2 + Math.random()*4,
    rot: Math.random() * Math.PI,
    vr: (-1 + Math.random()*2) * 0.12,
    life: 0,
    max: 120 + Math.random()*50
  }));

  let frame = 0;
  function tick(){
    frame++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const p of particles){
      p.life++;
      p.x += p.vx * DPR;
      p.y += p.vy * DPR;
      p.rot += p.vr;
      p.vy += 0.03 * DPR;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.life/p.max);
      // no fixed colors; let it vary via gradients-ish
      ctx.fillStyle = `hsla(${Math.floor(Math.random()*360)}, 90%, 65%, ${ctx.globalAlpha})`;
      ctx.fillRect(-p.r, -p.r, p.r*2, p.r*2);
      ctx.restore();
    }
    if (frame < 170) requestAnimationFrame(tick);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  tick();
}

function unlockDay(day){
  const unlocks = loadUnlocks();
  unlocks[String(day)] = true;
  saveUnlocks(unlocks);

  document.getElementById("statusPill").textContent = "Unlocked ✨";
  document.getElementById("statusPill").style.borderColor = "rgba(53,208,127,.35)";

  document.getElementById("wishText").textContent = CONFIG[day].wish;
  document.getElementById("wishCard").hidden = false;

  confettiBurst();
}

function renderChallenge(day){
  const cfg = CONFIG[day];
  const area = document.getElementById("challengeArea");
  area.innerHTML = "";
  selectedOption = null;
  tapState = null;
  memoryState = null;

  document.getElementById("challengeTitle").textContent = `${cfg.name} Challenge`;
  document.getElementById("challengeDesc").textContent = challengeDescription(cfg.challenge);

  const type = cfg.challenge.type;

  if (type === "tap") {
    const info = document.createElement("div");
    info.className = "muted";
    const timeText = cfg.challenge.seconds ? ` in <b>${cfg.challenge.seconds}s</b>` : ``;
    info.innerHTML = `Click <b>${cfg.challenge.target}</b> hearts${timeText}.`;
    area.appendChild(info);

    const zone = document.createElement("div");
    zone.className = "tapZone";
    zone.style.marginTop = "12px";
    area.appendChild(zone);

    const stat = document.createElement("div");
    stat.className = "rowSplit";
    stat.style.marginTop = "12px";
    const timeHtml = cfg.challenge.seconds ? `<span class="pill" id="tapTime">${cfg.challenge.seconds}s</span>` : ``;
    stat.innerHTML = `
      <span class="pill" id="tapScore">0/${cfg.challenge.target}</span>
      ${timeHtml}
    `;
    area.appendChild(stat);

    const start = document.createElement("button");
    start.className = "btn";
    start.textContent = "Start";
    start.style.marginTop = "12px";
    area.appendChild(start);

    tapState = { started:false, score:0, left: cfg.challenge.seconds, zone, timer:null, target: cfg.challenge.target };

    start.addEventListener("click", () => startTapGame());

  } else if (type === "scramble") {
    area.innerHTML = `
      <div class="pill">Scrambled: <b>${cfg.challenge.scramble}</b></div>
      <p class="muted" style="margin-top:10px">Type the correct phrase:</p>
      <input class="input" id="textAnswer" placeholder="Your answer..." autocomplete="off" />
    `;

  } else if (type === "quiz") {
    const q = document.createElement("div");
    q.innerHTML = `<p style="margin:0 0 10px"><b>${cfg.challenge.question}</b></p>`;
    area.appendChild(q);

    const grid = document.createElement("div");
    grid.className = "optionGrid";
    grid.id = "quizGrid";
    cfg.challenge.options.forEach((opt, idx) => {
      const o = document.createElement("div");
      o.className = "option";
      o.textContent = opt;
      o.addEventListener("click", () => {
        selectedOption = idx;
        [...grid.children].forEach(c => c.classList.remove("selected"));
        o.classList.add("selected");
      });
      grid.appendChild(o);
    });
    area.appendChild(grid);

  } else if (type === "code") {
    area.innerHTML = `
      <p class="muted" style="margin:0 0 10px">Enter the 4-digit love code:</p>
      <input class="input" id="pin" inputmode="numeric" maxlength="8" placeholder="e.g. 1430" />
    `;

  } else if (type === "sequence") {
    area.innerHTML = `
      <p style="margin:0 0 10px"><b>${cfg.challenge.prompt}</b></p>
      <input class="input" id="seq" placeholder="Your answer..." autocomplete="off" />
    `;

  } else if (type === "memory") {
    const label = document.createElement("p");
    label.className = "muted";
    label.style.margin = "0 0 10px";
    label.textContent = "Match all pairs to unlock.";
    area.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "memoryGrid";
    area.appendChild(grid);

    const emojis = ["❤","🌹","🍫","🧸","✨","💞"];
    const deck = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

    memoryState = {
      deck,
      revealed: [],
      matched: new Set(),
      lock: false,
      grid
    };

    deck.forEach((_, i) => {
      const tile = document.createElement("div");
      tile.className = "cardTile";
      tile.textContent = "❓";
      tile.addEventListener("click", () => flipCard(i, tile));
      grid.appendChild(tile);
    });

  } else if (type === "riddle") {
    area.innerHTML = `
      <p style="margin:0 0 10px"><b>${cfg.challenge.question}</b></p>
      <input class="input" id="riddle" placeholder="Your answer..." autocomplete="off" />
    `;

  } else if (type === "final") {
    area.innerHTML = `
      <p class="muted" style="margin:0 0 10px">${cfg.challenge.text}</p>
      <input class="input" id="final" placeholder="Type here..." autocomplete="off" />
    `;
  }
}

function challengeDescription(ch){
  switch(ch.type){
    case "tap": return "A fast mini game. Speed + focus.";
    case "scramble": return "A word puzzle. Rearrange the letters mentally.";
    case "quiz": return "A quick question. Pick the correct option.";
    case "code": return "A lock puzzle. Find the right code.";
    case "sequence": return "A logic puzzle. Predict the next number.";
    case "memory": return "A classic memory match mini game.";
    case "riddle": return "A riddle. Think simple.";
    case "final": return "A final vow. Type the exact phrase.";
    default: return "Complete the challenge.";
  }
}

function startTapGame(){
  if (!tapState || tapState.started) return;
  tapState.started = true;
  tapState.score = 0;

  const scoreEl = document.getElementById("tapScore");
  const timeEl = document.getElementById("tapTime");

  function spawn(){
    if (!tapState.started) return;
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = "❤";

    const x = 8 + Math.random() * 84;
    const y = 12 + Math.random() * 76;

    heart.style.left = `${x}%`;
    heart.style.top = `${y}%`;

    const kill = setTimeout(() => heart.remove(), 900);

    heart.addEventListener("click", () => {
      clearTimeout(kill);
      heart.remove();
      tapState.score++;
      scoreEl.textContent = `${tapState.score}/${tapState.target}`;
      if (tapState.score >= tapState.target){
        tapState.started = false;
        if (tapState.timer) clearInterval(tapState.timer);
        if (timeEl) timeEl.textContent = `Done!`;
      }
    });

    tapState.zone.appendChild(heart);
  }

  // spawn hearts frequently
  const spawnTimer = setInterval(() => {
    if (!tapState.started) { clearInterval(spawnTimer); return; }
    spawn(); spawn();
  }, 520);

  // only set up timer if seconds limit exists
  if (tapState.left) {
    tapState.timer = setInterval(() => {
      tapState.left--;
      if (timeEl) timeEl.textContent = `${tapState.left}s`;
      if (tapState.left <= 0){
        tapState.started = false;
        clearInterval(tapState.timer);
        if (timeEl) timeEl.textContent = `Time!`;
      }
    }, 1000);
  }

  // initial burst
  for (let i=0;i<6;i++) spawn();
}

function flipCard(i, tile){
  if (!memoryState || memoryState.lock) return;
  if (memoryState.matched.has(i)) return;

  // prevent re-click same revealed
  if (memoryState.revealed.some(x => x.i === i)) return;

  tile.textContent = memoryState.deck[i];
  tile.classList.add("revealed");
  memoryState.revealed.push({i, tile});

  if (memoryState.revealed.length === 2){
    const [a,b] = memoryState.revealed;
    memoryState.lock = true;

    const match = memoryState.deck[a.i] === memoryState.deck[b.i];
    setTimeout(() => {
      if (match){
        a.tile.classList.add("matched");
        b.tile.classList.add("matched");
        memoryState.matched.add(a.i);
        memoryState.matched.add(b.i);
      } else {
        a.tile.textContent = "❓";
        b.tile.textContent = "❓";
        a.tile.classList.remove("revealed");
        b.tile.classList.remove("revealed");
      }
      memoryState.revealed = [];
      memoryState.lock = false;
    }, match ? 420 : 680);
  }
}

function isMemoryComplete(){
  return memoryState && memoryState.matched.size === memoryState.deck.length;
}

function normalize(s){
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function checkChallenge(day){
  const cfg = CONFIG[day];
  const ch = cfg.challenge;

  if (ch.type === "tap"){
    return tapState && tapState.score >= ch.target;
  }
  if (ch.type === "scramble"){
    const v = document.getElementById("textAnswer")?.value;
    return normalize(v) === normalize(ch.answer);
  }
  if (ch.type === "quiz"){
    // Day 9 quiz is special - always false (user must fail 4 times to get hint)
    if (day === 9) return false;
    return selectedOption === ch.correctIndex;
  }
  if (ch.type === "code"){
    const v = document.getElementById("pin")?.value;
    return normalize(v) === normalize(ch.pin);
  }
  if (ch.type === "sequence"){
    const v = document.getElementById("seq")?.value;
    return normalize(v) === normalize(ch.answer);
  }
  if (ch.type === "memory"){
    return isMemoryComplete();
  }
  if (ch.type === "riddle"){
    const v = document.getElementById("riddle")?.value;
    return normalize(v) === normalize(ch.answer);
  }
  if (ch.type === "final"){
    const v = document.getElementById("final")?.value;
    return normalize(v) === normalize(ch.answer);
  }
  return false;
}

function init(){
  const dRaw = qs("d");
  const day = Number(dRaw);

  if (!DAYS.includes(day)){
    alert("Invalid day. Returning home.");
    location.href = "index.html";
    return;
  }

  // Reset day 9 quiz attempts
  if (day === 9) {
    day9QuizAttempts = 0;
  }

  const cfg = CONFIG[day];
  document.title = `Feb ${day} — ${cfg.name}`;
  document.getElementById("dayTitle").textContent = `Feb ${day} — ${cfg.name}`;
  document.getElementById("daySubtitle").textContent = `Beat today’s challenge to unlock the wish.`;

  const unlocks = loadUnlocks();
  const playable = loadPlayable();
  const already = !!unlocks[String(day)];
  const isPlayable = !!playable[String(day)];
  const todayMatch = isToday(day);
  const isPastDay = day < getTodayInBangladesh();
  
  // For past days, treat them as already unlocked (auto-show wish)
  const shouldShowWish = already || isPastDay;

  document.getElementById("statusPill").textContent = shouldShowWish ? "Unlocked ✨" : "Locked 🔒";

  // If already unlocked or past day, always show the wish
  if (shouldShowWish){
    document.getElementById("wishText").textContent = CONFIG[day].wish;
    document.getElementById("wishCard").hidden = false;
  }

  // Set up event listeners first (before any returns)
  document.getElementById("hintBtn").addEventListener("click", () => {
    if (isPastDay || (!todayMatch && !already && !isPlayable)){
      setModal(true, "Oops!", "Don't cheat mahi😁");
    } else {
      setModal(true, "Hint", cfg.hint);
    }
  });
  document.getElementById("closeModal").addEventListener("click", () => {
    setModal(false);
    // If hint was shown for day 9 quiz, unlock the wish
    if (day === 9 && localStorage.getItem("day9_hint_shown") === "true") {
      localStorage.removeItem("day9_hint_shown");
      unlockDay(day);
      alert("Unlocked! Scroll down for your wish ✨");
    }
  });
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") {
      setModal(false);
      // If hint was shown for day 9 quiz, unlock the wish
      if (day === 9 && localStorage.getItem("day9_hint_shown") === "true") {
        localStorage.removeItem("day9_hint_shown");
        unlockDay(day);
        alert("Unlocked! Scroll down for your wish ✨");
      }
    }
  });

  document.getElementById("backBtn").addEventListener("click", () => window.location.href = "index.html");

  document.getElementById("checkBtn").addEventListener("click", () => {
    if (isPastDay || (!todayMatch && !already && !isPlayable)) return; // Don't allow submission on past days or future locked days
    
    // Special logic for day 9 quiz
    if (day === 9 && cfg.challenge.type === "quiz") {
      day9QuizAttempts++;
      
      if (day9QuizAttempts < 4) {
        // Show wrong on the selected option only
        const grid = document.getElementById("quizGrid");
        if (grid && selectedOption !== null) {
          const selectedOpt = grid.children[selectedOption];
          if (selectedOpt) {
            selectedOpt.style.background = "rgba(255, 77, 109, 0.3)";
            selectedOpt.style.borderColor = "rgba(255, 77, 109, 0.6)";
            selectedOpt.style.color = "var(--hot)";
          }
        }
        alert(`Not yet! Try again (Attempt ${day9QuizAttempts}/4)`);
      } else if (day9QuizAttempts === 4) {
        // After 4 attempts, show hint and unlock
        alert("You've tried enough. Let me give you a hint...");
        setModal(true, "Hint", cfg.hint);
        
        // Store flag that hint was shown for day 9
        localStorage.setItem("day9_hint_shown", "true");
      }
      return;
    }
    
    const ok = checkChallenge(day);
    if (ok){
      unlockDay(day);
      alert("Unlocked! Scroll down for your wish ✨");
    } else {
      alert("Not yet! Try again (or use the hint).");
    }
  });

  document.getElementById("shareBtn").addEventListener("click", async () => {
    const text = document.getElementById("wishText").textContent || "";
    try{
      await navigator.clipboard.writeText(text);
      alert("Wish copied!");
    } catch {
      alert("Copy failed. You can manually select and copy.");
    }
  });

  document.getElementById("playAgainBtn").addEventListener("click", () => {
    // Hide the wish card and show the challenge again
    document.getElementById("wishCard").hidden = true;
    document.getElementById("challengeArea").style.display = "block";
    
    // Reset challenge state
    selectedOption = null;
    tapState = null;
    memoryState = null;
    day9QuizAttempts = 0;
    
    // Re-render the challenge
    renderChallenge(day);
  });

  // keep canvas sized
  window.addEventListener("resize", () => {
    const c = document.getElementById("confetti");
    c.width = innerWidth * (window.devicePixelRatio || 1);
    c.height = innerHeight * (window.devicePixelRatio || 1);
  });

  // For past days, just show the wish - don't show challenge
  if (isPastDay){
    document.getElementById("challengeArea").style.display = "none";
    document.getElementById("checkBtn").disabled = true;
    document.getElementById("checkBtn").style.opacity = "0.5";
    document.getElementById("checkBtn").style.cursor = "not-allowed";
    document.getElementById("hintBtn").disabled = true;
    document.getElementById("hintBtn").style.opacity = "0.5";
    document.getElementById("hintBtn").style.cursor = "not-allowed";
    return;
  }

  // Check if it's not today and not already unlocked and not playable
  if (!todayMatch && !already && !isPlayable){
    // Not today and not unlocked and not playable - show waiting message
    const area = document.getElementById("challengeArea");
    area.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <p style="font-size: 18px; margin: 0 0 10px;">⏰ Wait for the day, dear 😊</p>
        <p class="muted" style="margin: 0;">Feb ${day} will unlock on February ${day}, 2026</p>
      </div>
    `;
    document.getElementById("checkBtn").disabled = true;
    document.getElementById("checkBtn").textContent = "Waiting...";
    document.getElementById("checkBtn").style.opacity = "0.5";
    document.getElementById("checkBtn").style.cursor = "not-allowed";
    return;
  }

  // If today or already unlocked or playable, show challenge (allow replay)
  if (todayMatch || already || isPlayable){
    renderChallenge(day);
  }
}

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
  trackVisitor(deviceId);
}

initVisitorTracking();
init();
