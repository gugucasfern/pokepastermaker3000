export type JsonObject = Record<string, any>;
export type TeamDoc = JsonObject & { team: JsonObject[] };
const stats: Record<string,string> = { hp:'HP', atk:'Atk', def:'Def', spa:'SpA', spd:'SpD', spe:'Spe' };
const labels:Record<string,string> = {zenheadbutt:'Zen Headbutt',bodyslam:'Body Slam',rocktomb:'Rock Tomb',throatchop:'Throat Chop',foulplay:'Foul Play',shadowclaw:'Shadow Claw',swordsdance:'Swords Dance',closecombat:'Close Combat',populationbomb:'Population Bomb',followme:'Follow Me',superfang:'Super Fang',fakeout:'Fake Out',lastresort:'Last Resort',suckerpunch:'Sucker Punch',extremespeed:'Extreme Speed',bellydrum:'Belly Drum',psychocut:'Psycho Cut',toxic_orb:'Toxic Orb',focus_sash:'Focus Sash',rocky_helmet:'Rocky Helmet',mega_showdown_kangaskhanite:'Kangaskhanite',chople_berry:'Chople Berry',sitrus_berry:'Sitrus Berry',quickfeet:'Quick Feet',toxicboost:'Toxic Boost',friendguard:'Friend Guard'};
const labelKey=(v:string)=>v.toLowerCase().replace(/^.*:/,'').replace(/[^a-z0-9]/g,'');
const clean = (v: unknown) => {const raw=String(v??'').replace(/^.*:/,'');return labels[raw.toLowerCase()]??labels[labelKey(raw)]??raw.replace(/[_-]/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/\b\w/g,c=>c.toUpperCase());};
const id = (v: string) => {const raw=v.trim().replace(/^.*:/,'');const key=labelKey(raw);const match=Object.keys(labels).find(k=>labelKey(k)===key);return match??raw.toLowerCase().replace(/[^a-z0-9-]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');};
export function validateDocument(input: unknown): TeamDoc {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Array.isArray((input as any).team)) throw new Error('JSON não reconhecido: esperado um objeto de treinador com a propriedade team em formato de lista.');
  const doc=input as TeamDoc;
  doc.team.forEach((p,i)=>{ if(!p || typeof p!=='object' || Array.isArray(p)) throw new Error(`Entrada ${i+1} do time não é um objeto de Pokémon.`); if(typeof p.species!=='string'||!p.species.trim()) throw new Error(`Pokémon ${i+1} sem species.`); if(p.level!==undefined&&(!Number.isInteger(p.level)||p.level<1||p.level>100)) throw new Error(`Nível inválido no Pokémon ${i+1}.`); });
  return doc;
}
function statLine(label:string, data:any) { if(!data||typeof data!=='object') return ''; const bits=Object.entries(stats).filter(([k])=>data[k]!==undefined).map(([k,n])=>`${data[k]} ${n}`); return bits.length?`${label}: ${bits.join(' / ')}\n`:''; }
export function toShowdown(p:JsonObject):string {
  const species=clean(p.species); const nickname=p.nickname?`${clean(p.nickname)} (${species})`:species;
  const item=Array.isArray(p.heldItem)?p.heldItem[0]:p.heldItem;
  let out=nickname+(item?` @ ${clean(item)}`:'')+'\n';
  if(p.ability) out+=`Ability: ${clean(p.ability)}\n`; if(p.level!==undefined) out+=`Level: ${p.level}\n`; if(p.gender&&p.gender!=='GENDERLESS') out+=`${p.gender==='FEMALE'?'Female':'Male'}\n`; if(p.shiny) out+='Shiny: Yes\n'; if(p.nature) out+=`${clean(p.nature)} Nature\n`;
  out+=statLine('EVs',p.evs)+statLine('IVs',p.ivs); (Array.isArray(p.moveset)?p.moveset:[]).forEach((m:string)=>out+=`- ${clean(m)}\n`);
  return out.trimEnd();
}
export function teamToShowdown(doc:TeamDoc) { return doc.team.map(toShowdown).join('\n\n'); }
function parseSet(block:string, original:JsonObject={}) {
  const lines=block.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); if(!lines.length) throw new Error('Há um bloco vazio no texto Poképaste.');
  const head=lines[0]; const [left,...itemParts]=head.split('@'); const item=itemParts.join('@').trim(); let speciesText=left.trim(), nickname:string|undefined;
  const n=speciesText.match(/^(.*?)\s*\(([^()]+)\)$/); if(n){nickname=n[1].trim();speciesText=n[2].trim();}
  const p:JsonObject={...original,species:original.species??id(speciesText)}; if(nickname!==undefined)p.nickname=nickname; else if(original.nickname!==undefined) delete p.nickname;
  if(item){ const prev=Array.isArray(original.heldItem)?original.heldItem[0]:original.heldItem; const normalized=id(item); p.heldItem=prev&&id(prev)===normalized?original.heldItem:(Array.isArray(original.heldItem)?[normalized,...original.heldItem.slice(1)]:normalized); } else if(original.heldItem!==undefined) delete p.heldItem;
  let moves:string[]=[]; let evs:JsonObject={},ivs:JsonObject={};
  for(const line of lines.slice(1)) {
    if(line.startsWith('- ')){moves.push(id(line.slice(2)));continue;}
    let m=line.match(/^Ability:\s*(.+)$/i); if(m){p.ability=id(m[1]);continue;} m=line.match(/^Level:\s*(\d+)$/i); if(m){p.level=Number(m[1]);continue;}
    m=line.match(/^(Female|Male)$/i); if(m){p.gender=m[1].toUpperCase();continue;} m=line.match(/^Shiny:\s*(Yes|No)$/i); if(m){p.shiny=m[1].toLowerCase()==='yes';continue;}
    m=line.match(/^([A-Za-z]+) Nature$/i); if(m){p.nature=id(m[1]);continue;}
    m=line.match(/^(EVs|IVs):\s*(.+)$/i); if(m){const target=m[1].toLowerCase()==='evs'?evs:ivs; for(const entry of m[2].split('/')){const s=entry.trim().match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/i);if(s)target[Object.keys(stats).find(k=>stats[k].toLowerCase()===s[2].toLowerCase())!]=Number(s[1]);}continue;}
  }
  if(moves.length>4) throw new Error(`Mais de quatro golpes em ${speciesText}.`); p.moveset=moves;
  if(Object.keys(evs).length)p.evs={...original.evs,...evs}; if(Object.keys(ivs).length)p.ivs={...original.ivs,...ivs};
  return p;
}
export function fromShowdown(text:string, originals:JsonObject[]=[]):JsonObject[] { return text.trim()?text.trim().split(/\n\s*\n/).map((b,i)=>parseSet(b,originals[i]??{})):[]; }
export function applyTeam(original:TeamDoc, team:JsonObject[]):TeamDoc { return {...original,team}; }
export function validateTeam(team:JsonObject[]) { const errors:string[]=[]; team.forEach((p,i)=>{if(!p.species)errors.push(`Pokémon ${i+1}: espécie ausente.`); if(p.level!==undefined&&(!Number.isInteger(p.level)||p.level<1||p.level>100))errors.push(`Pokémon ${i+1}: nível deve ser de 1 a 100.`); for(const [kind,max] of [['evs',252],['ivs',31]] as const){const values=Object.values(p[kind]??{}).filter(v=>typeof v==='number') as number[];if(values.some(v=>v<0||v>max))errors.push(`Pokémon ${i+1}: ${kind.toUpperCase()} fora do limite (0–${max}).`);if(kind==='evs'&&values.reduce((a,b)=>a+b,0)>510)errors.push(`Pokémon ${i+1}: total de EVs acima de 510.`);} if((p.moveset??[]).length>4)errors.push(`Pokémon ${i+1}: mais de quatro golpes.`);});return errors; }
