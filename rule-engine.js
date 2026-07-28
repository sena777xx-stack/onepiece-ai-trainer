export const clone=v=>structuredClone(v);export const other=s=>s==='player'?'ai':'player';
export const shuffle=a=>{const x=[...a];for(let i=x.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
export const legalPlay=(g,s,c)=>g.activeSide===s&&g.phase==='main'&&c.cost<=g.sides[s].don.active&&['character','event'].includes(c.type);
export const legalAttack=(g,s,c)=>g.activeSide===s&&g.phase==='main'&&c.type!=='event'&&!c.rested&&!c.summoningSickness;
export const attackTargets=(g,s)=>{const f=g.sides[other(s)];return[{kind:'leader',uid:f.leader.uid,name:f.leader.name},...f.field.filter(c=>c.rested).map(c=>({kind:'character',uid:c.uid,name:c.name}))]};
export const counterOptions=(g,s)=>g.sides[s].hand.filter(c=>Number(c.counter)>0);export const blockers=(g,s)=>g.sides[s].field.filter(c=>!c.rested&&(c.keywords||[]).includes('blocker'));
export const winner=g=>{for(const s of['player','ai'])if(!g.sides[s].deck.length||g.sides[s].defeated)return other(s);return null};
