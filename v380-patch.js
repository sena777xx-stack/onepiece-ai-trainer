import{GameEngine}from'./game-engine-v3.js?v=3441';
import{chooseDefense}from'./ai-engine.js?v=3810';

/* Keep battle defense on the same AI policy version as main-phase decisions.
   Older game-engine imports could otherwise spend hand counters before using
   an active Blocker during a life-zero defense sequence. */
GameEngine.prototype.autoResolveDefense=async function(){
  const battle=this.state.pending;
  if(battle?.kind!=='battle')return false;
  const side=battle.defendingSide,own=this.state.sides[side],leader=own.leader;
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
