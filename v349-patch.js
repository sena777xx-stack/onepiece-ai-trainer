import{GameEngine}from'./game-engine-v3.js?v=3441';
import{UI}from'./ui-fixed.js?v=3441';

const previousPlayCard349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousPlayCard349.call(this,side,uid);
  if(!result||side!=='player'||!['OP01-016','EB02-017','EB04-002'].includes(source?.id))return result;
  const own=this.state.sides[side];
  const isBonney=source.id==='EB04-002';
  const lookCount=isBonney?4:5;
  const cards=own.deck.splice(Math.max(0,own.deck.length-lookCount));
  this.state.pending={
    kind:'luffyNamiSearch',
    side,
    sourceName:source.name,
    cards,
    options:cards.filter(card=>isBonney?(card.name!=='ジュエリー・ボニー'&&(card.traits||[]).some(trait=>['エッグヘッド','Egghead','麦わらの一味'].includes(trait))):(card.name!=='ナミ'&&(card.traits||[]).includes('麦わらの一味'))).map(card=>card.uid),
    help:isBonney?'デッキの上から4枚を確認し、「ジュエリー・ボニー」以外の特徴《エッグヘッド》か《麦わらの一味》を持つカード1枚までを手札に加えます。':'デッキの上から5枚を確認し、「ナミ」以外の特徴《麦わらの一味》を持つカード1枚までを手札に加えます。'
  };
  this.state.phase='effectChoice';
  this.log(`${source.name}の登場時：デッキ上から${cards.length}枚を確認`);
  return result;
};

GameEngine.prototype.resolveLuffyNamiSearch=function(side,chosenUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='luffyNamiSearch'||pending.side!==side)return false;
  const own=this.state.sides[side];
  const chosen=pending.cards.find(card=>card.uid===chosenUid&&pending.options.includes(card.uid));
  if(chosen){
    own.hand.push(chosen);
    this.log(`${chosen.name}を手札に加えた`);
  }else this.log('ナミの効果でカードを加えませんでした');
  const rest=pending.cards.filter(card=>card.uid!==chosen?.uid);
  own.deck.unshift(...rest);
  this.state.pending=null;
  this.state.phase='main';
  this.log(`残り${rest.length}枚をデッキの下へ`);
  return true;
};

const previousRenderGame349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousRenderGame349.call(this,g);
  if(g.pending?.kind!=='luffyNamiSearch'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349;
  const overlay=document.createElement('div');
  overlay.className='dialog';
  const panel=document.createElement('section');
  panel.className='redirect-flow';
  const head=document.createElement('div');
  head.className='redirect-head';
  head.innerHTML='<small>登場時効果</small><h2>'+pending.sourceName+'：カードを選択</h2>';
  const body=document.createElement('div');
  body.className='redirect-body';
  const help=document.createElement('p');
  help.textContent=pending.help;
  const grid=document.createElement('div');
  grid.className='effect-target-grid';
  for(const card of pending.cards){
    const button=document.createElement('button');
    button.dataset.id=card.uid;
    button.disabled=!pending.options.includes(card.uid);
    if(card.imageUrl){
      const image=document.createElement('img');
      image.src=card.imageUrl;image.alt=card.name;button.append(image);
    }
    const name=document.createElement('strong');
    name.textContent=card.name;button.append(name);
    if(button.disabled){
      const note=document.createElement('small');
      note.textContent='対象外';button.append(note);
    }
    button.addEventListener('click',()=>{
      this.close();
      engineRef?.resolveLuffyNamiSearch('player',card.uid);
      this.renderGame(engineRef.state);
    });
    grid.append(button);
  }
  body.append(help,grid);
  const foot=document.createElement('div');
  foot.className='redirect-footer single';
  const skip=document.createElement('button');
  skip.textContent='加えずに終了';
  skip.addEventListener('click',()=>{
    this.close();
    engineRef?.resolveLuffyNamiSearch('player',null);
    this.renderGame(engineRef.state);
  });
  foot.append(skip);
  panel.append(head,body,foot);overlay.append(panel);
  this.modal=overlay;document.body.append(overlay);
};

const previousStart349=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){
  const result=previousStart349.apply(this,args);
  window.__luffyEngine349=this;
  return result;
};
const previousLoad349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousLoad349.call(this,saved);
  window.__luffyEngine349=this;
  return result;
};
