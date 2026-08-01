import{GameEngine}from'./game-engine-v3.js?v=3441';import{UI}from'./ui-fixed.js?v=3441';import{resolveEffects}from'./effect-engine.js?v=3441';
const other=side=>side==='player'?'ai':'player';
const el=(tag,attrs={},...children)=>{const node=document.createElement(tag);for(const[key,value]of Object.entries(attrs)){if(key==='class')node.className=value;else if(key.startsWith('on'))node.addEventListener(key.slice(2).toLowerCase(),value);else if(value!==null&&value!==undefined)node.setAttribute(key,value)}for(const child of children.flat())node.append(child?.nodeType?child:document.createTextNode(child??''));return node};
const applyCopiedPower=(engine,battle,attacker,target)=>{const adjustment=(target.power||0)-(attacker.power||0),previous=attacker.devonPowerTurn===engine.state.turn?(attacker.devonPowerAdjustment||0):0;attacker.tempPower=(attacker.tempPower||0)-previous+adjustment;attacker.devonPowerAdjustment=adjustment;attacker.devonPowerTurn=engine.state.turn;battle.power=(attacker.power||0)+(attacker.attachedDon||0)*1000+(attacker.tempPower||0);engine.log(`${attacker.name}の元々のパワーを${target.power||0}に変更`)};
const clearDevonCopiedPower=(engine,side)=>{
  const own=engine.state?.sides?.[side];
  if(!own)return;
  for(const card of own.field||[]){
    if(card.id!=='OP16-104'||card.devonPowerTurn==null)continue;
    card.tempPower=(card.tempPower||0)-(card.devonPowerAdjustment||0);
    card.devonPowerAdjustment=0;
    delete card.devonPowerTurn;
  }
};
/* Devon copies base power only for the turn in which its attack effect resolved. */
const previousDevonEndTurn=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  const canEnd=this.state.activeSide===side&&this.state.phase==='main'&&!this.state.pending;
  if(canEnd)clearDevonCopiedPower(this,side);
  return previousDevonEndTurn.call(this,side);
};
const previousDevonLoad=GameEngine.prototype.load;
GameEngine.prototype.load=function(saved){
  const result=previousDevonLoad.call(this,saved);
  for(const side of['player','ai']){
    for(const card of this.state.sides[side].field||[]){
      const valid=side===this.state.activeSide&&card.devonPowerTurn===this.state.turn;
      if(card.id==='OP16-104'&&card.devonPowerTurn!=null&&!valid){
        card.tempPower=(card.tempPower||0)-(card.devonPowerAdjustment||0);
        card.devonPowerAdjustment=0;
        delete card.devonPowerTurn;
      }
    }
  }
  return result;
};
const previousAttack=GameEngine.prototype.declareAttack;
GameEngine.prototype.declareAttack=async function(side,attackerId,targetId){const result=await previousAttack.call(this,side,attackerId,targetId),battle=this.state.pending,own=this.state.sides[side],attacker=[own.leader,...own.field].find(card=>card.uid===attackerId);if(!result||battle?.kind!=='battle'||attacker?.id!=='OP16-104'||attacker.effectsNegatedThroughTurn>=this.state.turn)return result;const foe=this.state.sides[other(side)],options=foe.field;if(side==='ai'){const target=[...options].sort((a,b)=>(b.power||0)-(a.power||0))[0];if(target)applyCopiedPower(this,battle,attacker,target);return result}this.state.pending={kind:'devonAttackChoice',side,battle,attackerUid:attacker.uid,options:options.map(card=>card.uid)};this.state.phase='effectChoice';return true};
GameEngine.prototype.resolveDevonChoice=async function(side,targetUid=null){const pending=this.state.pending;if(pending?.side!==side)return false;if(pending.kind==='devonAttackChoice'){const own=this.state.sides[side],foe=this.state.sides[other(side)],attacker=own.field.find(card=>card.uid===pending.attackerUid),target=foe.field.find(card=>card.uid===targetUid);if(attacker&&target)applyCopiedPower(this,pending.battle,attacker,target);this.state.pending=pending.battle;this.state.phase='battle';return true}if(pending.kind==='devonTriggerChoice'){const own=this.state.sides[side],target=own.trash.find(card=>card.uid===targetUid&&card.type==='character'&&(card.cost||0)===1&&(card.traits||[]).includes('黒ひげ海賊団'));if(target&&own.field.length<5){own.trash=own.trash.filter(card=>card.uid!==target.uid);target.summoningSickness=true;target.rested=false;own.field.push(target);this.log(`${target.name}をトラッシュから登場`);await resolveEffects({engine:this,state:this.state,side},'onPlay',target)}this.state.pending=null;this.state.phase='main';return true}return false};
const previousUseTrigger=GameEngine.prototype.useTrigger;
GameEngine.prototype.useTrigger=async function(side,id){const own=this.state.sides[side],index=own.life.findIndex(card=>card.uid===id);if(index<0||own.life[index].id!=='OP16-104')return previousUseTrigger.call(this,side,id);this.snapshot();const[card]=own.life.splice(index,1);this.state.pending={kind:'trigger',side,card};this.state.phase='lifeReveal';const result=await this.resolveTrigger(true);this.syncBurgessPower?.();return result};
const previousTrigger=GameEngine.prototype.resolveTrigger;
GameEngine.prototype.resolveTrigger=async function(use){const pending=this.state.pending,card=pending?.card;if(!use||!['trigger','lifeReveal'].includes(pending?.kind)||card?.id!=='OP16-104')return previousTrigger.call(this,use);const side=pending.side,own=this.state.sides[side];this.draw(side,1,false);const options=own.trash.filter(item=>item.type==='character'&&(item.cost||0)===1&&(item.traits||[]).includes('黒ひげ海賊団'));own.trash.push(card);this.log(`${card.name}のトリガー：カード1枚を引いた`);if(side==='ai'){const target=options[0];if(target&&own.field.length<5){own.trash=own.trash.filter(item=>item.uid!==target.uid);target.summoningSickness=true;target.rested=false;own.field.push(target);await resolveEffects({engine:this,state:this.state,side},'onPlay',target);this.log(`${target.name}をトラッシュから登場`)}return this.endBattle()}const choice={kind:'devonTriggerChoice',side,sourceName:card.name,options:options.map(item=>item.uid)};if(this.state.pending?.kind==='handNotice'){this.state.pending.returnPending=choice;this.state.pending.returnPhase='effectChoice'}else{this.state.pending=choice;this.state.phase='effectChoice'}return true};
const previousEndBattle=GameEngine.prototype.endBattle;
GameEngine.prototype.endBattle=function(){if(['devonAttackChoice','devonTriggerChoice'].includes(this.state.pending?.kind))return true;return previousEndBattle.call(this)};
const previousRender=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){previousRender.call(this,g);if(g.pending?.kind==='devonAttackChoice'&&g.pending.side==='player')this.devonAttackPicker(g);if(g.pending?.kind==='devonTriggerChoice'&&g.pending.side==='player')this.devonTriggerPicker(g)};
UI.prototype.devonAttackPicker=function(g){this.close();const pending=g.pending,foe=g.sides.ai,cards=pending.options.map(id=>foe.field.find(card=>card.uid===id)).filter(Boolean),overlay=el('div',{class:'dialog'}),panel=el('section',{class:'sheet effect-picker'}),grid=el('div',{class:'effect-target-grid'});for(const card of cards){const button=el('button',{},card.imageUrl?el('img',{src:card.imageUrl,alt:card.name}):'',el('strong',{},card.name),el('small',{},`元々のパワー ${card.power||0}`));button.addEventListener('click',()=>this.a.devonChoice(card.uid));grid.append(button)}panel.append(el('h2',{},'カタリーナ・デボン'),el('p',{},'元々のパワーを同じにする相手キャラを1枚まで選びます。'),cards.length?grid:el('p',{class:'empty-choice'},'相手キャラがいません'),el('button',{class:'primary',onClick:()=>this.a.devonChoice(null)},'選ばず続ける'));overlay.append(panel);this.modal=overlay;document.body.append(overlay)};
UI.prototype.devonTriggerPicker=function(g){this.close();const pending=g.pending,own=g.sides.player,cards=pending.options.map(id=>own.trash.find(card=>card.uid===id)).filter(Boolean),overlay=el('div',{class:'dialog'}),panel=el('section',{class:'sheet effect-picker'}),grid=el('div',{class:'effect-target-grid'});for(const card of cards){const button=el('button',{},card.imageUrl?el('img',{src:card.imageUrl,alt:card.name}):'',el('strong',{},card.name),el('small',{},'コスト1《黒ひげ海賊団》'));button.addEventListener('click',()=>this.a.devonChoice(card.uid));grid.append(button)}panel.append(el('h2',{},'カタリーナ・デボンのトリガー'),el('p',{},'トラッシュから登場させるカードを1枚まで選びます。'),cards.length?grid:el('p',{class:'empty-choice'},'対象カードがありません'),el('button',{class:'primary',onClick:()=>this.a.devonChoice(null)},'登場させず終了'));overlay.append(panel);this.modal=overlay;document.body.append(overlay)};
