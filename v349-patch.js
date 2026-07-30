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
  this.log(`${source.name}の登場時：相手キャラ1枚までをパワー-${strawHatCount*1000}`);
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


const previousST31005Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousST31005Play349.call(this,side,uid);
  if(!result||source?.id!=='ST31-005')return result;
  const own=this.state.sides[side];
  const cards=own.deck.splice(Math.max(0,own.deck.length-5));
  this.state.pending={
    kind:'luffyNamiSearch',side,sourceName:source.name,cards,
    options:cards.filter(card=>(card.traits||[]).includes('麦わらの一味')).map(card=>card.uid),
    help:'デッキの上から5枚を確認し、特徴《麦わらの一味》を持つカード1枚までを手札に加えます。'
  };
  this.state.phase='effectChoice';
  this.log(`${source.name}の登場時：デッキ上から${cards.length}枚を確認`);
  return result;
};

GameEngine.prototype.beginST31005DonChoice=function(side){
  const own=this.state.sides[side],stage=own.stage;
  if(this.state.activeSide!==side||this.state.phase!=='main'||this.state.pending||stage?.id!=='ST31-005'||stage.rested||own.don.rested<1)return false;
  const options=[own.leader,...own.field].filter(card=>card.name==='モンキー・D・ルフィ').map(card=>card.uid);
  if(!options.length){this.log('サウザンド・サニー号：付与できる「モンキー・D・ルフィ」がいません');return false}
  this.snapshot();
  this.state.pending={kind:'st31005DonChoice',side,sourceName:stage.name,options};
  this.state.phase='effectChoice';
  return true;
};

GameEngine.prototype.resolveST31005DonChoice=function(side,targetUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='st31005DonChoice'||pending.side!==side)return false;
  const own=this.state.sides[side],stage=own.stage,target=[own.leader,...own.field].find(card=>card.uid===targetUid&&pending.options.includes(card.uid));
  if(!target||stage?.id!=='ST31-005'||stage.rested||own.don.rested<1){
    this.state.pending=null;this.state.phase='main';return false;
  }
  stage.rested=true;
  own.don.rested-=1;
  target.attachedDon=(target.attachedDon||0)+1;
  syncST31004Rush349(this,side);
  this.log(`${stage.name}：レストのDON!!1枚を${target.name}へ付与`);
  this.state.pending=null;this.state.phase='main';
  return true;
};

const previousST31005ShowCard349=UI.prototype.showCard;
UI.prototype.showCard=function(side,card,g){
  previousST31005ShowCard349.call(this,side,card,g);
  const canUse=side==='player'&&card.id==='ST31-005'&&g.sides.player.stage?.uid===card.uid&&g.activeSide==='player'&&g.phase==='main'&&!g.pending&&!card.rested&&g.sides.player.don.rested>0;
  if(!canUse)return;
  const actions=this.modal?.querySelector('.actions');if(!actions)return;
  const button=document.createElement('button');button.className='primary';button.textContent='起動メインを使う';
  button.addEventListener('click',()=>{this.close();const engineRef=window.__luffyEngine349;if(engineRef?.beginST31005DonChoice('player'))this.renderGame(engineRef.state)});
  actions.prepend(button);
};

const previousST31005Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousST31005Render349.call(this,g);
  if(g.pending?.kind!=='st31005DonChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,own=g.sides.player;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';head.innerHTML='<small>起動メイン</small><h2>DON!!の付与先を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='レストのDON!!1枚を付与する「モンキー・D・ルフィ」を選びます。';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(const uid of pending.options){
    const card=[own.leader,...own.field].find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card===own.leader?'リーダー：'+card.name:card.name;button.append(name);
    const note=document.createElement('small');note.textContent=`付与DON!! ${card.attachedDon||0}枚`;button.append(note);
    button.addEventListener('click',()=>{this.close();engineRef?.resolveST31005DonChoice('player',card.uid);this.renderGame(engineRef.state)});
    grid.append(button);
  }
  body.append(help,grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const cancel=document.createElement('button');cancel.textContent='やめる';cancel.addEventListener('click',()=>{engineRef.state.pending=null;engineRef.state.phase='main';this.close();this.renderGame(engineRef.state)});
  foot.append(cancel);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};


