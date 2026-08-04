import{GameEngine}from'./game-engine-v3.js?v=4022';

/* v365: make Doc Q trigger selection authoritative at resolution time. */
const previousTeachKoChoice365=GameEngine.prototype.resolveTeachKoChoice;
GameEngine.prototype.resolveTeachKoChoice=function(side,ids=[]){
  const pending=this.state.pending;
  if(pending?.kind!=='effectChoice'||pending.side!==side||pending.mode!=='docQ'){
    return previousTeachKoChoice365.call(this,side,ids);
  }

  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const requested=Array.isArray(ids)?ids:[ids];
  const chosen=[...new Set(requested)].filter(uid=>pending.options.includes(uid)).slice(0,2);
  const koNames=[];

  for(const uid of chosen){
    const target=foe.field.find(card=>card.uid===uid);
    if(!target)continue;
    if(target.id==='OP09-086'&&(target.effectsNegatedThroughTurn??-1)<this.state.turn){
      this.log('[効果] '+target.name+'は相手の効果ではK.O.されない');
      continue;
    }
    foe.field=foe.field.filter(card=>card.uid!==uid);
    if(target.attachedDon){
      foe.don.rested+=target.attachedDon;
      target.attachedDon=0;
    }
    foe.trash.push(target);
    koNames.push(target.name);
    this.log('ドクQの効果で'+target.name+'をK.O.');
  }

  if(!chosen.length)this.log('ドクQの効果で対象を選びませんでした');
  else if(!koNames.length)this.log('ドクQの効果では対象をK.O.できませんでした');

  this.state.pending=null;
  this.state.phase='main';
  this.log('ドクQの効果処理を終了');
  return true;
};
