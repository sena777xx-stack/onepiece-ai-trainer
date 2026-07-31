import{UI}from'./ui-fixed.js?v=3441';

function openLuffyLeaderPicker376(ui,g){
  const engine=window.__luffyEngine349,battle=g.pending,own=g.sides.player;
  const eligible=[own.leader,...own.field.filter(card=>(card.traits||[]).includes('麦わらの一味'))];
  const chosen=[];
  ui.close();
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>相手のアタック時</small><h2>ルフィのリーダー効果</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');
  help.textContent='使用するDON!!の枚数と、パワー+2000を与える対象を選んでください。同じ対象を複数回選べます。';
  const status=document.createElement('p');
  const grid=document.createElement('div');grid.className='effect-target-grid';
  const refresh=()=>{
    status.textContent='使用するDON!! '+chosen.length+' / '+own.don.active+'枚';
    for(const button of grid.querySelectorAll('button[data-id]')){
      const count=chosen.filter(uid=>uid===button.dataset.id).length;
      const card=eligible.find(item=>item.uid===button.dataset.id);
      const note=button.querySelector('small');
      if(note)note.textContent='現在 '+(Number(card?.power||0)+Number(card?.tempPower||0))+' / 選択 ×'+count+'（+'+(count*2000)+'）';
      button.classList.toggle('selected',count>0);
    }
  };
  for(const card of eligible){
    const button=document.createElement('button');button.type='button';button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card===own.leader?'リーダー：'+card.name:card.name;button.append(name);
    const note=document.createElement('small');button.append(note);
    button.addEventListener('click',()=>{if(chosen.length<own.don.active){chosen.push(card.uid);refresh()}});
    grid.append(button);
  }
  body.append(help,status,grid);
  const foot=document.createElement('div');foot.className='redirect-footer';
  const reset=document.createElement('button');reset.type='button';reset.textContent='選択を戻す';
  reset.addEventListener('click',()=>{chosen.length=0;refresh()});
  const back=document.createElement('button');back.type='button';back.textContent='カウンター画面へ戻る';
  back.addEventListener('click',()=>{ui.close();ui.defense(g)});
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent='リーダー効果を決定';
  confirm.addEventListener('click',()=>{
    if(!chosen.length)return;
    battle.op13001InlineHandled376=true;
    ui.close();
    engine?.resolveOP13001DefenseBoost('player',chosen);
    ui.defense(engine.state);
  });
  foot.append(reset,back,confirm);panel.append(head,body,foot);overlay.append(panel);
  ui.modal=overlay;document.body.append(overlay);refresh();
}

/* Always place the Luffy leader-effect entry in the actual current counter
   dialog.  If requirements are not met, keep it visible and explain why. */
const previousDefense376=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  const battle=g?.pending,own=g?.sides?.player,leader=own?.leader;
  const luffyBattle=battle?.kind==='battle'&&battle.defendingSide==='player'&&leader?.id==='OP13-001';
  if(!luffyBattle)return previousDefense376.call(this,g,...args);

  /* Prevent every older wrapper from opening a separate automatic prompt. */
  battle.op13001Prompted=true;
  const result=previousDefense376.call(this,g,...args);
  if(battle.op13001InlineHandled376)return result;

  const section=this.modal?.querySelector('section');
  if(!section||section.querySelector('[data-op13001-inline-376]'))return result;

  const attached=(leader.attachedDon||0)>=1;
  const notNegated=(leader.effectsNegatedThroughTurn??leader.effectsNegatedTurn??-1)<g.turn;
  const donRange=own.don.active>0&&own.don.active<=5;
  const realAttack=Boolean(battle.attackerUid)&&Boolean(battle.targetUid)&&['block','counter'].includes(battle.step);
  const usable=attached&&notNegated&&donRange&&realAttack;

  const wrap=document.createElement('div');wrap.dataset.op13001Inline376='true';
  wrap.style.display='grid';wrap.style.gap='8px';wrap.style.margin='12px 0';
  const button=document.createElement('button');button.type='button';
  button.textContent=usable?'ルフィのリーダー効果を使う':'ルフィのリーダー効果は使用不可';
  button.disabled=!usable;
  button.style.width='100%';button.style.minHeight='54px';
  if(usable)button.className='primary';
  const reason=document.createElement('small');
  reason.style.display='block';reason.style.lineHeight='1.5';
  if(usable)reason.textContent='この攻撃に対して、使用するDON!!枚数と強化対象を選べます。';
  else if(!attached)reason.textContent='使用条件：リーダーにDON!!を1枚以上付与する必要があります。';
  else if(!notNegated)reason.textContent='10コスト・ティーチなどの効果で、リーダー効果が無効になっています。';
  else if(!donRange)reason.textContent='使用条件：アクティブDON!!が1〜5枚のときに使用できます。';
  else reason.textContent='攻撃処理中のみ使用できます。';
  button.addEventListener('click',()=>openLuffyLeaderPicker376(this,g));
  wrap.append(button,reason);

  const footer=section.querySelector('.counter-actions,.redirect-footer,.actions')||
    [...section.querySelectorAll('button')].find(item=>/カウンター確定|防御を確定|攻撃を受ける/.test(item.textContent||''))?.parentElement;
  if(footer)section.insertBefore(wrap,footer);
  else section.append(wrap);
  return result;
};
