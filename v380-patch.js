import{GameEngine}from'./game-engine-v3.js?v=4022';
import{chooseDefense}from'./ai-engine.js?v=4033';

/* Keep battle defense on the same AI policy version as main-phase decisions.
   Older game-engine imports could otherwise spend hand counters before using
   an active Blocker during a life-zero defense sequence. */
GameEngine.prototype.autoResolveDefense=async function(){
  const battle=this.state.pending;
  if(battle?.kind!=='battle')return false;
  const side=battle.defendingSide,own=this.state.sides[side],leader=own.leader;
  if(side==='ai'&&leader?.id==='OP16-080'
    &&(leader.effectsNegatedThroughTurn??leader.effectsNegatedTurn??-1)<this.state.turn
    &&leader.teachRedirectUsedTurn!==this.state.turn
    &&typeof this.useTeachLeaderRedirect==='function'){
    const triggerCards=own.hand.filter(card=>(card.effects||[]).some(effect=>effect.timing==='trigger'));
    const current=battle.targetKind==='leader'?leader:own.field.find(card=>card.uid===battle.targetUid);
    const candidates=[leader,...own.field.filter(card=>(card.traits||[]).includes('黒ひげ海賊団'))]
      .filter(card=>card.uid!==battle.targetUid)
      .map(card=>({card,value:Number(card.cost||0)*2+Number(card.power||0)/1000+((card.keywords||[]).includes('blocker')?5:0)-((card.effects||[]).some(effect=>effect.timing==='onKO')?4:0)}))
      .sort((a,b)=>a.value-b.value);
    const currentValue=battle.targetKind==='leader'?20:Number(current?.cost||0)*2+Number(current?.power||0)/1000+((current?.keywords||[]).includes('blocker')?5:0);
    const urgent=battle.targetKind==='leader'&&own.life.length<=2;
    const redirect=candidates.find(item=>urgent||item.value+2<currentValue)?.card||null;
    const discard=triggerCards.slice().sort((a,b)=>{
      const keep=card=>(['OP09-093','OP16-119'].includes(card.id)?12:0)+Number(card.counter||0)/1000+Number(card.cost||0)/2;
      return keep(a)-keep(b)||String(a.id).localeCompare(String(b.id));
    })[0];
    if(redirect&&discard)this.useTeachLeaderRedirect(side,discard.uid,redirect.uid);
  }
  if(side==='ai'&&leader?.id==='OP13-001'&&!battle.op13001Prompted
    &&(leader.effectsNegatedThroughTurn??leader.effectsNegatedTurn??-1)<this.state.turn
    &&(leader.attachedDon||0)>=1&&own.don.active>0&&own.don.active<=5
    &&typeof this.resolveOP13001DefenseBoost==='function'){
    const target=battle.targetKind==='leader'?leader:own.field.find(card=>card.uid===battle.targetUid);
    const eligible=target&&(target.uid===leader.uid||(target.traits||[]).includes('麦わらの一味'));
    if(eligible){
      const shortfall=Math.max(0,Number(battle.power||0)-Number(battle.targetPower||0));
      const needed=Math.floor(shortfall/2000)+1;
      const urgent=battle.targetKind==='character'||own.life.length<=2||shortfall<=4000;
      const count=urgent?Math.min(needed,own.don.active):0;
      this.resolveOP13001DefenseBoost('ai',Array(count).fill(target.uid));
    }else this.resolveOP13001DefenseBoost('ai',[]);
  }
  const currentBattle=this.state.pending;
  if(currentBattle?.kind!=='battle')return true;
  const choice=chooseDefense(this.state,currentBattle.defendingSide,currentBattle);
  const result=this.defend(currentBattle.defendingSide,choice);
  if(this.state.pending?.kind==='lifeReveal'&&this.state.pending.side==='ai'){
    await this.resolveTrigger(Boolean(this.state.pending.hasTrigger));
  }
  return result;
};