/* ST31-004 correction: choose only one opposing Character. */
GameEngine.prototype.resolveST31004Choice=function(side,ids=[]){
  const pending=this.state.pending;
  if(pending?.kind!=='st31004PowerChoice'||pending.side!==side)return false;
  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const id=(Array.isArray(ids)?ids:[ids]).find(value=>pending.options.includes(value));
  const target=foe.field.find(card=>card.uid===id);
  if(target){
    const reduction=pending.max*1000;
    target.tempPower=(target.tempPower||0)-reduction;
    this.log(`${pending.sourceName}の登場時：${target.name}をこのターン中パワー-${reduction}`);
  }else this.log(`${pending.sourceName}の効果で対象を選びませんでした`);
  this.state.pending=null;
  this.state.phase='main';
  return true;
};

const previousST31004SingleRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousST31004SingleRender349.call(this,g);
  if(g.pending?.kind!=='st31004PowerChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,foe=g.sides.ai,reduction=pending.max*1000;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>登場時効果</small><h2>ST31-004 ルフィ：対象を1枚選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');
  help.textContent=`相手キャラ1枚までを、このターン中パワー-${reduction}します。（《麦わらの一味》${pending.max}枚）`;
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(const uid of pending.options){
    const card=foe.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent=`現在 ${card.power+(card.tempPower||0)} → ${card.power+(card.tempPower||0)-reduction}`;button.append(note);
    button.addEventListener('click',()=>{this.close();engineRef?.resolveST31004Choice('player',[card.uid]);this.renderGame(engineRef.state)});
    grid.append(button);
  }
  body.append(help,grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const skip=document.createElement('button');skip.textContent='選ばず終了';
  skip.addEventListener('click',()=>{this.close();engineRef?.resolveST31004Choice('player',[]);this.renderGame(engineRef.state)});
  foot.append(skip);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};


/* OP14-022 Usopp: activate up to 2 DON!! at the end of its controller's turn. */
const previousUsoppEndTurn349=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  const canEnd=this.state.activeSide===side&&this.state.phase==='main'&&!this.state.pending;
  if(canEnd){
    const own=this.state.sides[side],leaderTraits=own.leader.traits||[];
    if(leaderTraits.includes('FILM')||leaderTraits.includes('麦わらの一味')){
      for(const card of own.field){
        if(card.id!=='OP14-022')continue;
        const activeCount=Math.min(2,own.don.rested);
        own.don.rested-=activeCount;
        own.don.active+=activeCount;
        this.log(`${card.name}のターン終了時：DON!!を${activeCount}枚アクティブにした`);
      }
    }
  }
  return previousUsoppEndTurn349.call(this,side);
};


/* OP14-031 Nami: Blocker; on play rest up to 2 opposing cost-8-or-less Characters,
   then activate up to 5 DON!! at the end of this turn. */
const previousOP14031Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousOP14031Play349.call(this,side,uid);
  if(!result||source?.id!=='OP14-031')return result;
  this.state.op14031EndTurn=this.state.op14031EndTurn||{player:0,ai:0};
  this.state.op14031EndTurn[side]=(this.state.op14031EndTurn[side]||0)+1;
  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const options=foe.field.filter(card=>(card.cost||0)<=8&&!card.rested).map(card=>card.uid);
  if(!options.length){
    this.log(source.name+'の登場時：レストにできる相手キャラはいません');
    return result;
  }
  if(side==='ai'){
    const targets=foe.field.filter(card=>options.includes(card.uid))
      .sort((a,b)=>((b.cost||0)-(a.cost||0))||((b.power||0)-(a.power||0))).slice(0,2);
    for(const card of targets)card.rested=true;
    this.log(source.name+'の登場時：'+targets.map(card=>card.name).join('、')+'をレストにした');
    return result;
  }
  this.state.pending={kind:'op14031RestChoice',side,sourceName:source.name,options,max:2};
  this.state.phase='effectChoice';
  this.log(source.name+'の登場時：相手のコスト8以下のキャラを2枚まで選択');
  return result;
};

