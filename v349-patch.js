import{GameEngine}from'./game-engine-v3.js?v=3983';
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
  if(side==='ai'){
    const chosen=cards.filter(card=>this.state.pending?.options?.includes(card.uid))
      .sort((a,b)=>(Number(b.counter||0)-Number(a.counter||0))||(Number(b.cost||0)-Number(a.cost||0))||(Number(b.power||0)-Number(a.power||0)))[0];
    this.resolveLuffyNamiSearch('ai',chosen?.uid||null);
  }
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
  const options=foe.field.filter(card=>this.effectiveCost(foeSide,card)<=8&&!card.rested).map(card=>card.uid);
  if(!options.length){
    this.log(source.name+'の登場時：レストにできる相手キャラはいません');
    return result;
  }
  if(side==='ai'){
    const targets=foe.field.filter(card=>options.includes(card.uid))
      .sort((a,b)=>(this.effectiveCost(foeSide,b)-this.effectiveCost(foeSide,a))||((b.power||0)-(a.power||0))).slice(0,2);
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
  if(!['luffyNamiSearch','teachSearch3Choice'].includes(g.pending?.kind)||g.pending.side!=='player'||!this.modal)return;
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


/* EB04-007 Roronoa Zoro: on play Leader +2000 through the opponent's
   next End Phase; once per turn gain Rush: Character when a foe has 8000+ power. */
function eb04007Power349(card){
  return Number(card?.power||0)+Number(card?.tempPower||0)+Number(card?.burgessPowerBonus||0);
}

const previousEB04007Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousEB04007Play349.call(this,side,uid);
  if(!result||source?.id!=='EB04-007')return result;
  const leader=this.state.sides[side].leader;
  leader.tempPower=(leader.tempPower||0)+2000;
  this.log(source.name+'の登場時：リーダーを次の相手のエンドフェイズ終了時までパワー+2000');
  return result;
};

GameEngine.prototype.activateEB04007Rush=function(side,sourceUid){
  const own=this.state.sides[side],foe=this.state.sides[side==='player'?'ai':'player'];
  const source=own.field.find(card=>card.uid===sourceUid&&card.id==='EB04-007');
  if(!source||this.state.activeSide!==side||this.state.phase!=='main'||this.state.pending||source.eb04007RushUsedTurn===this.state.turn)return false;
  if(!foe.field.some(card=>eb04007Power349(card)>=8000)){
    this.log(source.name+'：相手にパワー8000以上のキャラがいないため効果を使用できません');
    return false;
  }
  this.snapshot();
  source.eb04007RushUsedTurn=this.state.turn;
  source.eb04007RushCharacterThroughTurn=this.state.turn;
  source.summoningSickness=false;
  source.keywords=Array.isArray(source.keywords)?source.keywords:[];
  if(!source.keywords.includes('rush'))source.keywords.push('rush');
  this.log(source.name+'の起動メイン：このターン中「速攻：キャラ」を得た');
  return true;
};

const previousEB04007Attack349=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerUid,targetUid){
  const own=this.state.sides[side],foe=this.state.sides[side==='player'?'ai':'player'];
  const attacker=own.field.find(card=>card.uid===attackerUid);
  if(attacker?.id==='EB04-007'&&attacker.eb04007RushCharacterThroughTurn===this.state.turn&&targetUid===foe.leader.uid){
    this.log(attacker.name+'の「速攻：キャラ」では相手リーダーへアタックできません');
    return false;
  }
  return previousEB04007Attack349.call(this,side,attackerUid,targetUid);
};

const previousEB04007BeginTurn349=GameEngine.prototype.beginTurn;
GameEngine.prototype.beginTurn=async function(side){
  const own=this.state?.sides?.[side];
  if(own){
    for(const card of own.field){
      if(card.id==='EB04-007'&&card.eb04007RushCharacterThroughTurn!=null){
        card.keywords=(card.keywords||[]).filter(keyword=>keyword!=='rush');
        delete card.eb04007RushCharacterThroughTurn;
      }
    }
  }
  return previousEB04007BeginTurn349.call(this,side);
};

const previousEB04007ShowCard349=UI.prototype.showCard;
UI.prototype.showCard=function(side,card,g){
  previousEB04007ShowCard349.call(this,side,card,g);
  const own=g.sides.player,foe=g.sides.ai;
  const canUse=side==='player'&&card.id==='EB04-007'&&own.field.some(item=>item.uid===card.uid)&&g.activeSide==='player'&&g.phase==='main'&&!g.pending&&card.eb04007RushUsedTurn!==g.turn&&foe.field.some(item=>eb04007Power349(item)>=8000);
  if(!canUse)return;
  const actions=this.modal?.querySelector('.actions');if(!actions)return;
  const button=document.createElement('button');button.className='primary';button.textContent='起動メインを使う';
  button.addEventListener('click',()=>{
    this.close();
    const engineRef=window.__luffyEngine349;
    engineRef?.activateEB04007Rush('player',card.uid);
    this.renderGame(engineRef.state);
  });
  actions.prepend(button);
};


/* Stable undo: skip transient AI snapshots and return control to the last
   player state. This also makes an in-flight AI loop observe the restored state. */
GameEngine.prototype.undo=function(){
  if(!this.history.length)return false;
  let restored=null;
  while(this.history.length){
    restored=this.history.pop();
    if(restored?.activeSide==='player')break;
  }
  if(!restored)return false;
  this.state=restored;
  if(this.state.phase==='effectChoice'&&!this.state.pending)this.state.phase='main';
  window.__luffyEngine349=this;
  this.log('直前のプレイヤー操作まで戻しました');
  return true;
};


/* EB04-007 usability correction: automatically apply Rush: Character when
   its condition is met, hide the manual button, and omit the Leader target. */
function syncEB04007AutomaticRush349(engine,side){
  if(!engine?.state||engine.state.activeSide!==side||engine.state.phase!=='main'||engine.state.pending)return;
  const own=engine.state.sides[side],foe=engine.state.sides[side==='player'?'ai':'player'];
  if(!foe.field.some(card=>eb04007Power349(card)>=8000))return;
  for(const card of own.field){
    if(card.id!=='EB04-007'||!card.summoningSickness||card.eb04007RushUsedTurn===engine.state.turn)continue;
    card.eb04007RushUsedTurn=engine.state.turn;
    card.eb04007RushCharacterThroughTurn=engine.state.turn;
    card.summoningSickness=false;
    card.keywords=Array.isArray(card.keywords)?card.keywords:[];
    if(!card.keywords.includes('rush'))card.keywords.push('rush');
    engine.log(card.name+'：条件を満たしたため、このターン中「速攻：キャラ」を得た');
  }
}

const previousEB04007AutoRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const engineRef=window.__luffyEngine349;
  if(engineRef?.state===g){
    syncEB04007AutomaticRush349(engineRef,'player');
    syncEB04007AutomaticRush349(engineRef,'ai');
  }
  return previousEB04007AutoRender349.call(this,g);
};

const previousEB04007AutoShowCard349=UI.prototype.showCard;
UI.prototype.showCard=function(side,card,g){
  const engineRef=window.__luffyEngine349;
  if(engineRef?.state===g)syncEB04007AutomaticRush349(engineRef,side);
  previousEB04007AutoShowCard349.call(this,side,card,g);
  if(card.id!=='EB04-007')return;
  const actions=this.modal?.querySelector('.actions');
  if(!actions)return;
  for(const button of [...actions.querySelectorAll('button')]){
    if(button.textContent.trim()==='起動メインを使う')button.remove();
    if(button.textContent.trim()==='攻撃する'&&card.eb04007RushCharacterThroughTurn===g.turn){
      button.addEventListener('click',()=>{window.__eb04007CharacterRushAttacker=card.uid},{capture:true,once:true});
    }
  }
};

const previousEB04007Targets349=UI.prototype.targets;
UI.prototype.targets=function(targets){
  const attackerUid=window.__eb04007CharacterRushAttacker;
  const engineRef=window.__luffyEngine349;
  const own=engineRef?.state?.sides?.player;
  const attacker=own?.field?.find(card=>card.uid===attackerUid);
  window.__eb04007CharacterRushAttacker=null;
  if(attacker?.id==='EB04-007'&&attacker.eb04007RushCharacterThroughTurn===engineRef.state.turn){
    return previousEB04007Targets349.call(this,(targets||[]).filter(target=>target.kind!=='leader'));
  }
  return previousEB04007Targets349.call(this,targets);
};


/* OP12-037 Demon Aura Nine Sword Style:
   Main — rest 3 own DON!! to rest up to 2 opposing Characters/DON!! total.
   Counter — pay 1 DON!! and give the defending Leader +3000 for the battle. */
const previousOP12037Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousOP12037Play349.call(this,side,uid);
  if(!result||source?.id!=='OP12-037')return result;
  const own=this.state.sides[side],foe=this.state.sides[side==='player'?'ai':'player'];
  if(own.don.active<3){
    this.log(source.name+'：追加コストのアクティブDON!!3枚がないため、メイン効果を使用しませんでした');
    return result;
  }
  const charOptions=foe.field.filter(card=>!card.rested).map(card=>card.uid);
  const maxDon=Math.min(2,foe.don.active);
  if(side==='ai'){
    own.don.active-=3;own.don.rested+=3;
    const targets=foe.field.filter(card=>charOptions.includes(card.uid))
      .sort((a,b)=>((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0))).slice(0,2);
    for(const card of targets)card.rested=true;
    const donCount=Math.min(2-targets.length,maxDon);
    foe.don.active-=donCount;foe.don.rested+=donCount;
    this.log(source.name+'：'+targets.length+'枚のキャラとDON!!'+donCount+'枚をレストにした');
    return result;
  }
  this.state.pending={kind:'op12037MainChoice',side,sourceName:source.name,charOptions,maxDon};
  this.state.phase='effectChoice';
  this.log(source.name+'：追加でDON!!3枚をレストにするか選択');
  return result;
};

GameEngine.prototype.resolveOP12037MainChoice=function(side,charIds=[],donCount=0,use=true){
  const pending=this.state.pending;
  if(pending?.kind!=='op12037MainChoice'||pending.side!==side)return false;
  const own=this.state.sides[side],foe=this.state.sides[side==='player'?'ai':'player'];
  if(!use){
    this.log(pending.sourceName+'のメイン効果を使用しませんでした');
    this.state.pending=null;this.state.phase='main';return true;
  }
  if(own.don.active<3){
    this.log(pending.sourceName+'：追加コストのDON!!が不足しています');
    this.state.pending=null;this.state.phase='main';return false;
  }
  const chosen=[...new Set(Array.isArray(charIds)?charIds:[charIds])]
    .filter(uid=>pending.charOptions.includes(uid)).slice(0,2);
  const validChars=chosen.map(uid=>foe.field.find(card=>card.uid===uid&&!card.rested)).filter(Boolean);
  const dons=Math.min(Math.max(0,Number(donCount)||0),pending.maxDon,foe.don.active,2-validChars.length);
  own.don.active-=3;own.don.rested+=3;
  for(const card of validChars)card.rested=true;
  foe.don.active-=dons;foe.don.rested+=dons;
  this.log(pending.sourceName+'：相手キャラ'+validChars.length+'枚とDON!!'+dons+'枚をレストにした');
  this.state.pending=null;this.state.phase='main';
  return true;
};

