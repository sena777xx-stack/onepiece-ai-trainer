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
  }else this.log(`${pending.sourceName}の効果でカードを加えませんでした`);
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


const previousSanjiPlay349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousSanjiPlay349.call(this,side,uid);
  if(!result||side!=='player'||source?.id!=='ST21-003')return result;
  const own=this.state.sides[side];
  const options=own.field.filter(card=>card.uid!==source.uid&&card.power>=6000&&(card.traits||[]).includes('麦わらの一味'));
  this.state.pending={kind:'luffySanjiChoice',side,sourceName:source.name,options:options.map(card=>card.uid)};
  this.state.phase='effectChoice';
  this.log(`${source.name}の登場時：ブロッカーを封じる対象を選択`);
  return result;
};

GameEngine.prototype.resolveLuffySanjiChoice=function(side,targetUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='luffySanjiChoice'||pending.side!==side)return false;
  const own=this.state.sides[side];
  const target=own.field.find(card=>card.uid===targetUid&&pending.options.includes(card.uid));
  if(target){
    target.noBlockThroughTurn=this.state.turn;
    this.log(`${target.name}がこのターン攻撃した場合、相手はブロッカーを使えません`);
  }else this.log('サンジの効果で対象を選びませんでした');
  this.state.pending=null;
  this.state.phase='main';
  return true;
};

const previousSanjiAttack349=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerUid,targetUid){
  const attacker=[this.state.sides[side].leader,...this.state.sides[side].field].find(card=>card.uid===attackerUid);
  const result=await previousSanjiAttack349.call(this,side,attackerUid,targetUid);
  if(result&&this.state.pending?.kind==='battle'&&attacker?.noBlockThroughTurn===this.state.turn){
    this.state.pending.step='counter';
    this.state.pending.blockerUid=null;
    this.log(`${attacker.name}の攻撃：サンジの効果でブロッカーを使用できません`);
  }
  return result;
};

const previousSanjiRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousSanjiRender349.call(this,g);
  if(g.pending?.kind!=='luffySanjiChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,own=g.sides.player;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>登場時効果</small><h2>サンジ：対象を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');
  help.textContent='パワー6000以上の特徴《麦わらの一味》のキャラ1枚までを選びます。選んだキャラがこのターン攻撃した場合、相手はブロッカーを使えません。';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(const uid of pending.options){
    const card=own.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const power=document.createElement('small');power.textContent='パワー '+card.power;button.append(power);
    button.addEventListener('click',()=>{this.close();engineRef?.resolveLuffySanjiChoice('player',card.uid);this.renderGame(engineRef.state)});
    grid.append(button);
  }
  body.append(help,grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const skip=document.createElement('button');skip.textContent='選ばず終了';
  skip.addEventListener('click',()=>{this.close();engineRef?.resolveLuffySanjiChoice('player',null);this.renderGame(engineRef.state)});
  foot.append(skip);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};


const previousChopperBeginTurn349=GameEngine.prototype.beginTurn;
GameEngine.prototype.beginTurn=async function(side){
  const result=await previousChopperBeginTurn349.call(this,side);
  const player=this.state.sides.player;
  if(side==='ai'){
    for(const card of player.field){
      if(card.id==='OP10-011')card.tempPower=(card.tempPower||0)+2000;
    }
    if(player.field.some(card=>card.id==='OP10-011'))this.log('トニートニー・チョッパー：相手ターン中パワー+2000');
  }
  return result;
};

const previousChopperLoad349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousChopperLoad349.call(this,saved);
  if(this.state.activeSide==='ai'){
    for(const card of this.state.sides.player.field){
      if(card.id==='OP10-011'&&(card.tempPower||0)<2000)card.tempPower=2000;
    }
  }
  return result;
};


const previousZoroPlay349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousZoroPlay349.call(this,side,uid);
  if(!result||source?.id!=='OP13-037')return result;
  const own=this.state.sides[side],leaderTraits=own.leader.traits||[];
  if(leaderTraits.includes('FILM')||leaderTraits.includes('麦わらの一味')){
    const activeCount=Math.min(2,own.don.rested);
    own.don.rested-=activeCount;own.don.active+=activeCount;
    this.log(`${source.name}の登場時：DON!!を${activeCount}枚アクティブにした`);
  }
  return result;
};

const previousZoroEndTurn349=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  const canEnd=this.state.activeSide===side&&this.state.phase==='main'&&!this.state.pending;
  const result=await previousZoroEndTurn349.call(this,side);
  if(!canEnd)return result;
  const own=this.state.sides[side];
  for(const card of own.field){
    if(card.id==='OP13-037'){
      card.rested=false;
      this.log(`${card.name}：ターン終了時にアクティブになった`);
    }
  }
  return result;
};