GameEngine.prototype.resolveOP14031RestChoice=function(side,ids=[]){
  const pending=this.state.pending;
  if(pending?.kind!=='op14031RestChoice'||pending.side!==side)return false;
  const foe=this.state.sides[side==='player'?'ai':'player'];
  const chosen=[...new Set(Array.isArray(ids)?ids:[ids])].filter(uid=>pending.options.includes(uid)).slice(0,2);
  const names=[];
  for(const uid of chosen){
    const card=foe.field.find(item=>item.uid===uid);
    if(card&&!card.rested){card.rested=true;names.push(card.name)}
  }
  this.log(names.length?pending.sourceName+'の登場時：'+names.join('、')+'をレストにした':pending.sourceName+'の効果で対象を選びませんでした');
  this.state.pending=null;
  this.state.phase='main';
  return true;
};

const previousOP14031EndTurn349=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  const canEnd=this.state.activeSide===side&&this.state.phase==='main'&&!this.state.pending;
  if(canEnd){
    const count=this.state.op14031EndTurn?.[side]||0;
    if(count){
      const own=this.state.sides[side],amount=Math.min(count*5,own.don.rested);
      own.don.rested-=amount;
      own.don.active+=amount;
      this.state.op14031EndTurn[side]=0;
      this.log('ナミのターン終了時：DON!!を'+amount+'枚アクティブにした');
    }
  }
  return previousOP14031EndTurn349.call(this,side);
};

const previousOP14031Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousOP14031Render349.call(this,g);
  if(g.pending?.kind!=='op14031RestChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,foe=g.sides.ai,chosen=[];
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>登場時効果</small><h2>OP14-031 ナミ：対象を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='相手のコスト8以下のアクティブのキャラを2枚まで選び、レストにします。';
  const status=document.createElement('p');status.textContent='選択 0 / 2枚';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  const refresh=()=>{
    status.textContent='選択 '+chosen.length+' / 2枚';
    for(const button of grid.querySelectorAll('button')){
      const selected=chosen.includes(button.dataset.id);
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    }
  };
  for(const uid of pending.options){
    const card=foe.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent='コスト '+card.cost+' / パワー '+(card.power+(card.tempPower||0));button.append(note);
    button.addEventListener('click',()=>{
      const index=chosen.indexOf(card.uid);
      if(index>=0)chosen.splice(index,1);else if(chosen.length<2)chosen.push(card.uid);
      refresh();
    });
    grid.append(button);
  }
  body.append(help,status,grid);
  const foot=document.createElement('div');foot.className='redirect-footer';
  const reset=document.createElement('button');reset.textContent='選択を戻す';reset.addEventListener('click',()=>{chosen.length=0;refresh()});
  const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='効果を決定';confirm.addEventListener('click',()=>{this.close();engineRef?.resolveOP14031RestChoice('player',chosen);this.renderGame(engineRef.state)});
  const skip=document.createElement('button');skip.textContent='選ばず終了';skip.addEventListener('click',()=>{this.close();engineRef?.resolveOP14031RestChoice('player',[]);this.renderGame(engineRef.state)});
  foot.append(reset,confirm,skip);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);refresh();
};


/* Character-area replacement rule: when 5 Characters are already in play,
   choose 1 of your Characters and trash it before playing a new Character. */
const previousFullFieldPlay349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const own=this.state.sides[side],source=own.hand.find(card=>card.uid===uid);
  if(source?.type==='character'&&own.field.length>=5){
    const canStart=this.state.activeSide===side&&this.state.phase==='main'&&!this.state.pending&&!this.state.winner&&Number(source.cost||0)<=own.don.active;
    if(!canStart){
      this.log('ルール上、このカードは現在使用できません');
      return false;
    }
    if(side==='ai'){
      const target=[...own.field].sort((a,b)=>((a.power||0)+(a.tempPower||0))-((b.power||0)+(b.tempPower||0))||((a.cost||0)-(b.cost||0)))[0];
      if(!target)return false;
      own.field=own.field.filter(card=>card.uid!==target.uid);
      own.trash.push(target);
      this.log('キャラエリアが5枚のため、'+target.name+'をトラッシュへ送った');
      return previousFullFieldPlay349.call(this,side,uid);
    }
    this.state.pending={kind:'fullFieldTrashChoice',side,cardUid:uid,sourceName:source.name,options:own.field.map(card=>card.uid)};
    this.state.phase='effectChoice';
    this.log(source.name+'を登場させるため、場のキャラ1枚を選択');
    return true;
  }
  return previousFullFieldPlay349.call(this,side,uid);
};