const previousOP12037Counters349=GameEngine.prototype.submitCounters;
GameEngine.prototype.submitCounters=function(side,counterIds=[]){
  const battle=this.state.pending,s=this.state.sides[side];
  if(battle?.kind==='battle'&&battle.step==='counter'&&battle.defendingSide===side){
    const requested=Array.isArray(counterIds)?counterIds:[counterIds],accepted=[];
    for(const uid of requested){
      const card=s.hand.find(item=>item.uid===uid);
      if(card?.id!=='OP12-037'){accepted.push(uid);continue}
      if(battle.targetKind!=='leader'||s.don.active<1){
        this.log(card.name+'：リーダーのバトルでアクティブDON!!1枚が必要です');
        continue;
      }
      s.don.active-=1;s.don.rested+=1;
      accepted.push(uid);
    }
    return previousOP12037Counters349.call(this,side,accepted);
  }
  return previousOP12037Counters349.call(this,side,counterIds);
};

const previousOP12037Defense349=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  previousOP12037Defense349.call(this,g,...args);
  const battle=g.pending,s=g.sides.player;
  if(battle?.kind!=='battle'||battle.defendingSide!=='player')return;
  for(const card of s.hand.filter(item=>item.id==='OP12-037')){
    const button=this.modal?.querySelector('.counter-grid button[data-id="'+card.uid+'"]');
    if(!button)continue;
    const usable=battle.targetKind==='leader'&&s.don.active>=1;
    button.disabled=!usable;
    button.title=usable?'アクティブDON!!1枚を使用':'リーダーへの攻撃時に、アクティブDON!!1枚が必要です';
    const note=document.createElement('small');note.textContent=usable?'コスト：DON!!1枚':'現在は使用不可';button.append(note);
  }
};

const previousOP12037Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousOP12037Render349.call(this,g);
  if(g.pending?.kind!=='op12037MainChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,foe=g.sides.ai,chosen=new Set();
  let donCount=0;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>メイン効果</small><h2>OP12-037：レストするカードを選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='追加で自分のDON!!3枚をレストにし、相手のキャラとDON!!を合計2枚までレストにします。';
  const status=document.createElement('p');
  const grid=document.createElement('div');grid.className='effect-target-grid';
  const refresh=()=>{
    const total=chosen.size+donCount;
    status.textContent='選択 '+total+' / 2枚（キャラ '+chosen.size+'枚・DON!! '+donCount+'枚）';
    for(const button of grid.querySelectorAll('button[data-id]'))button.classList.toggle('selected',chosen.has(button.dataset.id));
    const donButton=grid.querySelector('[data-don]');
    if(donButton){donButton.classList.toggle('selected',donCount>0);donButton.querySelector('small').textContent='選択 ×'+donCount+' / アクティブ '+foe.don.active+'枚'}
  };
  for(const uid of pending.charOptions){
    const card=foe.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent='パワー '+((card.power||0)+(card.tempPower||0));button.append(note);
    button.addEventListener('click',()=>{
      if(chosen.has(card.uid))chosen.delete(card.uid);
      else if(chosen.size+donCount<2)chosen.add(card.uid);
      refresh();
    });
    grid.append(button);
  }
  if(pending.maxDon>0){
    const button=document.createElement('button');button.dataset.don='true';
    const name=document.createElement('strong');name.textContent='相手のDON!!';button.append(name);
    const note=document.createElement('small');button.append(note);
    button.addEventListener('click',()=>{
      const available=Math.min(pending.maxDon,2-chosen.size);
      donCount=donCount>=available?0:donCount+1;
      refresh();
    });
    grid.append(button);
  }
  body.append(help,status,grid);
  const foot=document.createElement('div');foot.className='redirect-footer';
  const cancel=document.createElement('button');cancel.textContent='効果を使わない';
  cancel.addEventListener('click',()=>{this.close();engineRef?.resolveOP12037MainChoice('player',[],0,false);this.renderGame(engineRef.state)});
  const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='DON!!3枚をレストして決定';
  confirm.addEventListener('click',()=>{this.close();engineRef?.resolveOP12037MainChoice('player',[...chosen],donCount,true);this.renderGame(engineRef.state)});
  foot.append(cancel,confirm);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);refresh();
};


/* OP12-037 migration for matches/saves created before its effect was registered. */
function syncOP12037Runtime349(state){
  if(!state?.sides)return;
  for(const side of ['player','ai']){
    const s=state.sides[side];
    const cards=[s.leader,...s.deck,...s.hand,...s.life,...s.field,...s.trash,s.stage].filter(Boolean);
    if(state.pending?.card)cards.push(state.pending.card);
    if(Array.isArray(state.pending?.cards))cards.push(...state.pending.cards);
    for(const card of cards){
      if(card.id!=='OP12-037')continue;
      card.name='鬼気 九刀流 阿修羅 抜剣 亡者戯';
      card.type='event';card.color=['green'];card.cost=1;card.power=0;card.counter=3000;
      card.traits=['麦わらの一味'];
      card.text='【メイン】自分のDON!!3枚をレストにできる：相手の、キャラかDON!!合計2枚までを、レストにする。【カウンター】自分のリーダーを、このバトル中、パワー+3000。';
      card.imageUrl='https://cards.oplaytcg.com/OP12/jp/OP12-037.webp';
      card.effects=[];card.keywords=['main','counter'];
    }
  }
}

const previousOP12037MigrationPlay349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  syncOP12037Runtime349(this.state);
  return previousOP12037MigrationPlay349.call(this,side,uid);
};

const previousOP12037MigrationStart349=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){
  const result=previousOP12037MigrationStart349.apply(this,args);
  syncOP12037Runtime349(this.state);
  return result;
};

const previousOP12037MigrationLoad349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousOP12037MigrationLoad349.call(this,saved);
  syncOP12037Runtime349(this.state);
  return result;
};

const previousOP12037MigrationRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  syncOP12037Runtime349(g);
  return previousOP12037MigrationRender349.call(this,g);
};


/* OP15-032 Brook image repair */
const OP15032_IMAGE_349="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP15/OP15-032_JP.webp";
function syncOP15032Image349(state){
  if(!state||!state.sides)return;
  const cards=[];
  for(const sideName of ["player","ai"]){
    const side=state.sides[sideName];
    if(!side)continue;
    if(side.leader)cards.push(side.leader);
    if(side.stage)cards.push(side.stage);
    for(const zone of ["deck","hand","life","field","trash"]){
      if(Array.isArray(side[zone]))cards.push(...side[zone]);
    }
  }
  if(state.pending){
    if(state.pending.card)cards.push(state.pending.card);
    if(Array.isArray(state.pending.cards))cards.push(...state.pending.cards);
  }
  for(const card of cards){
    if(card&&card.id==="OP15-032")card.imageUrl=OP15032_IMAGE_349;
  }
}
const previousOP15032ImageStart349=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){
  const result=previousOP15032ImageStart349.apply(this,args);
  syncOP15032Image349(this.state);
  return result;
};
const previousOP15032ImageLoad349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousOP15032ImageLoad349.call(this,saved);
  syncOP15032Image349(this.state);
  return result;
};
const previousOP15032ImageRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  syncOP15032Image349(g);
  return previousOP15032ImageRender349.call(this,g);
};


/* Card detail: show the full image for hand cards and all cards on the board. */
const previousHandCardImageShowCard349=UI.prototype.showCard;
UI.prototype.showCard=function(side,card,g){
  previousHandCardImageShowCard349.call(this,side,card,g);
  const owner=g?.sides?.[side];
  const isHandCard=Boolean(owner?.hand?.some(item=>item.uid===card.uid));
  const isBoardCard=Boolean(owner?.leader?.uid===card.uid||owner?.field?.some(item=>item.uid===card.uid)||owner?.stage?.uid===card.uid);
  if((!isHandCard&&!isBoardCard)||!card.imageUrl)return;
  const panel=this.modal?.querySelector('.sheet');
  const title=panel?.querySelector('h2');
  if(!panel||!title||panel.querySelector('[data-hand-card-preview]'))return;
  panel.style.maxHeight='88dvh';
  panel.style.overflowY='auto';
  panel.style.webkitOverflowScrolling='touch';
  const preview=document.createElement('div');
  preview.dataset.handCardPreview='true';
  preview.style.cssText='display:flex;justify-content:center;align-items:center;margin:10px 0 14px;min-height:0';
  const image=document.createElement('img');
  image.src=card.imageUrl;
  image.alt=card.name+'のカード画像';
  image.loading='eager';
  image.style.cssText='display:block;width:min(44vw,180px);height:auto;max-height:36dvh;object-fit:contain;border-radius:9px;border:1px solid rgba(255,255,255,.28);box-shadow:0 8px 22px rgba(0,0,0,.38)';
  preview.append(image);
  title.insertAdjacentElement('afterend',preview);
};


/* OP13-040 I Know You're Strong... So I'll Go All Out:
   Main — optionally rest 2 additional DON!! and prevent up to 2 rested,
   cost-7-or-less opposing Characters from becoming active next refresh.
   Counter/Trigger — defending Leader +3000 for the battle. */
