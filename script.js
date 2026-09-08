const pages = ["home","verify","analyzing","result","history","how","about"];

let history = JSON.parse(localStorage.getItem("truthcheckHistory") || "[]");
let currentClaim = "";

// ==========================================
// n8n BACKEND URL
// ==========================================

const N8N_API_URL =
"https://muqash-00.app.n8n.cloud/webhook/truthcheck";

// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(page){
pages.forEach(id => {
const el = document.getElementById(id);
if(el) el.classList.toggle("active", id === page);
});

document.getElementById("navLinks")?.classList.remove("open");

window.scrollTo({
top: 0,
behavior: "smooth"
});

if(page === "history"){
renderHistory();
}
}

function toggleMenu(){
document.getElementById("navLinks").classList.toggle("open");
}

// ==========================================
// CHARACTER COUNTERS
// ==========================================

function setupCounter(inputId, counterId){

const input = document.getElementById(inputId);
const counter = document.getElementById(counterId);

if(!input || !counter) return;

input.addEventListener("input", () => {
counter.textContent =
`${input.value.length} / 2000`;
});
}

setupCounter("homeClaim", "homeCounter");
setupCounter("verifyClaim", "verifyCounter");

// ==========================================
// EXAMPLE CLAIM
// ==========================================

function useExample(text){

const input = document.getElementById("verifyClaim");

if(!input) return;

input.value = text;

input.dispatchEvent(
new Event("input")
);
}

// ==========================================
// MAIN VERIFICATION FUNCTION
// ==========================================

async function startVerification(inputId){

const input = document.getElementById(inputId);

const claim = input?.value.trim();

if(!claim){

```
alert(
  "Please enter a claim or statement first."
);

input?.focus();

return;
```

}

currentClaim = claim;

document.getElementById("resultClaim").textContent =
claim;

// Show analyzing screen
showPage("analyzing");

try{

```
// ========================================
// SEND CLAIM TO n8n
// ========================================

const response = await fetch(
  N8N_API_URL,
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      claim: claim
    })
  }
);


// ========================================
// CHECK SERVER RESPONSE
// ========================================

if(!response.ok){

  throw new Error(
    `Server error: ${response.status}`
  );
}


const result = await response.json();


console.log(
  "TruthCheck n8n Result:",
  result
);


// ========================================
// DISPLAY RESULT
// ========================================

displayResult(result);


// ========================================
// SAVE RESULT
// ========================================

saveHistory(result, claim);


// Show result page
showPage("result");
```

}catch(error){

```
console.error(
  "TruthCheck API Error:",
  error
);


showPage("verify");


alert(
  "Unable to connect to TruthCheck AI backend. Please try again."
);
```

}
}

// ==========================================
// DISPLAY REAL n8n RESULT
// ==========================================

