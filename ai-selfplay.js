import{GameEngine}from'./game-engine-v3.js?v=3981';
import{runAiTurn}from'./ai-engine.js?v=3970';import{recordSelfPlayMatch}from'./ai-telemetry.js?v=3513';

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
    const first=()=>((p.options||p.cards||[])[0]?.uid||(p.options||[])[0]||null);
    if(['devonTriggerChoice','devonAttackChoice'].includes(p.kind)&&engine.resolveDevonChoice){await engine.resolveDevonChoice(side,first());continue}
    if(p.kind==='sanjuanPowerChoice'&&engine.resolveSanjuanChoice){engine.resolveSanjuanChoice(side,first());continue}
    if(p.kind==='borsalinoLifeChoice'&&engine.resolveBorsalinoChoice){engine.resolveBorsalinoChoice(side,true);continue}
    if(['shiryuDiscardChoice','shiryuLifeChoice'].includes(p.kind)&&engine.resolveShiryuChoice){engine.resolveShiryuChoice(side,p.kind==='shiryuLifeChoice'?first():null);continue}
    if(['darkWaterMainChoice','darkWaterNegateChoice'].includes(p.kind)&&engine.resolveDarkWaterChoice){engine.resolveDarkWaterChoice(side,first());continue}
    if(p.kind==='zehahaChoice'&&engine.resolveZehahaChoice){await engine.resolveZehahaChoice(side,first(),true);continue}
    if(p.kind==='fullFieldTrashChoice'&&engine.resolveFullFieldTrashChoice){await engine.resolveFullFieldTrashChoice(side,first());continue}
    if(p.kind==='luffySanjiChoice'&&engine.resolveLuffySanjiChoice){engine.resolveLuffySanjiChoice(side,first());continue}
    if(p.kind==='op05038DiscardChoice'&&engine.resolveOP05038DiscardChoice){engine.resolveOP05038DiscardChoice(side,first());continue}
    if(p.kind==='op05038TriggerChoice'&&engine.resolveOP05038TriggerChoice){engine.resolveOP05038TriggerChoice(side,first());continue}
    if(p.kind==='op08036TriggerChoice'&&engine.resolveOP08036TriggerChoice){engine.resolveOP08036TriggerChoice(side,first());continue}
    if(p.kind==='op12037MainChoice'&&engine.resolveOP12037MainChoice){engine.resolveOP12037MainChoice(side,[],0,false);continue}
    if(p.kind==='op13040MainChoice'&&engine.resolveOP13040MainChoice){engine.resolveOP13040MainChoice(side,[],false);continue}
    if(p.kind==='op14031RestChoice'&&engine.resolveOP14031RestChoice){engine.resolveOP14031RestChoice(side,(p.options||[]).slice(0,p.max||2));continue}
    if(p.kind==='op15032RestChoice'&&engine.resolveOP15032RestChoice){engine.resolveOP15032RestChoice(side,first());continue}
    if(p.kind==='op15032ActiveChoice'&&engine.resolveOP15032ActiveChoice){engine.resolveOP15032ActiveChoice(side,first());continue}
    if(p.kind==='st31004PowerChoice'&&engine.resolveST31004Choice){engine.resolveST31004Choice(side,(p.options||[]).slice(0,p.max||3));continue}
    if(p.kind==='st31005DonChoice'&&engine.resolveST31005DonChoice){engine.resolveST31005DonChoice(side,first());continue}
    if(p.kind==='endTurnDonCountChoice'&&engine.resolveEndTurnDonCountChoice349){await engine.resolveEndTurnDonCountChoice349(side,p.max||p.remaining||0);continue}
    throw new Error('未対応の選択処理: '+p.kind);
  }
};
const runSide=async(engine,side)=>{
  if(side==='ai'){await runAiTurn(engine,0,()=>{},true);await drainPending(engine);return}
  swapPerspective(engine.state);
  await runAiTurn(engine,0,()=>{},true);
  await drainPending(engine);
  swapPerspective(engine.state);
};
export async function runSelfPlay(cards,deckLeft,deckRight,games=100,onProgress=()=>{},firstMode='alternate'){
  const count=Math.max(1,Math.min(1000,Number(games)||100));
  const mode=['left','right','alternate'].includes(firstMode)?firstMode:'alternate',result={requestedGames:count,games:0,firstMode:mode,leftWins:0,rightWins:0,draws:0,stalls:0,totalTurns:0,totalActions:0,cardPlays:{left:{},right:{}},firstStats:{leftFirst:{games:0,wins:0},rightFirst:{games:0,wins:0}},finishTotals:{leftDon:0,rightDon:0,leftHand:0,rightHand:0,leftField:0,rightField:0},issueSamples:[],startedAt:Date.now()};
  for(let game=0;game<count;game++){
    const engine=new GameEngine(cards,{player:deckLeft,ai:deckRight}),first=mode==='left'?'player':mode==='right'?'ai':game%2===0?'player':'ai';
    engine.start(first);
    const firstBucket=first==='player'?result.firstStats.leftFirst:result.firstStats.rightFirst;firstBucket.games++;
    engine.mulligan('player',keepOpening(engine.state.sides.player.hand));
    let actions=0;
    while(!engine.state.winner&&engine.state.turn<=40&&actions<240){
      if(engine.state.phase==='mulligan')break;
      await runSide(engine,engine.state.activeSide);
      actions++;
    }
    if(engine.state.winner==='player'){result.leftWins++;if(first==='player')firstBucket.wins++}
    else if(engine.state.winner==='ai'){result.rightWins++;if(first==='ai')firstBucket.wins++;}
    else{result.draws++;result.stalls++}
    recordSelfPlayMatch(engine.state,{actions,stalled:!engine.state.winner,safetyStop:!engine.state.winner&&(engine.state.turn>40||actions>=240)});
    result.totalTurns+=Number(engine.state.turn||0);result.totalActions+=actions;
    const played=engine.state._aiPlayedCards||{player:[],ai:[]};for(const id of played.player||[])result.cardPlays.left[id]=(result.cardPlays.left[id]||0)+1;for(const id of played.ai||[])result.cardPlays.right[id]=(result.cardPlays.right[id]||0)+1;
    const left=engine.state.sides.player,right=engine.state.sides.ai;result.finishTotals.leftDon+=Number(left.don?.active||0);result.finishTotals.rightDon+=Number(right.don?.active||0);result.finishTotals.leftHand+=left.hand.length;result.finishTotals.rightHand+=right.hand.length;result.finishTotals.leftField+=left.field.length;result.finishTotals.rightField+=right.field.length;
    if(!engine.state.winner||engine.state.turn>=18||left.don.active>=4||right.don.active>=4)result.issueSamples.push({game:game+1,winner:engine.state.winner||'none',turn:engine.state.turn,actions,leftDon:left.don.active,rightDon:right.don.active,leftLife:left.life.length,rightLife:right.life.length,leftHand:left.hand.length,rightHand:right.hand.length});
    result.games=game+1;
    const keepGoing=onProgress({...result,completed:result.games});await new Promise(resolve=>setTimeout(resolve,0));if(keepGoing===false){result.cancelled=true;break}
  }
  const completed=Math.max(1,result.games);
  result.averageTurns=Number((result.totalTurns/completed).toFixed(2));
  result.leftWinRate=Number((result.leftWins/completed*100).toFixed(1));
  result.rightWinRate=Number((result.rightWins/completed*100).toFixed(1));
  result.averageActions=Number((result.totalActions/completed).toFixed(1));
  result.firstStats.leftFirst.winRate=Number((result.firstStats.leftFirst.wins/Math.max(1,result.firstStats.leftFirst.games)*100).toFixed(1));result.firstStats.rightFirst.winRate=Number((result.firstStats.rightFirst.wins/Math.max(1,result.firstStats.rightFirst.games)*100).toFixed(1));
  const top=map=>Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,uses])=>({id,uses,perGame:Number((uses/completed).toFixed(2))}));result.topCards={left:top(result.cardPlays.left),right:top(result.cardPlays.right)};
  result.finishAverages=Object.fromEntries(Object.entries(result.finishTotals).map(([key,value])=>[key,Number((value/completed).toFixed(2))]));result.issueSamples=result.issueSamples.slice(0,30);
  result.finishedAt=Date.now();
  try{localStorage.setItem('op-ai-selfplay-last',JSON.stringify(result))}catch{}
  return result;
}