function syncOP13040Runtime349(state){
  if(!state?.sides)return;
  const cards=[];
  for(const sideName of ['player','ai']){
    const side=state.sides[sideName];if(!side)continue;
    if(side.leader)cards.push(side.leader);
    if(side.stage)cards.push(side.stage);
    for(const zone of ['deck','hand','life','field','trash'])if(Array.isArray(side[zone]))cards.push(...side[zone]);
  }
  if(state.pending?.card)cards.push(state.pending.card);
  if(Array.isArray(state.pending?.cards))cards.push(...state.pending.cards);
  for(const card of cards){
    if(card?.id!=='OP13-040')continue;
    card.name='強ェとわかってんだから… 始めから全開だ!!!';
    card.type='event';card.color=['green'];card.cost=1;card.power=0;card.counter=3000;
    card.traits=['超新星','麦わらの一味'];
    card.text='【メイン】自分のDON!!2枚をレストにできる：相手のレストのコスト7以下のキャラ2枚までは、次の相手のリフレッシュフェーズでアクティブにならない。【カウンター】自分のリーダーを、このバトル中、パワー+3000。【トリガー】このカードの【カウンター】効果を発動する。';
    card.effects=[{timing:'trigger',action:'op13040CounterTrigger'}];
    card.keywords=['main','counter','trigger'];
  }
}
const previousOP13040Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  syncOP13040Runtime349(this.state);
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousOP13040Play349.call(this,side,uid);
  if(!result||source?.id!=='OP13-040')return result;
  const own=this.state.sides[side],foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const options=foe.field.filter(card=>card.rested&&this.effectiveCost(foeSide,card)<=7).map(card=>card.uid);
  if(own.don.active<2){
    this.log(source.name+'：追加コストのアクティブDON!!2枚がないため、メイン効果を使用しませんでした');
    return result;
  }
  if(side==='ai'){
    const targets=foe.field.filter(card=>options.includes(card.uid))
      .sort((a,b)=>((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0))).slice(0,2);
    if(!targets.length){this.log(source.name+'：対象がないためメイン効果を使用しませんでした');return result}
    own.don.active-=2;own.don.rested+=2;
    for(const target of targets)markOP13040RefreshLock349(target);
    this.log(source.name+'：'+targets.map(card=>card.name).join('、')+'を次のリフレッシュでアクティブ不可にした');
    return result;
  }
  this.state.pending={kind:'op13040MainChoice',side,sourceName:source.name,options};
  this.state.phase='effectChoice';
  this.log(source.name+'：追加でDON!!2枚をレストにするか選択');
  return result;
};
GameEngine.prototype.resolveOP13040MainChoice=function(side,targetUids=[],use=true){
  const pending=this.state.pending;
  if(pending?.kind!=='op13040MainChoice'||pending.side!==side)return false;
  const own=this.state.sides[side],foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  if(!use){
    this.log(pending.sourceName+'のメイン効果を使用しませんでした');
    this.state.pending=null;this.state.phase='main';return true;
  }
  if(own.don.active<2){
    this.log(pending.sourceName+'：追加コストのDON!!が不足しています');
    this.state.pending=null;this.state.phase='main';return false;
  }
  const chosen=[...new Set(Array.isArray(targetUids)?targetUids:[targetUids])]
    .filter(uid=>pending.options.includes(uid)).slice(0,2);
  const targets=chosen.map(uid=>foe.field.find(card=>card.uid===uid&&card.rested&&this.effectiveCost(foeSide,card)<=7)).filter(Boolean);
  own.don.active-=2;own.don.rested+=2;
  for(const target of targets)markOP13040RefreshLock349(target);
  this.log(pending.sourceName+'：'+(targets.length?targets.map(card=>card.name).join('、'):'対象なし')+'を次のリフレッシュでアクティブ不可にした');
  this.state.pending=null;this.state.phase='main';return true;
};
const previousOP13040Trigger349=GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger=async function(use){
  syncOP13040Runtime349(this.state);
  const pending=this.state.pending;
  if(use&&['trigger','lifeReveal'].includes(pending?.kind)&&pending.card?.id==='OP13-040'){
    this.state.sides[pending.side].trash.push(pending.card);
    this.log(pending.card.name+'のトリガー：カウンター効果（リーダー+3000）を発動');
    return this.endBattle();
  }
  return previousOP13040Trigger349.call(this,use);
};
const previousOP13040ManualTrigger349=GameEngine.prototype.useTrigger;
GameEngine.prototype.useTrigger=async function(side,uid){
  syncOP13040Runtime349(this.state);
  const own=this.state.sides[side],index=own.life.findIndex(card=>card.uid===uid&&card.id==='OP13-040');
  if(index<0)return previousOP13040ManualTrigger349.call(this,side,uid);
  this.snapshot();
  const [card]=own.life.splice(index,1);own.trash.push(card);
  this.log('[手動] '+card.name+'のトリガー：カウンター効果を発動');
  return true;
};
const previousOP13040Start349=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){
  const result=previousOP13040Start349.apply(this,args);syncOP13040Runtime349(this.state);return result;
};
const previousOP13040Load349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousOP13040Load349.call(this,saved);syncOP13040Runtime349(this.state);return result;
};
const previousOP13040Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  syncOP13040Runtime349(g);
  previousOP13040Render349.call(this,g);
  if(g.pending?.kind!=='op13040MainChoice'||g.pending.side!=='player')return;
  this.close();
  const pending=g.pending,engineRef=window.__luffyEngine349,foe=g.sides.ai,chosen=new Set();
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>メイン効果</small><h2>OP13-040：対象を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='追加で自分のDON!!2枚をレストにし、相手のレストのコスト7以下のキャラを2枚まで選びます。';
  const status=document.createElement('p');
  const grid=document.createElement('div');grid.className='effect-target-grid';
  const refresh=()=>{
    status.textContent='選択 '+chosen.size+' / 2枚';
    for(const button of grid.querySelectorAll('button[data-id]'))button.classList.toggle('selected',chosen.has(button.dataset.id));
  };
  for(const uid of pending.options){
    const card=foe.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent='コスト '+engineRef.effectiveCost('ai',card)+' / パワー '+((card.power||0)+(card.tempPower||0));button.append(note);
    button.addEventListener('click',()=>{
      if(chosen.has(card.uid))chosen.delete(card.uid);
      else if(chosen.size<2)chosen.add(card.uid);
      refresh();
    });
    grid.append(button);
  }
  if(!pending.options.length){const empty=document.createElement('p');empty.textContent='選択できる相手キャラはいません。';grid.append(empty)}
  body.append(help,status,grid);
  const foot=document.createElement('div');foot.className='redirect-footer';
  const cancel=document.createElement('button');cancel.textContent='効果を使わない';
  cancel.addEventListener('click',()=>{this.close();engineRef?.resolveOP13040MainChoice('player',[],false);this.renderGame(engineRef.state)});
  const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='DON!!2枚をレストして決定';
  confirm.addEventListener('click',()=>{this.close();engineRef?.resolveOP13040MainChoice('player',[...chosen],true);this.renderGame(engineRef.state)});
  foot.append(cancel,confirm);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);refresh();
};


/* OP13-040 reliability fix: pay the event's 1 DON!! counter cost and
   keep selected Characters rested through their next refresh. */
const previousOP13040CounterCost349=GameEngine.prototype.submitCounters;
GameEngine.prototype.submitCounters=function(side,counterIds=[]){
  syncOP13040Runtime349(this.state);
  const battle=this.state.pending,own=this.state.sides[side];
  if(battle?.kind==='battle'&&battle.step==='counter'&&battle.defendingSide===side){
    const requested=Array.isArray(counterIds)?counterIds:[counterIds],accepted=[];
    for(const uid of requested){
      const card=own.hand.find(item=>item.uid===uid);
      if(card?.id!=='OP13-040'){accepted.push(uid);continue}
      if(battle.targetKind!=='leader'){
        this.log(card.name+'：カウンター効果はリーダーへの攻撃時のみ使用できます');
        continue;
      }
      if(own.don.active<1){
        this.log(card.name+'：カウンターの使用コストとしてアクティブDON!!1枚が必要です');
        continue;
      }
      own.don.active-=1;own.don.rested+=1;
      accepted.push(uid);
      this.log(card.name+'：使用コストのDON!!1枚をレスト');
    }
    return previousOP13040CounterCost349.call(this,side,accepted);
  }
  return previousOP13040CounterCost349.call(this,side,counterIds);
};
const previousOP13040CounterDefense349=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  previousOP13040CounterDefense349.call(this,g,...args);
  const battle=g.pending,own=g.sides.player;
  if(battle?.kind!=='battle'||battle.defendingSide!=='player')return;
  for(const card of own.hand.filter(item=>item.id==='OP13-040')){
    const button=this.modal?.querySelector('.counter-grid button[data-id="'+card.uid+'"]');
    if(!button)continue;
    const usable=battle.targetKind==='leader'&&own.don.active>=1;
    button.disabled=!usable;
    button.title=usable?'使用コスト：アクティブDON!!1枚':'リーダーへの攻撃時にアクティブDON!!1枚が必要です';
    const note=document.createElement('small');
    note.textContent=usable?'使用コスト：DON!!1枚':'現在は使用不可';
    button.append(note);
  }
};
function markOP13040RefreshLock349(target){
  target.preventNextActive=true;
  target.op13040RefreshLock=true;
}
const previousOP13040ResolveChoiceReliable349=GameEngine.prototype.resolveOP13040MainChoice;
GameEngine.prototype.resolveOP13040MainChoice=function(side,targetUids=[],use=true){
  const pending=this.state.pending;
  const foeSide=side==='player'?'ai':'player';
  const targetIds=pending?.kind==='op13040MainChoice'&&pending.side===side
    ?[...new Set(Array.isArray(targetUids)?targetUids:[targetUids])].filter(uid=>pending.options.includes(uid)).slice(0,2)
    :[];
  const result=previousOP13040ResolveChoiceReliable349.call(this,side,targetUids,use);
  if(result&&use){
    const foe=this.state.sides[foeSide];
    for(const uid of targetIds){
      const target=foe.field.find(card=>card.uid===uid);
      if(target){markOP13040RefreshLock349(target);this.log(target.name+'：次のリフレッシュでアクティブになりません')}
    }
  }
  return result;
};
const previousOP13040BeginTurnReliable349=GameEngine.prototype.beginTurn;
GameEngine.prototype.beginTurn=async function(side){
  const locked=(this.state?.sides?.[side]?.field||[]).filter(card=>card.op13040RefreshLock).map(card=>card.uid);
  const result=await previousOP13040BeginTurnReliable349.call(this,side);
  const own=this.state?.sides?.[side];
  for(const uid of locked){
    const card=own?.field?.find(item=>item.uid===uid);
    if(!card)continue;
    card.rested=true;
    delete card.op13040RefreshLock;
    this.log(card.name+'：OP13-040の効果でアクティブになりません');
  }
  return result;
};


/* Hard-disable paid counter Events when their DON!! cost cannot be paid. */
const previousPaidCounterDefense349=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  previousPaidCounterDefense349.call(this,g,...args);
  const battle=g.pending,own=g.sides.player;
  if(battle?.kind!=='battle'||battle.step!=='counter'||battle.defendingSide!=='player')return;
  for(const card of own.hand.filter(item=>item.id==='OP13-040'||item.id==='OP12-037')){
    const button=this.modal?.querySelector('.counter-grid button[data-id="'+card.uid+'"]');
    if(!button)continue;
    const usable=battle.targetKind==='leader'&&own.don.active>=1;
    button.disabled=!usable;
    button.setAttribute('aria-disabled',usable?'false':'true');
    button.style.pointerEvents=usable?'auto':'none';
    button.style.opacity=usable?'1':'.38';
    if(!usable)button.classList.remove('selected');
    let cost=button.querySelector('[data-paid-counter-cost]');
    if(!cost){cost=document.createElement('small');cost.dataset.paidCounterCost='true';button.append(cost)}
    cost.textContent=usable?'使用コスト：DON!!1枚':'DON!!不足・使用不可';
  }
};


/* Remove unpaid counter Events before the defense picker builds its choices. */
const previousPaidCounterFilteredDefense349=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  const battle=g.pending,own=g.sides.player;
  const mustHide=battle?.kind==='battle'&&battle.defendingSide==='player'
    &&(battle.targetKind!=='leader'||own.don.active<1);
  const hidden=[];
  if(mustHide){
    for(const card of own.hand){
      if(card.id!=='OP13-040'&&card.id!=='OP12-037')continue;
      hidden.push([card,card.counter]);
      card.counter=0;
    }
  }
  try{return previousPaidCounterFilteredDefense349.call(this,g,...args)}
  finally{for(const [card,counter] of hidden)card.counter=counter}
};


/* OP05-038 舞踏石
   Counter: pay 2 DON!!, Leader/Character +4000; then optionally discard
   one card to activate up to 3 DON!!. Trigger: rest an opposing Leader or
   a cost-3-or-less opposing Character. */