GameEngine.prototype.resolveFullFieldTrashChoice=async function(side,targetUid){
  const pending=this.state.pending;
  if(pending?.kind!=='fullFieldTrashChoice'||pending.side!==side||!pending.options.includes(targetUid))return false;
  const own=this.state.sides[side],target=own.field.find(card=>card.uid===targetUid);
  if(!target){
    this.state.pending=null;this.state.phase='main';return false;
  }
  own.field=own.field.filter(card=>card.uid!==targetUid);
  own.trash.push(target);
  const cardUid=pending.cardUid,sourceName=pending.sourceName;
  this.state.pending=null;
  this.state.phase='main';
  this.log(sourceName+'を登場させるため、'+target.name+'をトラッシュへ送った');
  return this.playCard(side,cardUid);
};

GameEngine.prototype.cancelFullFieldTrashChoice=function(side){
  const pending=this.state.pending;
  if(pending?.kind!=='fullFieldTrashChoice'||pending.side!==side)return false;
  this.state.pending=null;
  this.state.phase='main';
  this.log(pending.sourceName+'の登場をやめました');
  return true;
};

const previousFullFieldRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousFullFieldRender349.call(this,g);
  if(g.pending?.kind!=='fullFieldTrashChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,own=g.sides.player;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>キャラエリアが5枚です</small><h2>トラッシュへ送るキャラを選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='「'+pending.sourceName+'」を登場させるため、自分の場のキャラ1枚をトラッシュへ送ります。';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(const uid of pending.options){
    const card=own.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent='コスト '+card.cost+' / パワー '+(card.power+(card.tempPower||0));button.append(note);
    button.addEventListener('click',async()=>{
      this.close();
      await engineRef?.resolveFullFieldTrashChoice('player',card.uid);
      this.renderGame(engineRef.state);
    });
    grid.append(button);
  }
  body.append(help,grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const cancel=document.createElement('button');cancel.textContent='登場をやめる';
  cancel.addEventListener('click',()=>{engineRef?.cancelFullFieldTrashChoice('player');this.close();this.renderGame(engineRef.state)});
  foot.append(cancel);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};


/* Search helper: inspect the current hand without resolving or cancelling the search. */
const previousSearchHandRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousSearchHandRender349.call(this,g);
  if(g.pending?.kind!=='luffyNamiSearch'||g.pending.side!=='player'||!this.modal)return;
  const footer=this.modal.querySelector('.redirect-footer');
  if(!footer||footer.querySelector('[data-search-hand]'))return;
  const handButton=document.createElement('button');
  handButton.dataset.searchHand='true';
  handButton.textContent='手札を確認';
  handButton.addEventListener('click',()=>{
    this.close();
    const overlay=document.createElement('div');overlay.className='dialog';
    const panel=document.createElement('section');panel.className='redirect-flow';
    const head=document.createElement('div');head.className='redirect-head';
    const closeX=document.createElement('button');
    closeX.type='button';closeX.textContent='×';closeX.setAttribute('aria-label','手札確認を閉じる');
    closeX.style.cssText='position:absolute;right:18px;top:14px;border:0;background:transparent;color:#fff;font-size:32px;line-height:1;z-index:2';
    head.style.position='relative';
    head.innerHTML='<small>サーチ中</small><h2>現在の手札（'+g.sides.player.hand.length+'枚）</h2>';
    head.append(closeX);
    const body=document.createElement('div');body.className='redirect-body';
    const help=document.createElement('p');help.textContent='確認だけの画面です。×または「サーチへ戻る」でカード選択に戻れます。';
    const grid=document.createElement('div');grid.className='effect-target-grid';
    for(const card of g.sides.player.hand){
      const item=document.createElement('div');item.className='effect-target-card';
      item.style.cssText='display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid #53627a;border-radius:12px;background:#101a2b';
      if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;image.style.cssText='width:100%;height:auto;object-fit:contain;border-radius:8px';item.append(image)}
      const name=document.createElement('strong');name.textContent=card.name;item.append(name);
      const note=document.createElement('small');note.textContent='コスト '+(card.cost??'-')+' / カウンター '+(card.counter||0);item.append(note);
      grid.append(item);
    }
    if(!g.sides.player.hand.length){const empty=document.createElement('p');empty.textContent='手札はありません。';grid.append(empty)}
    body.append(help,grid);
    const foot=document.createElement('div');foot.className='redirect-footer single';
    const back=document.createElement('button');back.className='primary';back.textContent='サーチへ戻る';
    const returnToSearch=()=>{this.close();this.renderGame(g)};
    back.addEventListener('click',returnToSearch);closeX.addEventListener('click',returnToSearch);
    foot.append(back);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
  });
  footer.prepend(handButton);
};


