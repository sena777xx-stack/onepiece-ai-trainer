import{legalPlay,legalAttack,attackTargets,counterOptions,blockers}from'./rule-engine-v3.js?v=3441';import{recordAiTurn,getAiPolicyBias,getCardLearningBonus}from'./ai-telemetry.js?v=3513';const wait=ms=>new Promise(r=>setTimeout(r,ms));
const battlePower=card=>(card.power||0)+(card.attachedDon||0)*1000+(card.tempPower||0);
const targetPower=(g,target)=>{const foe=g.sides.player,card=target.kind==='leader'?foe.leader:foe.field.find(c=>c.uid===target.uid);return(card?.power||0)+(card?.tempPower||0)};
/* Teach can turn a leader attack into a battle against one of his characters.
   Treat the strongest redirect body as the real defensive line so Luffy does
   not waste several 5k/7k attacks into a waiting 10-cost Teach. */
const leaderPressurePower=g=>{
  const foe=g.sides.player,base=Number(foe.leader?.power||0)+Number(foe.leader?.tempPower||0);
  if(foe.leader?.id!=='OP16-080'||foe.hand.length===0)return base;
  const redirectBodies=foe.field.filter(card=>!card.rested||Number(card.power||0)>=7000);
  return Math.max(base,...redirectBodies.map(battlePower));
};
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
  const hasDance=own.hand.some(card=>card.id==='OP05-038');
  const hasPaidCounter=own.hand.some(card=>['OP12-037','OP13-040'].includes(card.id));
  const eventReserve=hasDance?2:hasPaidCounter?1:0;
  const incoming=[g.sides.player.leader,...g.sides.player.field].filter(card=>(card.preventAttackThroughTurn??-1)<g.turn+1).length;
  const negatedUntil=Number(own.leader.effectsNegatedThroughTurn??own.leader.effectsNegatedTurn??-1);
  const leaderEffectAvailable=negatedUntil<g.turn;
  /* Never reserve DON!! for Luffy's leader effect while 10-cost Teach has
     negated it. Keep only DON!! that can actually pay a Counter event. */
  const leaderReserve=!leaderEffectAvailable?0:own.life.length===0?Math.min(5,Math.max(3,incoming))
    :own.life.length===1?Math.min(4,Math.max(2,incoming)):1;
  return Math.min(own.don.active,Math.max(eventReserve,leaderReserve));
};
const playScore=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,turns=g.turnsTaken?.ai||0;
  if(card.type==='stage')return own.stage?-1000:(card.id==='OP09-099'?104:card.id==='ST31-005'?130:55);
  if(own.leader?.id==='OP16-080'){
    if(card.id==='OP09-093')return 220+(foe.field.length*9)+(foe.leader?.id==='OP13-001'?95:0)+(own.life.length<=2?20:0);
    if(card.id==='OP16-116')return 182+(foe.life.length<=2?24:0)+(own.hand.some(target=>target.uid!==card.uid&&target.id==='OP09-093')?72:0);
    if(card.id==='OP16-119')return 155+(own.life.length<=2?24:0);
    if(card.id==='EB04-058')return 150+(own.life.length<=2?55:0);
    if(card.id==='EB04-059')return 135+foe.field.filter(target=>engineCost(g,'player',target)<=6).length*14;
    if(card.id==='OP16-108')return 124+(own.trash.some(target=>(target.traits||[]).includes('黒ひげ海賊団')&&Number(target.cost||0)<=6)?18:0);
    if(card.id==='OP16-115')return 118+own.trash.filter(hasTrigger).length*5+(own.trash.some(target=>target.id==='OP16-116')&&own.hand.some(target=>target.id==='OP09-093')?48:0);
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
  if(card.id==='OP14-031')return 108+(own.life.length<=2?30:0)+foe.field.filter(c=>!c.rested&&engineCost(g,'player',c)<=8).length*8;
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
const luffyDonPlanBonus=(g,card)=>{
  const own=g.sides.ai;
  if(own.leader?.id!=='OP13-001')return 0;
  const immediate={ 'OP13-037':2,'OP13-027':2,'OP13-118':4 }[card.id]||0;
  const endTurn={ 'OP14-022':2,'OP14-031':5,'OP13-027':1 }[card.id]||0;
  if(!immediate&&!endTurn)return 0;
  const cost=Math.max(0,Number(card.cost||0));
  const restedAfterCost=Math.max(0,Number(own.don?.rested||0)+Math.min(cost,Number(own.don?.active||0)));
  const restoredNow=Math.min(immediate,restedAfterCost);
  const activeAfter=Math.max(0,Number(own.don?.active||0)-cost+restoredNow);
  const followUps=own.hand.filter(next=>next.uid!==card.uid&&Number(next.cost||99)<=activeAfter&&next.type!=='event').length;
  const endValue=Math.min(endTurn,Number(own.don?.total||0))*(own.life.length<=2?15:10);
  let bonus=restoredNow*24+Math.min(3,followUps)*10+endValue;
  if(card.id==='OP13-118'&&restoredNow>=3)bonus+=28;
  if(card.id==='OP14-031'&&own.life.length<=2)bonus+=24;
  if(restoredNow===0&&endTurn===0)bonus-=20;
  return bonus;
};
const deckPlanBonus=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,turns=g.turnsTaken?.ai||0;
  const first=g.firstPlayer==='ai',don=Number(own.don?.total||0),foeId=foe.leader?.id;
  const copiesOnBoard=own.field.filter(item=>item.id===card.id).length;
  let bonus=0;

  if(own.leader?.id==='OP13-001'){
    bonus+=luffyDonPlanBonus(g,card);
    if(card.id==='ST31-005'&&!own.stage)bonus+=turns<=2?85:30;
    if(['OP01-016','EB02-017','EB04-002'].includes(card.id))bonus+=turns<=2?55:own.hand.length<=4?32:8;
    if(don>=4&&don<=6&&['OP13-037','OP13-027','OP14-022','OP15-032'].includes(card.id))bonus+=first?26:34;
    if(['OP13-118','ST31-004','EB04-007'].includes(card.id)){
      bonus+=foe.life.length<=2?58:24;
      if(foeId==='OP16-080')bonus+=18;
    }
    if(['OP10-011','OP14-031'].includes(card.id))bonus+=own.life.length<=2?52:(first?12:24);
    if(card.id==='ST21-003')bonus+=foe.life.length<=1?120:-180;
  }

  if(own.leader?.id==='OP16-080'){
    if(card.id==='OP09-099'&&!own.stage)bonus+=turns<=2?80:28;
    if(['OP16-103','OP16-109','OP16-110'].includes(card.id))bonus+=turns<=3?44:8;
    if(card.id==='OP16-109')bonus+=foe.field.filter(target=>engineCost(g,'player',target)<=1).length*30;
    if(card.id==='OP09-096')bonus+=turns<=3?48:12;
    if(card.id==='OP09-093')bonus+=don>=10?95:-80;
    if(card.id==='OP16-119')bonus+=own.life.length<=2?52:18;
    if(card.id==='EB04-058')bonus+=own.life.length<=2?70:15;
    if(foeId==='OP13-001'&&['OP09-093','EB04-059','OP16-109'].includes(card.id))bonus+=24;
  }

  bonus-=copiesOnBoard*32;
  if(Number(card.counter||0)>=2000&&own.life.length<=2)bonus-=48;
  if(own.hand.length<=3&&Number(card.counter||0)>=1000)bonus-=18;
  return bonus;
};
const combatOutlook=(g,attempted=new Set())=>{
  const own=g.sides.ai,foe=g.sides.player;
  const attackers=[own.leader,...own.field].filter(card=>!attempted.has(card.uid)&&legalAttack(g,'ai',card));
  const leaderPower=leaderPressurePower(g);
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
  const own=g.sides.ai,foe=g.sides.player;
  const searchers=new Set(['ST31-005','OP01-016','EB02-017','EB04-002','OP09-096']);
  if(searchers.has(card.id)&&own.hand.length<=7)return true;
  if(['OP13-118','ST31-004','EB04-007'].includes(card.id))return true;
  if(card.id==='OP14-031'){
    const legalRestTargets=foe.field.filter(target=>!target.rested&&engineCost(g,'player',target)<=8);
    const readyPower=Math.max(0,...[own.leader,...own.field].filter(target=>legalAttack(g,'ai',target)).map(battlePower));
    const canOpenAttack=legalRestTargets.some(target=>(target.keywords||[]).includes('blocker')||(Number(target.cost||0)>=5&&readyPower>=Number(target.power||0)+Number(target.tempPower||0)));
    const urgentDefense=own.life.length===0&&legalRestTargets.some(target=>Number(target.power||0)+Number(target.tempPower||0)>=7000);
    /* Against Teach, attack before deploying Nami unless resting a Blocker is
       immediately useful. Otherwise Vasco Shot can be redirected into the
       attack, get K.O.'d, and rest the newly played Nami before defense. */
    if(foe.leader?.id==='OP16-080')return canOpenAttack;
    return canOpenAttack||urgentDefense||legalRestTargets.length>=2;
  }
  /* Log-derived correction: with a large hand and open field slots, develop
     real attackers before converting all remaining DON!! into one attack. */
  const affordable=card.type==='character'&&Number(card.cost||0)<=Number(own.don.active||0);
  const lowDefenseCost=Number(card.counter||0)<2000;
  if(affordable&&lowDefenseCost&&own.field.length<4&&own.hand.length>=6)return true;
  if(own.leader?.id==='OP13-001'&&own.life.length===0&&affordable&&lowDefenseCost&&['ST31-004','OP14-022','OP13-037','OP13-027','OP15-032','EB04-007'].includes(card.id))return true;
  if(own.leader?.id==='OP16-080'&&affordable&&lowDefenseCost&&own.field.length<3&&['OP16-103','OP16-108','OP16-109','OP16-110','OP09-086','OP16-119'].includes(card.id))return true;
  if(card.id==='ST21-003')return foe.life.length<=1&&foe.field.some(target=>!target.rested&&(target.keywords||[]).includes('blocker'));
  if(card.id==='OP09-093')return foe.leader?.id==='OP13-001'||foe.life.length<=1||foe.field.some(target=>(target.effects||[]).length>0&&Number(target.power||0)>=7000);
  if(card.id==='EB04-059')return foe.field.some(target=>!target.rested&&engineCost(g,'player',target)<=6&&((target.keywords||[]).includes('blocker')||Number(target.power||0)>=7000||Number(target.cost||0)>=5));
  return false;
};
const stableChoiceIndex=(g,cards)=>{
  const text=[g.turn,g.firstPlayer,g.sides.ai.life.length,g.sides.player.life.length,...g.sides.ai.hand.map(card=>card.id),...g.sides.ai.field.map(card=>card.id),...g.sides.player.field.map(card=>card.id)].join('|');
  let hash=2166136261;
  for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}
  return cards.length?Math.abs(hash) % cards.length:0;
};
const inMatchVarietyBonus=(g,card)=>{
  const played=g._aiPlayedCards?.ai||[],same=played.filter(id=>id===card.id).length;
  const distinct=new Set(played).size;
  return -Math.min(18,same*7)+(same===0&&distinct>1?3:0);
};
const chooseBestPlay=async(engine,attempted,preCombatOnly=false,training=false)=>{
  const g=engine.state,ownNow=g.sides.ai,beforeCombatNow=combatOutlook(g,attempted),defenseReserve=beforeCombatNow.lethal?0:desiredLuffyDefenseDon(g),candidates=ownNow.hand.filter(card=>legalPlay(g,'ai',card)&&!attempted.has(card.uid)&&usefulMainEvent(g,card)&&(ownNow.leader?.id!=='OP13-001'||beforeCombatNow.lethal||ownNow.don.active-Number(card.cost||0)>=defenseReserve));
  const beforeCombat=combatOutlook(g,attempted),evaluated=[];
  if(training){
    const ranked=candidates.map(card=>({card,score:playScore(g,card)+matchupPlayBonus(g,card)+deckPlanBonus(g,card)+getCardLearningBonus(g,card)+inMatchVarietyBonus(g,card)})).filter(item=>!preCombatOnly||preCombatPlayUseful(g,item.card)).sort((a,b)=>b.score-a.score||String(a.card.id).localeCompare(String(b.card.id)));
    return ranked[0]?.card||null;
  }
  for(const card of candidates){
    const shadow=cloneForLookahead(engine);
    let success=false;
    try{success=Boolean(await shadow.playCard('ai',card.uid))}catch{}
    if(!success){evaluated.push({card,score:-1e9});continue}
    const afterCombat=combatOutlook(shadow.state,attempted);
    const removedBlocker=afterCombat.activeBlockers<beforeCombat.activeBlockers;
    const tactical=preCombatPlayUseful(g,card)||(!beforeCombat.lethal&&afterCombat.lethal)||removedBlocker||afterCombat.score>=beforeCombat.score+24;
    if(preCombatOnly&&!tactical)continue;
    let score=positionScore(shadow.state)+playScore(g,card)*.08+matchupPlayBonus(g,card)+deckPlanBonus(g,card)+getCardLearningBonus(g,card)+inMatchVarietyBonus(g,card)+(afterCombat.score-beforeCombat.score)*2;
    const safetyBefore=opponentTurnRisk(g),safetyAfter=opponentTurnRisk(shadow.state);
    score+=(safetyBefore-safetyAfter)*1.8;
    const defensiveCardCost=Number(card.counter||0)>=2000?(g.sides.ai.life.length<=2?58:22):Number(card.counter||0)/120;
    const handAfter=shadow.state.sides.ai.hand.length;
    /* Convert oversized hands into board pressure instead of ending with
       several playable cards and unused DON!!. Preserve 2k counters. */
    if(g.sides.ai.hand.length>=7&&g.sides.ai.field.length<5&&card.type==='character'&&Number(card.counter||0)<2000){
      score+=28+(g.sides.ai.hand.length-6)*9;
      if(Number(card.cost||0)>=3)score+=16;
    }
    score-=defensiveCardCost;
    if(handAfter<=2&&g.sides.ai.life.length<=2)score-=55;
    if(preCombatOnly&&!preCombatPlayUseful(g,card)&&beforeCombat.lethal)score-=2200;
    if(!training&&!preCombatOnly&&!shadow.state.pending){
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
  const ranked=evaluated.sort((a,b)=>b.score-a.score||playScore(g,b.card)-playScore(g,a.card)||String(a.card.id).localeCompare(String(b.card.id))||String(a.card.uid).localeCompare(String(b.card.uid)));
  if(!ranked.length)return null;
  const best=ranked[0],critical=best.score>=1000||beforeCombat.lethal;
  if(critical)return best.card;
  const near=ranked.filter(item=>best.score-item.score<=6).slice(0,3);
  return near[stableChoiceIndex(g,near)]?.card||best.card;
};
const teachSearchPriority=(g,card)=>{
  const own=g.sides.ai,foe=g.sides.player,turns=g.turnsTaken?.ai||0;
  let score=playScore(g,card)+deckPlanBonus(g,card)+Number(card.counter||0)/250;
  if(card.id==='OP09-099'&&!own.stage)score+=45;
  if(['OP16-103','OP16-109','OP16-110'].includes(card.id)&&turns<=3)score+=30;
  if(card.id==='OP16-109'&&foe.field.some(target=>engineCost(g,'player',target)<=1))score+=45;
  if(card.id==='EB04-058'&&own.life.length<=2)score+=55;
  if(['OP16-119','OP09-093','OP16-116'].includes(card.id)&&own.don.total>=7)score+=50;
  score-=own.hand.filter(item=>item.id===card.id).length*14;
  return score;
};
const teachDiscardPenalty=(g,card)=>{
  const own=g.sides.ai;
  let penalty=Number(card.counter||0)/180+Math.max(0,playScore(g,card))*.18;
  if((card.effects||[]).some(effect=>effect.timing==='trigger'))penalty+=12;
  if(['OP09-093','OP16-119','OP16-116','EB04-058'].includes(card.id))penalty+=20;
  penalty-=Math.max(0,own.hand.filter(item=>item.id===card.id).length-1)*16;
  return penalty;
};
const attackOrders=cards=>{
  if(cards.length<=1)return[cards];
  const limited=cards.slice(0,6),power=card=>battlePower(card),isDouble=card=>(card.keywords||[]).some(keyword=>keyword==='doubleAttack'||keyword==='double attack');
  const candidates=[
    limited,
    limited.slice().sort((a,b)=>power(b)-power(a)||String(a.uid).localeCompare(String(b.uid))),
    limited.slice().sort((a,b)=>power(a)-power(b)||String(a.uid).localeCompare(String(b.uid))),
    limited.slice().sort((a,b)=>(isDouble(b)?1:0)-(isDouble(a)?1:0)||power(b)-power(a)),
    limited.slice().sort((a,b)=>(isDouble(a)?1:0)-(isDouble(b)?1:0)||power(a)-power(b))
  ];
  const seen=new Set();return candidates.filter(order=>{const key=order.map(card=>card.uid).join('|');if(seen.has(key))return false;seen.add(key);return true});
};
const bestLeaderAttackSequence=(g,attackers)=>{
  const foe=g.sides.player,leaderPower=Number(foe.leader?.power||0)+Number(foe.leader?.tempPower||0);
  const blockerCount=foe.field.filter(card=>!card.rested&&(card.keywords||[]).includes('blocker')).length;
  const estimatedStart=Math.max(0,foe.hand.length-1)*900+(foe.life.length<=1?700:0);
  let best={order:[],win:false,score:-Infinity,remainingLife:foe.life.length};
  for(const order of attackOrders(attackers)){
    let life=foe.life.length,counter=estimatedStart,blocks=blockerCount,win=false,used=0,forced=0;
    for(const attacker of order){
      used++;
      const power=battlePower(attacker),required=Math.max(0,power-leaderPower+1000);
      const doubleAttack=(attacker.keywords||[]).includes('doubleAttack')||(attacker.keywords||[]).includes('double attack');
      const shouldBlock=blocks>0&&(doubleAttack||power>=leaderPower+2000||life<=1);
      if(shouldBlock){blocks--;continue}
      if(counter>=required&&required>0){counter-=required;forced+=required;continue}
      if(life===0){win=true;break}
      life=Math.max(0,life-(doubleAttack?2:1));
    }
    const score=(win?10000:0)+(foe.life.length-life)*420+forced/120+Math.max(0,estimatedStart-counter)/180-blocks*35-used*(win?8:0);
    if(score>best.score)best={order,win,score,remainingLife:life};
  }
  return best;
};
const chooseBestAttack=async(engine,attempted,training=false)=>{
  const g=engine.state,own=g.sides.ai,foe=g.sides.player;
  const targets=attackTargets(g,'ai').filter(target=>target.kind==='leader'||foe.field.find(card=>card.uid===target.uid)?.rested);
  const attackers=[own.leader,...own.field].filter(card=>(card.preventAttackThroughTurn??-1)<g.turn&&!attempted.has(card.uid)&&card.aiAttackSkippedTurn!==g.turn&&legalAttack(g,'ai',card));
  const outlook=combatOutlook(g,attempted),policy=getAiPolicyBias(g),sequence=bestLeaderAttackSequence(g,attackers),choices=[];
  if(training){
    const ordered=sequence.order.length?sequence.order:attackers.slice().sort((a,b)=>battlePower(b)-battlePower(a));
    for(const attacker of ordered){const target=chooseAiAttackTarget(g,attacker,targets);if(target&&battlePower(attacker)>=targetPower(g,target))return{attacker,target,score:0}}
    return null;
  }
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
      const estimatedCounter=Math.max(0,foe.hand.length-1)*900+(foe.life.length<=1?700:0);
      const redirectPower=target.kind==='leader'?leaderPressurePower(g):Number(battle.targetPower||0);
      const redirectGap=Math.max(0,redirectPower-Number(battle.power||0));
      const force=Math.min(required,estimatedCounter)/1000;
      let score=positionScore(shadow.state)*.08+force*4;
      if(target.kind==='leader'){
        if(sequence.order[0]?.uid===attacker.uid)score+=sequence.win?2400:90;
        else if(sequence.win)score-=500;
        const doubleAttack=(attacker.keywords||[]).includes('doubleAttack')||(attacker.keywords||[]).includes('double attack');
        const likelyDamage=required>estimatedCounter;
        score+=28+(4-foe.life.length)*12+(likelyDamage?52:0)+(doubleAttack?35:0);
        if(foe.leader?.id==='OP16-080'&&foe.hand.length){
          if(redirectGap>0)score-=420+redirectGap/10;
          else score+=90;
        }
        score+=policy.aggression+policy.efficiency*.35;
        const attackMargin=Math.max(0,Number(battle.power||0)-redirectPower);
        const efficientPressure=attackMargin>=1000&&attackMargin<=3000;
        if(efficientPressure)score+=foe.hand.length>=5?42:24;
        score-=Math.max(0,attackMargin-5000)/250;
        if(outlook.lethal)score+=700+(doubleAttack?70:0)+(attackMargin<=3000?85:0);
        if(foe.life.length<=1&&likelyDamage)score+=1000;
      }else{
        const card=foe.field.find(item=>item.uid===target.uid);
        const value=Number(card?.cost||0)*5+Number(card?.power||0)/1000*3+((card?.keywords||[]).includes('blocker')?18:0);
        score+=value+(required>estimatedCounter?30:0)-8;
        score-=policy.aggression*.4;
        if(outlook.lethal||sequence.win)score+=((card?.keywords||[]).includes('blocker')?80:-700);
      }
      choices.push({attacker,target,score});
    }
  }
  return choices.sort((a,b)=>b.score-a.score||(outlook.lethal?battlePower(a.attacker)-battlePower(b.attacker):battlePower(b.attacker)-battlePower(a.attacker))||String(a.attacker.id).localeCompare(String(b.attacker.id))||String(a.target.uid).localeCompare(String(b.target.uid)))[0]||null;
};
const resolveAiPostPlayChoices=async engine=>{
  for(let guard=0;guard<8;guard++){
    const pending=engine.state.pending;
    if(!pending||pending.side!=='ai')break;
    const own=engine.state.sides.ai;
    if(pending.kind==='teach119OnPlayChoice'){
      const chosen=(pending.cards||[]).slice().sort((a,b)=>(hasTrigger(b)?1:0)-(hasTrigger(a)?1:0)||teachSearchPriority(engine.state,b)-teachSearchPriority(engine.state,a))[0];
      engine.resolveTeachKoChoice('ai',chosen?[chosen.uid]:[]);
    }else if(pending.kind==='borsalinoLifeChoice'&&typeof engine.resolveBorsalinoChoice==='function'){
      engine.resolveBorsalinoChoice('ai',own.life.length<=2&&own.deck.length>0);
    }else if(pending.kind==='shiryuDiscardChoice'&&typeof engine.resolveShiryuChoice==='function'){
      const hasLifeTarget=own.trash.some(card=>Number(card.cost||99)<=6&&(card.traits||[]).includes('黒ひげ海賊団'));
      const discard=hasLifeTarget&&own.hand.length>=3?own.hand.slice().sort((a,b)=>teachDiscardPenalty(engine.state,a)-teachDiscardPenalty(engine.state,b))[0]:null;
      engine.resolveShiryuChoice('ai',discard?.uid||null);
    }else if(pending.kind==='shiryuLifeChoice'&&typeof engine.resolveShiryuChoice==='function'){
      const chosen=(pending.options||[]).map(uid=>own.trash.find(card=>card.uid===uid)).filter(Boolean).sort((a,b)=>teachSearchPriority(engine.state,b)-teachSearchPriority(engine.state,a))[0];
      engine.resolveShiryuChoice('ai',chosen?.uid||null);
    }else if(pending.kind==='luffyNamiSearch'&&typeof engine.resolveLuffyNamiSearch==='function'){
      const chosen=(pending.cards||[]).filter(card=>(pending.options||[]).includes(card.uid)).sort((a,b)=>(playScore(engine.state,b)+deckPlanBonus(engine.state,b))-(playScore(engine.state,a)+deckPlanBonus(engine.state,a)))[0];
      engine.resolveLuffyNamiSearch('ai',chosen?.uid||null);
    }else break;
  }
};
export async function runAiTurn(engine,speed=500,onStep=()=>{},training=false){let g=engine.state;const openingOutlook=combatOutlook(g),fast=Number(speed)===0,pace=fast?0:Math.max(1000,Number(speed)||500),settle=fast?0:650,show=async text=>{engine.log(`AI行動：${text}`);onStep();await wait(pace)},attempted=new Set();let steps=0;while((g=engine.state).activeSide==='ai'&&!g.winner){if(++steps>100){recordAiTurn(engine.state,{stall:true,lethalMiss:openingOutlook.lethal,donWasted:engine.state.sides.ai.don.active});engine.log('AI行動：安全処理によりターンを終了します');if(g.pending?.kind==='battle')engine.endBattle();if(g.phase!=='main'&&!g.pending)g.phase='main';await engine.endTurn('ai');onStep();return}if(g.pending)return;
if(!attempted.has('__hachinosu__')){
  attempted.add('__hachinosu__');
  const own=g.sides.ai,stage=own.stage;
  if(stage?.id==='OP09-099'&&!stage.rested&&own.deck.length>=3&&own.hand.length>=4&&typeof engine.beginHachinosu==='function'){
    const discard=own.hand.slice().sort((a,b)=>teachDiscardPenalty(g,a)-teachDiscardPenalty(g,b)||String(a.id).localeCompare(String(b.id)))[0];
    const started=discard&&engine.beginHachinosu('ai',discard.uid);
    if(started?.cards){
      const chosen=started.cards.filter(card=>(card.traits||[]).includes('黒ひげ海賊団')).sort((a,b)=>teachSearchPriority(g,b)-teachSearchPriority(g,a))[0];
      engine.finishHachinosu('ai',chosen?.uid||null);
      await show('ハチノスで不要札を入れ替え、必要なカードを探します');
      continue;
    }
  }
}
const hasUnattacked=[g.sides.ai.leader,...g.sides.ai.field].some(card=>!attempted.has(card.uid)&&legalAttack(g,'ai',card));
const p=await chooseBestPlay(engine,attempted,hasUnattacked,training);
if(p){await show(`${p.name}を登場・使用します`);const played=await engine.playCard('ai',p.uid);if(played){g._aiPlayedCards??={player:[],ai:[]};g._aiPlayedCards.ai.push(p.id);await resolveAiPostPlayChoices(engine);}onStep();await wait(settle);if(!played)attempted.add(p.uid);
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
    const outlookNow=combatOutlook(g,attempted);
    const reserve=outlookNow.lethal?0:desiredLuffyDefenseDon(g);
    if(own.leader?.id==='OP13-001'&&ready.some(card=>card.uid===own.leader.uid)&&own.don.active>reserve){
      if(engine.attachDon('ai',own.leader.uid,1))attached++;
    }
    let spendable=Math.max(0,own.don.active-reserve);
    const leaderPower=leaderPressurePower(g);
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
const attackChoice=await chooseBestAttack(engine,attempted,training);if(attackChoice){const a=attackChoice.attacker,target=attackChoice.target,targetCard=target.kind==='leader'?g.sides.player.leader:g.sides.player.field.find(c=>c.uid===target.uid);await show(`${a.name}（${battlePower(a)}）で${targetCard?.name||'対象'}（${targetPower(g,target)}）へ攻撃します`);attempted.add(a.uid);const declared=await engine.declareAttack('ai',a.uid,target.uid);onStep();if(!declared){a.aiAttackSkippedTurn=g.turn;engine.log(`AI行動：${a.name}の攻撃は実行できないためスキップします`);onStep();continue}if(g.pending?.defendingSide==='player')return;await engine.autoResolveDefense();onStep();await wait(settle);continue}await show('行動を終えてターンを終了します');recordAiTurn(g,{lethalMiss:openingOutlook.lethal&&!g.winner,donWasted:g.sides.ai.don.active});const ended=await engine.endTurn('ai');if(!ended&&!g.pending){g.phase='main';await engine.endTurn('ai')}onStep();return}}
const defenseHandKeepValue=card=>{
  let value=Number(card.counter||0)/1000;
  if(card.id==='ST21-003')value+=12;
  if(['OP12-112','OP16-104','EB04-002'].includes(card.id))value+=7;
  if(['OP10-011','OP14-031','EB04-058'].includes(card.id))value+=6;
  if(luffyRestoreIds.has(card.id))value+=5;
  if(Number(card.cost||0)>=7)value+=4;
  return value;
};
const blockerSacrificeValue=card=>Number(card.cost||0)*1.5+Number(card.power||0)/2000+((card.effects||[]).some(effect=>effect.timing==='onKO')?-5:0);
export function chooseDefense(g,s,a){
  const own=g.sides[s],policy=s==='ai'?getAiPolicyBias(g):{safety:0};
  const needed=Math.max(0,Number(a.power||0)-Number(a.targetPower||0)+1000);
  if(needed<=0)return{counters:[]};

  const attackingSide=s==='player'?'ai':'player',enemy=g.sides[attackingSide];
  const attacker=[enemy.leader,...enemy.field].find(card=>card.uid===a.attackerUid);
  const target=a.targetKind==='leader'?own.leader:own.field.find(card=>card.uid===a.targetUid);
  const doubleAttack=(attacker?.keywords||[]).includes('doubleAttack')||(attacker?.keywords||[]).includes('double attack');
  const remainingAttackers=[enemy.leader,...enemy.field].filter(card=>card.uid!==a.attackerUid&&legalAttack(g,attackingSide,card)).length;
  const hitDamage=doubleAttack?2:1;
  const lifeAfterHit=Math.max(0,own.life.length-hitDamage);
  const lethalFollowup=own.life.length===0||hitDamage>own.life.length||(lifeAfterHit===0&&remainingAttackers>0);
  const mustGuard=a.targetKind==='leader'&&lethalFollowup;

  const targetHasKoValue=Boolean(target&&(target.effects||[]).some(effect=>effect.timing==='onKO')&&(target.effectsNegatedThroughTurn??target.effectsNegatedTurn??-1)<g.turn);
  const targetIsBlocker=Boolean((target?.keywords||[]).includes('blocker'));
  const targetBoardValue=target?Number(target.cost||0)*1.5+Number(target.power||0)/2000+(targetIsBlocker?5:0)-(targetHasKoValue?5:0):0;

  if(a.targetKind==='character'&&targetHasKoValue&&own.life.length>0)return{counters:[]};
  if(a.targetKind==='character'&&targetBoardValue<4&&needed>=2000)return{counters:[]};

  const futureReserve=Math.min(3,remainingAttackers);
  const baseFloor=own.life.length<=1?futureReserve:own.life.length===2?Math.max(1,futureReserve-1):2;
  const options=counterOptions(g,s).filter(card=>{
    if(card.id==='OP05-038')return own.don.active>=2;
    if(['OP12-037','OP13-040'].includes(card.id))return a.targetKind==='leader'&&own.don.active>=1;
    return true;
  }).slice(0,14),maxUse=Math.max(0,own.hand.length-baseFloor);
  let best=null;
  const limit=1<<options.length;
  for(let mask=1;mask<limit;mask++){
    let total=0,count=0,loss=0,ids=[];
    for(let i=0;i<options.length;i++)if(mask&(1<<i)){
      total+=Number(options[i].counter||0);
      count++;
      loss+=defenseHandKeepValue(options[i]);
      ids.push(options[i].uid);
    }
    if(count>maxUse||total<needed)continue;
    const waste=(total-needed)/1000;
    const candidate={ids,total,count,loss,score:loss+waste*1.9+count*.55};
    if(!best||candidate.score<best.score||
       (candidate.score===best.score&&candidate.total<best.total)||
       (candidate.score===best.score&&candidate.total===best.total&&candidate.ids.join().localeCompare(best.ids.join())<0))best=candidate;
  }

  const availableBlockers=blockers(g,s).sort((x,y)=>blockerSacrificeValue(x)-blockerSacrificeValue(y)||String(x.id).localeCompare(String(y.id)));
  const cheapestBlocker=availableBlockers[0];
  if(cheapestBlocker&&a.targetKind==='leader'){
    const blockCost=blockerSacrificeValue(cheapestBlocker);
    const counterCost=best?best.score:Infinity;
    const useBlocker=mustGuard&&(counterCost===Infinity||needed>=5000||blockCost<=counterCost+1.5)||
      (doubleAttack&&own.life.length<=2&&blockCost<=counterCost);
    if(useBlocker)return{blockerUid:cheapestBlocker.uid,counters:[]};
  }

  if(a.targetKind==='leader'&&!mustGuard){
    if(own.life.length>=3&&!doubleAttack&&needed<=4000&&policy.safety<15)return{counters:[]};
    if(lifeAfterHit>=1&&remainingAttackers===0&&needed>=3000)return{counters:[]};
    const takeThreshold=Math.max(4,9-policy.safety*.25)+(remainingAttackers?2:0);
    if(!best||best.score>takeThreshold)return{counters:[]};
  }

  if(a.targetKind==='character'&&!mustGuard){
    const protectThreshold=targetBoardValue+(targetIsBlocker&&own.life.length<=2?4:0);
    if(!best||best.score>protectThreshold)return{counters:[]};
  }

  return{counters:best?.ids||[]};
}