function syncOP05038Runtime349(state){
  if(!state?.sides)return;
  const all=[];
  for(const sideName of ['player','ai']){
    const side=state.sides[sideName];if(!side)continue;
    if(side.leader)all.push(side.leader);
    if(side.stage)all.push(side.stage);
    for(const zone of ['deck','hand','life','field','trash'])if(Array.isArray(side[zone]))all.push(...side[zone]);
  }
  if(state.pending?.card)all.push(state.pending.card);
  for(const card of all){
    if(card?.id!=='OP05-038')continue;
    card.name='舞踏石';
    card.type='event';card.color=['green'];card.cost=2;card.power=0;card.counter=4000;
    card.traits=['ドンキホーテ海賊団'];
    card.text='【カウンター】自分のリーダーかキャラ1枚までを、このバトル中、パワー+4000。その後、自分の手札1枚を捨ててもよい。そうした場合、自分のDON!!3枚までを、アクティブにする。【トリガー】相手のリーダーかコスト3以下のキャラ1枚までを、レストにする。';
    card.effects=[{timing:'trigger',action:'op05038Trigger'}];
    card.keywords=['counter','trigger'];
  }
}
const previousOP05038Submit349=GameEngine.prototype.submitCounters;
GameEngine.prototype.submitCounters=function(side,counterIds=[]){
  syncOP05038Runtime349(this.state);
  const battle=this.state.pending,own=this.state.sides[side];
  if(battle?.kind!=='battle'||battle.step!=='counter'||battle.defendingSide!==side)
    return previousOP05038Submit349.call(this,side,counterIds);
  const requested=Array.isArray(counterIds)?counterIds:[counterIds],accepted=[];
  let used=false;
  for(const uid of requested){
    const card=own.hand.find(item=>item.uid===uid);
    if(card?.id!=='OP05-038'){accepted.push(uid);continue}
    if(own.don.active<2){
      this.log(card.name+'：使用コストとしてアクティブDON!!2枚が必要です');
      continue;
    }
    own.don.active-=2;own.don.rested+=2;accepted.push(uid);used=true;
    this.log(card.name+'：使用コストのDON!!2枚をレストし、パワー+4000');
  }
  const result=previousOP05038Submit349.call(this,side,accepted);
  if(used&&side==='player'){
    this.state.pending={kind:'op05038DiscardChoice',side,sourceName:'舞踏石'};
    this.state.phase='effectChoice';
    this.log('舞踏石：手札1枚を捨ててDON!!3枚までをアクティブにできます');
  }
  return result;
};
GameEngine.prototype.resolveOP05038DiscardChoice=function(side,discardUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='op05038DiscardChoice'||pending.side!==side)return false;
  const own=this.state.sides[side];
  if(discardUid){
    const index=own.hand.findIndex(card=>card.uid===discardUid);
    if(index>=0){
      const [discarded]=own.hand.splice(index,1);own.trash.push(discarded);
      const count=Math.min(3,own.don.rested);
      own.don.rested-=count;own.don.active+=count;
      this.log('舞踏石：'+discarded.name+'を捨て、DON!!'+count+'枚をアクティブにした');
    }
  }else this.log('舞踏石：手札を捨てませんでした');
  this.state.pending=null;this.state.phase='main';
  return true;
};
const previousOP05038Trigger349=GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger=async function(use){
  syncOP05038Runtime349(this.state);
  const pending=this.state.pending;
  if(use&&['trigger','lifeReveal'].includes(pending?.kind)&&pending.card?.id==='OP05-038'){
    const side=pending.side,own=this.state.sides[side],foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
    own.trash.push(pending.card);
    this.state.pending={kind:'op05038TriggerChoice',side,options:[foe.leader,...foe.field.filter(card=>this.effectiveCost(foeSide,card)<=3)].map(card=>card.uid)};
    this.state.phase='effectChoice';
    this.log('舞踏石のトリガー：レストにする対象を選択');
    return true;
  }
  return previousOP05038Trigger349.call(this,use);
};
GameEngine.prototype.resolveOP05038TriggerChoice=function(side,targetUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='op05038TriggerChoice'||pending.side!==side)return false;
  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const target=[foe.leader,...foe.field].find(card=>card.uid===targetUid&&pending.options.includes(card.uid));
  if(target){target.rested=true;this.log('舞踏石のトリガー：'+target.name+'をレストにした')}
  else this.log('舞踏石のトリガー：対象を選びませんでした');
  this.state.pending=null;this.state.phase='main';return true;
};
const previousOP05038Start349=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){const result=previousOP05038Start349.apply(this,args);syncOP05038Runtime349(this.state);return result};
const previousOP05038Load349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){const result=previousOP05038Load349.call(this,saved);syncOP05038Runtime349(this.state);return result};

const previousOP05038FilteredDefense349=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  syncOP05038Runtime349(g);
  const battle=g.pending,own=g.sides.player,hidden=[];
  const cannotPay=battle?.kind==='battle'&&battle.defendingSide==='player'&&own.don.active<2;
  if(cannotPay){
    for(const card of own.hand.filter(item=>item.id==='OP05-038')){hidden.push([card,card.counter]);card.counter=0}
  }
  try{return previousOP05038FilteredDefense349.call(this,g,...args)}
  finally{for(const [card,counter] of hidden)card.counter=counter}
};
const previousOP05038Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  syncOP05038Runtime349(g);
  previousOP05038Render349.call(this,g);
  const pending=g.pending,engineRef=window.__luffyEngine349;
  if(pending?.side!=='player'||!['op05038DiscardChoice','op05038TriggerChoice'].includes(pending.kind))return;
  this.close();
  const own=g.sides.player,foe=g.sides.ai;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  const body=document.createElement('div');body.className='redirect-body';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  const foot=document.createElement('div');foot.className='redirect-footer single';
  if(pending.kind==='op05038DiscardChoice'){
    head.innerHTML='<small>カウンター効果</small><h2>舞踏石：手札を捨てるか選択</h2>';
    const help=document.createElement('p');help.textContent='手札1枚を捨てると、DON!!3枚までをアクティブにします。';
    for(const card of own.hand){
      const button=document.createElement('button');
      if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
      const name=document.createElement('strong');name.textContent=card.name;button.append(name);
      button.addEventListener('click',()=>{this.close();engineRef?.resolveOP05038DiscardChoice('player',card.uid);this.renderGame(engineRef.state);window.__resumeAi349?.()});
      grid.append(button);
    }
    body.append(help,grid);
    const skip=document.createElement('button');skip.textContent='捨てずに終了';
    skip.addEventListener('click',()=>{this.close();engineRef?.resolveOP05038DiscardChoice('player',null);this.renderGame(engineRef.state);window.__resumeAi349?.()});
    foot.append(skip);
  }else{
    head.innerHTML='<small>トリガー効果</small><h2>舞踏石：対象を選択</h2>';
    const help=document.createElement('p');help.textContent='相手のリーダーか、コスト3以下のキャラ1枚までをレストにします。';
    const candidates=[foe.leader,...foe.field].filter(card=>pending.options.includes(card.uid));
    for(const card of candidates){
      const button=document.createElement('button');
      if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;button.append(image)}
      const name=document.createElement('strong');name.textContent=card.name;button.append(name);
      button.addEventListener('click',()=>{this.close();engineRef?.resolveOP05038TriggerChoice('player',card.uid);this.renderGame(engineRef.state);window.__resumeAi349?.()});
      grid.append(button);
    }
    body.append(help,grid);
    const skip=document.createElement('button');skip.textContent='選ばず終了';
    skip.addEventListener('click',()=>{this.close();engineRef?.resolveOP05038TriggerChoice('player',null);this.renderGame(engineRef.state);window.__resumeAi349?.()});
    foot.append(skip);
  }
  panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};


/* Common effect-target picker: always show the actual opposing card image. */
UI.prototype.effectTargets=function(title,items){
  this.close();
  const engineRef=window.__luffyEngine349;
  const allCards=[];
  for(const sideName of ['player','ai']){
    const side=engineRef?.state?.sides?.[sideName];if(!side)continue;
    if(side.leader)allCards.push(side.leader);
    if(side.stage)allCards.push(side.stage);
    if(Array.isArray(side.field))allCards.push(...side.field);
  }
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  const small=document.createElement('small');small.textContent='効果対象の選択';
  const heading=document.createElement('h2');heading.textContent=title;
  head.append(small,heading);
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='画像をタップして、効果を適用する相手のカードを選んでください。';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(const item of items){
    const card=allCards.find(candidate=>candidate.uid===item.uid)||item;
    const button=document.createElement('button');button.dataset.id=item.uid;
    if(card.imageUrl){
      const image=document.createElement('img');image.src=card.imageUrl;image.alt=(card.name||item.name)+'のカード画像';image.loading='eager';button.append(image);
    }
    const name=document.createElement('strong');name.textContent=card.name||item.name||'対象カード';button.append(name);
    const details=[];
    const cost=item.cost??card.cost;
    const power=(item.power??card.power);
    if(cost!==undefined&&cost!==null)details.push('コスト '+cost);
    if(power!==undefined&&power!==null)details.push('パワー '+power);
    if(details.length){const note=document.createElement('small');note.textContent=details.join(' / ');button.append(note)}
    button.addEventListener('click',()=>{this.close();this.a.effectTarget(item.uid)});
    grid.append(button);
  }
  if(!items.length){const empty=document.createElement('p');empty.textContent='選択できるカードがありません。';grid.append(empty)}
  body.append(help,grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const close=document.createElement('button');close.textContent='閉じる';close.addEventListener('click',()=>this.close());foot.append(close);
  panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};


/* OP08-036 エレクトリカルルナ
   Main: all opposing rested cost-7-or-less Characters stay rested through
   their next refresh. Trigger: rest up to one opposing Character. */
function syncOP08036Runtime349(state){
  if(!state?.sides)return;
  const all=[];
  for(const sideName of ['player','ai']){
    const side=state.sides[sideName];if(!side)continue;
    if(side.leader)all.push(side.leader);
    if(side.stage)all.push(side.stage);
    for(const zone of ['deck','hand','life','field','trash'])if(Array.isArray(side[zone]))all.push(...side[zone]);
  }
  if(state.pending?.card)all.push(state.pending.card);
  for(const card of all){
    if(card?.id!=='OP08-036')continue;
    card.name='エレクトリカルルナ';
    card.type='event';card.color=['green'];card.cost=3;card.power=0;card.counter=0;
    card.traits=['ミンク族'];
    card.text='【メイン】相手のレストのコスト7以下のキャラすべては、次の相手のリフレッシュフェイズでアクティブにならない。【トリガー】相手のキャラ1枚までを、レストにする。';
    card.effects=[{timing:'trigger',action:'op08036Trigger'}];
    card.keywords=['main','trigger'];
  }
}
const previousOP08036Play349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  syncOP08036Runtime349(this.state);
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousOP08036Play349.call(this,side,uid);
  if(!result||source?.id!=='OP08-036')return result;
  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const targets=foe.field.filter(card=>card.rested&&this.effectiveCost(foeSide,card)<=7);
  for(const target of targets)markOP13040RefreshLock349(target);
  this.log(source.name+'：'+(targets.length?targets.map(card=>card.name).join('、'):'対象なし')+'を次のリフレッシュでアクティブ不可にした');
  return result;
};
const previousOP08036Trigger349=GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger=async function(use){
  syncOP08036Runtime349(this.state);
  const pending=this.state.pending;
  if(use&&['trigger','lifeReveal'].includes(pending?.kind)&&pending.card?.id==='OP08-036'){
    const side=pending.side,own=this.state.sides[side],foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
    own.trash.push(pending.card);
    if(side==='ai'){
      const target=[...foe.field].filter(card=>!card.rested).sort((a,b)=>((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0)))[0];
      if(target){target.rested=true;this.log('エレクトリカルルナのトリガー：'+target.name+'をレストにした')}
      else this.log('エレクトリカルルナのトリガー：対象なし');
      return this.endBattle();
    }
    this.state.pending={kind:'op08036TriggerChoice',side,options:foe.field.map(card=>card.uid)};
    this.state.phase='effectChoice';
    this.log('エレクトリカルルナのトリガー：レストにする相手キャラを選択');
    return true;
  }
  return previousOP08036Trigger349.call(this,use);
};
GameEngine.prototype.resolveOP08036TriggerChoice=function(side,targetUid=null){
  const pending=this.state.pending;
  if(pending?.kind!=='op08036TriggerChoice'||pending.side!==side)return false;
  const foeSide=side==='player'?'ai':'player',foe=this.state.sides[foeSide];
  const target=foe.field.find(card=>card.uid===targetUid&&pending.options.includes(card.uid));
  if(target){target.rested=true;this.log('エレクトリカルルナのトリガー：'+target.name+'をレストにした')}
  else this.log('エレクトリカルルナのトリガー：対象を選びませんでした');
  return this.endBattle();
};
const previousOP08036Start349=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){const result=previousOP08036Start349.apply(this,args);syncOP08036Runtime349(this.state);return result};
const previousOP08036Load349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){const result=previousOP08036Load349.call(this,saved);syncOP08036Runtime349(this.state);return result};

