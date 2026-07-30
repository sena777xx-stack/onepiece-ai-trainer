/* Trigger resolution guard v361
   Prevents duplicate taps/re-entrant AI calls from resolving the same life card twice.
   Card-specific follow-up choices remain available because they replace pending with a new object. */
(()=>{
  const previousResolveTrigger361=GameEngine.prototype.resolveTrigger;
  GameEngine.prototype.resolveTrigger=async function(use){
    const original=this.state.pending;
    if(!original||!['trigger','lifeReveal'].includes(original.kind)){
      return previousResolveTrigger361.call(this,use);
    }
    const uid=original.card?.uid||original.card?.id||'unknown';
    const token=String(this.state.turn||0)+':'+String(original.side||'')+':'+String(uid);
    if(this._triggerResolving361===token)return false;
    if(original._resolved361){
      if(this.state.pending===original){
        this.state.pending=null;
        this.state.phase='main';
      }
      return true;
    }
    original._resolved361=true;
    this._triggerResolving361=token;
    try{
      const result=await previousResolveTrigger361.call(this,use);
      const current=this.state.pending;
      const same=current===original||
        (current&&['trigger','lifeReveal'].includes(current.kind)&&
         (current.card?.uid||current.card?.id)===uid&&current.side===original.side);
      if(same){
        const own=this.state.sides[original.side],card=original.card;
        const alreadyHandled=[...own.hand,...own.trash,...own.field].some(item=>item.uid===card?.uid);
        if(card&&!alreadyHandled)(use&&original.hasTrigger!==false?own.trash:own.hand).push(card);
        this.state.pending=null;
        this.state.phase='main';
        this.log('トリガー処理を完了');
      }
      return result;
    }finally{
      if(this._triggerResolving361===token)this._triggerResolving361=null;
    }
  };
})();