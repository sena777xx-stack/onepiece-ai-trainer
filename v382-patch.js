import{UI}from'./ui-fixed.js?v=3441';

/* A battle can finish inside an asynchronous AI counter chain. Ensure the
   result sheet is restored after every final render, even if an older modal
   was still open when winner was set. */
const previousResultRender382=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const result=previousResultRender382.call(this,g);
  if(g?.winner&&typeof this.showBattleResult349==='function'){
    const visible=Boolean(document.querySelector('.battle-result-overlay'));
    if(!visible){
      this._battleResultShown349=true;
      this.showBattleResult349(g);
    }
  }
  return result;
};
