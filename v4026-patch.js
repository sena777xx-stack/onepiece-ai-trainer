import{GameEngine}from'./game-engine-v3.js?v=4022';
import{UI}from'./ui-fixed.js?v=3441';

const previousChoice4026=GameEngine.prototype.resolveTeachKoChoice;
GameEngine.prototype.resolveTeachKoChoice=function(side,ids=[]){
  const pending=this.state.pending;
  if(pending?.kind!=='handDiscardChoice')return previousChoice4026.call(this,side,ids);
  if(pending.side!==side)return false;
  const own=this.state.sides[side],required=Math.min(Number(pending.count||1),own.hand.length);
  const chosen=[...new Set(Array.isArray(ids)?ids:[ids])].map(uid=>own.hand.find(card=>card.uid===uid)).filter(Boolean).slice(0,required);
  if(chosen.length!==required)return false;
  this.snapshot();
  for(const card of chosen){
    own.hand=own.hand.filter(item=>item.uid!==card.uid);
    own.trash.push(card);
    this.log(card.name+'をトラッシュへ送った');
  }
  this.state.pending=null;
  this.state.phase='main';
  this.log(pending.sourceName+'の手札を捨てる処理を終了');
  return true;
};

const previousRender4026=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const result=previousRender4026.call(this,g);
  if(g.pending?.kind!=='handDiscardChoice'||g.pending.side!=='player')return result;
  if(this.modal?.querySelector('[data-hand-discard-4026]'))return result;
  const engine=window.__luffyEngine349,required=Math.min(Number(g.pending.count||1),g.sides.player.hand.length);
  if(required===0){engine?.resolveTeachKoChoice('player',[]);return previousRender4026.call(this,engine.state)}
  this.close();
  const pending=g.pending,selected=new Set();
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';panel.setAttribute('data-hand-discard-4026','true');
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>'+pending.sourceName+'</small><h2>捨てる手札を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='手札から'+required+'枚選び、トラッシュへ送ってください。';
  const grid=document.createElement('div');grid.className='discard-image-grid effect-target-grid';
  const footer=document.createElement('div');footer.className='redirect-footer';
  const back=document.createElement('button');back.textContent='戻る';
  const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='選択したカードを捨てる';confirm.disabled=true;
  const update=()=>{confirm.disabled=selected.size!==required;grid.querySelectorAll('button').forEach(button=>button.classList.toggle('selected',selected.has(button.dataset.id)))};
  for(const card of g.sides.player.hand){
    const button=document.createElement('button');button.type='button';button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent='コスト '+(card.cost??'-')+' / カウンター '+(card.counter||0);button.append(note);
    button.addEventListener('click',()=>{if(selected.has(card.uid))selected.delete(card.uid);else if(selected.size<required)selected.add(card.uid);update()});
    grid.append(button);
  }
  back.addEventListener('click',()=>{this.close();if(typeof this.a?.undo==='function')this.a.undo();else this.renderGame(g)});
  confirm.addEventListener('click',()=>{const ids=[...selected];this.close();if(engine?.resolveTeachKoChoice('player',ids))this.renderGame(engine.state);else this.renderGame(g)});
  body.append(help,grid);footer.append(back,confirm);panel.append(head,body,footer);overlay.append(panel);
  this.modal=overlay;document.body.append(overlay);update();
  return result;
};