/* OP13-027 Sanji: activate up to 2 DON!! on play and up to 1 DON!!
   at the end of its controller's turn with a FILM/Straw Hat Crew Leader. */
const previousOP13027Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousOP13027Play349.call(this,side,uid);
  if(!result||source?.id!=='OP13-027')return result;
  const own=this.state.sides[side],amount=Math.min(2,own.don.rested);
  own.don.rested-=amount;
  own.don.active+=amount;
  this.log(source.name+'の登場時：DON!!を'+amount+'枚アクティブにした');
  return result;
};

const previousOP13027EndTurn349=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  const canEnd=this.state.activeSide===side&&this.state.phase==='main'&&!this.state.pending;
  if(canEnd){
    const own=this.state.sides[side],traits=own.leader.traits||[];
    if(traits.includes('FILM')||traits.includes('麦わらの一味')){
      for(const card of own.field){
        if(card.id!=='OP13-027')continue;
        const amount=Math.min(1,own.don.rested);
        own.don.rested-=amount;
        own.don.active+=amount;
        this.log(card.name+'のターン終了時：DON!!を'+amount+'枚アクティブにした');
      }
    }
  }
  return previousOP13027EndTurn349.call(this,side);
};


/* OP13-118 Monkey.D.Luffy: Double Attack and multicolor-Leader on-play effect. */
const previousOP13118Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const own=this.state.sides[side],source=own.hand.find(card=>card.uid===uid);
  if(source?.type==='character'&&(source.cost||0)>=5&&own.op13118NoHighCostThroughTurn===this.state.turn){
    this.log('OP13-118 ルフィの効果により、このターンは元々のコスト5以上のキャラを登場できません');
    return false;
  }
  const result=await previousOP13118Play349.call(this,side,uid);
  if(!result||source?.id!=='OP13-118')return result;
  if((own.leader.color||[]).length>1){
    const amount=Math.min(4,own.don.rested);
    own.don.rested-=amount;
    own.don.active+=amount;
    own.op13118NoHighCostThroughTurn=this.state.turn;
    this.log(source.name+'の登場時：DON!!を'+amount+'枚アクティブにした');
    this.log('このターン中、元々のコスト5以上のキャラは登場できません');
  }
  return result;
};

const previousOP13118Damage349=GameEngine.prototype.resolveDamage;
GameEngine.prototype.resolveDamage=function(){
  const battle=this.state.pending;
  if(battle?.kind==='battle'&&battle.targetKind==='leader'&&battle.power>=battle.targetPower+battle.counterPower){
    const own=this.state.sides[battle.attackingSide];
    const attacker=[own.leader,...own.field].find(card=>card.uid===battle.attackerUid);
    if(attacker?.id==='OP13-118'){
      this.state.op13118ExtraDamage={defendingSide:battle.defendingSide,attackingSide:battle.attackingSide};
      this.log(attacker.name+'のダブルアタック');
    }
  }
  return previousOP13118Damage349.call(this);
};

