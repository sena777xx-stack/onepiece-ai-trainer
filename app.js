const CARD_LIBRARY = [
  {id:"P-001",name:"緑シャンクス",type:"leader",cost:0,power:5000,counter:0},
  {id:"OP17-001",name:"ベックマン",type:"character",cost:5,power:7000,counter:1000},
  {id:"OP17-002",name:"ヤソップ",type:"character",cost:4,power:6000,counter:1000},
  {id:"OP17-003",name:"ラッキー・ルウ",type:"character",cost:3,power:5000,counter:2000},
  {id:"OP17-004",name:"赤髪海賊団",type:"event",cost:2,power:0,counter:0},
  {id:"AI-ENEL-L",name:"紫エネル",type:"leader",cost:0,power:5000,counter:0},
  {id:"AI-ENEL-01",name:"雷迎",type:"character",cost:5,power:7000,counter:1000},
  {id:"AI-ENEL-02",name:"空島の戦士",type:"character",cost:3,power:5000,counter:2000},
  {id:"AI-ENEL-03",name:"神の裁き",type:"event",cost:2,power:0,counter:0},
  {id:"AI-NAMI-L",name:"青黄ナミ",type:"leader",cost:0,power:5000,counter:0},
  {id:"AI-LUCY-L",name:"赤青ルーシー",type:"leader",cost:0,power:5000,counter:0},
  {id:"AI-LUFFY-L",name:"緑青ルフィ",type:"leader",cost:0,power:5000,counter:0},
  {id:"AI-TEACH-L",name:"黒黄ティーチ",type:"leader",cost:0,power:5000,counter:0}
];

const AI_DECKS = {
  "purple-enel": {name:"紫エネル", leader:"AI-ENEL-L"},
  "blue-yellow-nami": {name:"青黄ナミ", leader:"AI-NAMI-L"},
  "red-blue-lucy": {name:"赤青ルーシー", leader:"AI-LUCY-L"},
  "green-blue-luffy": {name:"緑青ルフィ", leader:"AI-LUFFY-L"},
  "black-yellow-teach": {name:"黒黄ティーチ", leader:"AI-TEACH-L"}
};

const state = {
  started:false, turn:1, active:"player", playerFirst:true, speed:1,
  player:{life:5,donTotal:0,donActive:0,hand:[],field:[],leader:"P-001",deck:[]},
  ai:{life:5,donTotal:0,donActive:0,hand:[],field:[],leader:"AI-ENEL-L",deck:[]},
  log:[], history:[], difficulty:"normal", aiDeckKey:"purple-enel"
};

const $ = (id)=>document.getElementById(id);
const clone = (obj)=>JSON.parse(JSON.stringify(obj));

function buildDeck(prefix="player"){
  const pool = prefix==="player"
    ? ["OP17-001","OP17-002","OP17-003","OP17-004"]
    : ["AI-ENEL-01","AI-ENEL-02","AI-ENEL-03"];
  return Array.from({length:50},(_,i)=>pool[i%pool.length]).sort(()=>Math.random()-.5);
}

function cardData(id){ return CARD_LIBRARY.find(c=>c.id===id) || {id,name:id,type:"character",cost:0,power:0,counter:0}; }
function imageKey(id){ return `opai-image-${id}`; }
function getImage(id){ return localStorage.getItem(imageKey(id)); }

function cardElement(id, opts={}){
  const c=cardData(id);
  const el=document.createElement("button");
  el.className=`game-card ${c.type==="leader"?"leader":""} ${opts.rested?"rested":""}`;
  const image=getImage(id);
  if(image){
    el.innerHTML=`<img src="${image}" alt="${c.name}">${opts.badge?`<span class="card-badge">${opts.badge}</span>`:""}`;
  }else{
    el.innerHTML=`<div class="placeholder-card"><span class="code">${c.id}</span><span class="name">${c.name}</span><span class="stats">${c.cost?`COST ${c.cost}`:"LEADER"} ${c.power?`/ ${c.power}`:""}</span></div>${opts.badge?`<span class="card-badge">${opts.badge}</span>`:""}`;
  }
  el.addEventListener("click",()=>openCardDialog(id,opts.owner,opts.zone,opts.index));
  return el;
}

