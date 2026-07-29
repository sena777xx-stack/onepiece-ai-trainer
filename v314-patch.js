import{GameEngine}from'./game-engine-v3.js?v=3440';
import{UI}from'./ui-fixed.js?v=3440';
const el=(tag,attrs={},...children)=>{const node=document.createElement(tag);for(const[key,value]of Object.entries(attrs)){if(key==='class')node.className=value;else if(key.startsWith('on'))node.addEventListener(key.slice(2).toLowerCase(),value);else if(value!==null&&value!==undefined)node.setAttribute(key,value)}for(const child of children.flat())node.append(child?.nodeType?child:document.createTextNode(child??''));return node};
const standardEffectChoice=GameEngine.prototype.resolveTeachKoChoice;
GameEngine.prototype.resolveTeachKoChoice=function(side,ids=[]){
 const pending=this.state.pending;
 if(pending?.kind!=='handDiscardChoice')return standardEffectChoice.call(this,side,ids);
 if(pending.side!==side)return false;
 const hand=this.state.sides[side].hand,chosen=[...new Set(ids)].map(id=>hand.find(card=>card.uid===id)).filter(Boolean).slice(0,pending.count||1);
 if(chosen.length!==(pending.count||1))return false;
 this.snapshot();
 for(const card of chosen){this.state.sides[side].hand=this.state.sides[side].hand.filter(item=>item.uid!==card.uid);this.state.sides[side].trash.push(card);this.log(`${card.name}をトラッシュへ送った`)}
 this.state.pending=null;this.state.phase='main';return true;
};
const standardRender=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){standardRender.call(this,g);if(g.pending?.kind==='handDiscardChoice'&&g.pending.side==='player')this.handDiscardPrompt(g)};
UI.prototype.handDiscardPrompt=function(g){
 this.close();const pending=g.pending,hand=g.sides.player.hand;let selected=null;
 const overlay=el('div',{class:'dialog'}),panel=el('section',{class:'redirect-flow discard-choice-flow'}),head=el('div',{class:'redirect-head'},el('small',{},pending.sourceName),el('h2',{},'捨てる手札を選択')),body=el('div',{class:'redirect-body'}),grid=el('div',{class:'discard-image-grid'}),foot=el('div',{class:'redirect-footer single'}),confirm=el('button',{class:'primary',disabled:'disabled'},'選択したカードを捨てる');
 const update=()=>{confirm.disabled=!selected;grid.querySelectorAll('button').forEach(button=>button.classList.toggle('selected',button.dataset.id===selected))};
 for(const card of hand){const button=el('button',{'data-id':card.uid},card.imageUrl?el('img',{src:card.imageUrl,alt:card.name}):'',el('strong',{},card.name),el('small',{},card.id||''),el('span',{class:'discard-check'},'✓'));button.addEventListener('click',()=>{selected=selected===card.uid?null:card.uid;update()});grid.append(button)}
 confirm.addEventListener('click',()=>this.a.effectChoice([selected]));body.append(el('p',{},'ドロー処理が終わりました。トラッシュへ送るカードを1枚選んでください。'),grid);foot.append(confirm);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);update();
};