function displayResult(result){

const verdict =
result.verdict || "UNVERIFIED";

const confidence =
Number(result.confidence || 0);

// ----------------------------------------
// Accuracy Score
// ----------------------------------------

let accuracyScore = confidence;

if(verdict === "FALSE"){
accuracyScore = Math.max(
0,
100 - confidence
);
}

if(verdict === "UNVERIFIED"){
accuracyScore = 0;
}

// ----------------------------------------
// Basic result fields
// ----------------------------------------

document.getElementById(
"verdictText"
).textContent = verdict;

document.getElementById(
"scoreText"
).textContent =
accuracyScore + "%";

// ----------------------------------------
// Confidence level
// ----------------------------------------

let confidenceLevel = "LOW";

if(confidence >= 75){
confidenceLevel = "HIGH";
}
else if(confidence >= 40){
confidenceLevel = "MEDIUM";
}

document.getElementById(
"confidenceText"
).textContent =
confidenceLevel;

// ----------------------------------------
// Sources count
// ----------------------------------------

const sourceText =
result.sources || "";

const sourceCount =
sourceText
.split("\n")
.filter(x => x.trim())
.length;

document.getElementById(
"sourcesText"
).textContent =
sourceCount || "0";

// ----------------------------------------
// AI Explanation
// ----------------------------------------

document.getElementById(
"analysisText"
).textContent =
result.explanation ||
"No explanation was returned by the AI.";

// ----------------------------------------
// Verdict Icon + Styling
// ----------------------------------------

const icon =
document.getElementById("verdictIcon");

if(verdict === "TRUE"){

```
icon.textContent = "✓";
icon.style.color = "#16a34a";
icon.style.background = "#eaf8ef";
```

}

else if(verdict === "FALSE"){

```
icon.textContent = "×";
icon.style.color = "#dc2626";
icon.style.background = "#feecec";
```

}

else if(verdict === "PARTIALLY TRUE"){

```
icon.textContent = "!";
icon.style.color = "#d97706";
icon.style.background = "#fff6e6";
```

}

else{

```
icon.textContent = "?";
icon.style.color = "#6c4ce6";
icon.style.background = "#f1efff";
```

}

document.getElementById(
"verdictText"
).style.color =
icon.style.color;

// ----------------------------------------
// Evidence
// ----------------------------------------

renderEvidence(
result.evidence || "",
result.verdict
);

// ----------------------------------------
// Sources
// ----------------------------------------

renderSources(
result.sources || ""
);

// ----------------------------------------
// Correct Information
// ----------------------------------------

const correctInfo =
result.correct_information || "";

const analysisBox =
document.getElementById("analysisText");

if(correctInfo){

```
analysisBox.textContent +=
  "\n\nCorrect Information:\n" +
  correctInfo;
```

}
}

// ==========================================
// EVIDENCE DISPLAY
// ==========================================

function renderEvidence(evidence, verdict){

const evidencePlaceholders =
document.querySelectorAll(
".evidence-placeholder"
);

if(!evidencePlaceholders.length)
return;

const evidenceList =
evidence
.split("\n")
.map(x => x.replace(/^[-•]\s*/, "").trim())
.filter(Boolean);

const html =
evidenceList.length

```
  ? evidenceList
      .map(item => `
        <div style="
          margin-bottom:12px;
          padding:12px;
          border-radius:10px;
          background:#f8f9fc;
        ">
          <span style="margin-right:8px;">✓</span>
          ${escapeHtml(item)}
        </div>
      `)
      .join("")

  : `
    <p>No evidence returned.</p>
  `;
```

// Supporting evidence
if(evidencePlaceholders[0]){

```
evidencePlaceholders[0].innerHTML =
  `<div style="width:100%">${html}</div>`;

evidencePlaceholders[0].classList.remove(
  "danger"
);
```

}

// Contradicting evidence
if(evidencePlaceholders[1]){

```
if(verdict === "FALSE"){

  evidencePlaceholders[1].innerHTML =
    `<div style="width:100%">${html}</div>`;

  evidencePlaceholders[1].classList.add(
    "danger"
  );

}else{

  evidencePlaceholders[1].innerHTML =
    `<div style="width:100%">
      <p>No contradicting evidence specifically returned.</p>
    </div>`;

}
```

}
}

// ==========================================
// SOURCES DISPLAY
// ==========================================

function renderSources(sources){

const sourceBox =
document.querySelector(
".source-placeholder"
);

if(!sourceBox) return;

const sourceList =
sources
.split("\n")
.map(x =>
x
.replace(/^[-•]\s*/, "")
.trim()
)
.filter(Boolean);

if(!sourceList.length){

```
sourceBox.textContent =
  "No sources returned.";

return;
```

}

sourceBox.innerHTML =
sourceList
.map(source => `         <div style="
          padding:12px;
          margin-bottom:8px;
          border-radius:10px;
          background:#f8f9fc;
        ">
          ✓ ${escapeHtml(source)}         </div>
      `)
.join("");
}

// ==========================================
// SAVE REAL RESULT TO HISTORY
// ==========================================

