import{legalPlay,legalAttack,attackTargets,counterOptions,blockers}from'./rule-engine-v3.js?v=3441';const wait=ms=>new Promise(r=>setTimeout(r,ms));
const battlePower=card=>(card.power||0)+(card.attachedDon||0)*1000+(card.tempPower||0);
const targetPower=(g,target)=>{const foe=g.sides.player,card=target.kind==='leader'?foe.leader:foe.field.find(c=>c.uid===target.uid);return(card?.power||0)+(card?.tempPower||0)};
const luffyRestoreIds=new Set(['OP13-037','OP14-022','OP14-031','OP13-027','OP13-118']);
const hasTrigger=card=>(card?.keywords||[]).includes('trigger')||String(card?.text||'').includes('【トリガー】')||(card?.effects||[]).some(effect=>effect.timing==='trigger');
const usefulMainEvent=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,leader=own.leader?.id;
  if(card.type==='stage')return !own.stage&&own.hand.length>=3;
  if(leader==='OP16-080'){
    if(card.type==='character'){
      const turns=g.turnsTaken?.ai||0;
      if(card.id==='OP12-112')return own.life.length>=3&&own.hand.length>=7&&own.field.length<=3;
      if(card.id==='OP16-104'){
        const copyTarget=foe.field.some(target=>Number(target.power||0)+Number(target.tempPower||0)>=7000);
        return own.life.length>=3&&own.hand.length>=6&&own.field.length<=3&&copyTarget;
      }
      if(card.id==='OP16-109'){
        const koTargets=foe.field.filter(target=>engineCost(g,'player',target)<=1).length;
        return turns<=3||koTargets>0||own.hand.length>=7;
      }
      if(Number(card.counter||0)>=2000&&(own.life.length<=2||own.hand.length<=5))return false;
      return true;
    }
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
  if(card.type==='character'){
    if(card.id==='ST21-003'){
      const activeBlockers=foe.field.filter(target=>!target.rested&&(target.keywords||[]).includes('blocker')).length;
      const readyAttackers=[own.leader,...own.field].filter(target=>legalAttack(g,'ai',target));
      const attacksNeeded=Math.max(1,foe.life.length+1);
      const donAfterPlay=Math.max(0,own.don.active-Number(card.cost||0));
      const leaderPower=Number(foe.leader?.power||0)+Number(foe.leader?.tempPower||0);
      const canReachLeader=readyAttackers.filter(target=>battlePower(target)+donAfterPlay*1000>=leaderPower).length>=attacksNeeded;
      return foe.life.length<=1&&activeBlockers>0&&readyAttackers.length>=attacksNeeded&&canReachLeader;
    }
    const turns=g.turnsTaken?.ai||0;
    if(card.id==='EB04-002')return turns<=3&&own.deck.length>=5&&own.hand.length<=6;
    const keepForDefense=Number(card.counter||0)>=2000&&(own.life.length<=2||own.hand.length<=4);
    if(keepForDefense&&!['OP10-011','OP14-031'].includes(card.id))return false;
    if(['OP01-016','EB02-017'].includes(card.id)&&(own.deck.length<5||own.hand.length>=8))return false;
    if(card.id==='OP15-032'&&!foe.field.some(target=>!target.rested)&&own.field.length>=3)return false;
    return true;
  }
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
  const characters=targets.filter(target=>target.kind==='character'&&foe.field.find(card=>card.uid===target.uid)?.rested&&power>=targetPower(g,target)).map(target=>({target,card:foe.field.find(card=>card.uid===target.uid)}))
    .sort((a,b)=>(((b.card?.keywords||[]).includes('blocker')?1:0)-((a.card?.keywords||[]).includes('blocker')?1:0))||((b.card?.cost||0)-(a.card?.cost||0))||((b.card?.power||0)-(a.card?.power||0)));
  const valuable=characters.find(item=>(item.card?.keywords||[]).includes('blocker')||(item.card?.cost||0)>=4);
  if(valuable)return valuable.target;
  if(leader&&power>=targetPower(g,leader))return leader;
  return characters[0]?.target||null;
};
const desiredLuffyDefenseDon=g=>{
  const own=g.sides.ai;
  if(own.leader?.id!=='OP13-001')return 0;
  if(own.life.length<=1)return Math.min(3,own.don.active);
  if(own.life.length<=2)return Math.min(2,own.don.active);
  return Math.min(2,own.don.active);
};
const playScore=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,turns=g.turnsTaken?.ai||0;
  if(card.type==='stage')return own.stage?-1000:(card.id==='OP09-099'?104:card.id==='ST31-005'?130:55);
  if(own.leader?.id==='OP16-080'){
    if(card.id==='OP09-093')return 170+(foe.field.length*7)+(own.life.length<=2?15:0);
    if(card.id==='OP16-116')return 182+(foe.life.length<=2?24:0);
    if(card.id==='OP16-119')return 155+(own.life.length<=2?24:0);
    if(card.id==='EB04-058')return 150+(own.life.length<=2?55:0);
    if(card.id==='EB04-059')return 135+foe.field.filter(target=>engineCost(g,'player',target)<=6).length*14;
    if(card.id==='OP16-108')return 124+(own.trash.some(target=>(target.traits||[]).includes('黒ひげ海賊団')&&Number(target.cost||0)<=6)?18:0);
    if(card.id==='OP16-115')return 118+own.trash.filter(hasTrigger).length*5;
    if(card.id==='OP09-096')return turns<=3?154:110;
    if(['OP16-103','OP16-109','OP16-110'].includes(card.id))return turns<=3?148:88;
    if(card.id==='OP09-086')return 115+Math.min(35,own.trash.length*3);
    if(card.id==='OP16-106')return 108;
    if(card.id==='OP16-104')return foe.field.some(target=>Number(target.power||0)+Number(target.tempPower||0)>=7000)?108:38;
    if(card.id==='OP12-112')return own.hand.length>=7&&own.life.length>=3?88:28;
    if(card.id==='OP16-109')return 92+foe.field.filter(target=>engineCost(g,'player',target)<=1).length*24;
    if(Number(card.counter||0)>=2000)return own.life.length<=2||own.hand.length<=5?25:74;
  }
  if(card.id==='OP01-016'||card.id==='EB02-017'||card.id==='EB04-002')return turns<=2?125:(own.hand.length<=4?62:82);
  if(card.id==='OP14-031')return 108+(own.life.length<=2?30:0)+foe.field.filter(c=>!c.rested&&(c.cost||0)<=8).length*8;
  if(card.id==='OP13-118')return 112+(foe.life.length<=2?25:0);
  if(card.id==='ST31-004')return 102+([own.leader,...own.field].reduce((n,c)=>n+(c.attachedDon||0),0)>=3?25:0);
  if(card.id==='OP13-037'||card.id==='OP13-027'||card.id==='OP14-022')return 100;
  if(card.id==='OP10-011')return 112+(own.life.length<=2?45:0);
  if(card.id==='OP15-032')return 84+(foe.field.some(target=>!target.rested)?24:0);
  if(card.id==='EB04-007')return 105+(foe.field.some(target=>(target.power||0)+(target.tempPower||0)>=8000)?38:0)+(own.life.length<=2?15:0);
  if(card.id==='ST21-003')return foe.life.length<=1?220:-1000;
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
const positionScore=g=>{
  const value=(side,enemy)=>{
    const field=side.field.reduce((sum,card)=>sum+Number(card.power||0)/1000*3+Number(card.cost||0)*1.4+((card.keywords||[]).includes('blocker')?5:0)+(card.rested?-0.4:0),0);
    const hand=side.hand.reduce((sum,card)=>sum+3.5+Math.min(2,Number(card.counter||0)/1000),0);
    const pressure=[side.leader,...side.field].filter(card=>!card.rested).reduce((sum,card)=>sum+Math.max(0,(Number(card.power||0)+Number(card.tempPower||0)-5000)/1000),0);
    return side.life.length*30+hand+field+(side.stage?5:0)+side.don.active*.35+pressure+(enemy.life.length<=1?8:0);
  };
  return value(g.sides.ai,g.sides.player)-value(g.sides.player,g.sides.ai);
};
const cloneForLookahead=engine=>{
  const shadow=Object.create(Object.getPrototypeOf(engine));
  Object.assign(shadow,engine);
  shadow.state=typeof structuredClone==='function'?structuredClone(engine.state):JSON.parse(JSON.stringify(engine.state));
  shadow.history=[];
  return shadow;
};
const matchupPlayBonus=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,ownId=own.leader?.id,foeId=foe.leader?.id,second=g.firstPlayer!=='ai';let bonus=0;
  if(ownId==='OP13-001'&&foeId==='OP13-001'){
    if(['OP10-011','OP14-031'].includes(card.id))bonus+=second?24:14;
    if(['OP01-016','EB02-017','EB04-002'].includes(card.id)&&second)bonus+=10;
    if(['OP13-118','ST31-004','EB04-007'].includes(card.id))bonus+=second?8:16;
  }else if(ownId==='OP13-001'&&foeId==='OP16-080'){
    if(['OP13-118','ST31-004','EB04-007'].includes(card.id))bonus+=18;
    if(['OP10-011','OP14-031'].includes(card.id))bonus+=second?16:8;
  }else if(ownId==='OP16-080'&&foeId==='OP16-080'){
    if(card.id==='OP09-093')bonus+=30;if(card.id==='OP16-119')bonus+=16;if(card.id==='EB04-058')bonus+=second?22:12;
    if(['OP16-103','OP16-109','OP16-110','OP09-096'].includes(card.id))bonus+=second?12:7;
  }else if(ownId==='OP16-080'&&foeId==='OP13-001'){
    if(card.id==='OP09-093')bonus+=34;if(card.id==='EB04-058')bonus+=second?26:16;
    if(['OP16-103','OP16-109','OP16-110','OP09-096'].includes(card.id))bonus+=second?14:8;
  }
  return bonus;
};
const combatOutlook=(g,attempted=new Set())=>{
  const own=g.sides.ai,foe=g.sides.player;
  const attackers=[own.leader,...own.field].filter(card=>!attempted.has(card.uid)&&legalAttack(g,'ai',card));
  const leaderPower=Number(foe.leader?.power||0)+Number(foe.leader?.tempPower||0);
  let spareDon=Math.max(0,Number(own.don?.active||0)),damage=0,pressure=0;
  const powers=attackers.map(card=>({card,power:battlePower(card)})).sort((a,b)=>b.power-a.power);
  for(const item of powers){
    const deficit=Math.max(0,leaderPower-item.power);
    const use=Math.min(spareDon,Math.ceil(deficit/1000));
    spareDon-=use;
    const attackPower=item.power+use*1000;
    if(attackPower>=leaderPower){
      const doubleAttack=(item.card.keywords||[]).includes('doubleAttack')||(item.card.keywords||[]).includes('double attack');
      damage+=doubleAttack?2:1;
      pressure+=1+Math.max(0,attackPower-leaderPower)/1000*.35;
    }
  }
  const activeBlockers=foe.field.filter(card=>!card.rested&&(card.keywords||[]).includes('blocker')).length;
  const expectedCounter=Math.min(5000,Math.max(0,foe.hand.length-1)*850);
  const counterTax=Math.ceil(expectedCounter/2000);
  const effectiveDamage=Math.max(0,damage-activeBlockers-counterTax);
  const needed=Math.max(1,foe.life.length+1);
  return{score:pressure*10+effectiveDamage*18-activeBlockers*8,lethal:effectiveDamage>=needed,damage,effectiveDamage,needed,activeBlockers};
};
const opponentTurnRisk=g=>{
  const own=g.sides.ai,foe=g.sides.player;
  const leaderPower=Number(own.leader?.power||0)+Number(own.leader?.tempPower||0);
  const attackers=[foe.leader,...foe.field].filter(card=>(card.preventAttackThroughTurn??-1)<g.turn+1);
  const attackPowers=attackers.map(battlePower).sort((a,b)=>b-a);
  let bonusDon=Math.max(0,Number(foe.don?.total||0)),dangerous=0;
  for(const base of attackPowers){
    const need=Math.max(0,leaderPower-base);
    const use=Math.min(bonusDon,Math.ceil(need/1000));
    bonusDon-=use;
    if(base+use*1000>=leaderPower)dangerous++;
  }
  const blockers=own.field.filter(card=>(card.keywords||[]).includes('blocker')).length;
  const counterValue=own.hand.reduce((sum,card)=>sum+Math.max(0,Number(card.counter||0)),0);
  const counterStops=Math.floor(counterValue/2000);
  const leaderDonStops=own.leader?.id==='OP13-001'?Math.floor(Number(own.don?.active||0)/2):0;
  const unguarded=Math.max(0,dangerous-blockers-counterStops-leaderDonStops);
  const lethalRisk=Math.max(0,unguarded-own.life.length);
  return unguarded*14+lethalRisk*120+(own.life.length<=1?unguarded*18:0);
};
const stateTacticalValue=(g,attempted)=>positionScore(g)+combatOutlook(g,attempted).score*1.7-opponentTurnRisk(g)*1.4;
const bestSecondPlayValue=async(engine,attempted)=>{
  const base=stateTacticalValue(engine.state,attempted);
  if(engine.state.pending||engine.state.winner)return base;
  const options=engine.state.sides.ai.hand
    .filter(card=>legalPlay(engine.state,'ai',card)&&!attempted.has(card.uid)&&usefulMainEvent(engine.state,card))
    .sort((a,b)=>playScore(engine.state,b)-playScore(engine.state,a)).slice(0,6);
  let best=base;
  for(const card of options){
    const next=cloneForLookahead(engine);
    let ok=false;
    try{ok=Boolean(await next.playCard('ai',card.uid))}catch{}
    if(!ok)continue;
    let value=stateTacticalValue(next.state,attempted)+playScore(engine.state,card)*.04;
    if(next.state.winner==='ai')value+=10000;
    if(next.state.pending?.side==='ai')value-=12;
    if(!next.state.pending&&!next.state.winner&&next.state.sides.player.life.length<=2){
      const thirdOptions=next.state.sides.ai.hand
        .filter(item=>legalPlay(next.state,'ai',item)&&!attempted.has(item.uid)&&usefulMainEvent(next.state,item))
        .sort((a,b)=>playScore(next.state,b)-playScore(next.state,a)).slice(0,3);
      for(const thirdCard of thirdOptions){
        const third=cloneForLookahead(next);
        let thirdOk=false;
        try{thirdOk=Boolean(await third.playCard('ai',thirdCard.uid))}catch{}
        if(!thirdOk)continue;
        let thirdValue=stateTacticalValue(third.state,attempted)+playScore(next.state,thirdCard)*.03;
        if(third.state.winner==='ai')thirdValue+=10000;
        if(third.state.pending?.side==='ai')thirdValue-=10;
        value=Math.max(value,thirdValue);
      }
    }
    best=Math.max(best,value);
  }
  return best;
};
const preCombatPlayUseful=(g,card)=>{
  const foe=g.sides.player;
  if(card.id==='ST31-005'&&!g.sides.ai.stage)return true;
  if(['OP14-031','OP13-118','ST31-004','EB04-007'].includes(card.id))return true;
  if(card.id==='ST21-003')return foe.life.length<=1&&foe.field.some(target=>!target.rested&&(target.keywords||[]).includes('blocker'));
  if(card.id==='OP09-093')return foe.life.length<=1;
  return false;
};
const chooseBestPlay=async(engine,attempted,preCombatOnly=false)=>{
  const g=engine.state,candidates=g.sides.ai.hand.filter(card=>legalPlay(g,'ai',card)&&!attempted.has(card.uid)&&usefulMainEvent(g,card));
  const beforeCombat=combatOutlook(g,attempted),evaluated=[];
  for(const card of candidates){
    const shadow=cloneForLookahead(engine);
    let success=false;
    try{success=Boolean(await shadow.playCard('ai',card.uid))}catch{}
    if(!success){evaluated.push({card,score:-1e9});continue}
    const afterCombat=combatOutlook(shadow.state,attempted);
    const tactical=preCombatPlayUseful(g,card)||(!beforeCombat.lethal&&afterCombat.lethal)||afterCombat.score>=beforeCombat.score+10;
    if(preCombatOnly&&!tactical)continue;
    let score=positionScore(shadow.state)+playScore(g,card)*.08+matchupPlayBonus(g,card)+(afterCombat.score-beforeCombat.score)*2;
    const safetyBefore=opponentTurnRisk(g),safetyAfter=opponentTurnRisk(shadow.state);
    score+=(safetyBefore-safetyAfter)*1.8;
    if(!preCombatOnly&&!shadow.state.pending){
      const continuation=await bestSecondPlayValue(shadow,attempted);
      score+=(continuation-stateTacticalValue(shadow.state,attempted))*.55;
    }
    if(!beforeCombat.lethal&&afterCombat.lethal)score+=1500;
    if(beforeCombat.lethal&&!afterCombat.lethal)score-=1800;
    if(shadow.state.pending?.side==='ai')score-=18;
    if(shadow.state.winner==='ai')score+=10000;
    if(shadow.state.winner==='player')score-=10000;
    evaluated.push({card,score});
  }
  return evaluated.sort((a,b)=>b.score-a.score||playScore(g,b.card)-playScore(g,a.card)||String(a.card.id).localeCompare(String(b.card.id))||String(a.card.uid).localeCompare(String(b.card.uid)))[0]?.card||null;
};
const chooseBestAttack=async(engine,attempted)=>{
  const g=engine.state,own=g.sides.ai,foe=g.sides.player;
  const targets=attackTargets(g,'ai').filter(target=>target.kind==='leader'||foe.field.find(card=>card.uid===target.uid)?.rested);
  const attackers=[own.leader,...own.field].filter(card=>(card.preventAttackThroughTurn??-1)<g.turn&&!attempted.has(card.uid)&&card.aiAttackSkippedTurn!==g.turn&&legalAttack(g,'ai',card));
  const outlook=combatOutlook(g,attempted),choices=[];
  for(const attacker of attackers){
    for(const target of targets){
      if(battlePower(attacker)<targetPower(g,target))continue;
      const shadow=cloneForLookahead(engine);
      let declared=false;
      try{declared=Boolean(await shadow.declareAttack('ai',attacker.uid,target.uid))}catch{}
      const battle=shadow.state.pending;
      if(!declared||battle?.kind!=='battle')continue;
      const defender=shadow.state.sides.player;
      const required=Math.max(0,Number(battle.power||0)-Number(battle.targetPower||0)+1000);
      const counterCapacity=counterOptions(shadow.state,'player').reduce((sum,card)=>sum+Number(card.counter||0),0);
      const force=Math.min(required,counterCapacity)/1000;
      let score=positionScore(shadow.state)*.08+force*4;
      if(target.kind==='leader'){
        const doubleAttack=(attacker.keywords||[]).includes('doubleAttack')||(attacker.keywords||[]).includes('double attack');
        const likelyDamage=required>counterCapacity;
        score+=28+(4-foe.life.length)*12+(likelyDamage?52:0)+(doubleAttack?35:0);
        if(outlook.lethal)score+=700;
        if(foe.life.length<=1&&likelyDamage)score+=1000;
      }else{
        const card=foe.field.find(item=>item.uid===target.uid);
        const value=Number(card?.cost||0)*5+Number(card?.power||0)/1000*3+((card?.keywords||[]).includes('blocker')?18:0);
        score+=value+(required>counterCapacity?30:0)-8;
        if(outlook.lethal)score+=((card?.keywords||[]).includes('blocker')?80:-500);
      }
      choices.push({attacker,target,score});
    }
  }
  return choices.sort((a,b)=>b.score-a.score||battlePower(b.attacker)-battlePower(a.attacker)||String(a.attacker.id).localeCompare(String(b.attacker.id))||String(a.target.uid).localeCompare(String(b.target.uid)))[0]||null;
};
export async function runAiTurn(engine,speed=500,onStep=()=>{}){let g=engine.state;const pace=Math.max(1000,Number(speed)||500),show=async text=>{engine.log(`AI行動：${text}`);onStep();await wait(pace)},attempted=new Set();let steps=0;while((g=engine.state).activeSide==='ai'&&!g.winner){if(++steps>100){engine.log('AI行動：安全処理によりターンを終了します');if(g.pending?.kind==='battle')engine.endBattle();if(g.phase!=='main'&&!g.pending)g.phase='main';await engine.endTurn('ai');onStep();return}if(g.pending)return;
const hasUnattacked=[g.sides.ai.leader,...g.sides.ai.field].some(card=>!attempted.has(card.uid)&&legalAttack(g,'ai',card));
const p=await chooseBestPlay(engine,attempted,hasUnattacked);
if(p){await show(`${p.name}を登場・使用します`);const played=await engine.playCard('ai',p.uid);onStep();await wait(650);if(!played)attempted.add(p.uid);
if(played&&p.id==='OP09-093'&&typeof engine.useTeach10==='function'){
  const foe=g.sides.player;
  const target=foe.field.slice().sort((a,b)=>Number(b.cost||0)-Number(a.cost||0)||Number(b.power||0)-Number(a.power||0))[0]||null;
  if(engine.useTeach10('ai',target?.uid||null)){
    await show('10コスト・ティーチで相手リーダー'+(target?'と'+target.name:'')+'の効果を無効にします');
  }
}
continue}
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
  const ready=[own.leader,...own.field].filter(card=>legalAttack(g,'ai',card));
  if(own.don.active>0&&ready.length){
    let attached=0;
    if(own.leader?.id==='OP13-001'&&ready.some(card=>card.uid===own.leader.uid)&&own.don.active>0){
      if(engine.attachDon('ai',own.leader.uid,1))attached++;
    }
    const outlookNow=combatOutlook(g,attempted);
    const reserve=outlookNow.lethal?0:desiredLuffyDefenseDon(g);
    let spendable=Math.max(0,own.don.active-reserve);
    const leaderPower=Number(g.sides.player.leader?.power||0)+Number(g.sides.player.leader?.tempPower||0);
    const lines=outlookNow.lethal?[leaderPower,leaderPower+2000,leaderPower+4000]:[leaderPower,leaderPower+2000];
    for(const line of lines){
      const candidates=ready.map(card=>({card,need:Math.max(0,Math.ceil((line-battlePower(card))/1000))}))
        .filter(item=>item.need>0&&item.need<=spendable)
        .sort((a,b)=>a.need-b.need||battlePower(a.card)-battlePower(b.card));
      while(candidates.length&&spendable>0){
        const item=candidates.shift();
        if(item.need>spendable)continue;
        if(engine.attachDon('ai',item.card.uid,item.need)){attached+=item.need;spendable-=item.need}
      }
    }
    if(spendable>0&&(outlookNow.lethal||g.sides.player.life.length<=2)){
      const finisher=ready.slice().sort((a,b)=>{
        const bd=(b.keywords||[]).includes('doubleAttack')?1:0,ad=(a.keywords||[]).includes('doubleAttack')?1:0;
        return bd-ad||battlePower(b)-battlePower(a);
      })[0];
      if(finisher&&engine.attachDon('ai',finisher.uid,spendable)){attached+=spendable;spendable=0}
    }
    if(attached>0){
      await show('有効な攻撃ラインへDON!!を'+attached+'枚配分します');
      continue;
    }
  }
}
const attackChoice=await chooseBestAttack(engine,attempted);if(attackChoice){const a=attackChoice.attacker,target=attackChoice.target,targetCard=target.kind==='leader'?g.sides.player.leader:g.sides.player.field.find(c=>c.uid===target.uid);await show(`${a.name}（${battlePower(a)}）で${targetCard?.name||'対象'}（${targetPower(g,target)}）へ攻撃します`);attempted.add(a.uid);const declared=await engine.declareAttack('ai',a.uid,target.uid);onStep();if(!declared){a.aiAttackSkippedTurn=g.turn;engine.log(`AI行動：${a.name}の攻撃は実行できないためスキップします`);onStep();continue}if(g.pending?.defendingSide==='player')return;await engine.autoResolveDefense();onStep();await wait(650);continue}await show('行動を終えてターンを終了します');const ended=await engine.endTurn('ai');if(!ended&&!g.pending){g.phase='main';await engine.endTurn('ai')}onStep();return}}
export function chooseDefense(g,s,a){
  const own=g.sides[s],needed=Math.max(0,Number(a.power||0)-Number(a.targetPower||0)+1000);
  if(needed<=0)return{counters:[]};
  const attackingSide=s==='player'?'ai':'player',attacker=[g.sides[attackingSide].leader,...g.sides[attackingSide].field].find(card=>card.uid===a.attackerUid);
  const doubleAttack=(attacker?.keywords||[]).includes('doubleAttack')||(attacker?.keywords||[]).includes('double attack');
  const availableBlockers=blockers(g,s).sort((x,y)=>(Number(x.power||0)-Number(y.power||0))||(Number(x.cost||0)-Number(y.cost||0))||String(x.id).localeCompare(String(y.id)));
  if(availableBlockers.length&&a.targetKind==='leader'&&(own.life.length<=2||doubleAttack||needed>=4000))return{blockerUid:availableBlockers[0].uid,counters:[]};
  const options=counterOptions(g,s).slice(0,14),floor=own.life.length<=1?0:2,maxUse=Math.max(0,own.hand.length-floor);
  let best=null;
  const limit=1<<options.length;
  for(let mask=1;mask<limit;mask++){
    let total=0,count=0,ids=[];
    for(let i=0;i<options.length;i++)if(mask&(1<<i)){total+=Number(options[i].counter||0);count++;ids.push(options[i].uid)}
    if(count>maxUse||total<needed)continue;
    const candidate={ids,total,count};
    if(!best||candidate.total-needed<best.total-needed||(candidate.total===best.total&&candidate.count<best.count)|| (candidate.total===best.total&&candidate.count===best.count&&candidate.ids.join().localeCompare(best.ids.join())<0))best=candidate;
  }
  return{counters:best?.ids||[]};
}