const previousOP08036Render349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  syncOP08036Runtime349(g);
  previousOP08036Render349.call(this,g);
  const pending=g.pending,engineRef=window.__luffyEngine349;
  if(pending?.kind!=='op08036TriggerChoice'||pending.side!=='player')return;
  this.close();
  const foe=g.sides.ai;
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>トリガー効果</small><h2>エレクトリカルルナ：対象を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='相手のキャラ1枚までをレストにします。画像をタップして選択してください。';
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(const uid of pending.options){
    const card=foe.field.find(item=>item.uid===uid);if(!card)continue;
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name+'のカード画像';image.loading='eager';button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');note.textContent='コスト '+engineRef.effectiveCost('ai',card)+' / パワー '+((card.power||0)+(card.tempPower||0));button.append(note);
    button.addEventListener('click',()=>{this.close();engineRef?.resolveOP08036TriggerChoice('player',card.uid);this.renderGame(engineRef.state);window.__resumeAi349?.()});
    grid.append(button);
  }
  body.append(help,grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const skip=document.createElement('button');skip.textContent='選ばず終了';
  skip.addEventListener('click',()=>{this.close();engineRef?.resolveOP08036TriggerChoice('player',null);this.renderGame(engineRef.state);window.__resumeAi349?.()});
  foot.append(skip);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};


/* OP13-001 モンキー・D・ルフィ Leader
   DON!! x1 / On opponent's attack: when active DON!! is 5 or less, rest
   any number of DON!!; for each, give this Leader or one Straw Hat
   Character +2000 during this battle. */
function syncOP13001Leader349(state){
  if(!state?.sides)return;
  for(const sideName of ['player','ai']){
    const leader=state.sides[sideName]?.leader;
    if(leader?.id!=='OP13-001')continue;
    leader.name='モンキー・D・ルフィ';
    leader.type='leader';leader.color=['red','green'];leader.power=5000;leader.life=4;
    leader.traits=['超新星','麦わらの一味'];
    leader.text='【ドン!!×1】【相手のアタック時】自分のアクティブのDON!!が5枚以下の場合、自分のDON!!を任意の枚数レストにできる。レストにしたDON!!1枚につき、このリーダーか自分の特徴《麦わらの一味》を持つキャラ1枚までを、このバトル中、パワー+2000。';
    leader.keywords=['opponentAttack'];
  }
}
GameEngine.prototype.resolveOP13001DefenseBoost=function(side,targetUids=[]){
  syncOP13001Leader349(this.state);
  const battle=this.state.pending,own=this.state.sides[side],leader=own.leader;
  if(battle?.kind!=='battle'||battle.defendingSide!==side||leader?.id!=='OP13-001'||(leader.effectsNegatedThroughTurn??leader.effectsNegatedTurn??-1)>=this.state.turn||(leader.attachedDon||0)<1||own.don.active>5)return false;
  battle.op13001Prompted=true;
  const eligible=[leader,...own.field.filter(card=>(card.traits||[]).includes('麦わらの一味'))];
  const requested=Array.isArray(targetUids)?targetUids:[targetUids];
  const chosen=requested.filter(uid=>eligible.some(card=>card.uid===uid)).slice(0,own.don.active);
  const count=chosen.length;
  if(count){
    own.don.active-=count;own.don.rested+=count;
    battle.op13001Buffs=battle.op13001Buffs||[];
    for(const uid of chosen){
      const target=eligible.find(card=>card.uid===uid);if(!target)continue;
      target.tempPower=(target.tempPower||0)+2000;
      if(battle.targetUid===uid)battle.targetPower+=2000;
      battle.op13001Buffs.push(uid);
    }
    const summary=eligible.filter(card=>chosen.includes(card.uid)).map(card=>{
      const n=chosen.filter(uid=>uid===card.uid).length;return card.name+' +'+(n*2000);
    });
    this.log('OP13-001 リーダー効果：DON!!'+count+'枚をレスト（'+summary.join('、')+'）');
  }else this.log('OP13-001 リーダー効果を使用しませんでした');
  const hasBlocker=own.field.some(card=>!card.rested&&(card.keywords||[]).includes('blocker'));
  if(!hasBlocker&&battle.step==='block')this.chooseBlock(side,null);
  return true;
};
const previousOP13001EndBattle349=GameEngine.prototype.endBattle;
GameEngine.prototype.endBattle=function(...args){
  const battle=this.state.pending;
  if(battle?.kind==='battle'&&Array.isArray(battle.op13001Buffs)){
    const side=battle.defendingSide,own=this.state.sides[side],cards=[own.leader,...own.field];
    for(const uid of battle.op13001Buffs){
      const card=cards.find(item=>item.uid===uid);
      if(card)card.tempPower=(card.tempPower||0)-2000;
    }
    battle.op13001Buffs=[];
  }
  return previousOP13001EndBattle349.apply(this,args);
};
const previousOP13001Start349=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){const result=previousOP13001Start349.apply(this,args);syncOP13001Leader349(this.state);return result};
const previousOP13001Load349=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){const result=previousOP13001Load349.call(this,saved);syncOP13001Leader349(this.state);return result};

const previousOP13001Defense349=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  syncOP13001Leader349(g);
  const battle=g.pending,own=g.sides.player,leader=own.leader;
  const canPrompt=battle?.kind==='battle'&&battle.defendingSide==='player'&&!battle.op13001Prompted
    &&leader?.id==='OP13-001'&&(leader.effectsNegatedThroughTurn??leader.effectsNegatedTurn??-1)<g.turn&&(leader.attachedDon||0)>=1&&own.don.active<=5&&own.don.active>0;
  if(!canPrompt)return previousOP13001Defense349.call(this,g,...args);
  this.close();
  const engineRef=window.__luffyEngine349,eligible=[leader,...own.field.filter(card=>(card.traits||[]).includes('麦わらの一味'))],chosen=[];
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>相手のアタック時</small><h2>OP13-001 ルフィ：リーダー効果</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='アクティブDON!!をレストにし、1枚につきリーダーか《麦わらの一味》のキャラへ、このバトル中パワー+2000。同じカードを複数回選べます。';
  const status=document.createElement('p');
  const grid=document.createElement('div');grid.className='effect-target-grid';
  const refresh=()=>{
    status.textContent='使用するDON!! '+chosen.length+' / '+own.don.active+'枚';
    for(const button of grid.querySelectorAll('button[data-id]')){
      const count=chosen.filter(uid=>uid===button.dataset.id).length;
      const card=eligible.find(item=>item.uid===button.dataset.id);
      const note=button.querySelector('small');
      if(note)note.textContent='現在 '+((card?.power||0)+(card?.tempPower||0))+' / 選択 ×'+count+'（+'+(count*2000)+'）';
    }
  };
  for(const card of eligible){
    const button=document.createElement('button');button.dataset.id=card.uid;
    if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name+'のカード画像';image.loading='eager';button.append(image)}
    const name=document.createElement('strong');name.textContent=card.name;button.append(name);
    const note=document.createElement('small');button.append(note);
    button.addEventListener('click',()=>{if(chosen.length<own.don.active){chosen.push(card.uid);refresh()}});
    grid.append(button);
  }
  body.append(help,status,grid);
  const foot=document.createElement('div');foot.className='redirect-footer';
  const reset=document.createElement('button');reset.textContent='選択を戻す';reset.addEventListener('click',()=>{chosen.length=0;refresh()});
  const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='効果を決定';
  confirm.addEventListener('click',()=>{this.close();engineRef?.resolveOP13001DefenseBoost('player',chosen);this.defense(engineRef.state)});
  const skip=document.createElement('button');skip.textContent='効果を使わない';
  skip.addEventListener('click',()=>{this.close();engineRef?.resolveOP13001DefenseBoost('player',[]);this.defense(engineRef.state)});
  foot.append(reset,confirm,skip);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);refresh();
};


/* Keep the counter controls usable after the OP13-001 leader prompt. */
const previousOP13001CounterVisible349=UI.prototype.defense;
UI.prototype.defense=function(g,...args){
  const result=previousOP13001CounterVisible349.call(this,g,...args);
  const battle=g.pending;
  if(battle?.kind!=='battle'||battle.defendingSide!=='player'||battle.step!=='counter'||!this.modal)return result;
  const grid=this.modal.querySelector('.counter-grid');
  if(grid){grid.hidden=false;grid.style.display='grid'}
  const blockArea=this.modal.querySelector('.blocker-choice');
  if(blockArea)blockArea.hidden=true;
  const primary=[...this.modal.querySelectorAll('button')].find(button=>button.textContent.trim()==='防御を確定');
  if(primary){primary.hidden=false;primary.disabled=false;primary.style.display=''}
  const receive=[...this.modal.querySelectorAll('button')].find(button=>button.textContent.trim()==='そのまま受ける');
  if(receive){receive.hidden=false;receive.disabled=false}
  return result;
};


/* Choose how many DON!! to activate when two or more end-of-turn
   activation effects are waiting (OP14-022, OP13-027, OP14-031). */
