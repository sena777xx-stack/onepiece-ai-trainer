import{GameEngine}from'./game-engine-v3.js?v=3441';
import{chooseDefense}from'./ai-engine.js?v=3810';

/* Keep battle defense on the same AI policy version as main-phase decisions.
   Older game-engine imports could otherwise spend hand counters before using
   an active Blocker during a life-zero defense sequence. */
GameEngine.prototype.autoResolveDefense=async function(){
  const battle=this.state.pending;
  if(battle?.kind!=='battle')return false;
  const choice=chooseDefense(this.state,battle.defendingSide,battle);
  const result=this.defend(battle.defendingSide,choice);
  if(this.state.pending?.kind==='lifeReveal'&&this.state.pending.side==='ai'){
    await this.resolveTrigger(Boolean(this.state.pending.hasTrigger));
  }
  return result;
};