function saveHistory(){
  state.history.push(clone({
    turn:state.turn,active:state.active,player:state.player,ai:state.ai,log:state.log
  }));
  if(state.history.length>30) state.history.shift();
}

function addLog(text){
  state.log.unshift(`T${state.turn}：${text}`);
  renderLog();
}

function startGame(){
  state.started=true;
  state.turn=1;
  state.difficulty=$("difficultySelect").value;
  state.aiDeckKey=$("aiDeckSelect").value;
  if(state.aiDeckKey==="random"){
    const keys=Object.keys(AI_DECKS);
    state.aiDeckKey=keys[Math.floor(Math.random()*keys.length)];
  }
  const order=$("turnOrderSelect").value;
  state.playerFirst=order==="random"?Math.random()>.5:order==="first";
  state.active=state.playerFirst?"player":"ai";
  state.player={life:5,donTotal:0,donActive:0,hand:[],field:[],leader:"P-001",deck:buildDeck("player")};
  const aiDef=AI_DECKS[state.aiDeckKey];
  state.ai={life:5,donTotal:0,donActive:0,hand:[],field:[],leader:aiDef.leader,deck:buildDeck("ai")};
  state.player.hand=state.player.deck.splice(0,5);
  state.ai.hand=state.ai.deck.splice(0,5);
  state.log=[];state.history=[];
  $("setupScreen").classList.remove("active");
  $("gameScreen").classList.add("active");
  $("actionBar").classList.remove("hidden");
  addLog(`${aiDef.name}との対戦を開始`);
  beginTurn();
}

function beginTurn(){
  const side=state.active==="player"?state.player:state.ai;
  side.field.forEach(c=>c.rested=false);
  side.donActive=side.donTotal;
  const add=state.turn===1?1:2;
  side.donTotal=Math.min(10,side.donTotal+add);
  side.donActive=side.donTotal;
  if(!(state.turn===1 && state.active==="player" && state.playerFirst)) drawCard(state.active,false);
  addLog(`${state.active==="player"?"あなた":"AI"}のターン開始`);
  render();
  if(state.active==="ai") setTimeout(runAiTurn, 500/state.speed);
}

function drawCard(sideName, announce=true){
  const side=state[sideName];
  if(side.deck.length){
    side.hand.push(side.deck.shift());
    if(announce) addLog(`${sideName==="player"?"あなた":"AI"}が1枚ドロー`);
  }
  render();
}

function playCard(owner,index){
  saveHistory();
  const side=state[owner];
  const id=side.hand[index], c=cardData(id);
  if(c.type==="event"){
    if(side.donActive<c.cost) return alert("DON!!が足りません");
    side.donActive-=c.cost;
    side.hand.splice(index,1);
    addLog(`${owner==="player"?"あなた":"AI"}が「${c.name}」を使用`);
  }else{
    if(side.donActive<c.cost) return alert("DON!!が足りません");
    side.donActive-=c.cost;
    side.hand.splice(index,1);
    side.field.push({id,rested:false,attachedDon:0});
    addLog(`${owner==="player"?"あなた":"AI"}が「${c.name}」を登場`);
  }
  closeDialogs();render();
}

function toggleRest(owner,index){
  saveHistory();
  state[owner].field[index].rested=!state[owner].field[index].rested;
  addLog(`「${cardData(state[owner].field[index].id).name}」を${state[owner].field[index].rested?"レスト":"アクティブ"}`);
  closeDialogs();render();
}

