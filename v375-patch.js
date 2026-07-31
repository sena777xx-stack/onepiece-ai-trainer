import{UI}from'./ui-fixed.js?v=3441';

/* OP13-001: offer the optional leader effect inside the ordinary
   block/counter screen instead of opening it before that screen. */
const previousDefense375=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  const battle=g?.pending,own=g?.sides?.player,leader=own?.leader;
  const isRealAttack=battle?.kind==='battle'&&battle.defendingSide==='player'
    &&Boolean(battle.attackerUid)&&Boolean(battle.targetUid)
    &&['block','counter'].includes(battle.step);
  const canOffer=isRealAttack&&leader?.id==='OP13-001'
    &&!battle.op13001Prompted
    &&(leader.effectsNegatedThroughTurn??leader.effectsNegatedTurn??-1)<g.turn
    &&(leader.attachedDon||0)>=1&&own.don.active>0&&own.don.active<=5;

  if(!canOffer)return previousDefense375.call(this,g,...args);

  /* Suppress the older automatic pre-counter prompt for this render. */
  battle.op13001Prompted=true;
  const result=previousDefense375.call(this,g,...args);

  const panel=this.modal?.querySelector('.counter-sheet, .redirect-flow, .sheet');
  if(!panel)return result;
  const actions=panel.querySelector('.counter-actions, .redirect-footer, .actions');
  const button=document.createElement('button');
  button.type='button';
  button.className='op13001-inline-button';
  button.textContent='ルフィのリーダー効果を使う';
  button.style.width='100%';
  button.style.minHeight='52px';
  button.style.margin='12px 0';
  button.addEventListener('click',()=>{
    this.close();
    delete battle.op13001Prompted;
    /* Enter the existing DON!!/target picker only after the player asks. */
    previousDefense375.call(this,g,...args);
  });

  const note=document.createElement('p');
  note.className='zone-help op13001-inline-note';
  note.textContent='この攻撃に対して、DON!!をレストしてパワーを上げるか選べます。';
  if(actions)panel.insertBefore(note,actions),panel.insertBefore(button,actions);
  else panel.append(note,button);
  return result;
};
