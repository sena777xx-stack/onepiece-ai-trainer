import {GameEngine} from './game-engine-v3.js?v=3983';

/*
 * OP05-038 (舞踏石) can reveal from the AI life during the player's attack.
 * Its target picker is UI-only for the player, so resolve an AI-owned picker
 * here instead of leaving the game in effectChoice forever.
 */
const previousResolveTrigger3991 = GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger = async function(use){
  const result = await previousResolveTrigger3991.call(this, use);
  const pending = this.state?.pending;
  if(pending?.kind !== 'op05038TriggerChoice' || pending.side !== 'ai') return result;

  const foe = this.state.sides.player;
  const candidates = (pending.options || [])
    .map(uid => foe.leader.uid === uid ? foe.leader : foe.field.find(card => card.uid === uid))
    .filter(Boolean)
    .sort((a, b) => Number(a.rested) - Number(b.rested)
      || Number(b.power || 0) - Number(a.power || 0));
  const target = candidates.find(card => !card.rested) || null;

  this.resolveOP05038TriggerChoice('ai', target?.uid || null);
  if(!this.state.pending && this.state.activeSide === 'player' && !this.state.winner){
    this.state.phase = 'main';
  }
  return true;
};
