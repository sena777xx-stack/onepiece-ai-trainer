import{GameEngine}from'./game-engine-v3.js?v=3441';
import{UI}from'./ui-fixed.js?v=3441';

/* Record the exact cards that the AI actually paid from its hand as counters. */
const previousSubmitCounters371=GameEngine.prototype.submitCounters;
GameEngine.prototype.submitCounters=function(side,counterIds=[]){
  const own=this.state?.sides?.[side];
  const requested=new Set(Array.isArray(counterIds)?counterIds:[counterIds]);
  const candidates=side==='ai'&&own
    ?own.hand.filter(card=>requested.has(card.uid)).map(card=>({
      uid:card.uid,id:card.id,name:card.name,imageUrl:card.imageUrl,counter:Number(card.counter||0)
    }))
    :[];
  const result=previousSubmitCounters371.call(this,side,counterIds);
  if(side==='ai'&&candidates.length){
    const used=candidates.filter(card=>!own.hand.some(item=>item.uid===card.uid)&&own.trash.some(item=>item.uid===card.uid));
    if(used.length){
      this.state.aiCounterNotices371=Array.isArray(this.state.aiCounterNotices371)?this.state.aiCounterNotices371:[];
      this.state.aiCounterNotices371.push({
        cards:used,
        total:used.reduce((sum,card)=>sum+Number(card.counter||0),0),
        turn:this.state.turn
      });
      this.log('AIがカウンターで使用：'+used.map(card=>card.name+' +'+card.counter).join('、'));
    }
  }
  return result;
};

UI.prototype.showAiCounterNotice371=function(notice){
  this.close();
  const overlay=document.createElement('div');overlay.className='dialog ai-counter-notice-371';
  const panel=document.createElement('section');panel.className='redirect-flow';
  const head=document.createElement('div');head.className='redirect-head';
  const small=document.createElement('small');small.textContent='AI COUNTER';
  const title=document.createElement('h2');title.textContent='AIが使用したカウンター';
  const total=document.createElement('p');total.textContent='合計カウンター +'+Number(notice.total||0);
  head.append(small,title,total);
  const body=document.createElement('div');body.className='redirect-body';
  const grid=document.createElement('div');grid.className='counter-grid ai-counter-cards-371';
  grid.style.display='grid';grid.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';grid.style.gap='12px';
  for(const card of notice.cards||[]){
    const item=document.createElement('div');item.className='hand-check-card';
    item.style.position='relative';item.style.minWidth='0';
    if(card.imageUrl){
      const image=document.createElement('img');image.src=card.imageUrl;image.alt=card.name||'カウンターカード';
      image.style.width='100%';image.style.aspectRatio='5 / 7';image.style.objectFit='contain';image.style.borderRadius='10px';
      item.append(image);
    }
    const name=document.createElement('strong');name.textContent=String(card.name||'名称不明');name.style.display='block';name.style.marginTop='6px';
    const info=document.createElement('small');info.textContent=String(card.id||'')+' / カウンター +'+Number(card.counter||0);
    info.style.display='block';info.style.color='#f7c84b';info.style.marginTop='3px';
    item.append(name,info);grid.append(item);
  }
  body.append(grid);
  const foot=document.createElement('div');foot.className='redirect-footer single';
  const close=document.createElement('button');close.type='button';close.className='primary';close.textContent='確認して続ける';
  close.addEventListener('click',()=>this.close());
  foot.append(close);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};

const previousRenderGame371=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const result=previousRenderGame371.call(this,g);
  const queue=Array.isArray(g?.aiCounterNotices371)?g.aiCounterNotices371:null;
  if(queue?.length&&!this._showingAiCounter371){
    const notice=queue.shift();
    this._showingAiCounter371=true;
    setTimeout(()=>{
      this.showAiCounterNotice371(notice);
      this._showingAiCounter371=false;
    },0);
  }
  return result;
};
