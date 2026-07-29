import{UI}from'./ui-fixed.js?v=3441';
const previousDefense346=UI.prototype.defense;
UI.prototype.defense=function(g,skipLeader=false){
 previousDefense346.call(this,g,skipLeader);
 const battle=g.pending,defenseModal=this.modal,sheet=defenseModal?.querySelector('.counter-sheet');
 if(battle?.kind!=='battle'||battle.defendingSide!=='player'||!sheet||sheet.querySelector('.inspect-field-button'))return;
 const inspect=document.createElement('button');inspect.className='inspect-field-button';inspect.textContent='相手の場を確認';
 inspect.addEventListener('click',()=>{
  defenseModal.style.display='none';if(this.modal===defenseModal)this.modal=null;document.body.classList.remove('hand-open');
  document.querySelector('.battle-inspect-return')?.remove();
  const back=document.createElement('button');back.className='battle-inspect-return';back.setAttribute('aria-label','防御画面へ戻る');back.innerHTML='<strong>×</strong><span>防御へ戻る</span>';
  back.addEventListener('click',()=>{if(this.modal&&this.modal!==defenseModal)this.close();defenseModal.style.display='';this.modal=defenseModal;document.body.classList.add('hand-open');back.remove()});
  document.body.append(back);
 });
 const heading=sheet.querySelector('h2');heading?.insertAdjacentElement('afterend',inspect);
};
