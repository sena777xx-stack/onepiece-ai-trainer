import{GameEngine}from'./game-engine-v3.js?v=3441';
import{UI}from'./ui-fixed.js?v=3441';

/* OP16-115 闇水:
   AI used to leave darkWaterMainChoice pending forever because only the
   trigger-side negate choice had an AI resolver.  Resolve the recovery
   choice immediately and always return to main phase. */
const previousPlayCard374=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state?.sides?.[side]?.hand?.find(card=>card.uid===uid);
  const result=await previousPlayCard374.call(this,side,uid);
  if(!result||side!=='ai'||source?.id!=='OP16-115')return result;
  const pending=this.state.pending;
  if(pending?.kind==='darkWaterMainChoice'&&pending.side==='ai'){
    const own=this.state.sides.ai;
    const candidates=(pending.options||[]).map(id=>own.trash.find(card=>card.uid===id)).filter(Boolean);
    const chosen=candidates.sort((a,b)=>{
      const value=card=>Number(card.counter||0)/10+Number(card.cost||0)*100+Number(card.power||0)/100
        +(card.id==='OP16-119'?5000:0)+(card.id==='OP09-093'?4500:0);
      return value(b)-value(a);
    })[0];
    this.resolveDarkWaterChoice('ai',chosen?.uid||null);
    this.log('AI：闇水の効果処理を完了し、メインフェーズへ戻りました');
  }
  return result;
};

/* Recover old/stale saves that were stopped at the AI Dark Water choice. */
const previousBeginTurn374=GameEngine.prototype.beginTurn;
GameEngine.prototype.beginTurn=async function(side){
  if(this.state?.pending?.kind==='darkWaterMainChoice'&&this.state.pending.side==='ai'){
    const own=this.state.sides.ai,pending=this.state.pending;
    const target=(pending.options||[]).map(id=>own.trash.find(card=>card.uid===id)).filter(Boolean)[0];
    this.resolveDarkWaterChoice('ai',target?.uid||null);
    this.log('AI：停止していた闇水の効果処理を再開しました');
  }
  return previousBeginTurn374.call(this,side);
};

/* OP13-001 Luffy:
   create a fresh decision for every individual opposing attack. */
const previousDeclareAttack374=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerUid,targetUid){
  const result=await previousDeclareAttack374.call(this,side,attackerUid,targetUid);
  const battle=this.state?.pending;
  if(result&&battle?.kind==='battle'){
    delete battle.op13001Prompted;
    battle.op13001AttackToken=String(this.state.turn)+':'+String(attackerUid)+':'+String(targetUid)+':'+Date.now();
  }
  return result;
};

/* Never show the leader-effect selector outside a real attack, and never
   reuse the selector from the preceding attack. */
const previousDefense374=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  const battle=g?.pending;
  const realAttack=battle?.kind==='battle'&&Boolean(battle.attackerUid)&&Boolean(battle.targetUid)
    &&['block','counter'].includes(battle.step);
  const own=g?.sides?.player;
  const isLuffy=own?.leader?.id==='OP13-001';
  if(isLuffy&&!realAttack){
    if(battle?.kind==='battle')battle.op13001Prompted=true;
    return previousDefense374.call(this,g,...args);
  }
  return previousDefense374.call(this,g,...args);
};

/* Clear only the per-battle prompt marker after battle completion; the
   next attack will ask again even in the same turn. */
const previousEndBattle374=GameEngine.prototype.endBattle;
GameEngine.prototype.endBattle=function(...args){
  const battle=this.state?.pending;
  if(battle?.kind==='battle'){
    delete battle.op13001Prompted;
    delete battle.op13001AttackToken;
  }
  return previousEndBattle374.apply(this,args);
};
