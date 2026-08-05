import{GameEngine}from'./game-engine-v3.js?v=4022';

/* Paid counter events for the Luffy deck.
   Validate and pay every event cost before resolving the selected counters.
   OP05-038 has no printed character-counter value in card data, but its
   Counter effect supplies +4000 during the battle. */
const previousSubmitCounters4031=GameEngine.prototype.submitCounters;
GameEngine.prototype.submitCounters=function(side,counterIds=[]){
  const battle=this.state?.pending,own=this.state?.sides?.[side];
  if(battle?.kind!=='battle'||battle.step!=='counter'||battle.defendingSide!==side||!own){
    return previousSubmitCounters4031.call(this,side,counterIds);
  }
  const requested=Array.isArray(counterIds)?counterIds:[counterIds],accepted=[],temporary=[];
  let available=Number(own.don?.active||0);
  const eventCost=card=>card?.id==='OP05-038'?2:['OP12-037','OP13-040'].includes(card?.id)?1:0;
  for(const uid of requested){
    const card=own.hand.find(item=>item.uid===uid);
    if(!card)continue;
    const cost=eventCost(card);
    if(['OP12-037','OP13-040'].includes(card.id)&&battle.targetKind!=='leader'){
      this.log(card.name+'はリーダーへのアタック時のみカウンターに使用できます');
      continue;
    }
    if(cost>available){
      this.log(card.name+'は使用可能なDON!!が不足しているためカウンターに使用できません');
      continue;
    }
    if(card.id==='OP05-038'){
      temporary.push([card,Number(card.counter||0)]);
      card.counter=4000;
    }
    if(Number(card.counter||0)<=0)continue;
    if(cost){
      available-=cost;
      own.don.active-=cost;
      own.don.rested+=cost;
      this.log(card.name+'：カウンター使用コストとしてDON!!'+cost+'枚をレスト');
    }
    accepted.push(uid);
  }
  const result=previousSubmitCounters4031.call(this,side,accepted);
  const restore=()=>{for(const [card,value] of temporary)card.counter=value};
  if(result&&typeof result.then==='function')return result.finally(restore);
  restore();
  return result;
};
