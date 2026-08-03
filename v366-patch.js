import{GameEngine}from'./game-engine-v3.js?v=3983';

const baseDeclareAttack=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerId,targetId){
  const defender=side==='player'?'ai':'player';
  const targetCard=this.state?.sides?.[defender]?.field?.find(card=>card.uid===targetId);
  if(targetCard&&!targetCard.rested){
    this.log('ルール確認：アクティブのキャラにはアタックできません');
    return false;
  }
  return baseDeclareAttack.call(this,side,attackerId,targetId);
};
