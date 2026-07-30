import{GameEngine}from'./game-engine-v3.js?v=3501';

/* v362: finalize life triggers on the GameEngine instance used by app.js. */
const previousResolveTrigger362=GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger=async function(use){
  const original=this.state.pending;
  if(!original||!['trigger','lifeReveal'].includes(original.kind)){
    return previousResolveTrigger362.call(this,use);
  }
  const token=String(this.state.turn||0)+':'+String(original.side||'')+':'+String(original.card?.uid||original.card?.id||'');
  if(this._resolvingLifeTrigger362===token)return false;
  this._resolvingLifeTrigger362=token;
  try{
    const result=await previousResolveTrigger362.call(this,use);
    const pending=this.state.pending;

    // A trigger that draws cards queues a hand notice while retaining the old
    // lifeReveal object. Closing the notice must finish the trigger, not reopen it.
    if(pending?.kind==='handNotice'&&
       ['trigger','lifeReveal'].includes(pending.returnPending?.kind||'')&&
       pending.returnPending?.card?.uid===original.card?.uid){
      pending.returnPending=null;
      pending.returnPhase='main';
      pending.triggerFinished362=true;
    }

    // Defensive fallback for an unchanged trigger object.
    const current=this.state.pending;
    if(current===original){
      const own=this.state.sides[original.side],card=original.card;
      const handled=[...own.hand,...own.trash,...own.field].some(item=>item.uid===card?.uid);
      if(card&&!handled)(use&&original.hasTrigger!==false?own.trash:own.hand).push(card);
      this.state.pending=null;
      this.state.phase='main';
    }
    return result;
  }finally{
    if(this._resolvingLifeTrigger362===token)this._resolvingLifeTrigger362=null;
  }
};

const previousResolveHandNotice362=GameEngine.prototype.resolveHandNotice;
GameEngine.prototype.resolveHandNotice=function(){
  const notice=this.state.pending;
  const triggerFinished=notice?.kind==='handNotice'&&
    (notice.triggerFinished362||['trigger','lifeReveal'].includes(notice.returnPending?.kind||''));
  const result=previousResolveHandNotice362.call(this);
  if(triggerFinished){
    this.state.pending=null;
    this.state.phase='main';
    this.log('トリガー処理を完了');
  }
  return result;
};
