import{GameEngine}from'./game-engine-v3.js?v=3501';

/* v363: Thousand Sunny on-play search on the GameEngine used by app.js. */
const previousSunnyPlay363=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousSunnyPlay363.call(this,side,uid);
  if(!result||source?.id!=='ST31-005')return result;

  const own=this.state.sides[side];
  const cards=own.deck.splice(Math.max(0,own.deck.length-5));
  const options=cards.filter(card=>(card.traits||[]).includes('麦わらの一味')).map(card=>card.uid);
  this.log(source.name+'の登場時：デッキ上から'+cards.length+'枚を確認');

  this.state.pending={
    kind:'luffyNamiSearch',
    side,
    sourceName:source.name,
    cards,
    options,
    help:'デッキの上から5枚を確認し、特徴《麦わらの一味》を持つカード1枚までを手札に加えます。'
  };
  this.state.phase='effectChoice';

  if(side==='ai'){
    const chosen=cards.filter(card=>options.includes(card.uid)).sort((a,b)=>
      Number(b.counter||0)-Number(a.counter||0)||
      Number(b.cost||0)-Number(a.cost||0)||
      Number(b.power||0)-Number(a.power||0)
    )[0];
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
    this.log(pending.sourceName+'のサーチ成功：'+chosen.name+'を手札に加えた');
  }else if(!pending.options.length){
    this.log(pending.sourceName+'のサーチ対象なし：手札に加えられるカードはありませんでした');
  }else{
    this.log(pending.sourceName+'のサーチでカードを手札に加えませんでした');
  }
  const rest=pending.cards.filter(card=>card.uid!==chosen?.uid);
  own.deck.unshift(...rest);
  this.log('残り'+rest.length+'枚をデッキの下へ置いた');
  this.state.pending=null;
  this.state.phase='main';
  return true;
};

const previousSunnyStart363=GameEngine.prototype.start;
GameEngine.prototype.start=function(...args){
  const result=previousSunnyStart363.apply(this,args);
  window.__luffyEngine349=this;
  return result;
};
const previousSunnyLoad363=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousSunnyLoad363.call(this,saved);
  window.__luffyEngine349=this;
  return result;
};
