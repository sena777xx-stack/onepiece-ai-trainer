import{UI}from'./ui-fixed.js?v=3441';
const previousDefense345=UI.prototype.defense;
UI.prototype.defense=function(g,skipLeader=false){
 const battle=g.pending;
 const skip=skipLeader||battle?.step!=='block';
 previousDefense345.call(this,g,skip);
 if(battle?.kind!=='battle'||battle.defendingSide!=='player'||!this.modal)return;
 const blockArea=this.modal.querySelector('.blocker-choice');
 if(battle.step==='block'&&blockArea){
  for(const button of [...blockArea.querySelectorAll('button[data-blocker]')]){
   const replacement=button.cloneNode(true),uid=replacement.dataset.blocker||null;
   replacement.addEventListener('click',()=>this.a.chooseBlock(uid));
   button.replaceWith(replacement);
  }
  const grid=this.modal.querySelector('.counter-grid');if(grid)grid.hidden=true;
  const primary=[...this.modal.querySelectorAll('button')].find(button=>button.textContent==='防御を確定');if(primary)primary.hidden=true;
 }
 if(battle.step==='counter'){
  if(blockArea)blockArea.hidden=true;
  const help=this.modal.querySelector('.zone-help');if(help)help.textContent=battle.blockerUid?'ブロックしました。必要ならカウンターを選択してください。':'ブロックしません。必要ならカウンターを選択してください。';
  if(battle.blockerUid){const blocker=g.sides.player.field.find(card=>card.uid===battle.blockerUid),small=this.modal.querySelector('.counter-summary small');if(small)small.textContent='ブロック：'+(blocker?.name||'選択済みブロッカー')}
 }
};
