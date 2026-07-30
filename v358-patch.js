/* v358: enable and resolve the OP09-096 confirmation on every render. */
const enableTeachSearchButtons358=root=>{
  for(const button of root.querySelectorAll?.('button')||[]){
    const label=button.textContent?.trim();
    if(label==='手札に加える'||label==='加えない'){
      button.disabled=false;
      button.removeAttribute('disabled');
      button.style.pointerEvents='auto';
    }
  }
};
enableTeachSearchButtons358(document);
new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===1)enableTeachSearchButtons358(node);
    }
  }
}).observe(document.documentElement,{childList:true,subtree:true});

const resolveTeachSearch358=event=>{
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
  button.closest('.dialog')?.remove();
};
document.addEventListener('pointerdown',resolveTeachSearch358,true);
document.addEventListener('touchstart',resolveTeachSearch358,{capture:true,passive:true});
document.addEventListener('click',resolveTeachSearch358,true);
