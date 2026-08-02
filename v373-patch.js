import{GameEngine}from'./game-engine-v3.js?v=3441';
import{UI}from'./ui-fixed.js?v=3441';

const opposite373=side=>side==='player'?'ai':'player';

/* OP09-093: keep the chosen character negated and unable to attack
   through the opponent's next turn.  This final-layer guard is intentionally
   independent of the rule engine so later attack wrappers cannot bypass it. */
GameEngine.prototype.useTeach10=function(side,targetUid=null){
  const own=this.state?.sides?.[side],foe=this.state?.sides?.[opposite373(side)];
  const card=own?.field?.find(item=>item.id==='OP09-093'&&item.teach10PlayedTurn===this.state.turn);
  if(!card||this.state.activeSide!==side||this.state.phase!=='main'||this.state.pending||card.teach10UsedTurn===this.state.turn)return false;
  this.snapshot?.();
  card.teach10UsedTurn=this.state.turn;
  const through=this.state.turn+1;
  foe.leader.effectsNegatedThroughTurn=Math.max(foe.leader.effectsNegatedThroughTurn??-1,through);
  const target=foe.field.find(item=>item.uid===targetUid);
  if(target){
    target.effectsNegatedThroughTurn=Math.max(target.effectsNegatedThroughTurn??-1,through);
    target.preventAttackThroughTurn=Math.max(target.preventAttackThroughTurn??-1,through);
    target.cannotAttackThroughTurn=Math.max(target.cannotAttackThroughTurn??-1,through);
    target.preventAttackSourceSide=side;
    target.cannotAttackSource='OP09-093';
  }
  this.log(card.name+'：相手リーダー'+(target?'と'+target.name:'')+'の効果を相手の次のターン終了時まで無効化');
  if(target)this.log(target.name+'は相手の次のターン終了時までアタックできません');
  return true;
};

const previousDeclareAttack373=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerUid,targetUid){
  const own=this.state?.sides?.[side];
  const attacker=[own?.leader,...(own?.field||[])].find(card=>card?.uid===attackerUid);
  const locked=(attacker?.cannotAttackThroughTurn??attacker?.preventAttackThroughTurn??-1)>=this.state.turn
    &&attacker?.preventAttackSourceSide!==side;
  if(locked){
    this.log(attacker.name+'は10コスト・ティーチの効果でアタックできません');
    return false;
  }
  return previousDeclareAttack373.call(this,side,attackerUid,targetUid);
};

const previousShowCard373=UI.prototype.showCard;
UI.prototype.showCard=function(side,card,g){
  const result=previousShowCard373.call(this,side,card,g);
  const locked=(card?.cannotAttackThroughTurn??card?.preventAttackThroughTurn??-1)>=g.turn
    &&card?.preventAttackSourceSide!==side;
  if(locked){
    for(const button of this.modal?.querySelectorAll('button')||[]){
      if(button.textContent?.trim()==='攻撃する')button.remove();
    }
  }
  return result;
};

/* OP05-038: the original counter resolver handled the optional
   discard/active-DON step only for the player.  Resolve the same step for AI. */
const previousSubmitCounters373=GameEngine.prototype.submitCounters;
GameEngine.prototype.submitCounters=function(side,counterIds=[]){
  const own=this.state?.sides?.[side];
  const requested=Array.isArray(counterIds)?counterIds:[counterIds];
  const aiCopies=side==='ai'?requested.filter(uid=>own?.hand?.some(card=>card.uid===uid&&card.id==='OP05-038')).length:0;
  const finish=()=>{
    if(!aiCopies||!own||this.state.winner)return;
    for(let copy=0;copy<aiCopies;copy++){
      if(own.don.rested<=0||own.hand.length<=0){
        this.log('舞踏石（AI）：手札を捨てず、DON!!をアクティブにしませんでした');
        break;
      }
      const counts=new Map();
      for(const card of own.hand)counts.set(card.id,(counts.get(card.id)||0)+1);
      const protectedIds=new Set(['OP09-093','OP16-119','OP13-118']);
      const discard=[...own.hand].sort((a,b)=>{
        const score=card=>(protectedIds.has(card.id)?100000:0)
          +Number(card.counter||0)*10+Number(card.cost||0)*100
          -((counts.get(card.id)||0)>1?1000:0);
        return score(a)-score(b);
      })[0];
      if(!discard)break;
      own.hand=own.hand.filter(card=>card.uid!==discard.uid);
      own.trash.push(discard);
      const activeCount=Math.min(3,own.don.rested);
      own.don.rested-=activeCount;
      own.don.active+=activeCount;
      this.log('舞踏石（AI）：'+discard.name+'を捨て、DON!!'+activeCount+'枚をアクティブにした（'+own.don.active+'/'+own.don.total+'）');
    }
  };
  const result=previousSubmitCounters373.call(this,side,counterIds);
  if(result&&typeof result.then==='function')return result.then(value=>{finish();return value});
  finish();
  return result;
};

/* Preserve the new runtime fields in saved games. */
const previousLoad373=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousLoad373.call(this,saved);
  for(const side of ['player','ai']){
    const s=this.state?.sides?.[side];
    for(const card of [s?.leader,...(s?.field||[])].filter(Boolean)){
      if(card.cannotAttackSource==='OP09-093'&&card.preventAttackThroughTurn!==undefined)
        card.cannotAttackThroughTurn=Math.max(card.cannotAttackThroughTurn??-1,card.preventAttackThroughTurn);
    }
  }
  return result;
};
