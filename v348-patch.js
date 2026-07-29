import{UI}from'./ui-fixed.js?v=3441';

const previousLeaderRedirect348=UI.prototype.leaderRedirect;

UI.prototype.leaderRedirect=function(g){
  previousLeaderRedirect348.call(this,g);

  const effectModal=this.modal;
  const flow=effectModal?.querySelector('.redirect-flow');
  const head=flow?.querySelector('.redirect-head');
  if(!effectModal||!flow||!head)return;

  const addInspectButton=()=>{
    if(head.querySelector('.inspect-field-button'))return;
    const inspect=document.createElement('button');
    inspect.className='inspect-field-button';
    inspect.type='button';
    inspect.textContent='相手の場を確認';
    inspect.addEventListener('click',()=>{
      const hadHandOpen=document.body.classList.contains('hand-open');
      effectModal.style.display='none';
      if(this.modal===effectModal)this.modal=null;
      document.body.classList.remove('hand-open');
      document.querySelector('.battle-inspect-return')?.remove();

      const back=document.createElement('button');
      back.className='battle-inspect-return';
      back.type='button';
      back.setAttribute('aria-label','リーダー効果の選択画面へ戻る');
      back.innerHTML='<strong>×</strong><span>効果選択へ戻る</span>';
      back.addEventListener('click',()=>{
        if(this.modal&&this.modal!==effectModal)this.close();
        effectModal.style.display='';
        this.modal=effectModal;
        if(hadHandOpen)document.body.classList.add('hand-open');
        back.remove();
      });
      document.body.append(back);
    });
    head.append(inspect);
  };

  const observer=new MutationObserver(addInspectButton);
  observer.observe(head,{childList:true});
  effectModal.addEventListener('DOMNodeRemoved',()=>observer.disconnect(),{once:true});
  addInspectButton();
};
