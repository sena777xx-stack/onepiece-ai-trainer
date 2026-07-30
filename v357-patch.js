/* v357: hard mobile recovery for OP09-096 search dialog. */
const finishTeachSearch357=event=>{
  const button=event.target?.closest?.('button');
  const label=button?.textContent?.trim();
  if(label!=='手札に加える'&&label!=='加えない')return;
  const engine=window.__luffyEngine349;
  const pending=engine?.state?.pending;
  if(pending?.kind!=='teachSearch3Choice'||pending.side!=='player')return;
  let ids=[];
  if(label==='手札に加える'){
    const selected=document.querySelector('.search3-grid button.selected:not([disabled])')
      ||document.querySelector('.search3-grid button:not([disabled])');
    if(selected?.dataset?.id)ids=[selected.dataset.id];
  }
  engine.resolveTeachKoChoice('player',ids);
  const dialog=button.closest('.dialog');
  if(dialog)dialog.remove();
};
document.addEventListener('pointerup',finishTeachSearch357,true);
document.addEventListener('click',finishTeachSearch357,true);