const previousSelectableEndTurn349=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  const canChoose=side==='player'&&this.state.activeSide===side&&!this.state.pending&&!this.state.opEndTurnDonChoiceResolving349;
  if(canChoose){
    const own=this.state.sides[side],traits=own.leader.traits||[],validLeader=traits.includes('FILM')||traits.includes('麦わらの一味'),queue=[];
    if(validLeader){
      for(const card of own.field){
        if(card.id==='OP14-022')queue.push({id:card.id,uid:card.uid,name:card.name,max:2,imageUrl:card.imageUrl||''});
        if(card.id==='OP13-027')queue.push({id:card.id,uid:card.uid,name:card.name,max:1,imageUrl:card.imageUrl||''});
      }
    }
    const namiCount=this.state.op14031EndTurn?.[side]||0;
    const namiCard=own.field.find(card=>card.id==='OP14-031');
    for(let index=0;index<namiCount;index++)queue.push({id:'OP14-031',uid:namiCard?.uid||'',name:'ナミ',max:5,imageUrl:namiCard?.imageUrl||''});
    if(queue.length>=1){
      this.snapshot();
      this.state.pending={kind:'endTurnDonCountChoice',side,queue,index:0};
      this.state.phase='effectChoice';
      this.log('ターン終了時：'+queue.length+'件のDON!!アクティブ効果を順番に処理');
      return true;
    }
  }
  return previousSelectableEndTurn349.call(this,side);
};
GameEngine.prototype.resolveEndTurnDonCountChoice349=async function(side,amount=0){
  const pending=this.state.pending;
  if(pending?.kind!=='endTurnDonCountChoice'||pending.side!==side)return false;
  const own=this.state.sides[side],item=pending.queue[pending.index];
  if(!item)return false;
  const chosen=Math.max(0,Math.min(Number(amount)||0,item.max,own.don.rested));
  own.don.rested-=chosen;own.don.active+=chosen;
  this.log(item.name+'のターン終了時：DON!!を'+chosen+'枚アクティブにした');
  pending.index+=1;
  if(pending.index<pending.queue.length)return true;

  const masked=[];
  for(const card of own.field){
    if(card.id==='OP14-022'||card.id==='OP13-027'){masked.push([card,card.id]);card.id='__END_TURN_RESOLVED__'}
  }
  const savedNamiCount=this.state.op14031EndTurn?.[side]||0;
  if(this.state.op14031EndTurn)this.state.op14031EndTurn[side]=0;
  this.state.pending=null;this.state.phase='main';this.state.opEndTurnDonChoiceResolving349=true;
  try{return await previousSelectableEndTurn349.call(this,side)}
  finally{
    for(const [card,id] of masked)card.id=id;
    if(this.state.op14031EndTurn&&this.state.activeSide===side)this.state.op14031EndTurn[side]=savedNamiCount;
    this.state.opEndTurnDonChoiceResolving349=false;
  }
};

const previousSelectableEndTurnRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  previousSelectableEndTurnRender349.call(this,g);
  const pending=g.pending,engineRef=window.__luffyEngine349;
  if(pending?.kind!=='endTurnDonCountChoice'||pending.side!=='player')return;
  this.close();
  const own=g.sides.player,item=pending.queue[pending.index],limit=Math.min(item.max,own.don.rested);
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>ターン終了時 '+(pending.index+1)+' / '+pending.queue.length+'</small><h2>'+item.name+'：DON!!枚数を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='レストのDON!!から、アクティブにする枚数を選んでください。現在のレストDON!!：'+own.don.rested+'枚';
  if(item.imageUrl){
    const preview=document.createElement('div');preview.style.cssText='display:flex;justify-content:center;margin:8px 0 14px';
    const image=document.createElement('img');image.src=item.imageUrl;image.alt=item.name+'のカード画像';image.style.cssText='width:min(38vw,150px);height:auto;max-height:30dvh;object-fit:contain;border-radius:8px';preview.append(image);body.append(help,preview);
  }else body.append(help);
  const grid=document.createElement('div');grid.className='effect-target-grid';
  for(let amount=0;amount<=limit;amount++){
    const button=document.createElement('button');
    const strong=document.createElement('strong');strong.textContent=amount+'枚';
    const note=document.createElement('small');note.textContent=amount?'DON!!を'+amount+'枚アクティブにする':'アクティブにしない';
    button.append(strong,note);
    button.addEventListener('click',async()=>{
      this.close();
      await engineRef?.resolveEndTurnDonCountChoice349('player',amount);
      this.renderGame(engineRef.state);
      if(!engineRef.state.pending&&engineRef.state.activeSide==='ai')window.__resumeAi349?.();
    });
    grid.append(button);
  }
  body.append(grid);panel.append(head,body);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};




UI.prototype.aiDeckPicker=function(decks,current){
  this.close();
  const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node};
  const overlay=make('div','dialog'),panel=make('section','sheet player-deck-picker');
  panel.append(make('h2','', 'AIデッキを選択'),make('p','zone-help','AIが使用するデッキを選んでください。'));
  const options=make('div','player-deck-options');
  for(const [key,deck] of Object.entries(decks)){
    const button=make('button',key===current?'selected':'');
    const name=make('strong','',deck.name),count=make('span','',String(deck.cards.reduce((total,card)=>total+card.count,0))+'枚');
    button.append(name,count);
    if(key===current)button.append(make('b','','選択中'));
    button.addEventListener('click',()=>this.a.selectAiDeck(key));
    options.append(button);
  }
  const close=make('button','primary zone-close','閉じる');
  close.addEventListener('click',()=>this.close());
  panel.append(options,close);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};

// Start screen leader previews: follow the currently selected player and AI decks.
const previousRenderHomeLeaderPreview349=UI.prototype.renderHome;
UI.prototype.renderHome=function(hasSave,decks={}){
  previousRenderHomeLeaderPreview349.call(this,hasSave,decks);
  const tiles=[...this.root.querySelectorAll('.versus .deck-tile')];
  const aiTile=tiles[1];
  if(aiTile&&this.a.openAiDeckPicker&&!aiTile.classList.contains('ai-deck-select')){
    aiTile.classList.add('ai-deck-select');
    aiTile.setAttribute('role','button');
    aiTile.tabIndex=0;
    aiTile.style.cursor='pointer';
    aiTile.addEventListener('click',()=>this.a.openAiDeckPicker());
    aiTile.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();this.a.openAiDeckPicker()}});
    const hint=document.createElement('small');
    hint.textContent='タップして変更';
    hint.style.color='#f4c542';
    aiTile.append(hint);
  }
  const leaders=[
    {tile:tiles[0],src:decks.playerLeaderImage,name:decks.playerLeaderName||decks.playerName||'PLAYER'},
    {tile:tiles[1],src:decks.aiLeaderImage,name:decks.aiLeaderName||decks.aiName||'AI'}
  ];
  for(const leader of leaders){
    if(!leader.tile||leader.tile.querySelector('.home-leader-preview'))continue;
    const frame=document.createElement('div');
    frame.className='home-leader-preview';
    Object.assign(frame.style,{width:'min(22vw,96px)',aspectRatio:'5 / 7',margin:'10px auto 7px',borderRadius:'9px',overflow:'hidden',border:'2px solid rgba(245,190,45,.75)',background:'#080d17',boxShadow:'0 7px 18px rgba(0,0,0,.35)',flex:'0 0 auto'});
    if(leader.src){
      const image=document.createElement('img');
      image.src=leader.src;
      image.alt=leader.name;
      image.loading='eager';
      Object.assign(image.style,{display:'block',width:'100%',height:'100%',objectFit:'contain'});
      image.addEventListener('error',()=>frame.remove(),{once:true});
      frame.append(image);
    }else{
      Object.assign(frame.style,{display:'grid',placeItems:'center',padding:'7px',background:'linear-gradient(145deg,#4c1d75,#17102f 68%,#080d17)'});
      const fallback=document.createElement('strong');
      fallback.textContent=leader.name;
      Object.assign(fallback.style,{fontSize:'12px',lineHeight:'1.35',color:'#fff',textAlign:'center',overflowWrap:'anywhere'});
      frame.append(fallback);
    }
    const title=leader.tile.querySelector('strong');
    leader.tile.insertBefore(frame,title||null);
    Object.assign(leader.tile.style,{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',minWidth:'0'});
  }
};


// Resolve Luffy deck choices automatically when that deck is controlled by AI.
const previousAiLuffyChoicePlay349=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const result=await previousAiLuffyChoicePlay349.call(this,side,uid);
  if(!result||side!=='ai')return result;
  const pending=this.state.pending;
  if(pending?.side!=='ai')return result;
  if(pending.kind==='luffyNamiSearch'){
    const best=pending.cards.filter(card=>pending.options.includes(card.uid))
      .sort((a,b)=>((b.cost||0)-(a.cost||0))||((b.power||0)-(a.power||0)))[0];
    this.resolveLuffyNamiSearch('ai',best?.uid||null);
  }else if(pending.kind==='luffySanjiChoice'){
    const own=this.state.sides.ai;
    const best=own.field.filter(card=>pending.options.includes(card.uid))
      .sort((a,b)=>((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0)))[0];
    this.resolveLuffySanjiChoice('ai',best?.uid||null);
  }else if(pending.kind==='st31004PowerChoice'){
    const foe=this.state.sides.player;
    const best=foe.field.filter(card=>pending.options.includes(card.uid))
      .sort((a,b)=>((b.power||0)+(b.tempPower||0))-((a.power||0)+(a.tempPower||0)))[0];
    const chosen=best?Array(Math.max(0,pending.max||0)).fill(best.uid):[];
    this.resolveST31004Choice('ai',chosen);
  }else if(pending.kind==='op14031RestChoice'){
    const foe=this.state.sides.player;
    const chosen=foe.field.filter(card=>pending.options.includes(card.uid))
      .sort((a,b)=>((b.cost||0)-(a.cost||0))||((b.power||0)-(a.power||0))).slice(0,2).map(card=>card.uid);
    this.resolveOP14031RestChoice('ai',chosen);
  }
  return result;
};


// Let an AI-controlled OP13-001 Luffy evaluate and use its defensive Leader effect.
const previousAiLuffyDefense349=GameEngine.prototype.autoResolveDefense;
GameEngine.prototype.autoResolveDefense=function(...args){
  const battle=this.state.pending;
  if(battle?.kind==='battle'&&battle.defendingSide==='ai'&&!battle.op13001Prompted){
    const own=this.state.sides.ai,leader=own.leader;
    if(leader?.id==='OP13-001'&&(leader.effectsNegatedThroughTurn??leader.effectsNegatedTurn??-1)<this.state.turn&&(leader.attachedDon||0)>=1&&own.don.active>0&&own.don.active<=5){
      const target=battle.targetKind==='leader'?leader:own.field.find(card=>card.uid===battle.targetUid);
      const eligible=target&&(target.uid===leader.uid||(target.traits||[]).includes('麦わらの一味'));
      if(eligible){
        const shortfall=Math.max(0,(battle.power||0)-(battle.targetPower||0));
        const needed=Math.floor(shortfall/2000)+1;
        const urgent=battle.targetKind==='character'||own.life.length<=2||shortfall<=4000;
        const count=urgent?Math.min(needed,own.don.active):0;
        this.resolveOP13001DefenseBoost('ai',Array(count).fill(target.uid));
      }else this.resolveOP13001DefenseBoost('ai',[]);
    }
  }
  return previousAiLuffyDefense349.apply(this,args);
};


