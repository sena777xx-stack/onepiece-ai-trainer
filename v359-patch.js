/* v359: directly finalize OP09-096 without the layered generic resolver. */
const finalizeTeachSearch359=event=>{
  const button=event.target?.closest?.('button');
  const label=button?.textContent?.trim();
  const cardButton=button?.closest?.('.search3-grid')?button:null;
  if(label!=='手札に加える'&&label!=='加えない'&&!cardButton)return;
  const engine=window.__luffyEngine349;
  const pending=engine?.state?.pending;
  if(pending?.kind!=='teachSearch3Choice'||pending.side!=='player')return;
  let chosenUid=null;
  if(cardButton&&!cardButton.disabled)chosenUid=cardButton.dataset.id||null;
  if(label==='手札に加える'){
    const selected=document.querySelector('.search3-grid button.selected:not([disabled])')
      ||document.querySelector('.search3-grid button:not([disabled])');
    chosenUid=selected?.dataset?.id||null;
  }
  const own=engine.state.sides.player;
  const eligible=card=>card.id!=='OP09-096'&&(card.traits||[]).includes('黒ひげ海賊団');
  const chosen=pending.cards.find(card=>card.uid===chosenUid&&eligible(card));
  if(chosen){
    own.hand.push(chosen);
    engine.log(chosen.name+'を手札に加えた');
  }
  const rest=pending.cards.filter(card=>card.uid!==chosen?.uid);
  own.trash.push(...rest);
  engine.log('残り'+rest.length+'枚をトラッシュへ送った');
  engine.state.pending=null;
  engine.state.phase='main';
  button.closest('.dialog')?.remove();
};
document.addEventListener('pointerdown',finalizeTeachSearch359,true);
document.addEventListener('click',finalizeTeachSearch359,true);
