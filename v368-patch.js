import{UI}from'./ui-fixed.js?v=3441';

function safeName368(value){
  return String(value||'unknown').replace(/[\\/:*?"<>|\s]+/g,'-').replace(/-+/g,'-').slice(0,48);
}
function cardLine368(card,index){
  if(!card)return (index+1)+'. 不明なカード';
  const flags=[];
  if(card.rested)flags.push('レスト');else flags.push('アクティブ');
  if(Number(card.attachedDon||0))flags.push('付与DON!! '+Number(card.attachedDon||0));
  if(Number(card.tempPower||0))flags.push('一時パワー '+Number(card.tempPower||0));
  return (index+1)+'. '+String(card.name||'名称不明')+' ['+String(card.id||'ID不明')+']'+(flags.length?' / '+flags.join(' / '):'');
}
function sideBlock368(label,s){
  if(!s)return [label+'：データなし'];
  const don=s.don||{};
  const lines=[
    '【'+label+'】',
    'リーダー：'+String(s.leader?.name||'不明')+' ['+String(s.leader?.id||'ID不明')+']',
    'ライフ：'+Number(s.life?.length||0)+' / 手札：'+Number(s.hand?.length||0)+' / デッキ：'+Number(s.deck?.length||0)+' / トラッシュ：'+Number(s.trash?.length||0),
    'DON!!：アクティブ '+Number(don.active||0)+' / 合計 '+Number(don.total||0)+' / デッキ残り '+Math.max(0,10-Number(don.total||0)),
    'ステージ：'+(s.stage?String(s.stage.name||'名称不明')+' ['+String(s.stage.id||'ID不明')+']':'なし'),
    '場：'
  ];
  if(s.field?.length)s.field.forEach((card,index)=>lines.push(cardLine368(card,index)));
  else lines.push('なし');
  lines.push('手札：');
  if(s.hand?.length)s.hand.forEach((card,index)=>lines.push(cardLine368(card,index)));
  else lines.push('なし');
  lines.push('トラッシュ：');
  if(s.trash?.length)s.trash.forEach((card,index)=>lines.push(cardLine368(card,index)));
  else lines.push('なし');
  lines.push('ライフ（上から）：');
  if(s.life?.length)s.life.slice().reverse().forEach((card,index)=>lines.push(cardLine368(card,index)));
  else lines.push('なし');
  return lines;
}
function buildBattleReport368(g){
  const now=new Date();
  const result=g?.winner==='player'?'WIN':g?.winner==='ai'?'LOSE':'未確定';
  const logs=Array.isArray(g?.log)?g.log:[];
  const lines=[
    'ONE PIECE AI TRAINER 対戦レポート',
    '保存日時：'+now.toLocaleString('ja-JP'),
    '結果：'+result,
    'ターン：'+Number(g?.turn||0),
    '現在の手番：'+String(g?.activeSide||'不明'),
    '先攻：'+String(g?.firstPlayer||g?.startingSide||'不明'),
    ''
  ];
  lines.push(...sideBlock368('プレイヤー',g?.sides?.player),'',...sideBlock368('AI',g?.sides?.ai),'','【対戦ログ（全件）】');
  if(logs.length){
    logs.forEach((entry,index)=>{
      const text=typeof entry==='string'?entry:String(entry?.text||entry?.message||JSON.stringify(entry));
      lines.push(String(index+1).padStart(4,'0')+'｜'+text);
    });
  }else lines.push('ログなし');
  lines.push('','--- REPORT END ---');
  return lines.join('\n');
}
async function saveBattleReport368(g,button){
  const text=buildBattleReport368(g);
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const matchup=safeName368((g?.sides?.player?.leader?.name||'player')+'_vs_'+(g?.sides?.ai?.leader?.name||'ai'));
  const filename='onepiece-ai-trainer_'+matchup+'_'+stamp+'.txt';
  const blob=new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'});
  const file=typeof File==='function'?new File([blob],filename,{type:'text/plain;charset=utf-8'}):null;
  const original=button.textContent;
  try{
    if(file&&navigator.share&&navigator.canShare?.({files:[file]})){
      await navigator.share({title:'ONE PIECE AI TRAINER 対戦ログ',text:'対戦結果と振り返りログです。',files:[file]});
      button.textContent='共有しました';
    }else{
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download=filename;link.style.display='none';
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),3000);
      button.textContent='保存しました';
    }
  }catch(error){
    if(error?.name==='AbortError')return;
    try{
      await navigator.clipboard.writeText(text);
      button.textContent='ログをコピーしました';
    }catch(_){
      button.textContent='保存できませんでした';
    }
  }finally{
    setTimeout(()=>{if(button.isConnected)button.textContent=original},2200);
  }
}

const previousBattleReview368=UI.prototype.showBattleReview349;
UI.prototype.showBattleReview349=function(g){
  const result=previousBattleReview368.call(this,g);
  const panel=this.modal?.querySelector?.('.battle-review-sheet')||document.querySelector('.battle-review-sheet');
  const foot=panel?.querySelector('.redirect-footer');
  if(!foot||foot.querySelector('[data-save-battle-report-368]'))return result;
  foot.style.display='grid';
  foot.style.gridTemplateColumns='1fr 1fr';
  foot.style.gap='10px';
  const save=document.createElement('button');
  save.type='button';
  save.className='primary';
  save.dataset.saveBattleReport368='true';
  save.textContent='対戦ログを保存・共有';
  save.style.gridColumn='1 / -1';
  save.style.minHeight='52px';
  save.addEventListener('click',()=>saveBattleReport368(g,save));
  foot.prepend(save);
  return result;
};