// Strategic AI mulligan, kept here as a compatibility layer for cached engine modules.
const shuffleAiOpening349=list=>{const result=[...list];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result};
const shouldAiKeepOpening349=engine=>{
  const ai=engine.state.sides.ai,foe=engine.state.sides.player,hand=ai.hand;
  const first=engine.state.firstPlayer==='ai',foeId=foe.leader?.id;
  if(ai.leader.id==='OP13-001'){
    const starters=new Set(['ST31-005','OP01-016','EB02-017','EB04-002']);
    const early=hand.filter(card=>starters.has(card.id)||(card.type==='character'&&Number(card.cost||0)<=2)).length;
    const curve=hand.filter(card=>card.type==='character'&&Number(card.cost||0)>=4&&Number(card.cost||0)<=5).length;
    const finishers=hand.filter(card=>Number(card.cost||0)>=6).length;
    const defense=hand.reduce((sum,card)=>sum+Number(card.counter||0),0);
    let score=hand.reduce((sum,card)=>sum+(starters.has(card.id)?6:0)+(card.id==='OP10-011'?4:0)+(['OP13-037','OP14-022','OP13-027'].includes(card.id)?3:0)+(Number(card.counter||0)>=2000?2:0)-(Number(card.cost||0)>=7?2:0),0);
    if(!first&&curve)score+=2;
    if(foeId==='OP16-080'&&hand.some(card=>card.id==='OP10-011'))score+=3;
    return early>=1&&curve>=1&&finishers<=2&&defense>=2000&&score>=10;
  }
  const starters=new Set(['OP09-099','OP09-096','OP16-103','OP16-109','OP16-110']);
  const early=hand.filter(card=>starters.has(card.id)).length;
  const middle=hand.filter(card=>card.type==='character'&&Number(card.cost||0)>=4&&Number(card.cost||0)<=6).length;
  const top=hand.filter(card=>Number(card.cost||0)>=8).length;
  const defense=hand.reduce((sum,card)=>sum+Number(card.counter||0),0);
  let score=hand.reduce((sum,card)=>sum+(starters.has(card.id)?5:0)+(card.id==='OP09-099'?3:0)+(['OP09-086','EB04-058','OP16-108'].includes(card.id)?4:0)+(Number(card.counter||0)>=2000?2:0)-(Number(card.cost||0)>=8?2:0),0);
  if(foeId==='OP13-001'&&hand.some(card=>card.id==='OP16-109'))score+=4;
  if(!first&&middle)score+=2;
  return early>=1&&middle>=1&&top<=1&&defense>=2000&&score>=10;
};
const previousStrategicMulliganStart349=GameEngine.prototype.start;
GameEngine.prototype.start=function(first='player'){
  const result=previousStrategicMulliganStart349.call(this,first);
  if(this.state.phase==='mulligan'){
    this.state.sides.ai.mulliganDone=false;
    this.state.log=this.state.log.filter(entry=>entry.text!=='先攻AIが初手をキープ');
  }
  return result;
};
GameEngine.prototype.mulligan=function(side,keep){
  if(this.state.phase!=='mulligan'||this.state.sides[side].mulliganDone)return false;
  this.snapshot();
  const current=this.state.sides[side];
  if(!keep){current.deck=shuffleAiOpening349([...current.deck,...current.hand]);current.hand=[];this.draw(side,5,false,false);this.log((side==='player'?'あなた':'AI')+'がマリガン')}
  else this.log((side==='player'?'あなた':'AI')+'がキープ');
  current.mulliganDone=true;
  if(side==='player'&&!this.state.sides.ai.mulliganDone){
    const ai=this.state.sides.ai,aiKeep=shouldAiKeepOpening349(this);
    if(!aiKeep){ai.deck=shuffleAiOpening349([...ai.deck,...ai.hand]);ai.hand=[];this.draw('ai',5,false,false)}
    ai.mulliganDone=true;
    this.log(aiKeep?'AIが初手をキープ':'AIが初手をマリガン');
  }
  if(Object.values(this.state.sides).every(value=>value.mulliganDone))this.placeLifeAndBegin();
  return true;
};


/* Add a reversible Back action to player effect-choice dialogs.
   The normal undo snapshot restores the card, hand, DON!! and pending state
   together, so cancelling midway never leaves a partially paid effect. */
const previousEffectChoiceBackRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const result=previousEffectChoiceBackRender349.call(this,g);
  const pending=g?.pending;
  if(!pending||pending.side!=='player'||!/Choice$/.test(String(pending.kind||''))||pending.kind==='battle'||pending.kind==='teachSearch3Choice')return result;
  const modal=this.modal;
  if(!modal||modal.querySelector('[data-effect-back-349]'))return result;
  const button=document.createElement('button');
  button.type='button';
  button.dataset.effectBack349='true';
  button.className='effect-back-button';
  button.textContent='戻る';
  button.addEventListener('click',()=>{
    this.close();
    if(typeof this.a?.undo==='function')this.a.undo();
  });
  const footer=modal.querySelector('.redirect-footer,.sheet-actions,.dialog-actions');
  if(footer)footer.insertBefore(button,footer.firstChild);
  else modal.querySelector('section')?.append(button);
  return result;
};


/* Show actual Leader/Character cards while choosing an attack target. */
UI.prototype.targets=function(items){
  this.close();
  const engine=window.__luffyEngine349;
  const foe=engine?.state?.sides?.ai;
  const cards=(items||[]).map(item=>{
    const card=item.kind==='leader'?foe?.leader:foe?.field?.find(candidate=>candidate.uid===item.uid);
    return{...item,card};
  });
  const overlay=document.createElement('div');overlay.className='dialog';
  const panel=document.createElement('section');panel.className='redirect-flow attack-target-picker';
  const head=document.createElement('div');head.className='redirect-head';
  head.innerHTML='<small>アタック</small><h2>攻撃対象を選択</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const help=document.createElement('p');help.textContent='カード画像を確認して、攻撃する対象を選んでください。';
  const grid=document.createElement('div');grid.className='effect-target-grid attack-target-grid';
  for(const item of cards){
    const button=document.createElement('button');button.type='button';
    const card=item.card;
    if(card?.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name||item.name;button.append(image)}
    const name=document.createElement('strong');name.textContent=item.kind==='leader'?('リーダー：'+(card?.name||item.name)):(card?.name||item.name);button.append(name);
    const info=document.createElement('small');
    const donPower=engine?.state?.activeSide==='ai'?Number(card?.attachedDon||0)*1000:0;
    const power=Number(card?.power||0)+Number(card?.tempPower||0)+donPower;
    info.textContent='パワー '+power+(item.kind==='character'?'・レスト':'');
    button.append(info);
    button.addEventListener('click',()=>this.a.target(item.uid));
    grid.append(button);
  }
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const back=document.createElement('button');back.type='button';back.textContent='戻る';back.addEventListener('click',()=>this.close());
  foot.append(back);body.append(help,grid);panel.append(head,body,foot);overlay.append(panel);
  this.modal=overlay;document.body.append(overlay);
};


/* Allow the player to inspect the current hand without leaving a Life trigger choice. */
const previousLifeRevealHandCheck349=UI.prototype.lifeRevealPrompt;
UI.prototype.lifeRevealPrompt=function(pending){
  const result=previousLifeRevealHandCheck349.call(this,pending);
  const actions=this.modal?.querySelector('.actions');
  if(!actions||actions.querySelector('[data-check-hand-349]'))return result;
  const check=document.createElement('button');check.type='button';check.dataset.checkHand349='true';check.textContent='手札を確認';
  check.addEventListener('click',()=>{
    const engine=window.__luffyEngine349,hand=engine?.state?.sides?.player?.hand||[];
    const overlay=document.createElement('div');overlay.className='dialog hand-check-overlay';
    const panel=document.createElement('section');panel.className='redirect-flow';
    const head=document.createElement('div');head.className='redirect-head';head.innerHTML='<small>確認</small><h2>現在の手札</h2>';
    const body=document.createElement('div');body.className='redirect-body';
    const count=document.createElement('p');count.textContent='手札 '+hand.length+'枚';
    const grid=document.createElement('div');grid.className='effect-target-grid';
    for(const card of hand){
      const item=document.createElement('div');item.className='hand-check-card';
      if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;item.append(image)}
      const name=document.createElement('strong');name.textContent=card.name;item.append(name);
      const info=document.createElement('small');info.textContent=card.id+'　コスト '+(card.cost??'-')+'　カウンター '+(card.counter??0);item.append(info);
      grid.append(item);
    }
    if(!hand.length){const empty=document.createElement('p');empty.textContent='手札はありません。';body.append(count,empty)}
    else body.append(count,grid);
    const foot=document.createElement('div');foot.className='redirect-footer single';
    const close=document.createElement('button');close.type='button';close.className='primary';close.textContent='トリガー選択へ戻る';close.addEventListener('click',()=>overlay.remove());
    foot.append(close);panel.append(head,body,foot);overlay.append(panel);document.body.append(overlay);
  });
  actions.insertBefore(check,actions.firstChild);
  return result;
};


/* Attached DON!! grants +1000 only during its controller's turn.
   Recalculate the defending card after every declaration so no wrapper or
   restored save can carry an opponent-turn DON!! bonus into defense. */
const previousTurnScopedDonAttack349=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerId,targetId){
  const result=await previousTurnScopedDonAttack349.call(this,side,attackerId,targetId);
  const battle=this.state.pending;
  if(result&&battle?.kind==='battle'){
    const defending=this.state.sides[battle.defendingSide];
    const target=battle.targetKind==='leader'?defending.leader:defending.field.find(card=>card.uid===battle.targetUid);
    if(target)battle.targetPower=Number(target.power||0)+Number(target.tempPower||0);
  }
  return result;
};


/* Inspect both battlefields without resolving or closing the Life trigger. */
const previousLifeRevealFieldCheck349=UI.prototype.lifeRevealPrompt;
UI.prototype.lifeRevealPrompt=function(pending){
  const result=previousLifeRevealFieldCheck349.call(this,pending);
  const actions=this.modal?.querySelector('.actions');
  if(!actions||actions.querySelector('[data-check-field-349]'))return result;
  const check=document.createElement('button');check.type='button';check.dataset.checkField349='true';check.textContent='場を確認';
  check.addEventListener('click',()=>{
    const engine=window.__luffyEngine349,state=engine?.state;
    const overlay=document.createElement('div');overlay.className='dialog field-check-overlay';
    const panel=document.createElement('section');panel.className='redirect-flow';
    const head=document.createElement('div');head.className='redirect-head';head.innerHTML='<small>確認</small><h2>現在の場</h2>';
    const body=document.createElement('div');body.className='redirect-body';
    const addSide=(side,label)=>{
      const sideState=state?.sides?.[side];
      const title=document.createElement('h3');title.textContent=label;
      const grid=document.createElement('div');grid.className='effect-target-grid';
      const cards=[sideState?.leader,...(sideState?.field||[])].filter(Boolean);
      for(const card of cards){
        const item=document.createElement('div');item.className='hand-check-card field-check-card';
        if(card.imageUrl){const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name;item.append(image)}
        const name=document.createElement('strong');name.textContent=card===sideState.leader?'リーダー：'+card.name:card.name;item.append(name);
        const donPower=state?.activeSide===side?Number(card.attachedDon||0)*1000:0;
        const power=Number(card.power||0)+Number(card.tempPower||0)+donPower;
        const info=document.createElement('small');info.textContent='パワー '+power+' / '+(card.rested?'レスト':'アクティブ')+' / 付与DON!! '+Number(card.attachedDon||0);item.append(info);
        grid.append(item);
      }
      body.append(title,grid);
    };
    addSide('ai','相手の場');addSide('player','自分の場');
    const foot=document.createElement('div');foot.className='redirect-footer single';
    const close=document.createElement('button');close.type='button';close.className='primary';close.textContent='トリガー選択へ戻る';close.addEventListener('click',()=>overlay.remove());
    foot.append(close);panel.append(head,body,foot);overlay.append(panel);document.body.append(overlay);
  });
  const hand=actions.querySelector('[data-check-hand-349]');
  if(hand?.nextSibling)actions.insertBefore(check,hand.nextSibling);else actions.insertBefore(check,actions.firstChild);
  return result;
};


