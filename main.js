//target all elements to save to constants
const page1btn=document.querySelector("#page1btn");
const page2btn=document.querySelector("#page2btn");
const page3btn=document.querySelector("#page3btn");
const page4btn=document.querySelector("#page4btn");
const page5btn=document.querySelector("#page5btn");
var allpages=document.querySelectorAll(".page");
//select all subtopic pages
function hideall(){ //function to hide all pages
for(let onepage of allpages){ //go through all subtopic pages
onepage.style.display="none"; //hide it
}
}

function show(pgno){ //function to show selected page no
hideall();

//select the page based on the parameter passed in
let onepage=document.querySelector("#page"+pgno);
onepage.style.display="block"; //show the page

}
/*Listen for clicks on the buttons, assign anonymous
eventhandler functions to call show function*/
page1btn.addEventListener("click", function () {
show(1);
});

page2btn.addEventListener("click", function () {
show(2);
});
page3btn.addEventListener("click", function () {
show(3);
});
page4btn.addEventListener("click", function () {
show(4);
});
page5btn.addEventListener("click", function () {
show(5);
});
show(1); //show page 1 by default

/* =========================================================
   GAS LAB: IDLE CHEMIST
   A simple Cookie-Clicker style game. Each gas test
   (splint / limewater / litmus) is a temporary power-up
   instead of a quiz question, so the science still teaches
   through play instead of through multiple choice.
   You have 5 minutes to earn as much Research as possible.
   ========================================================= */
