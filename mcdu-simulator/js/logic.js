
// ===============================
// BASIC MCDU INPUT ENGINE
// ===============================

// LCD elements
const screenContent = document.querySelector(".screen-content");
const cursor = document.getElementById("mcdu-cursor");

// Scratchpad (user input line)
let scratchpad = "";

// -------------------------------
// SCRATCHPAD ERROR STATE
// -------------------------------
let scratchpadError = null;

// -------------------------------
// DIR PAGE DATA (STATE)
// -------------------------------
const dirData = {
  directTo: ""
};

// values: "FROMTO", "FLTNBR"


// -------------------------------
// SHOW SCRATCHPAD ERROR
// -------------------------------
function showError(msg) {
  scratchpadError = msg;
  renderLCD();
}


// -------------------------------
// INIT PAGE DATA (STATE)
// -------------------------------
const initData = {
  fromTo: "",
  fltNbr: ""
};


// -------------------------------
// MCDU Pages
// -------------------------------
let currentPage = "INIT";

const pages = {
  INIT: `
  <span class="lcd-amber">INIT</span><br>
  FROM/TO ${initData.fromTo || "____/____"}<br><br>
  FLT NBR ${initData.fltNbr || "_____"}<br><br>
  COST INDEX ___
`,


  DIR: `
    <span class="lcd-amber">DIR</span><br>
    DIRECT TO<br><br>
    ----<br>
    ----
  `,

  DATA: `
    <span class="lcd-amber">DATA</span><br>
    A/C STATUS<br><br>
    SOFTWARE<br>
    DATABASE
  `
};


// CLR long-press handling
let clrPressTimer = null;
const CLR_HOLD_TIME = 800; // milliseconds


// Max characters (real MCDU approx)
const MAX_LEN = 24;

const allKeys = document.querySelectorAll("button[data-key]");

// -------------------------------
// Button click listener
// -------------------------------
allKeys.forEach(btn => {
  const key = btn.dataset.key;

  if (key === "CLR") {
    // long press start
    btn.addEventListener("mousedown", () => {
      clrPressTimer = setTimeout(() => {
        clearAll(); // long press
      }, CLR_HOLD_TIME);
    });

    // release
    btn.addEventListener("mouseup", () => {
      if (clrPressTimer) {
        clearTimeout(clrPressTimer);
        clrPressTimer = null;
        deleteLastChar(); // short press
      }
    });

    // mouse leave safety
    btn.addEventListener("mouseleave", () => {
      if (clrPressTimer) {
        clearTimeout(clrPressTimer);
        clrPressTimer = null;
      }
    });

    return; // CLR handled separately
  }

  // normal buttons
  btn.addEventListener("click", () => {
    handleKeyPress(key);
  });
});


// -------------------------------
// Key handler
// -------------------------------
function handleKeyPress(key) {

  // -------------------------------
  // PAGE SWITCHING
  // -------------------------------
  if (key === "INIT" || key === "DIR" || key === "DATA") {
    currentPage = key;
    renderLCD();
    return;
  }

  // -------------------------------
  // LSK HANDLING (INIT PAGE)
  // -------------------------------
  // -------------------------------
  // LSK HANDLING (INIT PAGE) – REAL MCDU
  // -------------------------------
  if (currentPage === "INIT") {

    // L1 → FROM/TO
    if (key === "L1") {

      if (scratchpad === "") {
        showError("NOT ALLOWED");
        return;
      }

      if (!/^[A-Z]{4}\/[A-Z]{4}$/.test(scratchpad)) {
        showError("NOT ALLOWED");
        return;
      }

      initData.fromTo = scratchpad;
      scratchpad = "";
      renderLCD();
      return;
    }

    // L2 → FLT NBR
    if (key === "L2") {

      if (scratchpad === "") {
        showError("NOT ALLOWED");
        return;
      }

      initData.fltNbr = scratchpad;
      scratchpad = "";
      renderLCD();
      return;
    }
  }

  // -------------------------------
  // LSK HANDLING (DIR PAGE)
  // -------------------------------
  // -------------------------------
  // LSK HANDLING (DIR PAGE) – REAL MCDU
  // -------------------------------
  if (currentPage === "DIR") {

    // L1 → DIRECT TO
    if (key === "L1") {

      if (scratchpad === "") {
        showError("NOT ALLOWED");
        return;
      }

      if (!/^[A-Z]{3,5}$/.test(scratchpad)) {
        showError("NOT ALLOWED");
        return;
      }

      dirData.directTo = scratchpad;
      scratchpad = "";

      showError(`DIRECT TO ${dirData.directTo}`);
      return;
    }
  }






  // -------------------------------
  // IGNORE NON-INPUT KEYS
  // -------------------------------
  // (ONLY real LSKs, not letters)
  // -------------------------------
  if (
    /^L[1-6]$/.test(key) ||   // L1–L6 only
    /^R[1-6]$/.test(key) ||   // R1–R6 only
    key === "PROG" ||
    key === "PERF" ||
    key === "BRT" ||
    key === "DIM" ||
    key === "OVF"
  ) {
    return;
  }


  // -------------------------------
  // SPACE
  // -------------------------------
  if (key === "SP") {
    addChar(" ");
    return;
  }

  // -------------------------------
  // NORMAL INPUT
  // -------------------------------
  if (key.length === 1 || key === "+/-") {
    addChar(key);
  }
}


