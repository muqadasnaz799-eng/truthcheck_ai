const pages = ["home","verify","analyzing","result","history","how","about"];

let history = JSON.parse(localStorage.getItem("truthcheckHistory") || "[]");
let currentClaim = "";

function showPage(page){
  if(page === "how") page = "how";
  pages.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle("active", id === page);
  });
  document.getElementById("navLinks")?.classList.remove("open");
  window.scrollTo({top:0, behavior:"smooth"});
  if(page === "history") renderHistory();
}

function toggleMenu(){
  document.getElementById("navLinks").classList.toggle("open");
}

function setupCounter(inputId,counterId){
  const input=document.getElementById(inputId);
  const counter=document.getElementById(counterId);
  if(!input || !counter) return;
  input.addEventListener("input",()=>counter.textContent=`${input.value.length} / 2000`);
}

setupCounter("homeClaim","homeCounter");
setupCounter("verifyClaim","verifyCounter");

function useExample(text){
  const input=document.getElementById("verifyClaim");
  input.value=text;
  input.dispatchEvent(new Event("input"));
}

function startVerification(inputId){
  const input=document.getElementById(inputId);
  const claim=input?.value.trim();

  if(!claim){
    alert("Please enter a claim or statement first.");
    input?.focus();
    return;
  }

  currentClaim=claim;
  document.getElementById("resultClaim").textContent=claim;
  showPage("analyzing");

  // Development preview only.
  // Real fact-check APIs + AI will replace this logic in the backend phase.
  setTimeout(()=>{
    generatePreviewResult(claim);
    saveHistoryPreview(claim);
    showPage("result");
  },2200);
}

function generatePreviewResult(claim){
  const lower=claim.toLowerCase();
  let verdict="UNVERIFIED", score=50, confidence="MEDIUM", sources=0;
  let explanation="There is not enough connected evidence in this frontend-only development version to make a reliable conclusion.";

  if(lower.includes("earth is flat")){
    verdict="FALSE"; score=2; confidence="HIGH"; sources=8;
    explanation="The claim is a development preview. In the final version, the system will compare real fact-check results and reliable source evidence before generating this verdict.";
  } else if(lower.includes("10% of their brain") || lower.includes("10% of the brain")){
    verdict="FALSE"; score=5; confidence="HIGH"; sources=6;
    explanation="The claim is a development preview. The final version will use real evidence and source-backed AI analysis.";
  } else if(lower.includes("water boils at 100") || lower.includes("water boils at 100°c")){
    verdict="TRUE"; score=98; confidence="HIGH"; sources=5;
    explanation="This is a development preview for UI testing. The final result will be based on connected evidence rather than hard-coded examples.";
  }

  document.getElementById("verdictText").textContent=verdict;
  document.getElementById("scoreText").textContent=score+"%";
  document.getElementById("confidenceText").textContent=confidence;
  document.getElementById("sourcesText").textContent=sources;
  document.getElementById("analysisText").textContent=explanation;

  const icon=document.getElementById("verdictIcon");
  icon.textContent=verdict==="TRUE"?"✓":verdict==="FALSE"?"×":verdict==="MISLEADING"?"!":"?";
  icon.style.color=verdict==="TRUE"?"#16a34a":verdict==="FALSE"?"#dc2626":verdict==="MISLEADING"?"#d97706":"#6c4ce6";
  icon.style.background=verdict==="TRUE"?"#eaf8ef":verdict==="FALSE"?"#feecec":verdict==="MISLEADING"?"#fff6e6":"#f1efff";
  document.getElementById("verdictText").style.color=icon.style.color;
}

function saveHistoryPreview(claim){
  const lower=claim.toLowerCase();
  let verdict="UNVERIFIED", score=50, confidence="MEDIUM";
  if(lower.includes("earth is flat")){verdict="FALSE";score=2;confidence="HIGH"}
  else if(lower.includes("10% of their brain")){verdict="FALSE";score=5;confidence="HIGH"}
  else if(lower.includes("water boils at 100")){verdict="TRUE";score=98;confidence="HIGH"}

  history.unshift({
    claim, verdict, score, confidence,
    date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})
  });
  history=history.slice(0,50);
  localStorage.setItem("truthcheckHistory",JSON.stringify(history));
}

function renderHistory(){
  const rows=document.getElementById("historyRows");
  const empty=document.getElementById("emptyHistory");
  if(!rows) return;

  const search=(document.getElementById("historySearch")?.value||"").toLowerCase();
  const filter=document.getElementById("historyFilter")?.value||"All Results";

  const filtered=history.filter(item=>{
    const matchesSearch=item.claim.toLowerCase().includes(search);
    const matchesFilter=filter==="All Results" || item.verdict===filter;
    return matchesSearch && matchesFilter;
  });

  rows.innerHTML="";
  empty.style.display=filtered.length?"none":"block";

  filtered.forEach((item,index)=>{
    const div=document.createElement("div");
    div.className="history-table history-row";
    const badgeClass=item.verdict==="FALSE"?"false":item.verdict==="TRUE"?"true":item.verdict==="MISLEADING"?"misleading":"unverified";
    div.innerHTML=`
      <span>${escapeHtml(item.claim)}</span>
      <span><b class="badge ${badgeClass}">${item.verdict}</b></span>
      <span>${item.score}%</span>
      <span>${item.confidence}</span>
      <span>${item.date}</span>
      <span><button class="view-btn" onclick="viewHistory(${history.indexOf(item)})">View</button></span>`;
    rows.appendChild(div);
  });

  document.getElementById("totalChecks").textContent=history.length;
  document.getElementById("verifiedChecks").textContent=history.filter(x=>x.verdict!=="UNVERIFIED").length;
  document.getElementById("averageAccuracy").textContent=history.length ? Math.round(history.reduce((a,b)=>a+b.score,0)/history.length)+"%" : "—";
  document.getElementById("lastChecked").textContent=history.length ? history[0].date : "—";
}

function viewHistory(index){
  const item=history[index];
  if(!item) return;
  currentClaim=item.claim;
  document.getElementById("resultClaim").textContent=item.claim;
  document.getElementById("verdictText").textContent=item.verdict;
  document.getElementById("scoreText").textContent=item.score+"%";
  document.getElementById("confidenceText").textContent=item.confidence;
  document.getElementById("sourcesText").textContent="—";
  document.getElementById("analysisText").textContent="This saved item is currently a frontend development record. Real evidence details will be stored here after the backend and verification APIs are connected.";
  showPage("result");
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

window.addEventListener("hashchange",()=>{
  const hash=location.hash.replace("#","");
  if(hash==="home"||hash==="verify"||hash==="history"||hash==="about"||hash==="how-it-works") showPage(hash==="how-it-works"?"how":hash);
});

renderHistory();
