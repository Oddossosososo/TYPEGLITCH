(() => {
  "use strict";

  const ID = "typeglitch";
  window.TYPEGLITCH?.destroy?.();
  document.getElementById(ID)?.remove();
  document.getElementById(ID + "-style")?.remove();

  const defaults = {
    mode: "basic",
    wpm: 50,
    minDelay: 100,
    maxDelay: 333,
    pauseDelay: 100,
    accuracy: 100
  };

  let settings = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem("typeglitch-v05") || "{}");
    for (const key of Object.keys(defaults)) {
      if (Object.hasOwn(saved, key)) settings[key] = saved[key];
    }
  } catch {}

  const panel = document.createElement("section");
  panel.id = ID;
  panel.innerHTML = `
    <header id="tgDrag">
      <strong>⚡ TYPEGLITCH <small>v0.5</small></strong>
      <button id="tgClose" aria-label="Close">×</button>
    </header>
    <main>
      <div class="tg-status"><span id="tgStatus">READY</span><b id="tgWpmLive">0 WPM</b></div>
      <div class="tg-track"><div id="tgBar"></div></div>
      <div class="tg-stats">
        <div><b id="tgTyped">0</b><small>ATTEMPTS</small></div>
        <div><b id="tgAccuracyLive">100%</b><small>ACCURACY</small></div>
        <div><b id="tgElapsed">0s</b><small>ELAPSED</small></div>
      </div>
      <hr>
      <div class="tg-modes"><button id="tgBasic">BASIC</button><button id="tgAdvanced">ADVANCED</button></div>
      <section id="tgBasicSection">
        <label>Target WPM <b id="tgWpmValue"></b></label>
        <input id="tgWpmSlider" type="range" min="10" max="150" step="5">
      </section>
      <section id="tgAdvancedSection">
        <label>Minimum delay <b id="tgMinValue"></b></label>
        <input id="tgMin" type="range" min="20" max="500" step="10">
        <label>Maximum delay <b id="tgMaxValue"></b></label>
        <input id="tgMax" type="range" min="50" max="1000" step="10">
      </section>
      <section>
        <label>Word pause <b id="tgPauseValue"></b></label>
        <input id="tgPause" type="range" min="0" max="500" step="10">
        <label>Accuracy simulation <b id="tgAccuracyValue"></b></label>
        <input id="tgAccuracy" type="range" min="50" max="100">
      </section>
      <div class="tg-actions">
        <button id="tgStart">START</button>
        <button id="tgStop">STOP</button>
        <button id="tgReset">RESET</button>
      </div>
      <footer>ARROWRIGHT TO TOGGLE · SETTINGS SAVED LOCALLY</footer>
    </main>`;

  const style = document.createElement("style");
  style.id = ID + "-style";
  style.textContent = `
    #typeglitch{position:fixed;top:24px;right:24px;width:292px;background:#100e19;color:#eee;border:1px solid #854cff;border-radius:14px;z-index:2147483000;font:13px/1.4 system-ui,sans-serif;box-shadow:0 12px 40px #0008,0 0 24px #854cff33;overflow:hidden}
    #typeglitch *{box-sizing:border-box}
    #typeglitch header{display:flex;justify-content:space-between;align-items:center;padding:13px;background:#211831;color:#c8a5ff;cursor:move;user-select:none}
    #typeglitch header small{font-size:10px;color:#9c83bf}
    #typeglitch main{padding:13px}
    #typeglitch button{border:0;border-radius:7px;padding:8px 10px;background:#49316e;color:#fff;cursor:pointer;font-weight:650}
    #typeglitch button:hover{background:#8150c8}
    #typeglitch #tgClose{padding:2px 9px;font-size:18px}
    #typeglitch .tg-status{display:flex;justify-content:space-between;color:#bd91ff;font-weight:700}
    #typeglitch .tg-track{height:7px;background:#292332;border-radius:9px;margin:12px 0;overflow:hidden}
    #typeglitch #tgBar{height:100%;width:0;background:linear-gradient(90deg,#8147d9,#d0aaff);transition:width .15s}
    #typeglitch .tg-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;text-align:center}
    #typeglitch .tg-stats b{display:block;color:#d0aaff;font-size:19px}
    #typeglitch .tg-stats small{font-size:9px;color:#92879f}
    #typeglitch hr{border:0;border-top:1px solid #342942;margin:13px 0}
    #typeglitch .tg-modes,#typeglitch .tg-actions{display:flex;gap:7px;margin:10px 0}
    #typeglitch .tg-modes button,#typeglitch .tg-actions button{flex:1}
    #typeglitch label{display:flex;justify-content:space-between;margin:10px 0 4px;color:#c8bfd4}
    #typeglitch label b{color:#c69cff}
    #typeglitch input{width:100%;accent-color:#a56aff;cursor:pointer}
    #typeglitch #tgAdvancedSection{display:none}
    #typeglitch #tgStart{background:#7040b4}
    #typeglitch #tgStop{background:#783b55}
    #typeglitch #tgReset{background:#393344}
    #typeglitch footer{text-align:center;color:#81738f;font-size:9px;margin-top:10px}
  `;

  document.head.appendChild(style);
  document.body.appendChild(panel);

  const $ = id => panel.querySelector("#" + id);
  let running = false;
  let timer = null;
  let startedAt = 0;
  let elapsedBefore = 0;
  let attempts = 0;
  let correct = 0;
  let mistakes = 0;
  let destroyed = false;

  const save = () => {
    try { localStorage.setItem("typeglitch-v05", JSON.stringify(settings)); } catch {}
  };

  function updateSettings() {
    $("tgWpmSlider").value = settings.wpm;
    $("tgWpmValue").textContent = settings.wpm;
    $("tgMin").value = settings.minDelay;
    $("tgMinValue").textContent = settings.minDelay + "ms";
    $("tgMax").value = settings.maxDelay;
    $("tgMaxValue").textContent = settings.maxDelay + "ms";
    $("tgPause").value = settings.pauseDelay;
    $("tgPauseValue").textContent = settings.pauseDelay + "ms";
    $("tgAccuracy").value = settings.accuracy;
    $("tgAccuracyValue").textContent = settings.accuracy + "%";
    $("tgBasicSection").style.display = settings.mode === "basic" ? "block" : "none";
    $("tgAdvancedSection").style.display = settings.mode === "advanced" ? "block" : "none";
  }

  function getNextCharacter() {
    const word = document.querySelector("#words .word.active");
    if (!word) return null;
    const letters = [...word.children];
    const next = letters.find(letter => letter.className === "");
    if (next) return next.textContent;
    return " ";
  }

  function sendCharacter(character) {
    const input = document.getElementById("wordsInput");
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (!setter) return false;
    input.focus();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    setter.call(input, input.value.slice(0, start) + character + input.value.slice(end));
    const caret = start + character.length;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: character
    }));
    return true;
  }

  const keyNeighbors = {
    a:"qwsz",b:"vghn",c:"xdfv",d:"serfcx",e:"wrsd34",
    f:"rtgdvc",g:"tyfhvb",h:"yugjbn",i:"uojk89",
    j:"uikhmn",k:"iojlm",l:"opk",m:"njk",n:"bhjm",
    o:"ipkl90",p:"ol",q:"12wa",r:"etdf45",s:"awedxz",
    t:"ryfgh56",u:"yihj78",v:"fgcb",w:"qesad23",
    x:"sdzc",y:"tugh67",z:"asx"
  };

  function getMistypedCharacter(character) {
    const neighbors = keyNeighbors[character.toLowerCase()];
    if (!neighbors) return character;
    const wrong = neighbors[Math.floor(Math.random() * neighbors.length)];
    return character === character.toUpperCase() ? wrong.toUpperCase() : wrong;
  }

  function elapsed() {
    return elapsedBefore + (running ? performance.now() - startedAt : 0);
  }

  function updateStats() {
    const ms = elapsed();
    const minutes = ms / 60000;
    const wpm = minutes > 0 ? Math.round((attempts / 5) / minutes) : 0;
    $("tgWpmLive").textContent = wpm + " WPM";
    $("tgTyped").textContent = attempts;
    $("tgAccuracyLive").textContent = attempts ? Math.round(correct / attempts * 100) + "%" : "100%";
    $("tgElapsed").textContent = Math.floor(ms / 1000) + "s";

    const words = [...document.querySelectorAll("#words .word")];
    const totalChars = words.reduce((sum, word) => sum + word.textContent.length, 0) + Math.max(0, words.length - 1);
    const done = Math.min(attempts, totalChars);
    $("tgBar").style.width = totalChars ? (done / totalChars * 100) + "%" : "0%";
  }

  function stop(message = "STOPPED") {
    if (running) elapsedBefore += performance.now() - startedAt;
    running = false;
    clearTimeout(timer);
    timer = null;
    $("tgStatus").textContent = message;
    updateStats();
  }

  function tick() {
    if (!running) return;
    const character = getNextCharacter();
    if (character === null) {
      stop("TEST FINISHED");
      return;
    }

    const isCorrect = Math.random() * 100 < settings.accuracy;
    const actual = isCorrect ? character : getMistypedCharacter(character);
    if (!sendCharacter(actual)) {
      stop("INPUT ERROR");
      return;
    }

    attempts++;
    if (isCorrect) correct++;
    else mistakes++;

    updateStats();

    let delay;
    if (settings.mode === "basic") {
      delay = 12000 / Math.max(1, Number(settings.wpm));
    } else {
      const low = Math.min(settings.minDelay, settings.maxDelay);
      const high = Math.max(settings.minDelay, settings.maxDelay);
      delay = low + Math.random() * (high - low);
    }
    if (character === " ") delay += Number(settings.pauseDelay) || 0;

    $("tgStatus").textContent = "TYPING";
    timer = setTimeout(tick, delay);
  }

  function start() {
    if (running) return;
    if (!document.getElementById("wordsInput") || !document.querySelector("#words .word.active")) {
      $("tgStatus").textContent = "OPEN A TEST FIRST";
      return;
    }
    running = true;
    startedAt = performance.now();
    $("tgStatus").textContent = "TYPING";
    tick();
  }

  function reset() {
    stop("RESET");
    elapsedBefore = 0;
    attempts = correct = mistakes = 0;
    updateStats();
    $("tgStatus").textContent = "READY";
  }

  $("tgStart").onclick = start;
  $("tgStop").onclick = () => stop();
  $("tgReset").onclick = reset;
  $("tgBasic").onclick = () => { settings.mode = "basic"; updateSettings(); save(); };
  $("tgAdvanced").onclick = () => { settings.mode = "advanced"; updateSettings(); save(); };

  const sliders = {
    tgWpmSlider: "wpm",
    tgMin: "minDelay",
    tgMax: "maxDelay",
    tgPause: "pauseDelay",
    tgAccuracy: "accuracy"
  };
  for (const [id, key] of Object.entries(sliders)) {
    $(id).addEventListener("input", event => {
      settings[key] = Number(event.target.value);
      updateSettings();
      save();
    });
  }

  function onKeydown(event) {
    if (event.code !== "ArrowRight" || event.repeat) return;
    if (event.target.closest?.("#typeglitch") || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    event.preventDefault();
    running ? stop() : start();
  }
  window.addEventListener("keydown", onKeydown);

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  $("tgDrag").addEventListener("pointerdown", event => {
    if (event.target.closest("button")) return;
    dragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    $("tgDrag").setPointerCapture(event.pointerId);
  });
  $("tgDrag").addEventListener("pointermove", event => {
    if (!dragging) return;
    panel.style.left = Math.max(0, event.clientX - offsetX) + "px";
    panel.style.top = Math.max(0, event.clientY - offsetY) + "px";
    panel.style.right = "auto";
  });
  $("tgDrag").addEventListener("pointerup", () => { dragging = false; });
  $("tgDrag").addEventListener("pointercancel", () => { dragging = false; });

  const statsTimer = setInterval(() => {
    if (!destroyed && panel.isConnected) updateStats();
  }, 500);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    clearInterval(statsTimer);
    window.removeEventListener("keydown", onKeydown);
    panel.remove();
    style.remove();
    delete window.TYPEGLITCH;
  }

  $("tgClose").onclick = destroy;
  window.TYPEGLITCH = { start, stop, reset, destroy, settings };
  updateSettings();
  updateStats();
  console.log("TYPEGLITCH v0.5 loaded. Press ArrowRight to toggle.");
})();