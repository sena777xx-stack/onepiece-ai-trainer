import{GameEngine}from'./game-engine-v3.js?v=4022';
import{UI}from'./ui-fixed.js?v=3441';

const eligible=card=>card?.id!=='OP09-096'&&(card?.traits||[]).includes('黒ひげ海賊団');

GameEngine.prototype.resolveTeachSearch3Choice=function(side,chosenUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='teachSearch3Choice'||pending.side!==side)return false;
  const own=this.state.sides[side];
  const chosen=(pending.cards||[]).find(card=>card.uid===chosenUid&&eligible(card));
  if(chosen){
    own.hand.push(chosen);
    this.log(chosen.name+'を手札に加えた');
  }else this.log(pending.sourceName+'のサーチでカードを加えなかった');
  const rest=(pending.cards||[]).filter(card=>card.uid!==chosen?.uid);
  own.trash.push(...rest);
  this.log('残り'+rest.length+'枚をトラッシュへ送った');
  this.state.pending=null;
  this.state.phase='main';
  this.log(pending.sourceName+'のサーチ処理を終了');
  return true;
};

const previousAutoDefense4025=GameEngine.prototype.autoResolveDefense;
GameEngine.prototype.autoResolveDefense=async function(){
  const result=await previousAutoDefense4025.call(this);
  const pending=this.state.pending;
  if(pending?.kind==='teachSearch3Choice'&&pending.side==='ai'){
    const chosen=(pending.cards||[]).filter(eligible).sort((a,b)=>Number(b.cost||0)-Number(a.cost||0)||Number(b.counter||0)-Number(a.counter||0))[0];
    this.resolveTeachSearch3Choice('ai',chosen?.uid||null);
  }
  return result;
};

const previousRender4025=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const result=previousRender4025.call(this,g);
  if(g.pending?.kind!=='teachSearch3Choice'||g.pending.side!=='player')return result;
  if(this.modal?.querySelector('[data-teach-search3-4025]'))return result;
  this.close();
  const pending=g.pending,engine=window.__luffyEngine349;
  let selected=null;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';panel.setAttribute('data-teach-search3-4025','true');
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>'+pending.sourceName+'</small><h2>デッキ上3枚を確認</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='「おれの時代だァ!!!!」以外の《黒ひげ海賊団》を1枚まで選べます。残りはトラッシュへ送られます。';
  const grid=document.createElement('div');grid.className='search3-grid effect-target-grid';
  const footer=document.createElement('div');footer.className='redirect-footer';
  const skip=document.createElement('button');skip.textContent='加えない';
  const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='手札に加える';confirm.disabled=true;
  const update=()=>{confirm.disabled=!selected;grid.querySelectorAll('button').forEach(button=>button.classList.toggle('selected',button.dataset.id===selected))};
  for(const card of pending.cards||[]){
    const canPick=eligible(card),button=document.createElement('button');button.type='button';button.dataset.id=card.uid;button.disabled=!canPick;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent=canPick?'《黒ひげ海賊団》':'選択対象外';button.append(note);
    if(canPick)button.addEventListener('click',()=>{selected=selected===card.uid?null:card.uid;update()});
    grid.append(button);
  }
  const finish=uid=>{this.close();engine?.resolveTeachSearch3Choice('player',uid);this.renderGame(engine.state)};
  skip.addEventListener('click',()=>finish(null));
  confirm.addEventListener('click',()=>finish(selected));
  body.append(help,grid);footer.append(skip,confirm);panel.append(head,body,footer);overlay.append(panel);
  this.modal=overlay;document.body.append(overlay);update();
  return result;
};