function attackWith(owner,zone,index){
  saveHistory();
  let unit;
  if(zone==="leader") unit={id:state[owner].leader,rested:false,attachedDon:0};
  else unit=state[owner].field[index];
  if(unit.rested) return alert("このカードはレスト状態です");
  unit.rested=true;
  const target=owner==="player"?"ai":"player";
  const base=cardData(unit.id).power+(unit.attachedDon||0)*1000;
  state[target].life=Math.max(0,state[target].life-1);
  addLog(`${owner==="player"?"あなた":"AI"}が${base}でリーダーへ攻撃`);
  if(state[target].life===0) addLog(`${owner==="player"?"あなた":"AI"}の勝利！`);
  closeDialogs();render();
}

function attachDon(index){
  if(state.player.donActive<=0) return alert("アクティブDON!!がありません");
  saveHistory();
  state.player.donActive--;
  state.player.field[index].attachedDon=(state.player.field[index].attachedDon||0)+1;
  addLog(`「${cardData(state.player.field[index].id).name}」にDON!!を1枚付与`);
  closeDialogs();render();
}

function endTurn(){
  if(state.active!=="player") return;
  saveHistory();
  state.active="ai";
  beginTurn();
}

async function runAiTurn(){
  const delay=(ms)=>new Promise(r=>setTimeout(r,ms/state.speed));
  await delay(500);
  // 1. Play the highest-cost playable card, preserving 1 DON on HARD.
  const reserve=state.difficulty==="hard"?1:0;
  while(true){
    let candidates=state.ai.hand.map((id,i)=>({id,i,c:cardData(id)}))
      .filter(x=>x.c.cost<=state.ai.donActive-reserve)
      .sort((a,b)=>b.c.cost-a.c.cost);
    if(!candidates.length) break;
    const pick=state.difficulty==="easy"
      ? candidates[Math.floor(Math.random()*candidates.length)]
      : candidates[0];
    playCard("ai",pick.i);
    await delay(650);
    if(state.difficulty==="easy") break;
  }

  // 2. Attack leader first.
  const attackers=[{zone:"leader",index:0,id:state.ai.leader},...state.ai.field.map((x,i)=>({zone:"field",index:i,id:x.id}))];
  for(const a of attackers){
    const unit=a.zone==="leader"?null:state.ai.field[a.index];
    if(unit?.rested) continue;
    attackWith("ai",a.zone,a.index);
    await delay(650);
    if(state.player.life===0) return;
  }

  addLog("AIがターン終了");
  state.active="player";
  state.turn++;
  beginTurn();
}

function openCardDialog(id,owner,zone,index){
  const c=cardData(id);
  const preview=$("dialogCardPreview");
  preview.innerHTML="";
  const wrap=document.createElement("div");wrap.className="dialog-card";
  wrap.appendChild(cardElement(id,{owner,zone,index}));
  preview.appendChild(wrap);
  const actions=$("dialogActions");actions.innerHTML="";
  const addAction=(label,fn)=>{const b=document.createElement("button");b.textContent=label;b.onclick=fn;actions.appendChild(b);};

  if(owner==="player" && state.active==="player"){
    if(zone==="hand") addAction("登場／使用",()=>playCard("player",index));
    if(zone==="field"){
      addAction("レスト切替",()=>toggleRest("player",index));
      addAction("DON!!を付ける",()=>attachDon(index));
      addAction("攻撃",()=>attackWith("player","field",index));
    }
    if(zone==="leader") addAction("リーダーで攻撃",()=>attackWith("player","leader",0));
  }
  if(!actions.children.length) addAction("閉じる",closeDialogs);
  $("cardDialog").showModal();
}

function closeDialogs(){
  document.querySelectorAll("dialog[open]").forEach(d=>d.close());
}