/* Battle result and post-game review. */
UI.prototype.showBattleReview349=function(g){
  this.close();
  const overlay=document.createElement('div');overlay.className='dialog battle-review-overlay';
  const panel=document.createElement('section');panel.className='redirect-flow battle-review-sheet';
  const head=document.createElement('div');head.className='redirect-head';head.innerHTML='<small>振り返り</small><h2>対戦結果の確認</h2>';
  const body=document.createElement('div');body.className='redirect-body';
  const summary=document.createElement('div');summary.className='battle-review-summary';
  for(const [label,side] of [['自分','player'],['AI','ai']]){
    const s=g.sides[side],box=document.createElement('div');
    const title=document.createElement('strong');title.textContent=label+'：'+s.leader.name;
    const info=document.createElement('p');info.textContent='ライフ '+s.life.length+' / 手札 '+s.hand.length+' / デッキ '+s.deck.length+' / 場 '+s.field.length+' / トラッシュ '+s.trash.length;
    box.append(title,info);summary.append(box);
  }
  const logTitle=document.createElement('h3');logTitle.textContent='対戦ログ';
  const logs=document.createElement('div');logs.className='battle-review-log';
  for(const entry of g.log.slice(-80)){
    const row=document.createElement('p');row.textContent=entry.text||String(entry);logs.append(row);
  }
  body.append(summary,logTitle,logs);
  const foot=document.createElement('div');foot.className='redirect-footer';
  const board=document.createElement('button');board.type='button';board.textContent='最終盤面を見る';board.addEventListener('click',()=>{this.close();this.showFinalBoardReturn349(g)});
  const result=document.createElement('button');result.type='button';result.className='primary';result.textContent='結果画面へ戻る';result.addEventListener('click',()=>this.showBattleResult349(g));
  foot.append(board,result);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};
UI.prototype.showFinalBoardReturn349=function(g){
  document.querySelector('[data-final-board-return-349]')?.remove();
  const wrap=document.createElement('div');wrap.dataset.finalBoardReturn349='true';
  wrap.style.position='fixed';wrap.style.left='16px';wrap.style.right='16px';wrap.style.bottom='calc(84px + env(safe-area-inset-bottom))';wrap.style.zIndex='9999';wrap.style.display='flex';wrap.style.justifyContent='center';wrap.style.pointerEvents='none';
  const button=document.createElement('button');button.type='button';button.className='primary';button.textContent='結果画面へ戻る';
  button.style.width='min(360px,100%)';button.style.height='52px';button.style.pointerEvents='auto';button.style.boxShadow='0 8px 24px rgba(0,0,0,.45)';
  button.addEventListener('click',()=>{wrap.remove();this.showBattleResult349(g)});
  wrap.append(button);document.body.append(wrap);
};
UI.prototype.showBattleResult349=function(g){
  this.close();document.querySelector('[data-final-board-return-349]')?.remove();
  const won=g.winner==='player';
  const overlay=document.createElement('div');overlay.className='dialog battle-result-overlay';
  const panel=document.createElement('section');panel.className='redirect-flow battle-result-sheet '+(won?'win':'lose');
  const head=document.createElement('div');head.className='redirect-head';
  const label=document.createElement('small');label.textContent='BATTLE RESULT';
  const result=document.createElement('h2');result.textContent=won?'WIN':'LOSE';
  const note=document.createElement('p');note.textContent=won?'バトルに勝利しました':'バトルに敗北しました';
  head.append(label,result,note);
  const foot=document.createElement('div');foot.className='redirect-footer';foot.style.display='grid';foot.style.gridTemplateColumns='1fr 1fr';foot.style.gap='12px';foot.style.minHeight='0';foot.style.height='auto';
  const review=document.createElement('button');review.type='button';review.textContent='振り返り';review.addEventListener('click',()=>this.showBattleReview349(g));
  review.style.height='56px';review.style.minHeight='56px';review.style.padding='10px 12px';
  const home=document.createElement('button');home.type='button';home.className='primary';home.textContent='最初の画面に戻る';home.style.height='56px';home.style.minHeight='56px';home.style.padding='10px 12px';home.addEventListener('click',()=>{this.close();this._battleResultShown349=false;this.a.home()});
  foot.append(review,home);panel.append(head,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};
const previousBattleResultRender349=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const result=previousBattleResultRender349.call(this,g);
  if(!g?.winner){this._battleResultShown349=false;return result}
  if(!this._battleResultShown349){
    this._battleResultShown349=true;
    this.showBattleResult349(g);
  }
  return result;
};


/* AI trigger finalizer v350: never leave an AI-only choice blocking the player's main phase. */
const previousAiTriggerFinalizer350=GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger=async function(use){
  const original=this.state.pending;
  const aiLife=Boolean(original&&['trigger','lifeReveal'].includes(original.kind)&&original.side==='ai');
  const result=await previousAiTriggerFinalizer350.call(this,use);
  if(!aiLife)return result;
  for(let guard=0;guard<8;guard++){
    const pending=this.state.pending;
    if(!pending||pending.side!=='ai')break;
    const beforeToken=String(pending.kind)+':'+String(pending.stage||'')+':'+String((pending.options||[]).join(','));
    if(pending.kind==='effectChoice'){
      await this.resolveTeachKoChoice('ai',(pending.options||[]).slice(0,pending.max||1));
    }else if(pending.kind==='handDiscardChoice'){
      const own=this.state.sides.ai;
      const ids=own.hand.slice().sort((a,b)=>Number(a.counter||0)-Number(b.counter||0)||Number(a.cost||0)-Number(b.cost||0)).slice(0,pending.count||1).map(card=>card.uid);
      await this.resolveTeachKoChoice('ai',ids);
    }else if(pending.kind==='devonTriggerChoice'&&typeof this.resolveDevonChoice==='function'){
      await this.resolveDevonChoice('ai',(pending.options||[])[0]||null);
    }else if(pending.kind==='sanjuanPowerChoice'&&typeof this.resolveSanjuanChoice==='function'){
      const own=this.state.sides.ai;
      const target=(pending.options||[]).map(uid=>uid===own.leader.uid?own.leader:own.field.find(card=>card.uid===uid)).filter(Boolean)
        .sort((a,b)=>(7000-Number(b.power||0))-(7000-Number(a.power||0)))[0];
      await this.resolveSanjuanChoice('ai',target?.uid||null);
    }else if(pending.kind==='darkWaterNegateChoice'&&typeof this.resolveDarkWaterChoice==='function'){
      await this.resolveDarkWaterChoice('ai',(pending.options||[])[0]||null);
    }else break;
    const after=this.state.pending,afterToken=after?String(after.kind)+':'+String(after.stage||'')+':'+String((after.options||[]).join(',')):'';
    if(after&&afterToken===beforeToken)break;
  }
  if(!this.state.pending&&this.state.activeSide==='player'&&!this.state.winner)this.state.phase='main';
  return true;
};


/* AI search selection v351: choose cards by curve, defense and matchup needs. */
const aiSearchValue351=(state,card)=>{
  const own=state.sides.ai,foe=state.sides.player,turns=state.turnsTaken?.ai||0;
  let value=Number(card.counter||0)/500+Number(card.power||0)/2000;
  if(own.leader.id==='OP13-001'){
    if(card.id==='ST31-005'&&!own.stage)value+=18;
    if(['OP01-016','EB02-017','EB04-002'].includes(card.id)&&turns<=2)value+=12;
    if(['OP10-011','OP14-031'].includes(card.id)&&own.life.length<=2)value+=15;
    if(['ST31-004','OP13-118','EB04-007'].includes(card.id)&&foe.life.length<=2)value+=18;
    if(Number(card.cost||0)<=Math.max(1,own.don.total+2))value+=7;
    if(card.id==='ST21-003'&&foe.life.length>1)value+=8;
  }else{
    if(card.id==='OP09-099'&&!own.stage)value+=16;
    if(['OP09-096','OP16-103','OP16-109','OP16-110'].includes(card.id)&&turns<=3)value+=12;
    if(card.id==='OP16-109'&&foe.field.some(target=>Number(target.cost||0)<=1))value+=15;
    if(card.id==='EB04-058'&&own.life.length<=2)value+=18;
    if(['OP16-119','OP09-093','OP16-116'].includes(card.id)&&own.don.total>=7)value+=16;
    if(Number(card.cost||0)<=Math.max(1,own.don.total+2))value+=6;
  }
  const copies=own.hand.filter(item=>item.id===card.id).length;
  return value-copies*(own.leader.id==='OP13-001'?8:4);
};
const previousAiSearchPlay351=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousAiSearchPlay351.call(this,side,uid);
  if(!result||side!=='ai')return result;
  const own=this.state.sides.ai,pending=this.state.pending;
  if(pending?.kind==='luffyNamiSearch'&&pending.side==='ai'){
    const chosen=pending.cards.filter(card=>pending.options.includes(card.uid)).sort((a,b)=>aiSearchValue351(this.state,b)-aiSearchValue351(this.state,a))[0];
    this.resolveLuffyNamiSearch('ai',chosen?.uid||null);
  }else if(pending?.kind==='teachSearch3Choice'&&pending.side==='ai'){
    const chosen=(pending.cards||[]).filter(card=>card.id!=='OP09-096'&&(card.traits||[]).includes('黒ひげ海賊団')).sort((a,b)=>aiSearchValue351(this.state,b)-aiSearchValue351(this.state,a))[0];
    if(chosen){own.hand.push(chosen);this.log(chosen.name+'をサーチで手札に加えた')}
    own.trash.push(...(pending.cards||[]).filter(card=>card.uid!==chosen?.uid));
    this.state.pending=null;this.state.phase='main';
  }
  return result;
};


/* AI self-play button v351. */
const previousSelfPlayHome351=UI.prototype.renderHome;
UI.prototype.renderHome=function(...args){
  const result=previousSelfPlayHome351.apply(this,args);
  const setup=this.root?.querySelector('.setup');
  if(setup&&!setup.querySelector('[data-ai-selfplay]')&&typeof this.a?.selfPlay==='function'){
    const button=document.createElement('button');
    button.type='button';button.dataset.aiSelfplay='true';button.textContent='AI同士で対戦データを取る';
    button.addEventListener('click',()=>this.a.selfPlay());
    setup.append(button);
  }
  return result;
};