function saveHistory(result, claim){

const verdict =
result.verdict || "UNVERIFIED";

const confidence =
Number(result.confidence || 0);

let score = confidence;

if(verdict === "FALSE"){
score = Math.max(
0,
100 - confidence
);
}

if(verdict === "UNVERIFIED"){
score = 0;
}

history.unshift({

```
claim: claim,

verdict: verdict,

score: score,

confidence:
  confidence >= 75
    ? "HIGH"
    : confidence >= 40
      ? "MEDIUM"
      : "LOW",

explanation:
  result.explanation || "",

evidence:
  result.evidence || "",

sources:
  result.sources || "",

correct_information:
  result.correct_information || "",

date:
  new Date().toLocaleDateString(
    "en-GB",
    {
      day:"2-digit",
      month:"short",
      year:"numeric"
    }
  )
```

});

history =
history.slice(0, 50);

localStorage.setItem(
"truthcheckHistory",
JSON.stringify(history)
);
}

// ==========================================
// HISTORY
// ==========================================

function renderHistory(){

const rows =
document.getElementById(
"historyRows"
);

const empty =
document.getElementById(
"emptyHistory"
);

if(!rows) return;

const search =
(
document.getElementById(
"historySearch"
)?.value || ""
).toLowerCase();

const filter =
document.getElementById(
"historyFilter"
)?.value ||
"All Results";

const filtered =
history.filter(item => {

```
  const matchesSearch =
    item.claim
      .toLowerCase()
      .includes(search);


  const matchesFilter =
    filter === "All Results" ||
    item.verdict === filter;


  return (
    matchesSearch &&
    matchesFilter
  );
});
```

rows.innerHTML = "";

empty.style.display =
filtered.length
? "none"
: "block";

filtered.forEach(item => {

```
const div =
  document.createElement("div");


div.className =
  "history-table history-row";


const badgeClass =
  item.verdict === "FALSE"
    ? "false"
    : item.verdict === "TRUE"
      ? "true"
      : item.verdict === "MISLEADING"
        ? "misleading"
        : "unverified";


div.innerHTML = `

  <span>
    ${escapeHtml(item.claim)}
  </span>

  <span>
    <b class="badge ${badgeClass}">
      ${escapeHtml(item.verdict)}
    </b>
  </span>

  <span>
    ${item.score}%
  </span>

  <span>
    ${escapeHtml(item.confidence)}
  </span>

  <span>
    ${item.date}
  </span>

  <span>
    <button
      class="view-btn"
      onclick="viewHistory(${history.indexOf(item)})">
      View
    </button>
  </span>

`;


rows.appendChild(div);
```

});

document.getElementById(
"totalChecks"
).textContent =
history.length;

document.getElementById(
"verifiedChecks"
).textContent =
history.filter(
x => x.verdict !== "UNVERIFIED"
).length;

document.getElementById(
"averageAccuracy"
).textContent =
history.length

```
  ? Math.round(
      history.reduce(
        (a,b) =>
          a + Number(b.score || 0),
        0
      ) / history.length
    ) + "%"

  : "—";
```

document.getElementById(
"lastChecked"
).textContent =
history.length
? history[0].date
: "—";
}

// ==========================================
// VIEW SAVED HISTORY
// ==========================================

function viewHistory(index){

const item =
history[index];

if(!item) return;

currentClaim =
item.claim;

document.getElementById(
"resultClaim"
).textContent =
item.claim;

document.getElementById(
"verdictText"
).textContent =
item.verdict;

document.getElementById(
"scoreText"
).textContent =
item.score + "%";

document.getElementById(
"confidenceText"
).textContent =
item.confidence;

document.getElementById(
"analysisText"
).textContent =
item.explanation ||
"No explanation saved.";

renderEvidence(
item.evidence || "",
item.verdict
);

renderSources(
item.sources || ""
);

showPage("result");
}

// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(str){

return String(str).replace(
/[&<>"']/g,
m => ({
"&":"&",
"<":"<",
">":">",
'"':""",
"'":"'"
}[m])
);
}

// ==========================================
// HASH NAVIGATION
// ==========================================

window.addEventListener(
"hashchange",
() => {

```
const hash =
  location.hash.replace("#","");


if(
  hash === "home" ||
  hash === "verify" ||
  hash === "history" ||
  hash === "about" ||
  hash === "how-it-works"
){

  showPage(
    hash === "how-it-works"
      ? "how"
      : hash
  );
}
```

}
);

// ==========================================
// INITIALIZE
// ==========================================

renderHistory();
