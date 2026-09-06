const KEY="studentMoneyTracker.v1";
const defaultState={settings:{startingBalance:0,taxRate:15,workLimit:48},earnings:[],expenses:[]};
let state=loadState(), charts={};

const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(n)||0);
const dateISO=d=>{const x=new Date(d); return new Date(x.getTime()-x.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const today=dateISO(new Date());
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function loadState(){try{return {...defaultState,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();}

function mondayOf(d){const x=new Date(d+"T12:00:00"); const day=x.getDay(); const diff=day===0?-6:1-day; x.setDate(x.getDate()+diff); return dateISO(x)}
function currentFortnight(){const m=mondayOf(today); const x=new Date(m+"T12:00:00"); x.setDate(x.getDate()+13); return {start:m,end:dateISO(x)}}
function inRange(date,start,end){return date>=start&&date<=end}
function currentHours(){const f=currentFortnight(); return state.earnings.filter(e=>inRange(e.date,f.start,f.end)).reduce((s,e)=>s+Number(e.hours||0),0)}
function totals(){const gross=state.earnings.reduce((s,e)=>s+Number(e.amount||0),0);const exp=state.expenses.reduce((s,e)=>s+Number(e.amount||0),0);const tax=gross*(Number(state.settings.taxRate)||0)/100;const balance=Number(state.settings.startingBalance||0)+gross-exp-tax;return {gross,exp,tax,balance,net:gross-tax-exp}}
function monthKey(d){return String(d).slice(0,7)}
function last30(){const arr=[];const end=new Date(today+"T12:00:00");for(let i=29;i>=0;i--){const d=new Date(end);d.setDate(d.getDate()-i);arr.push(dateISO(d))}return arr}
function sumByDate(items,dates){return dates.map(d=>items.filter(x=>x.date===d).reduce((s,x)=>s+Number(x.amount||0),0))}
function destroyCharts(){Object.values(charts).forEach(c=>c?.destroy());charts={}}
function makeChart(id,type,data,options={}){const el=$(id);if(!el)return;charts[id]=new Chart(el,{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"#a9b4c7",boxWidth:10,font:{size:10}}}},scales:{x:{grid:{color:"rgba(255,255,255,.04)"},ticks:{color:"#7f8ba0",font:{size:9},maxTicksLimit:8}},y:{grid:{color:"rgba(255,255,255,.04)"},ticks:{color:"#7f8ba0",font:{size:9}}}},...options}})}

