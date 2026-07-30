import{legalPlay,legalAttack,attackTargets,counterOptions,blockers}from'./rule-engine-v3.js?v=3441';const wait=ms=>new Promise(r=>setTimeout(r,ms));
const battlePower=card=>(card.power||0)+(card.attachedDon||0)*1000+(card.tempPower||0);
const targetPower=(g,target)=>{const foe=g.sides.player,card=target.kind==='leader'?foe.leader:foe.field.find(c=>c.uid===target.uid);return(card?.power||0)+(card?.tempPower||0)};
const luffyRestoreIds=new Set(['OP13-037','OP14-022','OP14-031','OP13-027','OP13-118']);
const hasTrigger=card=>(card?.keywords||[]).includes('trigger')||String(card?.text||'').includes('【トリガー】')||(card?.effects||[]).some(effect=>effect.timing==='trigger');
const usefulMainEvent=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,leader=own.leader?.id;
  if(card.type==='stage')return !own.stage&&own.hand.length>=3;
  if(leader==='OP16-080'){
    if(card.type==='character'&&Number(card.counter||0)>=2000&&own.life.length<=2&&own.hand.length<=4&&own.field.length>=2)return false;
    if(card.type!=='event')return true;
    if(card.id==='OP09-096')return own.deck.length>=3&&own.hand.length<=8;
    if(card.id==='OP16-115')return own.trash.some(target=>target.id!==card.id&&hasTrigger(target));
    if(card.id==='EB04-059'){
      const valid6=foe.field.filter(target=>engineCost(g,'player',target)<=6);
      const valid5=valid6.filter(target=>engineCost(g,'player',target)<=5);
      return own.life.length>0&&own.field.length<foe.field.length&&valid6.length>0&&(valid5.length>0||valid6.some(target=>(target.power||0)>=7000));
    }
    if(card.id==='OP16-116')return own.don.total>=10&&own.hand.some(target=>target.uid!==card.uid&&target.type==='character'&&target.name==='マーシャル・D・ティーチ');
    return false;
  }
  if(leader!=='OP13-001')return card.type!=='event';
  if(card.id==='OP12-037'){
    const activeCharacters=foe.field.filter(target=>!target.rested).length;
    const targets=activeCharacters+Math.min(2,foe.don.active),reserve=desiredLuffyDefenseDon(g);
    return targets>=2&&own.don.active>=(card.cost||0)+3+reserve;
  }
  if(card.id==='OP13-040'){
    const targets=foe.field.filter(target=>target.rested&&engineCost(g,'player',target)<=7).length,reserve=desiredLuffyDefenseDon(g);
    return targets>=1&&own.don.active>=(card.cost||0)+2+reserve;
  }
  return card.type!=='event';
};
const engineCost=(g,side,card)=>Number(card?.cost||0)+(g.activeSide!==(side)&&g.sides[side]?.leader?.id==='OP16-080'&&card?.type==='character'?1:0);
const chooseAiAttackTarget=(g,attacker,targets)=>{
  const foe=g.sides.player,power=battlePower(attacker),leader=targets.find(target=>target.kind==='leader');
  if(foe.life.length<=2&&leader&&power>=targetPower(g,leader))return leader;
  const characters=targets.filter(target=>target.kind==='character'&&power>=targetPower(g,target)).map(target=>({target,card:foe.field.find(card=>card.uid===target.uid)}))
    .sort((a,b)=>(((b.card?.keywords||[]).includes('blocker')?1:0)-((a.card?.keywords||[]).includes('blocker')?1:0))||((b.card?.cost||0)-(a.card?.cost||0))||((b.card?.power||0)-(a.card?.power||0)));
  const valuable=characters.find(item=>(item.card?.keywords||[]).includes('blocker')||(item.card?.cost||0)>=4);
  if(valuable)return valuable.target;
  if(leader&&power>=targetPower(g,leader))return leader;
  return characters[0]?.target||null;
};
const desiredLuffyDefenseDon=g=>{
  const own=g.sides.ai;
  if(own.leader?.id!=='OP13-001')return 0;
  if(own.life.length<=1)return Math.min(5,own.don.active);
  if(own.life.length<=2)return Math.min(4,own.don.active);
  return Math.min(3,own.don.active);
};
const playScore=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,turns=g.turnsTaken?.ai||0;
  if(card.type==='stage')return own.stage?-1000:(card.id==='OP09-099'?104:card.id==='ST31-005'?130:55);
  if(own.leader?.id==='OP16-080'){
    if(card.id==='OP09-093')return 190+(foe.field.length*8)+(own.life.length<=2?18:0);
    if(card.id==='OP16-116')return 182+(foe.life.length<=2?24:0);
    if(card.id==='OP16-119')return 168+(own.life.length<=2?30:0);
    if(card.id==='EB04-058')return 150+(own.life.length<=2?55:0);
    if(card.id==='EB04-059')return 135+foe.field.filter(target=>engineCost(g,'player',target)<=6).length*14;
    if(card.id==='OP16-108')return 128+(own.trash.some(target=>(target.traits||[]).includes('黒ひげ海賊団')&&Number(target.cost||0)<=6)?22:0);
    if(card.id==='OP16-115')return 118+own.trash.filter(hasTrigger).length*5;
    if(card.id==='OP09-096')return turns<=3?142:105;
    if(card.id==='OP09-086')return 115+Math.min(35,own.trash.length*3);
    if(card.id==='OP16-106')return 108;
    if(card.id==='OP16-104'||card.id==='OP12-112')return own.life.length<=2&&own.hand.length<=5?45:96;
    if(Number(card.counter||0)>=2000)return own.life.length<=2?35:82;
  }
  if(card.id==='OP01-016'||card.id==='EB02-017'||card.id==='EB04-002')return turns<=2?125:78;
  if(card.id==='OP14-031')return 108+(own.life.length<=2?30:0)+foe.field.filter(c=>!c.rested&&(c.cost||0)<=8).length*8;
  if(card.id==='OP13-118')return 112+(foe.life.length<=2?25:0);
  if(card.id==='ST31-004')return 102+([own.leader,...own.field].reduce((n,c)=>n+(c.attachedDon||0),0)>=3?25:0);
  if(card.id==='OP13-037'||card.id==='OP13-027'||card.id==='OP14-022')return 100;
  if(card.id==='OP10-011')return 92+(own.life.length<=2?25:0);
  if(card.id==='ST21-003')return 86;
  if(card.id==='OP12-037'){
    const targets=foe.field.filter(c=>!c.rested).length+Math.min(2,foe.don.active);
    return targets>=2?82:35;
  }
  if(card.id==='OP13-040'){
    const targets=foe.field.filter(c=>c.rested&&engineCost(g,'player',c)<=7).length;
    return targets>=2?88:60;
  }
  return 50+Number(card.cost||0)*5+Number(card.power||0)/1000;
};
export async function runAiTurn(engine,speed=500,onStep=()=>{}){let g=engine.state;const pace=Math.max(1000,Number(speed)||500),show=async text=>{engine.log(`AI行動：${text}`);onStep();await wait(pace)},attempted=new Set();let steps=0;while((g=engine.state).activeSide==='ai'&&!g.winner){if(++steps>100){engine.log('AI行動：安全処理によりターンを終了します');if(g.pending?.kind==='battle')engine.endBattle();if(g.phase!=='main'&&!g.pending)g.phase='main';await engine.endTurn('ai');onStep();return}if(g.pending)return;const p=g.sides.ai.hand.filter(c=>legalPlay(g,'ai',c)&&!attempted.has(c.uid)&&usefulMainEvent(g,c)).sort((a,b)=>playScore(g,b)-playScore(g,a))[0];if(p){await show(`${p.name}を登場・使用します`);const played=await engine.playCard('ai',p.uid);onStep();await wait(650);if(!played)attempted.add(p.uid);continue}
if(!attempted.has('__luffy_support__')){
  attempted.add('__luffy_support__');
  const own=g.sides.ai;
  if(own.stage?.id==='ST31-005'&&!own.stage.rested&&own.don.rested>0&&typeof engine.beginST31005DonChoice==='function'){
    const luffy=[own.leader,...own.field].filter(card=>card.name==='モンキー・D・ルフィ')
      .sort((a,b)=>((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0)))[0];
    if(luffy&&engine.beginST31005DonChoice('ai')){
      engine.resolveST31005DonChoice('ai',luffy.uid);
      await show('サウザンド・サニー号でレストのDON!!をルフィへ付与します');
    }
  }
  const ready=[own.leader,...own.field].filter(card=>legalAttack(g,'ai',card))
    .sort((a,b)=>((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0)));
  if(own.don.active>0&&ready.length){
    let attached=0;
    if(own.leader?.id==='OP13-001'&&ready.some(card=>card.uid===own.leader.uid)&&own.don.active>0){
      if(engine.attachDon('ai',own.leader.uid,1))attached++;
    }
    const attacker=ready.find(card=>card.uid!==own.leader.uid)||ready[0];
    const reserve=desiredLuffyDefenseDon(g);
    const spendable=Math.max(0,own.don.active-reserve);
    if(attacker&&spendable>0&&engine.attachDon('ai',attacker.uid,spendable))attached+=spendable;
    if(attached>0){
      await show('攻撃役へDON!!を'+attached+'枚付与します');
      continue;
    }
  }
}
const targets=attackTargets(g,'ai'),attackers=[g.sides.ai.leader,...g.sides.ai.field].filter(c=>(c.preventAttackThroughTurn??-1)<g.turn&&!attempted.has(c.uid)&&c.aiAttackSkippedTurn!==g.turn&&legalAttack(g,'ai',c)&&targets.some(t=>battlePower(c)>=targetPower(g,t))).sort((a,b)=>battlePower(b)-battlePower(a)),a=attackers[0];if(a){const target=chooseAiAttackTarget(g,a,targets);if(target){const targetCard=target.kind==='leader'?g.sides.player.leader:g.sides.player.field.find(c=>c.uid===target.uid);await show(`${a.name}（${battlePower(a)}）で${targetCard?.name||'対象'}（${targetPower(g,target)}）へ攻撃します`);attempted.add(a.uid);const declared=await engine.declareAttack('ai',a.uid,target.uid);onStep();if(!declared){a.aiAttackSkippedTurn=g.turn;engine.log(`AI行動：${a.name}の攻撃は実行できないためスキップします`);onStep();continue}if(g.pending?.defendingSide==='player')return;await engine.autoResolveDefense();onStep();await wait(650);continue}}await show('行動を終えてターンを終了します');const ended=await engine.endTurn('ai');if(!ended&&!g.pending){g.phase='main';await engine.endTurn('ai')}onStep();return}}
export function chooseDefense(g,s,a){const needed=Math.max(0,a.power-a.targetPower+1000),block=blockers(g,s)[0];if(block&&a.targetKind==='leader'&&g.sides[s].life.length<=2)return{blockerUid:block.uid,counters:[]};const opts=counterOptions(g,s).sort((x,y)=>y.counter-x.counter),used=[];let total=0;for(const c of opts){if(total>=needed||g.sides[s].hand.length-used.length<=2)break;used.push(c.uid);total+=c.counter}return{counters:total>=needed?used:[]}}
