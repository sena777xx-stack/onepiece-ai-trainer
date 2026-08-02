import{GameEngine}from'./game-engine-v3.js?v=3441';import{recordAiMatch}from'./ai-telemetry.js?v=3513';import{runSelfPlay}from'./ai-selfplay.js?v=3860';import{runAiTurn}from'./ai-engine.js?v=3880';import{storage}from'./storage.js';import{UI}from'./ui-fixed.js?v=3441';const root=document.querySelector('#app');let engine,attacker,playerDecks={},aiDecks={},cardCatalog={},selectedPlayerDeck='teach',selectedAiDeck='luffy';const json=async p=>{const r=await fetch(p);if(!r.ok)throw Error(p);return r.json()};
const actions={newGame:first=>{engine.start(first);render()},load:()=>{const s=storage.load();if(s){engine.load(s);render();maybeAi()}},home:()=>{ui.close();home()},mulligan:k=>{ui.close();engine.mulligan('player',k);render();maybeAi()},card:(s,c)=>ui.showCard(s,c,engine.state),zone:(s,z)=>ui.showZone(s,z,engine.state),play:async id=>{ui.close();await engine.playCard('player',id);render()},attachDon:id=>{ui.close();engine.attachDon('player',id,1);render()},move:(s,from,to,id)=>{ui.close();engine.manualMove(s,from,to,id);render()},shuffle:s=>{ui.close();engine.shuffleDeck(s);render()},manualDraw:s=>{ui.close();engine.draw(s,1);render()},attack:id=>{attacker=id;ui.close();const f=engine.state.sides.ai;ui.targets([{kind:'leader',uid:f.leader.uid,name:f.leader.name},...f.field.filter(c=>c.rested).map(c=>({kind:'character',uid:c.uid,name:c.name}))])},target:async id=>{ui.close();await engine.declareAttack('player',attacker,id);render();if(engine.state.pending?.defendingSide==='ai'){engine.autoResolveDefense();render()}},defend:o=>{ui.close();engine.defend('player',o);render();maybeAi()},endTurn:()=>{engine.endTurn('player');render();maybeAi()},undo:()=>{ui.close();engine.undo();render()},save:()=>{storage.save(engine.export());ui.toast('端末に保存しました')}};
actions.selfPlay=async()=>{
  const requested=Number(prompt('AI同士で検証する試合数（1～1000）','100'));
  if(!Number.isFinite(requested)||requested<1)return;
  const count=Math.min(1000,Math.floor(requested));
  const order=prompt('先攻設定を選んでください\n1：先攻後攻を交互\n2：左側を先攻\n3：右側を先攻','1');
  if(order===null)return;
  const firstMode=order==='2'?'left':order==='3'?'right':'alternate';
  ui.toast?.('AI同士の対戦を開始します');
  const result=await runSelfPlay(cardCatalog,playerDecks[selectedPlayerDeck],aiDecks[selectedAiDeck],count,progress=>{
    if(progress.completed%50===0)ui.toast?.('AI検証 '+progress.completed+' / '+count);
  },firstMode);
  const orderLabel=firstMode==='left'?'左側が先攻':firstMode==='right'?'右側が先攻':'先攻後攻を交互';
  alert('AI対AI 検証完了\n先攻設定：'+orderLabel+'\n'+playerDecks[selectedPlayerDeck].name+' '+result.leftWins+'勝\n'+aiDecks[selectedAiDeck].name+' '+result.rightWins+'勝\n引き分け・停止 '+result.draws+'試合\n平均 '+result.averageTurns+'ターン');
};
actions.chooseBlock=blockerUid=>{ui.close();const ok=engine.chooseBlock('player',blockerUid);render();if(!ok)ui.toast('ブロッカーを選択できませんでした')};
actions.bulkMove=(side,from,to,ids)=>{ui.close();for(const id of ids)engine.manualMove(side,from,to,id);render()};actions.useTrigger=async(side,id)=>{if(actions._manualTriggerBusy)return;actions._manualTriggerBusy=true;try{ui.close();await engine.useTrigger(side,id);render()}finally{actions._manualTriggerBusy=false}};actions.zone=(side,zone)=>zone==='deck'?ui.showDeck(side,engine.state):zone==='life'?ui.showLife(side,engine.state):ui.showZone(side,zone,engine.state);actions.target=async id=>{ui.close();await engine.declareAttack('player',attacker,id);if(engine.state.pending?.defendingSide==='ai')await engine.autoResolveDefense();if(engine.state.pending?.kind==='trigger'&&engine.state.pending.side==='ai')await engine.resolveTrigger(true);render()};actions.triggerChoice=async use=>{if(actions._triggerChoiceBusy)return;actions._triggerChoiceBusy=true;try{ui.close();await engine.resolveTrigger(use);render();maybeAi()}finally{actions._triggerChoiceBusy=false}};
actions.effectAction=async(side,id,action)=>{ui.close();await engine.applyEffectAction('player',side,id,action);render()};
actions.viewDeck=()=>ui.deckList(engine.decks.player,engine.cards);
actions.openPlayerDeckPicker=()=>ui.deckPicker(playerDecks,selectedPlayerDeck);
actions.selectPlayerDeck=key=>{if(!playerDecks[key])return;selectedPlayerDeck=key;engine.decks.player=playerDecks[key];storage.settings({...storage.settings(),playerDeck:key});ui.close();home()};actions.openAiDeckPicker=()=>ui.aiDeckPicker(aiDecks,selectedAiDeck);actions.selectAiDeck=key=>{if(!aiDecks[key])return;selectedAiDeck=key;engine.decks.ai=aiDecks[key];storage.settings({...storage.settings(),aiDeck:key});ui.close();home()};
actions.attachDon=id=>{const s=engine.state.sides.player,card=[s.leader,...s.field].find(c=>c.uid===id);ui.donPicker(id,s.don.active,card?.attachedDon||0)};
actions.commitDon=(id,amount)=>{ui.close();engine.attachDon('player',id,amount);render()};
const normalPlay=actions.play;actions.play=async id=>{const card=engine.state.sides.player.hand.find(c=>c.uid===id);if(card?.id==='EB04-059'){const mine=engine.state.sides.player,foe=engine.state.sides.ai;if(mine.field.length>=foe.field.length){ui.toast('自分のキャラが相手より少ない場合に使えます');return}if(!mine.life.length){ui.toast('表向きにするライフがありません');return}if(mine.don.active<6){ui.toast('使用可能なDON!!が6枚必要です');return}ui.eb04059Picker(foe.field);return}await normalPlay(id)};
actions.resolveEB04059=async ids=>{ui.close();const card=engine.state.sides.player.hand.find(c=>c.id==='EB04-059');if(card)await engine.useEB04059('player',card.uid,ids);render()};
const normalCard=actions.card;actions.card=(side,card)=>{const s=engine.state.sides[side];if(side==='player'&&card.id==='OP09-099'&&s.stage?.uid===card.uid&&engine.state.activeSide==='player'&&engine.state.phase==='main'){if(card.rested){ui.toast('ハチノスはレスト中です');return}if(!s.hand.length){ui.toast('捨てる手札がありません');return}ui.hachinosuDiscard(s.hand);return}normalCard(side,card)};
actions.hachinosuDiscard=discardUid=>{ui.close();const result=engine.beginHachinosu('player',discardUid);render();if(result?.cards)ui.hachinosuPick(result.cards)};
actions.hachinosuFinish=chosenUid=>{ui.close();engine.finishHachinosu('player',chosenUid);render()};
actions.leaderRedirect=(discardUid,targetUid)=>{ui.close();const ok=engine.useTeachLeaderRedirect('player',discardUid,targetUid);render();ui.toast(ok?'選択したカードをトラッシュへ送りました':'リーダー効果を処理できませんでした')};
actions.skipLeaderRedirect=()=>{ui.close();ui.defense(engine.state,true)};
actions.effectChoice=ids=>{ui.close();engine.resolveTeachKoChoice('player',ids);render();maybeAi()};
actions.teach10=targetUid=>{ui.close();engine.useTeach10('player',targetUid);render()};
actions.engineSync=()=>engine.syncBurgessPower?.();
actions.darkWaterChoice=targetUid=>{ui.close();engine.resolveDarkWaterChoice('player',targetUid);render();maybeAi()};
actions.borsalinoChoice=addLife=>{ui.close();engine.resolveBorsalinoChoice('player',addLife);render();maybeAi()};
actions.sanjuanChoice=targetUid=>{ui.close();engine.resolveSanjuanChoice('player',targetUid);render();maybeAi()};
actions.shiryuChoice=targetUid=>{ui.close();engine.resolveShiryuChoice('player',targetUid);render();maybeAi()};
actions.zehahaChoice=async(targetUid,takeLife)=>{ui.close();await engine.resolveZehahaChoice('player',targetUid,takeLife);render();maybeAi()};
actions.devonChoice=async targetUid=>{ui.close();await engine.resolveDevonChoice('player',targetUid);if(engine.state.pending?.kind==='battle'&&engine.state.pending.defendingSide==='ai')await engine.autoResolveDefense();render();maybeAi()};
actions.handNoticeContinue=()=>{ui.close();engine.resolveHandNotice();render();maybeAi()};
actions.undo=()=>{ui.close();const ok=engine.undo();if(!ok){ui.toast('これ以上戻せません');return}ui.knownHandIds=new Set(engine.state.sides.player.hand.map(c=>c.uid));ui.lastPhase=engine.state.phase;render();maybeAi()};
actions.attack=id=>{attacker=id;ui.close();const foe=engine.state.sides.ai,candidates=[{kind:'leader',uid:foe.leader.uid,name:foe.leader.name,power:(foe.leader.power||0)+(foe.leader.tempPower||0)},...foe.field.filter(c=>c.rested).map(c=>({kind:'character',uid:c.uid,name:c.name,power:(c.power||0)+(c.tempPower||0)}))];ui.targets(candidates)};
const deckName=d=>(d?.name||'デッキ').replace(/\s+\d{4}-\d{2}-\d{2}$/,'');const deckLeader=d=>engine.cards?.[d?.leader]||null;const ui=new UI(root,actions),home=()=>{const playerLeader=deckLeader(engine.decks.player),aiLeader=deckLeader(engine.decks.ai);ui.renderHome(Boolean(storage.load()),{playerName:deckName(engine.decks.player),aiName:deckName(engine.decks.ai),playerLeaderName:playerLeader?.name||'',aiLeaderName:aiLeader?.name||'',playerLeaderImage:playerLeader?.imageUrl||'',aiLeaderImage:aiLeader?.imageUrl||''})},render=()=>{recordAiMatch(engine.state);ui.renderGame(engine.state);if(engine.state.pending?.kind==='trigger'&&engine.state.pending.side==='player')ui.triggerPrompt(engine.state.pending.card)};async function maybeAi(){if(engine.state.activeSide==='ai'&&!engine.state.winner){render();await runAiTurn(engine,storage.settings().aiSpeed,render);render()}}window.__resumeAi349=maybeAi;try{const[c,p,luffy]=await Promise.all([json('./cards.json?v=3526'),json('./black-yellow-teach.json?v=3422'),json('./red-green-luffy.json?v=3421')]);playerDecks={teach:p,luffy};aiDecks={teach:p,luffy};const settings=storage.settings(),savedDeck=settings.playerDeck,savedAiDeck=settings.aiDeck;selectedPlayerDeck=playerDecks[savedDeck]?savedDeck:'teach';selectedAiDeck=aiDecks[savedAiDeck]?savedAiDeck:'luffy';if(savedAiDeck!==selectedAiDeck)storage.settings({...settings,aiDeck:selectedAiDeck});cardCatalog=Object.fromEntries(c.map(x=>[x.id,x]));engine=new GameEngine(cardCatalog,{player:playerDecks[selectedPlayerDeck],ai:aiDecks[selectedAiDeck]});window.__luffyEngine349=engine;home();
if(new URLSearchParams(location.search).get('autotrain')==='10000'){
  const trainButton=document.createElement('button');
  trainButton.type='button';trainButton.textContent='10,000戦のAI学習を開始';
  trainButton.style.cssText='position:fixed;z-index:99999;left:20px;right:20px;bottom:24px;padding:18px;border-radius:14px;background:#d99b08;color:white;font-weight:800;font-size:18px';
  document.body.appendChild(trainButton);
  trainButton.addEventListener('click',async()=>{
    trainButton.disabled=true;const plans=[['teach','luffy'],['luffy','teach'],['teach','teach'],['luffy','luffy']],summary={total:0,plans:[],startedAt:Date.now()};
    for(const [leftKey,rightKey] of plans){
      const row={left:leftKey,right:rightKey,games:0,leftWins:0,rightWins:0,draws:0,turns:0};
      for(const batch of Array(25).fill(100)){
        trainButton.textContent='学習中 '+summary.total+' / 10000（'+leftKey+' vs '+rightKey+'）';
        const result=await runSelfPlay(cardCatalog,playerDecks[leftKey],aiDecks[rightKey],batch,()=>{},'alternate');
        row.games+=result.games;row.leftWins+=result.leftWins;row.rightWins+=result.rightWins;row.draws+=result.draws;row.turns+=result.totalTurns;summary.total+=result.games;
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      row.averageTurns=Number((row.turns/row.games).toFixed(2));row.leftWinRate=Number((row.leftWins/row.games*100).toFixed(1));row.rightWinRate=Number((row.rightWins/row.games*100).toFixed(1));summary.plans.push(row);
    }
    summary.finishedAt=Date.now();window.__aiTraining10000Result=summary;
    const report=document.createElement('pre');report.id='ai-training-10000-result';report.textContent=JSON.stringify(summary,null,2);report.style.cssText='position:fixed;z-index:99999;inset:12px;overflow:auto;padding:16px;background:#101b2e;color:white;white-space:pre-wrap';
    trainButton.remove();document.body.appendChild(report);
  });
}
}catch(e){root.textContent='データを読み込めませんでした。GitHub PagesのURLから開いてください。';console.error(e)}if('serviceWorker'in navigator)addEventListener('load',async()=>{try{for(const registration of await navigator.serviceWorker.getRegistrations())await registration.unregister();if('caches'in window)for(const key of await caches.keys())await caches.delete(key)}catch(error){console.warn(error)}});
