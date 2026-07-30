import{GameEngine}from'./game-engine-v3.js?v=3441';

/* v364: OP01-016 / EB02-017 / EB04-002 search resolution. */
const previousSearcherPlay364=GameEngine.prototype.playCard;
GameEngine.prototype.playCard=async function(side,uid){
  const source=this.state.sides[side].hand.find(card=>card.uid===uid);
  const result=await previousSearcherPlay364.call(this,side,uid);
  if(!result||!['OP01-016','EB02-017','EB04-002'].includes(source?.id))return result;
  if(this.state.pending?.kind==='luffyNamiSearch'&&this.state.pending.side===side)return result;

  const own=this.state.sides[side],isBonney=source.id==='EB04-002',lookCount=isBonney?4:5;
  const cards=own.deck.splice(Math.max(0,own.deck.length-lookCount));
  const eligible=card=>isBonney
    ? card.name!=='ジュエリー・ボニー'&&(card.traits||[]).some(trait=>['エッグヘッド','Egghead','麦わらの一味'].includes(trait))
    : card.name!=='ナミ'&&(card.traits||[]).includes('麦わらの一味');
  const options=cards.filter(eligible).map(card=>card.uid);

  this.state.pending={
    kind:'luffyNamiSearch',
    side,
    sourceName:source.name+'（'+source.id+'）',
    cards,
    options,
    help:isBonney
      ? 'デッキの上から4枚を確認し、「ジュエリー・ボニー」以外の特徴《エッグヘッド》か《麦わらの一味》を持つカード1枚までを手札に加えます。'
      : 'デッキの上から5枚を確認し、「ナミ」以外の特徴《麦わらの一味》を持つカード1枚までを手札に加えます。'
  };
  this.state.phase='effectChoice';
  this.log(source.name+'（'+source.id+'）の登場時：デッキ上から'+cards.length+'枚を確認');

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
