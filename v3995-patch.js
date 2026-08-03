import {GameEngine} from './game-engine-v3.js?v=3983';
import {UI} from './ui-fixed.js?v=3441';

function normalizeTeach10Entry3995(engine, side, card){
  if(!card || card.id !== 'OP09-093') return card;
  card.cost = 10;
  if(card.summoningSickness && card.teach10PlayedTurn == null){
    card.teach10PlayedTurn = engine.state.turn;
  }
  return card;
}

const previousPlayCard3995 = GameEngine.prototype.playCard;
GameEngine.prototype.playCard = async function(side, uid){
  const source = this.state?.sides?.[side]?.hand?.find(card => card.uid === uid);
  const isTeach10 = source?.id === 'OP09-093';
  const result = await previousPlayCard3995.call(this, side, uid);
  if(result && isTeach10){
    const fieldCard = this.state.sides[side].field.find(card => card.uid === uid);
    if(fieldCard){
      fieldCard.cost = 10;
      fieldCard.teach10PlayedTurn = this.state.turn;
      fieldCard.teach10UsedTurn = undefined;
      this.log('10コスト・ティーチ：登場ターンの起動メインを使用できます');
    }
  }
  return result;
};

const previousLoad3995 = GameEngine.prototype.load;
GameEngine.prototype.load = function(saved){
  const result = previousLoad3995.call(this, saved);
  for(const side of ['player','ai']){
    for(const card of this.state?.sides?.[side]?.field || []){
      normalizeTeach10Entry3995(this, side, card);
    }
  }
  return result;
};

const previousShowCard3995 = UI.prototype.showCard;
UI.prototype.showCard = function(side, card, state){
  if(side === 'player' && card?.id === 'OP09-093'){
    normalizeTeach10Entry3995({state}, side, card);
  }
  const result = previousShowCard3995.call(this, side, card, state);
  if(side !== 'player' || card?.id !== 'OP09-093') return result;
  if(state.activeSide !== 'player' || state.phase !== 'main' || state.pending) return result;
  if(!state.sides.player.field.some(item => item.uid === card.uid)) return result;
  if(card.teach10PlayedTurn !== state.turn || card.teach10UsedTurn === state.turn) return result;

  const actions = this.modal?.querySelector('.actions');
  if(!actions) return result;
  const already = [...actions.querySelectorAll('button')].some(button =>
    button.textContent?.includes('起動メイン')
  );
  if(!already){
    const button = document.createElement('button');
    button.className = 'primary';
    button.textContent = '起動メイン効果';
    button.addEventListener('click', () => this.teach10Picker(state));
    actions.insertBefore(button, actions.lastElementChild);
  }
  return result;
};