function render(){
 const t=totals(), hrs=currentHours(), f=currentFortnight(), limit=Number(state.settings.workLimit)||48, pct=Math.min(100,hrs/limit*100);
 $("heroBalance").textContent=money(t.balance); $("totalEarnings").textContent=money(t.gross); $("totalExpenses").textContent=money(t.exp); $("taxReserve").textContent=money(t.tax); $("netMoney").textContent=money(t.net);
 $("earningCount").textContent=`${state.earnings.length} ${state.earnings.length===1?"entry":"entries"}`;$("expenseCount").textContent=`${state.expenses.length} ${state.expenses.length===1?"entry":"entries"}`;
 $("fortnightHours").textContent=`${hrs.toFixed(1)} / ${limit}h`;
 $("hoursStatus").textContent=hrs>=limit?"Limit reached":hrs>=limit*.8?"Approaching limit":"Plenty of room";
 const days=Math.max(1,new Set([...state.earnings.map(e=>e.date),...state.expenses.map(e=>e.date)]).size);$("avgDaily").textContent=`${money(t.net/days)}/day average`;
 $("monthNet").textContent=money(monthNet());$("limitUsed").textContent=`${hrs.toFixed(1)}h`; $("limitRemaining").textContent=`${Math.max(0,limit-hrs).toFixed(1)}h remaining`;
 $("limitMessage").textContent=hrs>=limit?"Do not add more work hours in this fortnight. Check your visa conditions before working again.":hrs>=limit*.8?"You're at 80%+ of the limit. Plan remaining shifts carefully.":"You are comfortably below your 48-hour fortnight limit.";
 const fill=$("limitFill");fill.style.width=`${pct}%`;fill.className=pct>=100?"danger":pct>=80?"warn":"";
 const badge=$("safetyBadge");badge.textContent=pct>=100?"LIMIT":pct>=80?"CAUTION":"SAFE";badge.className=`badge ${pct>=100?"danger":pct>=80?"warn":"good"}`;
 renderTables();renderRecent();renderHours();renderReports();renderCharts();renderSettings();
}
function monthNet(){
 const k=monthKey(today),gross=state.earnings.filter(e=>monthKey(e.date)===k).reduce((s,e)=>s+Number(e.amount),0),exp=state.expenses.filter(e=>monthKey(e.date)===k).reduce((s,e)=>s+Number(e.amount),0);return gross-exp-gross*(Number(state.settings.taxRate)||0)/100;
}
function renderTables(){
 $("earningsGrossSection").textContent=money(totals().gross);$("earningsTaxSection").textContent=money(totals().tax);$("earningsNetSection").textContent=money(totals().gross-totals().tax);
 $("expensesTotalSection").textContent=money(totals().exp);const mk=monthKey(today);const me=state.expenses.filter(e=>monthKey(e.date)===mk).reduce((s,e)=>s+Number(e.amount),0);$("expensesMonthSection").textContent=money(me);$("expensesAvgSection").textContent=money(totals().exp/Math.max(1,new Set(state.expenses.map(e=>e.date)).size));
 const es=[...state.earnings].sort((a,b)=>b.date.localeCompare(a.date));$("earningsTable").innerHTML=es.length?es.map(e=>`<tr><td>${esc(e.date)}</td><td><strong>${esc(e.job)}</strong></td><td>${Number(e.hours).toFixed(2)}h</td><td class="green">${money(e.amount)}</td><td>${money(e.amount*state.settings.taxRate/100)}</td><td class="green">${money(e.amount*(1-state.settings.taxRate/100))}</td><td><div class="row-actions"><button class="icon-btn" onclick="editEarning('${e.id}')">Edit</button><button class="icon-btn" onclick="deleteEarning('${e.id}')">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="7" class="muted">No earnings yet.</td></tr>`;
 const xs=[...state.expenses].sort((a,b)=>b.date.localeCompare(a.date));$("expensesTable").innerHTML=xs.length?xs.map(e=>`<tr><td>${esc(e.date)}</td><td>${esc(e.category)}</td><td>${esc(e.description)}</td><td class="red">${money(e.amount)}</td><td>${e.deductible?"Yes":"No"}</td><td><div class="row-actions"><button class="icon-btn" onclick="editExpense('${e.id}')">Edit</button><button class="icon-btn" onclick="deleteExpense('${e.id}')">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="6" class="muted">No expenses yet.</td></tr>`;
}
function renderRecent(){const all=[...state.earnings.map(e=>({...e,type:"in",title:e.job,amount:e.amount})),...state.expenses.map(e=>({...e,type:"out",title:e.description,amount:e.amount}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);$("recentActivity").innerHTML=all.length?all.map(x=>`<div class="activity"><div class="activity-icon ${x.type}">${x.type==="in"?"↗":"↘"}</div><div class="activity-main"><strong>${esc(x.title)}</strong><span>${esc(x.date)} · ${x.type==="in"?"Earning":"Expense"}</span></div><div class="activity-amount ${x.type}">${x.type==="in"?"+":"−"}${money(x.amount)}</div></div>`).join(""):`<p class="muted">Add your first earning or expense to start tracking.</p>`}
function renderHours(){
 const f=currentFortnight(),limit=Number(state.settings.workLimit)||48,hrs=currentHours(),pct=Math.min(100,hrs/limit*100);$("hoursBig").textContent=`${hrs.toFixed(1)}h`;$("hoursRange").textContent=`${f.start} → ${f.end}`;$("ringPercent").textContent=`${Math.round(pct)}%`;$("limitRing").style.background=`conic-gradient(${pct>=100?"#ff5d70":pct>=80?"#ffca5c":"#35d07f"} ${pct*3.6}deg,#253047 ${pct*3.6}deg)`;
 const jobs={};state.earnings.filter(e=>inRange(e.date,f.start,f.end)).forEach(e=>jobs[e.job]=(jobs[e.job]||0)+Number(e.hours||0));const arr=Object.entries(jobs).sort((a,b)=>b[1]-a[1]);$("jobHoursList").innerHTML=arr.length?arr.map(([j,h])=>`<div class="bar-row"><div class="bar-label"><span>${esc(j)}</span><span>${h.toFixed(1)}h</span></div><div class="bar-track"><div style="width:${Math.min(100,h/limit*100)}%"></div></div></div>`).join(""):`<p class="muted">No work logged in the current fortnight.</p>`;
}
function renderReports(){const t=totals();$("reportStarting").textContent=money(state.settings.startingBalance);$("reportGross").textContent=money(t.gross);$("reportTax").textContent=money(t.tax);$("reportExpenses").textContent=money(t.exp);$("reportBalance").textContent=money(t.balance);$("reportHours").textContent=state.earnings.reduce((s,e)=>s+Number(e.hours||0),0).toFixed(1)+"h"}
function renderSettings(){$("startingBalance").value=state.settings.startingBalance;$("taxRate").value=state.settings.taxRate;$("workLimit").value=state.settings.workLimit}
function renderCharts(){
 destroyCharts();const ds=last30(),labels=ds.map(d=>d.slice(5)),inc=sumByDate(state.earnings,ds),out=sumByDate(state.expenses,ds);
 makeChart("earningsChart","line",{labels,datasets:[{label:"Earnings",data:inc,borderColor:"#35d07f",backgroundColor:"rgba(53,208,127,.08)",fill:true,tension:.35,pointRadius:2}]});
 makeChart("expensesChart","bar",{labels,datasets:[{label:"Expenses",data:out,backgroundColor:"rgba(255,93,112,.7)",borderRadius:5}]});
 const cats={};state.expenses.forEach(e=>cats[e.category]=(cats[e.category]||0)+Number(e.amount));makeChart("categoryChart","doughnut",{labels:Object.keys(cats),datasets:[{data:Object.values(cats),backgroundColor:["#ff5d70","#ffca5c","#65a7ff","#a979ff","#35d07f","#f58fb0","#73d6d0","#f6a65b","#8895a7"],borderWidth:0}]},{plugins:{legend:{position:"bottom"}}});
 makeChart("expenseDailyChart","line",{labels,datasets:[{label:"Expenses",data:out,borderColor:"#ff5d70",backgroundColor:"rgba(255,93,112,.07)",fill:true,tension:.35,pointRadius:2}]});
 makeChart("cashflowChart","line",{labels,datasets:[{label:"Income",data:inc,borderColor:"#35d07f",tension:.35,pointRadius:2},{label:"Expenses",data:out,borderColor:"#ff5d70",tension:.35,pointRadius:2}]});
 const months=[];const now=new Date(today+"T12:00:00");for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`)}const nets=months.map(k=>{const g=state.earnings.filter(e=>monthKey(e.date)===k).reduce((s,e)=>s+Number(e.amount),0);const x=state.expenses.filter(e=>monthKey(e.date)===k).reduce((s,e)=>s+Number(e.amount),0);return g-x-g*state.settings.taxRate/100});makeChart("monthlyChart","bar",{labels:months.map(x=>x.slice(0,7)),datasets:[{label:"Net",data:nets,backgroundColor:"#65a7ff",borderRadius:5}]});
}

function openModal(id){$(id).classList.add("open")}
function closeModals(){document.querySelectorAll(".modal-backdrop").forEach(x=>x.classList.remove("open"))}
function resetEarningForm(){ $("earningForm").reset();$("earningId").value="";$("earningDate").value=today;$("earningModalTitle").textContent="Add earnings";updateTaxPreview()}
function resetExpenseForm(){ $("expenseForm").reset();$("expenseId").value="";$("expenseDate").value=today;$("expenseModalTitle").textContent="Add expense"}
function updateTaxPreview(){const a=Number($("earningAmount").value||0);$("modalTaxPreview").textContent=money(a*state.settings.taxRate/100)}
function addEarning(ev){ev.preventDefault();const id=$("earningId").value||crypto.randomUUID();const obj={id,date:$("earningDate").value,job:$("earningJob").value.trim(),hours:Number($("earningHours").value),amount:Number($("earningAmount").value),notes:$("earningNotes").value};if(!obj.date||!obj.job||obj.hours<0||obj.amount<0)return;const f=currentFortnight();let newHours=state.earnings.filter(e=>e.id!==id&&inRange(e.date,f.start,f.end)).reduce((s,e)=>s+Number(e.hours||0),0);if(inRange(obj.date,f.start,f.end)&&newHours+obj.hours>Number(state.settings.workLimit)){alert(`This would take the current fortnight to ${(newHours+obj.hours).toFixed(2)} hours, above your configured ${state.settings.workLimit}-hour limit. Edit the hours/date or change the setting only if your actual visa conditions allow it.`);return}const i=state.earnings.findIndex(e=>e.id===id);i>=0?state.earnings[i]=obj:state.earnings.push(obj);save();closeModals();toast("Earnings saved")}
function addExpense(ev){ev.preventDefault();const id=$("expenseId").value||crypto.randomUUID();const obj={id,date:$("expenseDate").value,category:$("expenseCategory").value,description:$("expenseDescription").value.trim(),amount:Number($("expenseAmount").value),deductible:$("expenseDeductible").checked,notes:$("expenseNotes").value};const i=state.expenses.findIndex(e=>e.id===id);i>=0?state.expenses[i]=obj:state.expenses.push(obj);save();closeModals();toast("Expense saved")}
function editEarning(id){const e=state.earnings.find(x=>x.id===id);if(!e)return;$("earningId").value=e.id;$("earningDate").value=e.date;$("earningJob").value=e.job;$("earningHours").value=e.hours;$("earningAmount").value=e.amount;$("earningNotes").value=e.notes||"";$("earningModalTitle").textContent="Edit earnings";updateTaxPreview();openModal("earningsModal")}
function editExpense(id){const e=state.expenses.find(x=>x.id===id);if(!e)return;$("expenseId").value=e.id;$("expenseDate").value=e.date;$("expenseCategory").value=e.category;$("expenseDescription").value=e.description;$("expenseAmount").value=e.amount;$("expenseDeductible").checked=!!e.deductible;$("expenseNotes").value=e.notes||"";$("expenseModalTitle").textContent="Edit expense";openModal("expenseModal")}
function deleteEarning(id){if(confirm("Delete this earning?")){state.earnings=state.earnings.filter(e=>e.id!==id);save();toast("Earning deleted")}}
function deleteExpense(id){if(confirm("Delete this expense?")){state.expenses=state.expenses.filter(e=>e.id!==id);save();toast("Expense deleted")}}
function toast(msg){const x=$("toast");x.textContent=msg;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`moneytrack-backup-${today}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported")}
function importData(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.settings||!Array.isArray(x.earnings)||!Array.isArray(x.expenses))throw Error();state={...defaultState,...x};save();toast("Backup imported")}catch{alert("That file does not look like a MoneyTrack backup.")}};r.readAsText(file)}
function clearData(){if(confirm("Delete ALL earnings, expenses and settings? Export a backup first if you may need them later.")){state=structuredClone(defaultState);save();toast("All data deleted")}}

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.section)));
document.querySelectorAll("[data-section-jump]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.sectionJump)));
function showSection(id){document.querySelectorAll(".page-section").forEach(s=>s.classList.toggle("active",s.id===id));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.section===id));const titles={dashboard:"Dashboard",earnings:"Earnings",expenses:"Expenses",hours:"Work-limit monitor",reports:"Reports",settings:"Settings"};$("pageTitle").textContent=titles[id]||"Dashboard";window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll("[data-open-modal]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.openModal==="earningsModal")resetEarningForm();else resetExpenseForm();openModal(b.dataset.openModal)}));
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",closeModals));document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModals()}));
$("earningForm").addEventListener("submit",addEarning);$("expenseForm").addEventListener("submit",addExpense);$("earningAmount").addEventListener("input",updateTaxPreview);
$("settingsForm").addEventListener("submit",e=>{e.preventDefault();state.settings.startingBalance=Number($("startingBalance").value)||0;state.settings.taxRate=Number($("taxRate").value)||0;state.settings.workLimit=Number($("workLimit").value)||48;save();toast("Settings saved")});
$("exportBtn").addEventListener("click",exportData);$("exportBtn2").addEventListener("click",exportData);$("importInput").addEventListener("change",e=>e.target.files[0]&&importData(e.target.files[0]));$("importInput2").addEventListener("change",e=>e.target.files[0]&&importData(e.target.files[0]));$("clearBtn").addEventListener("click",clearData);
window.editEarning=editEarning;window.editExpense=editExpense;window.deleteEarning=deleteEarning;window.deleteExpense=deleteExpense;
render();