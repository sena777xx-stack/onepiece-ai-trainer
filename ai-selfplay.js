import{GameEngine}from'./game-engine-v3.js?v=3441';
import{runAiTurn}from'./ai-engine.js?v=3467';import{recordSelfPlayMatch}from'./ai-telemetry.js?v=3512';

const flip=side=>side==='player'?'ai':side==='ai'?'player':side;
const swapPerspective=state=>{
  [state.sides.player,state.sides.ai]=[state.sides.ai,state.sides.player];
  state.sides.player.side='player';state.sides.ai.side='ai';
  state.activeSide=flip(state.activeSide);state.firstPlayer=flip(state.firstPlayer);
  [state.turnsTaken.player,state.turnsTaken.ai]=[state.turnsTaken.ai,state.turnsTaken.player];
  if(state._aiPlayedCards)[state._aiPlayedCards.player,state._aiPlayedCards.ai]=[state._aiPlayedCards.ai,state._aiPlayedCards.player];
  if(state.pending){
    for(const key of['side','attackingSide','defendingSide','resumeSide','targetSide'])if(state.pending[key])state.pending[key]=flip(state.pending[key]);
  }
  if(state.winner)state.winner=flip(state.winner);
};
const keepOpening=hand=>{
  const early=hand.some(card=>card.type!=='event'&&Number(card.cost||0)<=2);
  const middle=hand.some(card=>card.type==='character'&&Number(card.cost||0)>=3&&Number(card.cost||0)<=5);
  const bricks=hand.filter(card=>Number(card.cost||0)>=7).length;
  const counter=hand.reduce((sum,card)=>sum+Number(card.counter||0),0);
  return early&&middle&&bricks<=2&&counter>=2000;
};
const drainPending=async engine=>{
  for(let guard=0;guard<16&&engine.state.pending&&!engine.state.winner;guard++){
    const p=engine.state.pending,side=p.side||p.defendingSide;
    if(p.kind==='battle'){await engine.autoResolveDefense();continue}
    if(['lifeReveal','trigger'].includes(p.kind)){await engine.resolveTrigger(Boolean(p.hasTrigger||p.kind==='trigger'));continue}
    if(p.kind==='handNotice'){engine.resolveHandNotice();continue}
    if(['effectChoice','handDiscardChoice','teach119OnPlayChoice','teach119TriggerChoice','teachSearch3Choice'].includes(p.kind)){
      const own=engine.state.sides[side],ids=(p.options||p.cards||[]).map(item=>typeof item==='string'?item:item.uid);
      if(p.kind==='handDiscardChoice')ids.splice(0,ids.length,...own.hand.slice().sort((a,b)=>Number(a.counter||0)-Number(b.counter||0)).slice(0,p.count||1).map(card=>card.uid));
      engine.resolveTeachKoChoice(side,ids.slice(0,p.max||1));continue;
    }
    if(p.kind==='luffyNamiSearch'&&engine.resolveLuffyNamiSearch){
      const own=engine.state.sides[side],chosen=(p.cards||[]).filter(card=>(p.options||[]).includes(card.uid)).sort((a,b)=>Number(b.counter||0)-Number(a.counter||0)||Number(b.cost||0)-Number(a.cost||0))[0];
      engine.resolveLuffyNamiSearch(side,chosen?.uid||null);continue;
    }
    if(p.kind==='devonTriggerChoice'&&engine.resolveDevonChoice){await engine.resolveDevonChoice(side,(p.options||[])[0]||null);continue}
    if(p.kind==='sanjuanPowerChoice'&&engine.resolveSanjuanChoice){engine.resolveSanjuanChoice(side,(p.options||[])[0]||null);continue}
    if(p.kind==='borsalinoLifeChoice'&&engine.resolveBorsalinoChoice){engine.resolveBorsalinoChoice(side,true);continue}
    if(p.kind==='shiryuDiscardChoice'&&engine.resolveShiryuChoice){engine.resolveShiryuChoice(side,null);continue}
    engine.state.pending=null;engine.state.phase='main';
  }
};
const runSide=async(engine,side)=>{
  if(side==='ai'){await runAiTurn(engine,0,()=>{});await drainPending(engine);return}
  swapPerspective(engine.state);
  await runAiTurn(engine,0,()=>{});
  await drainPending(engine);
  swapPerspective(engine.state);
};
export async function runSelfPlay(cards,deckLeft,deckRight,games=100,onProgress=()=>{},firstMode='alternate'){
  const count=Math.max(1,Math.min(10000,Number(games)||100));
  const mode=['left','right','alternate'].includes(firstMode)?firstMode:'alternate',result={games:count,firstMode:mode,leftWins:0,rightWins:0,draws:0,stalls:0,totalTurns:0,startedAt:Date.now()};
  for(let game=0;game<count;game++){
    const engine=new GameEngine(cards,{player:deckLeft,ai:deckRight}),first=mode==='left'?'player':mode==='right'?'ai':game%2===0?'player':'ai';
    engine.start(first);
    engine.mulligan('player',keepOpening(engine.state.sides.player.hand));
    let actions=0;
    while(!engine.state.winner&&engine.state.turn<=40&&actions<240){
      if(engine.state.phase==='mulligan')break;
      await runSide(engine,engine.state.activeSide);
      actions++;
    }
    if(engine.state.winner==='player')result.leftWins++;
    else if(engine.state.winner==='ai')result.rightWins++;
    else{result.draws++;result.stalls++}
    if(engine.state.winner)recordSelfPlayMatch(engine.state);
    result.totalTurns+=Number(engine.state.turn||0);
    if(game%10===0||game===count-1){onProgress({...result,completed:game+1});await new Promise(resolve=>setTimeout(resolve,0))}
  }
  result.averageTurns=Number((result.totalTurns/count).toFixed(2));
  result.leftWinRate=Number((result.leftWins/count*100).toFixed(1));
  result.rightWinRate=Number((result.rightWins/count*100).toFixed(1));
  result.finishedAt=Date.now();
  try{localStorage.setItem('op-ai-selfplay-last',JSON.stringify(result))}catch{}
  return result;
}
