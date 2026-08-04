import{GameEngine}from'./game-engine-v3.js?v=4022';

/* Luffy AI must finish with at most five active DON!! so OP13-001
   remains usable during the opponent's attacks. End-turn effects say
   "up to", therefore excess activations are deliberately declined. */
const previousEndTurn367=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  const own=this.state?.sides?.[side],isAiLuffy=side==='ai'&&own?.leader?.id==='OP13-001';
  const result=await previousEndTurn367.call(this,side);
  if(isAiLuffy&&own&&(own.leader.attachedDon||0)>=1&&own.don.active>5){
    const excess=own.don.active-5;
    own.don.active-=excess;
    own.don.rested+=excess;
    this.log('AI判断：ルフィのリーダー効果を使えるよう、終了時のDON!!回復を5枚で止めた');
  }
  return result;
};
