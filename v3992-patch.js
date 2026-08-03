import {GameEngine} from './game-engine-v3.js?v=3983';
import {UI} from './ui-fixed.js?v=3441';

const previousPlayCard3992 = GameEngine.prototype.playCard;

function findTeach3992(sideState, uid){
  return sideState.hand.find(card =>
    card.uid === uid &&
    card.type === 'character' &&
    card.name === 'マーシャル・D・ティーチ'
  );
}

async function finishZehaha3992(engine, side, targetUid, takeLife){
  const pending = engine.state.pending;
  if(pending?.kind !== 'zehahaChoice' || pending.side !== side) return false;

  const mine = engine.state.sides[side];
  const foeSide = side === 'player' ? 'ai' : 'player';
  const foe = engine.state.sides[foeSide];
  const teach = targetUid ? findTeach3992(mine, targetUid) : null;

  if(teach && mine.field.length < 5){
    engine.state.pending = null;
    engine.state.phase = 'main';
    const originalCost = teach.cost;
    teach.cost = 0;
    const played = await engine.playCard(side, teach.uid);
    teach.cost = originalCost;
    if(played) engine.log(`ゼハハハハハハ!!!の効果で${teach.name}を登場`);
  }else if(targetUid){
    engine.log('ゼハハハハハハ!!!：選択したティーチを登場させられませんでした');
  }else{
    engine.log('ゼハハハハハハ!!!：ティーチを登場させませんでした');
  }

  if(takeLife && foe.life.length){
    const lifeCard = foe.life.pop();
    foe.hand.push(lifeCard);
    engine.log('ゼハハハハハハ!!!：相手のライフ上1枚を手札に加えた');
  }else{
    engine.log('ゼハハハハハハ!!!：相手のライフを手札に加えませんでした');
  }

  engine.state.pending = null;
  engine.state.phase = 'main';
  engine.checkWin();
  return true;
}

GameEngine.prototype.resolveZehahaChoice = async function(side, targetUid = null, takeLife = false){
  return await finishZehaha3992(this, side, targetUid, Boolean(takeLife));
};

GameEngine.prototype.playCard = async function(side, uid){
  const s = this.state.sides[side];
  const card = s?.hand.find(item => item.uid === uid);
  if(card?.id !== 'OP16-116') return previousPlayCard3992.call(this, side, uid);

  const legal = this.state.activeSide === side &&
    this.state.phase === 'main' &&
    !this.state.pending &&
    s.don.total === 10 &&
    s.don.active >= (card.cost || 0);
  if(!legal){
    this.log('ゼハハハハハハ!!!は自分の場のDON!!が10枚あるメインフェーズに使用できます');
    return false;
  }

  this.snapshot();
  s.don.active -= card.cost || 0;
  s.don.rested += card.cost || 0;
  s.hand = s.hand.filter(item => item.uid !== uid);
  s.trash.push(card);
  this.log('ゼハハハハハハ!!!をイベントとして使用');

  const options = s.field.length < 5
    ? s.hand.filter(item => item.type === 'character' && item.name === 'マーシャル・D・ティーチ').map(item => item.uid)
    : [];
  const foeSide = side === 'player' ? 'ai' : 'player';
  const canTakeLife = this.state.sides[foeSide].life.length > 0;

  if(side === 'ai'){
    const choices = options
      .map(id => findTeach3992(s, id))
      .filter(Boolean)
      .sort((a, b) => (b.cost || 0) - (a.cost || 0) || (b.power || 0) - (a.power || 0));
    this.state.pending = {kind:'zehahaChoice', side, options, canTakeLife};
    await finishZehaha3992(this, side, choices[0]?.uid || null, canTakeLife);
    return true;
  }

  this.state.pending = {kind:'zehahaChoice', side, options, canTakeLife};
  this.state.phase = 'effectChoice';
  this.log('ゼハハハハハハ!!!：登場させるティーチと相手ライフを選択');
  return true;
};

function zehahaPrompt3992(ui, state){
  ui.close();
  const pending = state.pending;
  const mine = state.sides.player;
  const cards = pending.options.map(uid => findTeach3992(mine, uid)).filter(Boolean);
  let selectedUid = null;
  let takeLife = Boolean(pending.canTakeLife);

  const overlay = document.createElement('div');
  overlay.className = 'dialog';
  const panel = document.createElement('section');
  panel.className = 'sheet effect-picker';
  panel.style.maxHeight = '88vh';
  panel.style.overflow = 'auto';
  panel.innerHTML = '<h2>ゼハハハハハハ!!!</h2><p>手札から「マーシャル・D・ティーチ」1枚までを登場させます。</p>';

  const grid = document.createElement('div');
  grid.className = 'effect-target-grid';
  const confirm = document.createElement('button');
  confirm.className = 'primary';
  confirm.textContent = '効果を決定';

  const update = () => {
    for(const button of grid.querySelectorAll('button')){
      button.classList.toggle('selected', button.dataset.id === selectedUid);
    }
  };

  for(const card of cards){
    const button = document.createElement('button');
    button.dataset.id = card.uid;
    if(card.imageUrl){
      const image = document.createElement('img');
      image.src = card.imageUrl;
      image.alt = card.name;
      button.append(image);
    }
    const name = document.createElement('strong');
    name.textContent = card.name;
    const meta = document.createElement('small');
    meta.textContent = `${card.id} / コスト ${card.cost} / パワー ${card.power}`;
    button.append(name, meta);
    button.addEventListener('click', () => {
      selectedUid = selectedUid === card.uid ? null : card.uid;
      update();
    });
    grid.append(button);
  }

  if(!cards.length){
    const empty = document.createElement('p');
    empty.textContent = mine.field.length >= 5
      ? '場が5枚のため、ティーチは登場させられません。'
      : '登場させられるティーチは手札にありません。';
    panel.append(empty);
  }else{
    panel.append(grid);
  }

  const lifeLabel = document.createElement('label');
  lifeLabel.style.cssText = 'display:flex;gap:10px;align-items:center;padding:14px 4px';
  const lifeCheck = document.createElement('input');
  lifeCheck.type = 'checkbox';
  lifeCheck.checked = takeLife;
  lifeCheck.disabled = !pending.canTakeLife;
  lifeCheck.addEventListener('change', () => { takeLife = lifeCheck.checked; });
  const lifeText = document.createElement('span');
  lifeText.textContent = pending.canTakeLife
    ? '相手のライフ上1枚を手札に加える'
    : '相手のライフがないため選択できません';
  lifeLabel.append(lifeCheck, lifeText);

  confirm.addEventListener('click', () => ui.a.zehahaChoice(selectedUid, takeLife));
  panel.append(lifeLabel, confirm);
  overlay.append(panel);
  ui.modal = overlay;
  document.body.append(overlay);
  update();
}

const previousRenderGame3992 = UI.prototype.renderGame;
UI.prototype.renderGame = function(state){
  previousRenderGame3992.call(this, state);
  if(state.pending?.kind === 'zehahaChoice' && state.pending.side === 'player'){
    zehahaPrompt3992(this, state);
  }
};