const previousOP13118Trigger349=GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger=async function(use){
  const wasLifeReveal=this.state.pending?.kind==='lifeReveal';
  const result=await previousOP13118Trigger349.call(this,use);
  const extra=this.state.op13118ExtraDamage;
  if(!wasLifeReveal||!extra)return result;
  this.state.op13118ExtraDamage=null;
  const defender=this.state.sides[extra.defendingSide];
  if(!defender.life.length){
    defender.defeated=true;
    this.log('ダブルアタックの2ダメージ目：ライフ0のリーダーへダメージ');
    this.state.pending=null;
    return this.checkWin();
  }
  const lifeCard=defender.life.pop(),hasTrigger=(lifeCard.effects||[]).some(effect=>effect.timing==='trigger');
  this.state.pending={kind:'lifeReveal',side:extra.defendingSide,card:lifeCard,resumeSide:extra.attackingSide,hasTrigger};
  this.state.phase='lifeReveal';
  this.log('ダブルアタックの2ダメージ目：ライフから'+lifeCard.name+'を公開');
  return true;
};


/* OP15-032 Brook: on play rest up to 1 opposing card; Activate: Main —
   trash this Character to set up to 1 own base-cost-8-or-less Character active. */
const previousOP15032Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousOP15032Play349.call(this,side,uid);
  if(!result||source?.id!=='OP15-032')return result;
  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const targets=[];
  if(foe.leader&&!foe.leader.rested)targets.push(foe.leader);
  for(const card of foe.field)if(!card.rested)targets.push(card);
  if(foe.stage&&!foe.stage.rested)targets.push(foe.stage);
  if(!targets.length){
    this.log(source.name+'の登場時：レストにできる相手のカードがありません');
    return result;
  }
  if(side==='ai'){
    const blockers=targets.filter(card=>card.type==='character'&&(card.keywords||[]).includes('blocker'));
    const characters=targets.filter(card=>card.type==='character');
    const target=(blockers.length?blockers:characters.length?characters:targets)
      .sort((a,b)=>((b.cost||0)-(a.cost||0))||((b.power||0)-(a.power||0)))[0];
    target.rested=true;
    this.log(source.name+'の登場時：'+target.name+'をレストにした');
    return result;
  }
  this.state.pending={kind:'op15032RestChoice',side,sourceName:source.name,options:targets.map(card=>card.uid)};
  this.state.phase='effectChoice';
  this.log(source.name+'の登場時：レストにする相手のカードを1枚まで選択');
  return result;
};

GameEngine.prototype.resolveOP15032RestChoice=function(side,targetUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='op15032RestChoice'||pending.side!==side)return false;
  const foe=this.state.sides[side==='player'?'ai':'player'];
  const target=[foe.leader,...foe.field,foe.stage].filter(Boolean)
    .find(card=>card.uid===targetUid&&pending.options.includes(card.uid));
  if(target&&!target.rested){
    target.rested=true;
    this.log(pending.sourceName+'の登場時：'+target.name+'をレストにした');
  }else this.log(pending.sourceName+'の効果で対象を選びませんでした');
  this.state.pending=null;
  this.state.phase='main';
  return true;
};

GameEngine.prototype.beginOP15032Main=function(side,sourceUid){
  const own=this.state.sides[side],source=own.field.find(card=>card.uid===sourceUid&&card.id==='OP15-032');
  const leaderTraits=own.leader?.traits||[];
  if(!source||this.state.activeSide!==side||this.state.phase!=='main'||this.state.pending||!leaderTraits.includes('麦わらの一味'))return false;
  const options=own.field.filter(card=>card.uid!==sourceUid&&card.rested&&Number(card.baseCost??card.cost??0)<=8).map(card=>card.uid);
  if(!options.length){
    this.log(source.name+'：アクティブにできるコスト8以下の自分のキャラがいません');
    return false;
  }
  this.snapshot();
  own.field=own.field.filter(card=>card.uid!==sourceUid);
  if(source.attachedDon){
    own.don.rested+=source.attachedDon;
    source.attachedDon=0;
  }
  own.trash.push(source);
  this.state.pending={kind:'op15032ActiveChoice',side,sourceName:source.name,options};
  this.state.phase='effectChoice';
  this.log(source.name+'をトラッシュへ送り、アクティブにする自分のキャラを選択');
  return true;
};

GameEngine.prototype.resolveOP15032ActiveChoice=function(side,targetUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='op15032ActiveChoice'||pending.side!==side)return false;
  const own=this.state.sides[side],target=own.field.find(card=>card.uid===targetUid&&pending.options.includes(card.uid));
  if(target&&target.rested&&Number(target.baseCost??target.cost??0)<=8){
    target.rested=false;
    this.log(pending.sourceName+'の起動メイン：'+target.name+'をアクティブにした');
  }else this.log(pending.sourceName+'の起動メインで対象を選びませんでした');
  this.state.pending=null;
  this.state.phase='main';
  return true;
};