(function () {
  const GAME_LENGTH_SECONDS = 5 * 60; // 5 minute round

  // ---- Upgrade definitions ----
  const upgradeDefs = [
    { id: "betterFlask",   name: "Better Flask",      baseCost: 25,  clickAdd: 1, rps: 0, desc: "+1 Research per click" },
    { id: "labAssistant",  name: "Lab Assistant",     baseCost: 75,  clickAdd: 0, rps: 1, desc: "+1 Research/sec" },
    { id: "heatingBurner", name: "Heating Burner",    baseCost: 200, clickAdd: 5, rps: 0, desc: "+5 Research per click" },
    { id: "scientist",     name: "Scientist",         baseCost: 400, clickAdd: 0, rps: 8, desc: "+8 Research/sec" }
  ];

  // ---- State (resets every round, nothing is saved between visits) ----
  function freshState() {
    return {
      research: 0,
      owned: {},          // upgradeId -> count owned
      combo: 1,
      lastClickTime: 0,
      timeLeft: GAME_LENGTH_SECONDS,
      started: false,     // has "Start Game" been pressed yet
      running: false,     // true while actively playing (false when paused/not started/ended)
      ended: false,       // true once the 5 minutes are up
      pausedAt: null,     // timestamp of when the current pause began
      powerups: {
        oxygen: { active: false, endsAt: 0, cooldownUntil: 0 },
        carbondioxide: { active: false, endsAt: 0, cooldownUntil: 0 },
        ammonia: { active: false, endsAt: 0, cooldownUntil: 0 }
      }
    };
  }

  let state = freshState();

  // ---- DOM refs ----
  const el = {};
  function cacheDom() {
    el.statTimer = document.getElementById("statTimer");
    el.statResearch = document.getElementById("statResearch");
    el.statRPS = document.getElementById("statRPS");
    el.statCombo = document.getElementById("statCombo");
    el.mainFlask = document.getElementById("mainFlask");
    el.clickPower = document.getElementById("clickPower");
    el.floatLayer = document.getElementById("floatLayer");
    el.shopList = document.getElementById("shopList");
    el.endingScreen = document.getElementById("endingScreen");
    el.endingSummary = document.getElementById("endingSummary");
    el.playAgainBtn = document.getElementById("playAgainBtn");
    el.startBtn = document.getElementById("startBtn");
    el.pauseBtn = document.getElementById("pauseBtn");
    el.restartBtn = document.getElementById("restartBtn");
    el.statePrompt = document.getElementById("statePrompt");
    el.pw = {
      oxygen: { btn: document.getElementById("pwOxygen"), state: document.getElementById("pwOxygenState") },
      carbondioxide: { btn: document.getElementById("pwCarbon"), state: document.getElementById("pwCarbonState") },
      ammonia: { btn: document.getElementById("pwAmmonia"), state: document.getElementById("pwAmmoniaState") }
    };
  }

  const gameRoot = document.getElementById("page5");
  if (!gameRoot) return; // safety: game markup not found

  cacheDom();
  buildShop();
  wireEvents();
  render();

  let autoCollectInterval = null;
  let tickInterval = null;
  startTick();

  // ---- Helpers ----
  function upgradeCost(def) {
    const owned = state.owned[def.id] || 0;
    return Math.round(def.baseCost * Math.pow(1.15, owned));
  }

  function productionMultiplier() {
    const now = Date.now();
    return state.powerups.oxygen.active && now < state.powerups.oxygen.endsAt ? 2 : 1;
  }

  function baseClickPower() {
    let power = 1;
    upgradeDefs.forEach(def => {
      power += def.clickAdd * (state.owned[def.id] || 0);
    });
    return power;
  }

  function researchPerSecond() {
    let rps = 0;
    upgradeDefs.forEach(def => {
      rps += def.rps * (state.owned[def.id] || 0);
    });
    return rps * productionMultiplier();
  }

  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return Math.floor(n).toString();
  }

  function fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function addResearch(amount) {
    state.research += amount;
  }

  // ---- Click handling ----
  function handleFlaskClick() {
    if (!state.running) return;
    const now = Date.now();

    if (now - state.lastClickTime <= 800) {
      state.combo = Math.min(5, state.combo + 1);
    } else {
      state.combo = 1;
    }
    state.lastClickTime = now;

    let power = baseClickPower() * productionMultiplier() * state.combo;

    let isCrit = false;
    if (state.powerups.carbondioxide.active && now < state.powerups.carbondioxide.endsAt) {
      if (Math.random() < 0.25) {
        isCrit = true;
        power *= 10;
      }
    }

    addResearch(power);
    spawnFloatingNumber(power, isCrit);
    pulseFlask();
    render();
  }

  function spawnFloatingNumber(amount, isCrit) {
    if (!el.floatLayer) return;
    const span = document.createElement("span");
    span.className = "floatnum" + (isCrit ? " crit" : "");
    span.textContent = (isCrit ? "CRIT! +" : "+") + fmt(amount);
    span.style.left = (40 + Math.random() * 20) + "%";
    el.floatLayer.appendChild(span);
    setTimeout(() => span.remove(), 900);
  }

  function pulseFlask() {
    if (!el.mainFlask) return;
    el.mainFlask.classList.remove("pulse");
    void el.mainFlask.offsetWidth;
    el.mainFlask.classList.add("pulse");
  }

  // ---- Shop ----
  function buildShop() {
    el.shopList.innerHTML = "";
    upgradeDefs.forEach(def => {
      const row = document.createElement("button");
      row.className = "shopitem";
      row.dataset.id = def.id;
      el.shopList.appendChild(row);
    });
    refreshShop();
    el.shopList.addEventListener("click", e => {
      const btn = e.target.closest(".shopitem");
      if (!btn) return;
      buyUpgrade(btn.dataset.id);
    });
  }

  function refreshShop() {
    upgradeDefs.forEach(def => {
      const row = el.shopList.querySelector('[data-id="' + def.id + '"]');
      if (!row) return;
      const cost = upgradeCost(def);
      const owned = state.owned[def.id] || 0;
      const affordable = state.running && state.research >= cost;
      row.classList.toggle("affordable", affordable);
      row.disabled = !affordable;
      row.innerHTML =
        '<span class="shopname">' + def.name + ' <span class="shopowned">(' + owned + ')</span></span>' +
        '<span class="shopdesc">' + def.desc + '</span>' +
        '<span class="shopcost">' + fmt(cost) + ' Research</span>';
    });
  }

  function buyUpgrade(id) {
    if (!state.running) return;
    const def = upgradeDefs.find(d => d.id === id);
    if (!def) return;
    const cost = upgradeCost(def);
    if (state.research < cost) return;
    state.research -= cost;
    state.owned[id] = (state.owned[id] || 0) + 1;
    render();
  }

  // ---- Power-ups ----
  const POWER_DURATION = 15000;
  const POWER_COOLDOWN = 20000;

  function activatePower(kind) {
    if (!state.running) return;
    const now = Date.now();
    const p = state.powerups[kind];
    if (now < p.cooldownUntil) return;

    p.active = true;
    p.endsAt = now + POWER_DURATION;
    p.cooldownUntil = now + POWER_DURATION + POWER_COOLDOWN;

    if (kind === "ammonia") {
      startAutoCollect();
    }

    render();
  }

  function startAutoCollect() {
    if (autoCollectInterval) clearInterval(autoCollectInterval);
    autoCollectInterval = setInterval(() => {
      const p = state.powerups.ammonia;
      if (!p.active || Date.now() > p.endsAt) {
        clearInterval(autoCollectInterval);
        autoCollectInterval = null;
        return;
      }
      if (!state.running) return; // paused: keep the power-up alive, just don't collect
      const amount = baseClickPower() * productionMultiplier();
      addResearch(amount);
      spawnFloatingNumber(amount, false);
      render();
    }, 1000);
  }

  function updatePowerupUI() {
    const now = Date.now();
    ["oxygen", "carbondioxide", "ammonia"].forEach(kind => {
      const p = state.powerups[kind];
      const ui = el.pw[kind];
      if (!ui || !ui.btn) return;
      if (p.active && now < p.endsAt && state.running) {
        ui.btn.classList.add("active");
        ui.btn.disabled = true;
        ui.state.textContent = "Active: " + Math.ceil((p.endsAt - now) / 1000) + "s";
      } else {
        if (p.active && now >= p.endsAt) p.active = false; // just expired
        ui.btn.classList.remove("active");
        if (state.ended) {
          ui.btn.disabled = true;
          ui.state.textContent = "Ended";
        } else if (!state.running) {
          ui.btn.disabled = true;
          ui.state.textContent = state.started ? "Paused" : "Ready";
        } else if (now < p.cooldownUntil) {
          ui.btn.disabled = true;
          ui.state.textContent = "Cooldown: " + Math.ceil((p.cooldownUntil - now) / 1000) + "s";
        } else {
          ui.btn.disabled = false;
          ui.state.textContent = "Ready";
        }
      }
    });
  }

  // ---- Timer & ending ----
  function startTick() {
    let lastTime = Date.now();
    tickInterval = setInterval(() => {
      const now = Date.now();
      if (!state.running) {
        lastTime = now; // keep the clock in sync so paused time isn't counted on resume
        return;
      }
      const elapsedSec = (now - lastTime) / 1000;
      lastTime = now;

      const rps = researchPerSecond();
      if (rps > 0) addResearch(rps * elapsedSec);

      if (now - state.lastClickTime > 800 && state.combo > 1) {
        state.combo = 1;
      }

      state.timeLeft = Math.max(0, state.timeLeft - elapsedSec);
      if (state.timeLeft <= 0) {
        endGame();
      }

      render();
    }, 250);
  }

  function endGame() {
    state.running = false;
    state.ended = true;
    if (autoCollectInterval) clearInterval(autoCollectInterval);
    el.endingSummary.textContent = "You produced " + fmt(state.research) + " Research in 5 minutes. Nice lab work!";
    el.endingScreen.classList.remove("hidden");
    el.pauseBtn.classList.add("hidden");
    el.restartBtn.classList.add("hidden");
    el.startBtn.classList.add("hidden");
  }

  function restartGame() {
    if (autoCollectInterval) clearInterval(autoCollectInterval);
    state = freshState();
    el.endingScreen.classList.add("hidden");
    el.startBtn.classList.remove("hidden");
    el.pauseBtn.classList.add("hidden");
    el.pauseBtn.textContent = "⏸ Pause";
    el.restartBtn.classList.add("hidden");
    el.statePrompt.classList.remove("hidden");
    el.statePrompt.textContent = 'Press "Start Game" to begin your 5 minute lab session.';
    render();
  }

  function startGame() {
    if (state.ended) return; // ended games should use Play Again / Restart instead
    state.started = true;
    state.running = true;
    el.startBtn.classList.add("hidden");
    el.pauseBtn.classList.remove("hidden");
    el.pauseBtn.textContent = "⏸ Pause";
    el.restartBtn.classList.remove("hidden");
    el.statePrompt.classList.add("hidden");
    render();
  }

  function togglePause() {
    if (!state.started || state.ended) return;

    if (state.running) {
      // pausing: remember when, so we can shift timestamps forward on resume
      state.running = false;
      state.pausedAt = Date.now();
    } else {
      // resuming: shift every wall-clock timestamp forward by the paused duration
      // so power-up durations/cooldowns and combo timing don't lose time while paused
      const now = Date.now();
      const pausedDuration = now - (state.pausedAt || now);
      state.lastClickTime += pausedDuration;
      Object.values(state.powerups).forEach(p => {
        p.endsAt += pausedDuration;
        p.cooldownUntil += pausedDuration;
      });
      state.pausedAt = null;
      state.running = true;
    }

    el.pauseBtn.textContent = state.running ? "⏸ Pause" : "▶ Resume";
    render();
  }

  // ---- Wiring ----
  function wireEvents() {
    el.mainFlask.addEventListener("click", handleFlaskClick);
    Object.keys(el.pw).forEach(kind => {
      el.pw[kind].btn.addEventListener("click", () => activatePower(kind));
    });
    el.playAgainBtn.addEventListener("click", restartGame);
    el.startBtn.addEventListener("click", startGame);
    el.pauseBtn.addEventListener("click", togglePause);
    el.restartBtn.addEventListener("click", restartGame);
  }

  // ---- Render ----
  function render() {
    el.statTimer.textContent = fmtTime(state.timeLeft);
    el.statResearch.textContent = fmt(state.research);
    el.statRPS.textContent = fmt(researchPerSecond());
    el.statCombo.textContent = "x" + state.combo;
    el.clickPower.textContent = fmt(baseClickPower() * productionMultiplier() * state.combo);
    el.mainFlask.disabled = !state.running;
    refreshShop();
    updatePowerupUI();
  }
})();
const btnSubmit=document.querySelector("#btnSubmit");
btnSubmit.addEventListener("click",CheckAns);
const scorebox=document.querySelector("#scorebox");
var q1,q2,score=0;
function CheckAns(){
score=0; //reset score to 0, check ans and give score if correct
//read the value of the selected radio button for q1
q1=document.querySelector("input[name='q1']:checked").value;
console.log(q1); //check q1 value retrieved
if(q1=="reignites")score++;
//read the value of the selected radio button for q2
q2=document.querySelector("input[name='q2']:checked").value;
console.log(q2); //check q2 value retrieved
if(q2=="fireair")score++;
scorebox.innerHTML="Score:"+score;
}