// -------------------------------
// Add character to scratchpad
// -------------------------------
function addChar(char) {

  // ❌ agar error active hai → typing block
  if (scratchpadError) return;

  if (scratchpad.length >= MAX_LEN) return;

  scratchpad += char;
  renderLCD();
}

// -------------------------------
// Render LCD
// -------------------------------
function renderLCD() {




  let pageContent = "";

  // -------------------------------
  // INIT PAGE
  // -------------------------------
  if (currentPage === "INIT") {

    let fromToText = initData.fromTo || "____/____";
    let fltNbrText = initData.fltNbr || "_____";



    pageContent = `
      <span class="lcd-amber">INIT</span><br>
      FROM/TO ${fromToText}<br><br>
      FLT NBR ${fltNbrText}<br><br>
      COST INDEX ___
    `;
  }

  // -------------------------------
  // DIR PAGE
  // -------------------------------
  else if (currentPage === "DIR") {

    let directText = dirData.directTo || "_____";


    pageContent = `
      <span class="lcd-amber">DIR</span><br>
      DIRECT TO ${directText}<br><br>
      <br>
      <br>
    `;
  }

  // -------------------------------
  // OTHER PAGES
  // -------------------------------
  else {
    pageContent = pages[currentPage];
  }

  // -------------------------------
  // SCRATCHPAD / ERROR LINE
  // -------------------------------
  let scratchLine = "";
  if (scratchpadError) {
    scratchLine = `<span class="lcd-amber">${scratchpadError}</span>`;
  }

  screenContent.innerHTML = pageContent;

  const scratchEl = document.querySelector(".scratchpad-text");

  if (scratchpadError) {
    scratchEl.innerHTML = scratchpadError;
    scratchEl.classList.add("lcd-amber");     // 👈 YELLOW
    scratchEl.classList.remove("scratchpad");
  } else {
    scratchEl.innerHTML = scratchpad;
    scratchEl.classList.remove("lcd-amber");  // 👈 GREEN
    scratchEl.classList.add("scratchpad");
  }




}




// -------------------------------
// Delete last character (short CLR)
// -------------------------------
function deleteLastChar() {

  // 🔴 FIRST PRIORITY: clear error only
  if (scratchpadError) {
    scratchpadError = null;
    renderLCD();
    return;
  }

  // normal delete
  if (scratchpad.length === 0) return;

  scratchpad = scratchpad.slice(0, -1);
  renderLCD();
}


// -------------------------------
// Clear all (long CLR)
// -------------------------------
function clearAll() {

  // 🔴 FIRST: clear error
  if (scratchpadError) {
    scratchpadError = null;
  }

  // clear scratchpad
  scratchpad = "";
  renderLCD();
}

// ===============================
// EXTERNAL NIGHT MODE TOGGLE
// ===============================
const nightToggleBtn = document.getElementById("nightToggle");
const mcduPanel = document.querySelector(".mcdu");

nightToggleBtn.addEventListener("click", () => {
  mcduPanel.classList.toggle("night-mode");
  nightToggleBtn.classList.toggle("active");
});