function render(){
  $("turnBadge").textContent=`TURN ${state.turn}`;
  $("phaseBadge").textContent=state.active==="player"?"自分のターン":"AIのターン";
  $("aiDeckName").textContent=AI_DECKS[state.aiDeckKey]?.name||"AI";
  $("aiHandCount").textContent=state.ai.hand.length;
  $("aiLifeCount").textContent=state.ai.life;
  $("aiDonCount").textContent=`${state.ai.donActive}/${state.ai.donTotal}`;
  $("playerLifeCount").textContent=state.player.life;
  $("playerDonCount").textContent=`${state.player.donActive}/${state.player.donTotal}`;
  $("playerHandCount").textContent=`${state.player.hand.length}枚`;

  renderZone("aiLeaderZone",[state.ai.leader],"ai","leader");
  renderZone("playerLeaderZone",[state.player.leader],"player","leader");
  renderZone("aiField",state.ai.field,"ai","field");
  renderZone("playerField",state.player.field,"player","field");
  renderZone("playerHand",state.player.hand,"player","hand");
}

function renderZone(elId,items,owner,zone){
  const el=$(elId);el.innerHTML="";
  if(!items.length && zone==="field"){
    for(let i=0;i<3;i++){const e=document.createElement("div");e.className="empty-slot";e.textContent="EMPTY";el.appendChild(e);}
    return;
  }
  items.forEach((item,index)=>{
    const id=typeof item==="string"?item:item.id;
    const rested=typeof item==="object"&&item.rested;
    const badge=typeof item==="object"&&item.attachedDon?`DON!! +${item.attachedDon}`:"";
    el.appendChild(cardElement(id,{owner,zone,index,rested,badge}));
  });
}

function renderLog(){
  $("logList").innerHTML=state.log.map(x=>`<div class="log-item">${x}</div>`).join("");
}

function undo(){
  const prev=state.history.pop();
  if(!prev) return;
  state.turn=prev.turn;state.active=prev.active;state.player=prev.player;state.ai=prev.ai;state.log=prev.log;
  render();renderLog();
}

function populateImageSelector(){
  $("imageCardSelect").innerHTML=CARD_LIBRARY.map(c=>`<option value="${c.id}">${c.id}｜${c.name}</option>`).join("");
}

$("startBtn").onclick=startGame;
$("resetBtn").onclick=()=>location.reload();
$("drawBtn").onclick=()=>state.active==="player"&&drawCard("player");
$("donBtn").onclick=()=>{if(state.active!=="player")return;saveHistory();state.player.donTotal=Math.min(10,state.player.donTotal+1);state.player.donActive++;addLog("DON!!を1枚追加");render();};
$("attackBtn").onclick=()=>alert("攻撃したいリーダーまたはキャラをタップしてください");
$("endTurnBtn").onclick=endTurn;
$("undoBtn").onclick=undo;
$("logBtn").onclick=()=>$("logDialog").showModal();
$("imageManagerBtn").onclick=()=>$("imageDialog").showModal();
$("speedBtn").onclick=()=>{state.speed=state.speed===1?2:state.speed===2?4:1;$("speedBtn").textContent=`AI速度 ×${state.speed}`;};
document.querySelectorAll("[data-close-dialog]").forEach(b=>b.onclick=closeDialogs);

$("imageUploadInput").addEventListener("change",(e)=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{localStorage.setItem(imageKey($("imageCardSelect").value),reader.result);alert("画像を登録しました");render();};
  reader.readAsDataURL(file);
});
$("clearImagesBtn").onclick=()=>{
  CARD_LIBRARY.forEach(c=>localStorage.removeItem(imageKey(c.id)));
  alert("登録画像を削除しました");render();
};

populateImageSelector();


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}
function showInstallHint() {
  document.getElementById("installHint")?.classList.remove("hidden");
}
document.getElementById("showInstallBtn")?.addEventListener("click", showInstallHint);
document.getElementById("closeInstallHint")?.addEventListener("click", () => {
  document.getElementById("installHint")?.classList.add("hidden");
});
if (isIos() && !isStandalone() && !localStorage.getItem("install-hint-seen")) {
  setTimeout(showInstallHint, 1400);
  localStorage.setItem("install-hint-seen", "1");
}
