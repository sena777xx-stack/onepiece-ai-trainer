import {GameEngine} from './game-engine-v3.js?v=3983';
import {UI} from './ui-fixed.js?v=3441';

const effectsNegated3996 = (state, card) =>
  Number(card?.effectsNegatedThroughTurn ?? -1) >= Number(state?.turn ?? 0) ||
  Number(card?.effectsNegatedTurn ?? -1) === Number(state?.turn ?? 0);

const previousChooseBlock3996 = GameEngine.prototype.chooseBlock;
GameEngine.prototype.chooseBlock = function(side, blockerUid = null){
  if(blockerUid){
    const blocker = this.state?.sides?.[side]?.field?.find(card => card.uid === blockerUid);
    if(blocker && effectsNegated3996(this.state, blocker)){
      this.log(blocker.name + 'は効果無効中のためブロッカーを使用できません');
      return previousChooseBlock3996.call(this, side, null);
    }
  }
  return previousChooseBlock3996.call(this, side, blockerUid);
};

const previousAutoDefense3996 = GameEngine.prototype.autoResolveDefense;
GameEngine.prototype.autoResolveDefense = function(){
  const battle = this.state?.pending;
  if(battle?.kind !== 'battle') return previousAutoDefense3996.call(this);
  const side = battle.defendingSide;
  const changed = [];
  for(const card of this.state.sides[side].field){
    if(!effectsNegated3996(this.state, card) || !(card.keywords || []).includes('blocker')) continue;
    changed.push([card, card.keywords]);
    card.keywords = card.keywords.filter(keyword => keyword !== 'blocker');
  }
  try{
    return previousAutoDefense3996.call(this);
  }finally{
    for(const [card, keywords] of changed) card.keywords = keywords;
  }
};

const previousDefenseUI3996 = UI.prototype.defense;
UI.prototype.defense = function(state, ...args){
  const changed = [];
  for(const card of state?.sides?.player?.field || []){
    if(!effectsNegated3996(state, card) || !(card.keywords || []).includes('blocker')) continue;
    changed.push([card, card.keywords]);
    card.keywords = card.keywords.filter(keyword => keyword !== 'blocker');
  }
  try{
    return previousDefenseUI3996.call(this, state, ...args);
  }finally{
    for(const [card, keywords] of changed) card.keywords = keywords;
  }
};
