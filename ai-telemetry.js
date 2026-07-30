const KEY='op-ai-trainer-ai-learning-v1';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"version":1,"matchups":{}}')}catch{return{version:1,matchups:{}}}};
const write=data=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}};
const matchupKey=state=>{
  const ai=state?.sides?.ai?.leader?.id||'unknown',player=state?.sides?.player?.leader?.id||'unknown';
  const order=state?.firstPlayer==='ai'?'first':'second';
  return ai+'-vs-'+player+'-'+order;
};
export function recordAiTurn(state,metrics={}){
  if(!state?.sides)return;
  const data=read(),key=matchupKey(state),row=data.matchups[key]||{turns:0,matches:0,wins:0,losses:0,lethalMisses:0,donWasted:0,stalls:0};
  row.turns++;
  row.lethalMisses+=metrics.lethalMiss?1:0;
  row.donWasted+=Math.max(0,Number(metrics.donWasted||0));
  row.stalls+=metrics.stall?1:0;
  row.updatedAt=Date.now();
  data.matchups[key]=row;write(data);
}
export function recordAiMatch(state){
  if(!state?.winner||state._aiTelemetryRecorded)return;
  state._aiTelemetryRecorded=true;
  const data=read(),key=matchupKey(state),row=data.matchups[key]||{turns:0,matches:0,wins:0,losses:0,lethalMisses:0,donWasted:0,stalls:0};
  row.matches++;if(state.winner==='ai')row.wins++;else row.losses++;row.updatedAt=Date.now();
  data.matchups[key]=row;
  data.cardStats??={};data.cardStats[key]??={};
  const played=[...new Set(state._aiPlayedCards?.ai||[])],won=state.winner==='ai';
  for(const id of played){
    const card=data.cardStats[key][id]||{games:0,wins:0};
    card.games++;if(won)card.wins++;data.cardStats[key][id]=card;
  }
  write(data);
}
export function getAiPolicyBias(state){
  const row=read().matchups[matchupKey(state)];
  if(!row||row.turns<5)return{aggression:0,efficiency:0,safety:0};
  const lethalRate=row.lethalMisses/Math.max(1,row.turns),wasteRate=row.donWasted/Math.max(1,row.turns),lossRate=row.losses/Math.max(1,row.matches);
  return{
    aggression:clamp(lethalRate*90+(lossRate-.5)*18,-8,35),
    efficiency:clamp(wasteRate*3,0,24),
    safety:clamp((lossRate-.45)*28,0,18)
  };
}
export function getAiTrainingStats(){return read()}
if(typeof window!=='undefined')window.__aiTrainingStats=getAiTrainingStats;

const perspectiveKey=(state,side)=>{
  const other=side==='ai'?'player':'ai',ownId=state?.sides?.[side]?.leader?.id||'unknown',foeId=state?.sides?.[other]?.leader?.id||'unknown';
  const order=state?.firstPlayer===side?'first':'second';
  return ownId+'-vs-'+foeId+'-'+order;
};
export function recordSelfPlayMatch(state){
  if(!state?.winner||state._selfPlayTelemetryRecorded)return;
  state._selfPlayTelemetryRecorded=true;
  const data=read();data.cardStats??={};
  for(const side of['player','ai']){
    const key=perspectiveKey(state,side),won=state.winner===side,played=[...new Set(state._aiPlayedCards?.[side]||[])];
    const row=data.matchups[key]||{turns:0,matches:0,wins:0,losses:0,lethalMisses:0,donWasted:0,stalls:0};
    row.matches++;if(won)row.wins++;else row.losses++;row.updatedAt=Date.now();data.matchups[key]=row;
    data.cardStats[key]??={};
    for(const id of played){
      const card=data.cardStats[key][id]||{games:0,wins:0};
      card.games++;if(won)card.wins++;data.cardStats[key][id]=card;
    }
  }
  write(data);
}
export function getCardLearningBonus(state,card){
  const stats=read().cardStats?.[matchupKey(state)]?.[card?.id];
  if(!stats||stats.games<12)return 0;
  const rate=(stats.wins+3)/(stats.games+6);
  const confidence=Math.min(1,(stats.games-8)/42);
  return clamp((rate-.5)*36*confidence,-12,12);
}
