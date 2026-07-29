import{UI}from'./ui-fixed.js?v=3441';
const previousDefense347=UI.prototype.defense;
UI.prototype.defense=function(g,skipLeader=false){
 previousDefense347.call(this,g,skipLeader);
 const battle=g.pending,defenseModal=this.modal,flow=defenseModal?.querySelector('.counter-visual-flow,.counter-sheet');
 if(battle?.kind!=='battle'||battle.defendingSide!=='player'||!flow)return;
 if(battle.step==='block'){
  for(const button of [...flow.querySelectorAll('.blocker-choice[data-id]')]){
   const replacement=button.cloneNode(true),uid=replacement.dataset.id;
   replacement.addEventListener('click',()=>this.a.chooseBlock(uid));button.replaceWith(replacement);
  }
  const help=flow.querySelector('.zone-help');if(help)help.textContent='ブロッカーを選ぶとブロックを確定し、続けてカウンター選択へ進みます。';
 }
 if(battle.step==='counter'){
  const help=flow.querySelector('.zone-help');if(help)help.textContent=battle.blockerUid?'ブロック済みです。必要なら手札のカウンターを選択してください。':'必要なら手札のカウンターを選択してください。';
  const receive=[...flow.querySelectorAll('button')].find(button=>button.textContent==='攻撃を受ける');if(receive)receive.textContent='カウンターを使わない';
 }
 if(flow.querySelector('.inspect-field-button'))return;
 const inspect=document.createElement('button');inspect.className='inspect-field-button';inspect.textContent='相手の場を確認';
 inspect.addEventListener('click',()=>{
  defenseModal.style.display='none';if(this.modal===defenseModal)this.modal=null;document.body.classList.remove('hand-open');document.querySelector('.battle-inspect-return')?.remove();
  const back=document.createElement('button');back.className='battle-inspect-return';back.setAttribute('aria-label','防御画面へ戻る');back.innerHTML='<strong>×</strong><span>防御へ戻る</span>';
  back.addEventListener('click',()=>{if(this.modal&&this.modal!==defenseModal)this.close();defenseModal.style.display='';this.modal=defenseModal;document.body.classList.add('hand-open');back.remove()});document.body.append(back);
 });
 const head=flow.querySelector('.redirect-head')||flow;head.append(inspect);
};
