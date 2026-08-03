import{GameEngine}from'./game-engine-v3.js?v=3983';
import{UI}from'./ui-fixed.js?v=3441';

/* Recover a battle that is waiting only for the AI defender. */
const previousEndTurn369=GameEngine.prototype.endTurn;
GameEngine.prototype.endTurn=async function(side){
  if(this.state.activeSide===side){
    let pending=this.state.pending;
    if(pending?.kind==='battle'&&pending.defendingSide!==side){
      this.log('[復旧] 停止していた相手側の防御処理を再開');
      for(let guard=0;guard<3&&this.state.pending?.kind==='battle';guard++){
        const before=this.state.pending;
        const ok=this.autoResolveDefense();
        if(!ok||this.state.pending===before&&before.step===this.state.pending?.step)break;
      }
      pending=this.state.pending;
    }
    if(!pending&&['effectChoice','battle','counter'].includes(this.state.phase)){
      this.state.phase='main';
      this.log('[復旧] 完了済みの効果処理を閉じてメインフェーズへ戻りました');
    }
  }
  return previousEndTurn369.call(this,side);
};

function liveLogText369(g){
  const result=g?.winner==='player'?'WIN':g?.winner==='ai'?'LOSE':'対戦中';
  const pending=g?.pending;
  const pendingText=pending?JSON.stringify({
    kind:pending.kind,step:pending.step,side:pending.side,
    attackingSide:pending.attackingSide,defendingSide:pending.defendingSide,
    mode:pending.mode,options:Array.isArray(pending.options)?pending.options.length:undefined
  }):'なし';
  const lines=[
    'ONE PIECE AI TRAINER 途中経過ログ',
    '保存日時：'+new Date().toLocaleString('ja-JP'),
    '状態：'+result,
    'ターン：'+Number(g?.turn||0),
    '手番：'+String(g?.activeSide||'不明'),
    'フェーズ：'+String(g?.phase||'不明'),
    '未完了処理：'+pendingText,
    ''
  ];
  for(const [label,key] of [['プレイヤー','player'],['AI','ai']]){
    const s=g?.sides?.[key],don=s?.don||{};
    lines.push('【'+label+'】 '+String(s?.leader?.name||'不明'));
    lines.push('ライフ '+Number(s?.life?.length||0)+' / 手札 '+Number(s?.hand?.length||0)+' / デッキ '+Number(s?.deck?.length||0)+' / 場 '+Number(s?.field?.length||0)+' / トラッシュ '+Number(s?.trash?.length||0));
    lines.push('DON!! アクティブ '+Number(don.active||0)+' / 合計 '+Number(don.total||0));
    lines.push('場：'+(s?.field?.map(card=>String(card.name||'不明')+'['+String(card.id||'')+']'+(card.rested?'(レスト)':'(アクティブ)')).join('、')||'なし'),'');
  }
  lines.push('【対戦ログ（全件）】');
  (g?.log||[]).forEach((entry,index)=>lines.push(String(index+1).padStart(4,'0')+'｜'+String(typeof entry==='string'?entry:(entry?.text||entry?.message||JSON.stringify(entry)))));
  return lines.join('\n');
}
async function saveLiveLog369(g,button){
  const text=liveLogText369(g),stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const filename='onepiece-ai-trainer_途中経過_'+stamp+'.txt';
  const blob=new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'});
  const file=typeof File==='function'?new File([blob],filename,{type:'text/plain;charset=utf-8'}):null;
  const original=button.textContent;
  try{
    if(file&&navigator.share&&navigator.canShare?.({files:[file]})){
      await navigator.share({title:'ONE PIECE AI TRAINER 途中経過ログ',files:[file]});
      button.textContent='共有しました';
    }else{
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),3000);button.textContent='保存しました';
    }
  }catch(error){
    if(error?.name!=='AbortError'){
      try{await navigator.clipboard.writeText(text);button.textContent='コピーしました'}
      catch(_){button.textContent='保存できませんでした'}
    }
  }finally{setTimeout(()=>{if(button.isConnected)button.textContent=original},2000)}
}
UI.prototype.showLiveLog369=function(g){
  this.close();
  const overlay=document.createElement('div');overlay.className='dialog live-log-overlay';
  const panel=document.createElement('section');panel.className='redirect-flow live-log-sheet';
  const head=document.createElement('div');head.className='redirect-head';
  const small=document.createElement('small');small.textContent='動作確認';
  const title=document.createElement('h2');title.textContent='対戦ログ';
  const status=document.createElement('p');
  status.textContent='フェーズ：'+String(g.phase||'不明')+' / 未完了処理：'+String(g.pending?.kind||'なし')+(g.pending?.step?' / '+g.pending.step:'');
  head.append(small,title,status);
  const body=document.createElement('div');body.className='redirect-body battle-review-log';
  body.style.whiteSpace='pre-wrap';body.style.overflowY='auto';
  body.style.maxHeight='58vh';body.style.fontSize='14px';body.style.lineHeight='1.55';
  const logs=(g.log||[]);
  body.textContent=logs.length?logs.map((entry,index)=>String(index+1).padStart(4,'0')+'｜'+String(typeof entry==='string'?entry:(entry?.text||entry?.message||JSON.stringify(entry)))).join('\n'):'ログはまだありません';
  const foot=document.createElement('div');foot.className='redirect-footer';
  foot.style.display='grid';foot.style.gridTemplateColumns='1fr 1fr';foot.style.gap='10px';
  const save=document.createElement('button');save.type='button';save.className='primary';save.textContent='ログを保存・共有';save.addEventListener('click',()=>saveLiveLog369(g,save));
  const close=document.createElement('button');close.type='button';close.textContent='対戦へ戻る';close.addEventListener('click',()=>this.close());
  foot.append(close,save);panel.append(head,body,foot);overlay.append(panel);this.modal=overlay;document.body.append(overlay);
};

const previousRenderGame369=UI.prototype.renderGame;
UI.prototype.renderGame=function(g){
  const result=previousRenderGame369.call(this,g);
  const chips=this.root?.querySelector?.('.topbar .chips');
  if(chips&&!chips.querySelector('[data-live-log-369]')){
    const button=document.createElement('button');button.type='button';button.dataset.liveLog369='true';
    button.className='chip';button.textContent='ログ確認';
    button.style.cursor='pointer';button.addEventListener('click',()=>this.showLiveLog369(g));
    chips.prepend(button);
  }
  const end=[...this.root?.querySelectorAll?.('button')||[]].find(button=>button.textContent.trim()==='ターン終了');
  const pending=g?.pending;
  const aiDefenseStuck=g?.activeSide==='player'&&pending?.kind==='battle'&&pending.defendingSide==='ai';
  if(end&&aiDefenseStuck){
    end.disabled=false;
    end.title='相手側の防御処理を完了してターンを終了します';
  }
  return result;
};
