import{GameEngine}from'./game-engine-v3.js?v=3441';
import{UI}from'./ui-fixed.js?v=3441';

/* A chosen blocker must remain rested after the block is accepted. */
const previousChooseBlock370=GameEngine.prototype.chooseBlock;
GameEngine.prototype.chooseBlock=function(side,blockerUid=null){
  const own=this.state?.sides?.[side];
  const blocker=blockerUid?own?.field?.find(card=>card.uid===blockerUid):null;
  const result=previousChooseBlock370.call(this,side,blockerUid);
  if(result&&blockerUid){
    const current=own?.field?.find(card=>card.uid===blockerUid);
    if(current){
      current.rested=true;
      current.blockedOnTurn=this.state.turn;
    }
  }
  return result;
};

/* When all five Character slots are occupied, allow the player to make
   room before resolving an Event that plays another Character. */
const previousShowCard370=UI.prototype.showCard;
UI.prototype.showCard=function(side,card,g){
  const result=previousShowCard370.call(this,side,card,g);
  const own=g?.sides?.player;
  const isOwnFieldCharacter=side==='player'&&card?.type==='character'&&own?.field?.some(item=>item.uid===card.uid);
  const canTrash=isOwnFieldCharacter&&own.field.length>=5&&g.activeSide==='player'&&g.phase==='main'&&!g.pending&&!g.winner;
  if(!canTrash)return result;
  const actions=this.modal?.querySelector?.('.actions');
  if(!actions||actions.querySelector('[data-full-field-trash-370]'))return result;
  const button=document.createElement('button');
  button.type='button';
  button.dataset.fullFieldTrash370='true';
  button.textContent='このキャラをトラッシュに送る';
  button.style.borderColor='#d88b39';
  button.addEventListener('click',async()=>{
    if(!confirm('キャラエリアの枠を空けるため、'+String(card.name||'このキャラ')+'をトラッシュに送りますか？'))return;
    await this.a.effectAction('player',card.uid,'trash');
  });
  actions.append(button);
  return result;
};
