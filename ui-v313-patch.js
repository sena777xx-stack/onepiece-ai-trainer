import{UI}from'./ui-fixed.js?v=3430';
const el=(tag,attrs={},...children)=>{const node=document.createElement(tag);for(const[key,value]of Object.entries(attrs)){if(key==='class')node.className=value;else if(key.startsWith('on'))node.addEventListener(key.slice(2).toLowerCase(),value);else if(value!==null&&value!==undefined)node.setAttribute(key,value)}for(const child of children.flat())node.append(child?.nodeType?child:document.createTextNode(child??''));return node};
UI.prototype.showZone=function(side,zone,g){
 this.close();document.body.classList.remove('hand-open');
 const sideState=g.sides[side],cards=[...sideState[zone]],selected=new Set();
 const overlay=el('div',{class:'dialog'}),panel=el('section',{class:'sheet zone-sheet trash-image-sheet'}),count=el('p'),grid=el('div',{class:'trash-image-grid'});
 const update=()=>{count.textContent=`トラッシュ：${cards.length}枚 / ${selected.size}枚選択`;grid.querySelectorAll('.trash-image-card').forEach(button=>button.classList.toggle('selected',selected.has(button.dataset.id)))};
 for(const card of cards){
  const image=card.imageUrl?el('img',{src:card.imageUrl,alt:card.name,loading:'lazy',onError:event=>event.currentTarget.classList.add('image-error')}):el('div',{class:'trash-image-fallback'},card.name);
  const button=el('button',{class:'trash-image-card','data-id':card.uid},image,el('span',{class:'trash-selected-mark'},'✓'),el('strong',{},card.name),el('small',{},`${card.id||''}　C${card.cost??'-'} / P${card.power||'-'} / +${card.counter||0}`));
  button.addEventListener('click',()=>{selected.has(card.uid)?selected.delete(card.uid):selected.add(card.uid);update()});grid.append(button);
 }
 const move=(label,to)=>el('button',{onClick:()=>selected.size&&this.a.bulkMove(side,zone,to,[...selected])},label);
 panel.append(el('h2',{},`${side==='player'?'自分':'AI'}のトラッシュ`),count,el('p',{class:'zone-help'},'画像をタップしてカードを選択できます。'),grid,el('div',{class:'zone-actions'},move('手札へ','hand'),move('デッキ上へ','deckTop'),move('デッキ下へ','deckBottom'),move('ライフ上へ','lifeTop'),move('場へ','field')),el('button',{class:'primary zone-close',onClick:()=>this.close()},'閉じる'));
 overlay.append(panel);this.modal=overlay;document.body.append(overlay);update();
};
