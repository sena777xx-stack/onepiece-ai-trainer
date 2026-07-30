/* v360: prevent search-dialog taps from reaching the game controls behind it. */
const style360=document.createElement('style');
style360.textContent=`
.dialog{
  position:fixed!important;
  inset:0!important;
  z-index:2147483647!important;
  pointer-events:auto!important;
  isolation:isolate!important;
}
.dialog .redirect-flow,
.dialog .redirect-body,
.dialog .search3-grid,
.dialog .redirect-footer{
  position:relative!important;
  z-index:2!important;
  pointer-events:auto!important;
}
.dialog button{
  position:relative!important;
  z-index:3!important;
  pointer-events:auto!important;
  touch-action:manipulation!important;
}
`;
document.head.append(style360);
const shieldDialog360=node=>{
  const dialog=node.matches?.('.dialog')?node:node.querySelector?.('.dialog');
  if(!dialog||dialog.dataset.shield360)return;
  dialog.dataset.shield360='true';
  for(const type of ['pointerdown','pointerup','touchstart','touchend','click']){
    dialog.addEventListener(type,event=>event.stopPropagation(),false);
  }
};
new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)shieldDialog360(node);
}).observe(document.documentElement,{childList:true,subtree:true});
document.querySelectorAll('.dialog').forEach(shieldDialog360);
