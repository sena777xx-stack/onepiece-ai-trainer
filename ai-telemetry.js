const KEY='op-ai-trainer-ai-learning-v1';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const emptyRow=()=>({turns:0,matches:0,wins:0,losses:0,draws:0,lethalMisses:0,donWasted:0,stalls:0,handStarved:0,safetyStops:0,totalMatchTurns:0});
const read=()=>{try{const data=JSON.parse(localStorage.getItem(KEY)||'{"version":2,"matchups":{}}');data.version=2;data.matchups??={};data.cardStats??={};data.recentMatches??=[];return data}catch{return{version:2,matchups:{},cardStats:{},recentMatches:[]}}};
const write=data=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}};
const rowFor=(data,key)=>Object.assign(emptyRow(),data.matchups[key]||{});
const matchupKey=state=>{
  const ai=state?.sides?.ai?.leader?.id||'unknown',player=state?.sides?.player?.leader?.id||'unknown';
  const order=state?.firstPlayer==='ai'?'first':'second';
  return ai+'-vs-'+player+'-'+order;
};
const perspectiveKey=(state,side)=>{
  const other=side==='ai'?'player':'ai',ownId=state?.sides?.[side]?.leader?.id||'unknown',foeId=state?.sides?.[other]?.leader?.id||'unknown';
  const order=state?.firstPlayer===side?'first':'second';
  return ownId+'-vs-'+foeId+'-'+order;
};
const addTurnMetrics=(row,metrics={})=>{
  row.turns++;
  row.lethalMisses+=metrics.lethalMiss?1:0;
  row.donWasted+=Math.max(0,Number(metrics.donWasted||0));
  row.stalls+=metrics.stall?1:0;
  row.handStarved+=metrics.handStarved?1:0;
};
const addMatch=(data,key,{won=false,draw=false,turns=0,stalled=false,safetyStop=false}={})=>{
  const row=rowFor(data,key);row.matches++;
  if(draw)row.draws++;else if(won)row.wins++;else row.losses++;
  row.totalMatchTurns+=Math.max(0,Number(turns||0));
  row.stalls+=stalled?1:0;row.safetyStops+=safetyStop?1:0;row.updatedAt=Date.now();
  data.matchups[key]=row;return row;
};
const recordCards=(data,key,played,won)=>{
  data.cardStats[key]??={};
  for(const id of [...new Set(played||[])]){
    const card=data.cardStats[key][id]||{games:0,wins:0};
    card.games++;if(won)card.wins++;data.cardStats[key][id]=card;
  }
};
const rememberMatch=(data,entry)=>{
  data.recentMatches.push({...entry,at:Date.now()});
  if(data.recentMatches.length>200)data.recentMatches.splice(0,data.recentMatches.length-200);
};
export function recordAiTurn(state,metrics={}){
  if(!state?.sides)return;
  const data=read(),key=matchupKey(state),row=rowFor(data,key);
  addTurnMetrics(row,metrics);row.updatedAt=Date.now();data.matchups[key]=row;write(data);
}
export function recordAiMatch(state,meta={}){
  if(!state?.winner||state._aiTelemetryRecorded)return;
  state._aiTelemetryRecorded=true;
  const data=read(),key=matchupKey(state),won=state.winner==='ai';
  addMatch(data,key,{won,turns:state.turn,stalled:meta.stalled,safetyStop:meta.safetyStop});
  recordCards(data,key,state._aiPlayedCards?.ai,won);
  rememberMatch(data,{mode:'player-vs-ai',key,winner:state.winner,firstPlayer:state.firstPlayer,turns:Number(state.turn||0),stalled:Boolean(meta.stalled),safetyStop:Boolean(meta.safetyStop)});
  write(data);
}
export function recordSelfPlayMatch(state,meta={}){
  if(state?._selfPlayTelemetryRecorded)return;
  if(!state?.sides)return;
  state._selfPlayTelemetryRecorded=true;
  const data=read(),draw=!state.winner;
  for(const side of['player','ai']){
    const key=perspectiveKey(state,side),won=state.winner===side;
    addMatch(data,key,{won,draw,turns:state.turn,stalled:meta.stalled||draw,safetyStop:meta.safetyStop});
    recordCards(data,key,state._aiPlayedCards?.[side],won);
  }
  rememberMatch(data,{mode:'ai-vs-ai',left:state.sides.player.leader?.id,right:state.sides.ai.leader?.id,winner:state.winner||'draw',firstPlayer:state.firstPlayer,turns:Number(state.turn||0),actions:Number(meta.actions||0),stalled:Boolean(meta.stalled||draw),safetyStop:Boolean(meta.safetyStop)});
  write(data);
}
export function getAiPolicyBias(state){
  const row=read().matchups[matchupKey(state)];
  if(!row||row.turns<5)return{aggression:0,efficiency:0,safety:0};
  const lethalRate=row.lethalMisses/Math.max(1,row.turns),wasteRate=row.donWasted/Math.max(1,row.turns),lossRate=row.losses/Math.max(1,row.matches),stallRate=(row.stalls+row.safetyStops)/Math.max(1,row.turns+row.matches),starveRate=row.handStarved/Math.max(1,row.turns);
  return{
    aggression:clamp(lethalRate*90+(lossRate-.5)*18+stallRate*10,-8,35),
    efficiency:clamp(wasteRate*3+stallRate*12,0,24),
    safety:clamp((lossRate-.45)*28+starveRate*18,0,22)
  };
}
export function getCardLearningBonus(state,card){
  const stats=read().cardStats?.[matchupKey(state)]?.[card?.id];
  if(!stats||stats.games<12)return 0;
  const rate=(stats.wins+3)/(stats.games+6),confidence=Math.min(1,(stats.games-8)/42);
  return clamp((rate-.5)*36*confidence,-12,12);
}
export function getAiTrainingStats(){return read()}
if(typeof window!=='undefined')window.__aiTrainingStats=getAiTrainingStats;