const previousOP15032ShowCard349=UI.prototype.showCard;
UI.prototype.showCard=function(side,card,g){
  previousOP15032ShowCard349.call(this,side,card,g);
  const own=g.sides.player;
  const canUse=side==='player'&&card.id==='OP15-032'&&own.field.some(item=>item.uid===card.uid)&&g.activeSide==='player'&&g.phase==='main'&&!g.pending&&(own.leader?.traits||[]).includes('麦わらの一味')&&own.field.some(item=>item.uid!==card.uid&&item.rested&&Number(item.baseCost??item.cost??0)<=8);
  if(!canUse)return;
  const actions=this.modal?.querySelector('.actions');if(!actions)return;
  const button=document.createElement('button');button.className='primary';button.textContent='起動メインを使う';
  button.addEventListener('click',()=>{this.close();const engineRef=window.__luffyEngine349;if(engineRef?.beginOP15032Main('player',card.uid))this.renderGame(engineRef.state)});
  actions.prepend(button);
};

const previousOP15032Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousOP15032Render349.call(this,g);
  const pending=g.pending,engineRef=window.__luffyEngine349;
  if(!pending||pending.side!=='player'||(pending.kind!=='op15032RestChoice'&&pending.kind!=='op15032ActiveChoice'))return;
  this.close();
  const isRest=pending.kind==='op15032RestChoice';
  const sideState=isRest?g.sides.ai:g.sides.player;
  const candidates=isRest?[sideState.leader,...sideState.field,sideState.stage].filter(Boolean):sideState.field;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>'+(isRest?'登場時効果':'起動メイン')+'</small><h2>OP15-032 ブルック：対象を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');
  help.textContent=isRest?'相手のアクティブのカード1枚までをレストにします。':'自分のレストの、元々のコスト8以下のキャラ1枚までをアクティブにします。';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(const uid of pending.options){
    const card=candidates.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');
    name.textContent=card===sideState.leader?'リーダー：'+card.name:card===sideState.stage?'ステージ：'+card.name:card.name;
    button.append(name);
    const note=document.createElement('small');
    note.textContent=card.type==='character'?'コスト '+card.cost+' / パワー '+((card.power||0)+(card.tempPower||0)):(card===sideState.leader?'リーダー':'ステージ');
    button.append(note);
    button.addEventListener('click',()=>{this.close();if(isRest)engineRef?.resolveOP15032RestChoice('player',card.uid);else engineRef?.resolveOP15032ActiveChoice('player',card.uid);this.renderGame(engineRef.state)});
    grid.append(button);
  }
  body.append(help,grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const skip=document.createElement('button');skip.textContent='選ばず終了';
  skip.addEventListener('click',()=>{this.close();if(isRest)engineRef?.resolveOP15032RestChoice('player',null);else engineRef?.resolveOP15032ActiveChoice('player',null);this.renderGame(engineRef.state)});
  foot.append(skip);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};

const previousOP15032EndTurn349=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  if(side==='ai'&&this.state.activeSide===side&&this.state.phase==='main'&&!this.state.pending){
    const own=this.state.sides.ai,traits=own.leader?.traits||[];
    if(traits.includes('麦わらの一味')){
      for(const brook of [...own.field].filter(card=>card.id==='OP15-032')){
        const target=own.field.filter(card=>card.uid!==brook.uid&&card.rested&&Number(card.baseCost??card.cost??0)<=8)
          .sort((a,b)=>(((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0)))||((b.cost||0)-(a.cost||0)))[0];
        if(!target)continue;
        own.field=own.field.filter(card=>card.uid!==brook.uid);
        if(brook.attachedDon){own.don.rested+=brook.attachedDon;brook.attachedDon=0}
        own.trash.push(brook);
        target.rested=false;
        this.log(brook.name+'の起動メイン：自身をトラッシュへ送り、'+target.name+'をアクティブにした');
      }
    }
  }
  return previousOP15032EndTurn349.call(this,side);
};