function syncST31004Rush349(engine,side){
  const own=engine.state.sides[side];
  const attached=(own.leader.attachedDon||0)+own.field.reduce((sum,card)=>sum+(card.attachedDon||0),0);
  for(const card of own.field){
    if(card.id!=='ST31-004')continue;
    card.keywords=Array.isArray(card.keywords)?card.keywords:[];
    const hasRush=card.keywords.includes('rush');
    if(attached>=3&&!hasRush)card.keywords.push('rush');
    if(attached<3&&hasRush)card.keywords=card.keywords.filter(keyword=>keyword!=='rush');
  }
}

const previousST31Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousST31Play349.call(this,side,uid);
  if(!result)return result;
  syncST31004Rush349(this,side);
  if(source?.id!=='ST31-004')return result;
  const own=this.state.sides[side],foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const strawHatCount=[own.leader,...own.field,own.stage].filter(card=>card&&(card.traits||[]).includes('麦わらの一味')).length;
  const options=foe.field.map(card=>card.uid);
  if(!strawHatCount||!options.length){
    this.log(`${source.name}の登場時：パワーを下げる対象なし`);
    return result;
  }
  this.state.pending={kind:'st31004PowerChoice',side,sourceName:source.name,max:strawHatCount,options};
  this.state.phase='effectChoice';
  this.log(`${source.name}の登場時：最大${strawHatCount}回、相手キャラをパワー-1000`);
  return result;
};

GameEngine.prototype.resolveST31004Choice=function(side,ids=[]){
  const pending=this.state.pending;
  if(pending?.kind!=='st31004PowerChoice'||pending.side!==side)return false;
  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const chosen=ids.filter(id=>pending.options.includes(id)).slice(0,pending.max);
  for(const id of chosen){
    const target=foe.field.find(card=>card.uid===id);
    if(target)target.tempPower=(target.tempPower||0)-1000;
  }
  if(chosen.length)this.log(`${pending.sourceName}の登場時：相手キャラへ合計${chosen.length}回、パワー-1000`);
  else this.log(`${pending.sourceName}の効果で対象を選びませんでした`);
  this.state.pending=null;
  this.state.phase='main';
  return true;
};

const previousST31Attach349=GameEngine.prototype.attachDon;
GameEngine.prototype.attachDon=function(side,uid,amount=1){
  const result=previousST31Attach349.call(this,side,uid,amount);
  if(result)syncST31004Rush349(this,side);
  return result;
};

const previousST31Begin349=GameEngine.prototype.beginTurn;
GameEngine.prototype.beginTurn=async function(side){
  const result=await previousST31Begin349.call(this,side);
  syncST31004Rush349(this,side);
  return result;
};

const previousST31Attack349=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerUid,targetUid){
  syncST31004Rush349(this,side);
  return previousST31Attack349.call(this,side,attackerUid,targetUid);
};

const previousST31Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousST31Render349.call(this,g);
  if(g.pending?.kind!=='st31004PowerChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,foe=g.sides.ai,chosen=[];
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>登場時効果</small><h2>ST31-004 ルフィ：対象を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');
  help.textContent=`最大${pending.max}回、相手キャラを選んでパワー-1000。同じキャラを複数回選べます。`;
  const status=document.createElement('p');status.textContent=`選択 0 / ${pending.max}回`;
  const grid=document.createElement('div');grid.className='effect-target-grid';
  const refresh=()=>{
    status.textContent=`選択 ${chosen.length} / ${pending.max}回`;
    for(const button of grid.querySelectorAll('button')){
      const count=chosen.filter(id=>id===button.dataset.id).length;
      button.querySelector('small').textContent=`現在 ${(foe.field.find(card=>card.uid===button.dataset.id)?.power||0)+(foe.field.find(card=>card.uid===button.dataset.id)?.tempPower||0)} / 選択 ×${count}`;
    }
  };
  for(const uid of pending.options){
    const card=foe.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');button.append(note);
    button.addEventListener('click',()=>{if(chosen.length<pending.max){chosen.push(card.uid);refresh()}});
    grid.append(button);
  }
  body.append(help,status,grid);
  const foot=document.createElement('div');foot.className='redirect-footer';
  const reset=document.createElement('button');reset.textContent='選択を戻す';reset.addEventListener('click',()=>{chosen.length=0;refresh()});
  const confirm=document.createElement('button');confirm.textContent='効果を決定';confirm.addEventListener('click',()=>{this.close();engineRef?.resolveST31004Choice('player',chosen);this.renderGame(engineRef.state)});
  const skip=document.createElement('button');skip.textContent='選ばず終了';skip.addEventListener('click',()=>{this.close();engineRef?.resolveST31004Choice('player',[]);this.renderGame(engineRef.state)});
  foot.append(reset,confirm,skip);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);refresh();
};
