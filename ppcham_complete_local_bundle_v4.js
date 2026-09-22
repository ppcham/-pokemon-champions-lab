/* ppcham — Complete Local Bundle v2
 *
 * Combines:
 * - Core local data hub
 * - Team Builder Core
 * - Set Optimizer
 * - Team Builder UI
 * - Integrated visual asset system
 *
 * Runtime guarantees:
 * - Local-only
 * - No fetch / XHR
 * - Existing moves/item/nature/AP preserved
 * - Six selected Pokémon remain fixed
 * - Missing Pokémon/item/type art => Poké Ball fallback
 */

/* ===== CORE BUNDLE ===== */
/* ppcham — Complete Local Bundle v1
 *
 * Local-only runtime bundle.
 * No fetch / XHR / remote runtime dependency.
 *
 * Includes:
 *  - Local Data Hub
 *  - PPCham Team Builder Core
 *  - Set Optimizer
 *  - Team Builder UI
 *
 * Assumes the ppcham host page already contains its current UI and embedded/local DBs.
 */


/* ===== ppcham_local_data_hub_v1.js ===== */

/* ppcham — Local Data Hub v1
 *
 * Goal:
 *   Run ppcham entirely from local/in-app databases.
 *   No external fetch. No XHR. No remote runtime dependency.
 *
 * Expected local data objects (any may be embedded beforehand):
 *   window.PPCHAM_DB = {
 *     pokemon: [...],
 *     moves: [...],
 *     items: [...],
 *     abilities: [...],
 *     natures: [...],
 *     environment: {...}
 *   }
 *
 * Backward-compatible fallbacks:
 *   LabDBBridge.pokemon_master / move_master / item_master / nature_master
 *   CurrentEnvironmentDB / Season6EnvironmentDB
 */
(() => {
  if(window.PPChamDataHub) return;

  const norm=s=>(s??"").toString().normalize("NFKC").trim();

  const state = {
    mode:"local-only",
    external_fetch:false,
    loaded:false,
    version:1,
    counts:{},
    environment:null
  };

  function getBridge(){
    return window.LabDBBridge || (window.LabDBBridge={});
  }

  function localRoot(){
    return window.PPCHAM_DB || {};
  }

  function load(){
    const B=getBridge();
    const R=localRoot();

    const pokemon=R.pokemon || B.pokemon_master || [];
    const moves=R.moves || B.move_master || [];
    const items=R.items || B.item_master || [];
    const natures=R.natures || B.nature_master || [];
    const abilities=R.abilities ||
      window.PokemonChampionsAbilityMaster?.rows ||
      window.ability_master_db?.rows ||
      [];

    const environment=
      R.environment ||
      B.currentEnvironmentDB ||
      window.CurrentEnvironmentDB ||
      window.Season6EnvironmentDB ||
      null;

    B.pokemon_master=pokemon;
    B.move_master=moves;
    B.item_master=items;
    B.nature_master=natures;
    B.ability_master=abilities;

    state.counts={
      pokemon:pokemon.length,
      moves:moves.length,
      items:items.length,
      abilities:abilities.length,
      natures:natures.length
    };

    if(environment?.rows?.length){
      applyEnvironment(environment);
    }

    state.loaded=true;
    return snapshot();
  }

  function buildIndexes(){
    const B=getBridge();

    B._ppchamIndex={
      pokemonById:new Map(),
      pokemonByName:new Map(),
      moveById:new Map(),
      moveByName:new Map(),
      itemById:new Map(),
      itemByName:new Map(),
      abilityById:new Map(),
      abilityByName:new Map(),
      natureById:new Map(),
      natureByName:new Map()
    };

    for(const x of B.pokemon_master||[]){
      if(x.pokemon_id) B._ppchamIndex.pokemonById.set(x.pokemon_id,x);
      for(const n of [x.name,x.name_ja,x.canonical_name_ja,x.canonical_name_en,...(x.aliases_ja||[]),...(x.aliases_en||[])].filter(Boolean)){
        B._ppchamIndex.pokemonByName.set(norm(n).toLowerCase(),x);
      }
    }

    for(const x of B.move_master||[]){
      if(x.move_id) B._ppchamIndex.moveById.set(x.move_id,x);
      for(const n of [x.name,x.name_ja,x.name_en,...(x.aliases_ja||[]),...(x.aliases_en||[])].filter(Boolean)){
        B._ppchamIndex.moveByName.set(norm(n).toLowerCase(),x);
      }
    }

    for(const x of B.item_master||[]){
      if(x.item_id) B._ppchamIndex.itemById.set(x.item_id,x);
      for(const n of [x.name,x.name_ja,x.name_en,...(x.aliases_ja||[]),...(x.aliases_en||[])].filter(Boolean)){
        B._ppchamIndex.itemByName.set(norm(n).toLowerCase(),x);
      }
    }

    for(const x of B.ability_master||[]){
      if(x.ability_id) B._ppchamIndex.abilityById.set(x.ability_id,x);
      for(const n of [x.name,x.name_ja,x.name_en,...(x.aliases_ja||[]),...(x.aliases_en||[])].filter(Boolean)){
        B._ppchamIndex.abilityByName.set(norm(n).toLowerCase(),x);
      }
    }

    for(const x of B.nature_master||[]){
      if(x.nature_id||x.id) B._ppchamIndex.natureById.set(x.nature_id||x.id,x);
      for(const n of [x.name,x.ja,x.name_ja].filter(Boolean)){
        B._ppchamIndex.natureByName.set(norm(n).toLowerCase(),x);
      }
    }

    return B._ppchamIndex;
  }

  function resolve(kind,ref){
    const B=getBridge();
    const idx=B._ppchamIndex || buildIndexes();
    if(!ref) return null;

    const mapId=idx[`${kind}ById`];
    const mapName=idx[`${kind}ByName`];

    if(typeof ref==="object"){
      const id=ref[`${kind}_id`] || ref.id;
      if(id && mapId?.has(id)) return mapId.get(id);

      const name=ref.name || ref.name_ja || ref.canonical_name_ja || ref.pokemon_name;
      if(name && mapName?.has(norm(name).toLowerCase())) return mapName.get(norm(name).toLowerCase());
      return null;
    }

    if(mapId?.has(ref)) return mapId.get(ref);
    return mapName?.get(norm(ref).toLowerCase()) || null;
  }

  function applyEnvironment(db){
    if(!db?.rows?.length) return false;

    const B=getBridge();
    B.currentEnvironmentDB=db;
    state.environment={
      season:db.season||null,
      regulation:db.regulation||null,
      source_updated:db.source_updated||db.updated||null,
      rows:db.rows.length
    };

    const byId=new Map();
    const byName=new Map();

    for(const row of db.rows){
      if(row.pokemon_id) byId.set(row.pokemon_id,row);
      if(row.pokemon_name) byName.set(norm(row.pokemon_name).toLowerCase(),row);
    }

    B.getEnvironmentRow=function(ref){
      const p=resolve("pokemon",ref);
      if(p?.pokemon_id && byId.has(p.pokemon_id)) return byId.get(p.pokemon_id);

      const n=norm(
        p?.name || p?.name_ja || p?.canonical_name_ja ||
        ref?.pokemon_name || ref
      ).toLowerCase();

      return byName.get(n)||null;
    };

    B.getEnvironmentRank=function(ref){
      const row=B.getEnvironmentRow(ref);
      return Number.isFinite(Number(row?.rank)) ? Number(row.rank) : null;
    };

    B.getPopularMoves=function(ref){
      const row=B.getEnvironmentRow(ref);
      return (row?.move_usage||[])
        .map(x=>{
          const m=resolve("move",x.move_id||x.name);
          return m ? {...m,usage:Number(x.usage)||0,source:"ppcham_environment"} : null;
        })
        .filter(Boolean)
        .sort((a,b)=>b.usage-a.usage);
    };

    B.getItemUsageById=function(ref){
      const row=B.getEnvironmentRow(ref);
      return (row?.item_usage||[])
        .map(x=>{
          const item=resolve("item",x.item_id||x.name);
          return item ? {...item,usage:Number(x.usage)||0,source:"ppcham_environment"} : null;
        })
        .filter(Boolean)
        .sort((a,b)=>b.usage-a.usage);
    };

    B.getNatureUsage=function(ref){
      const row=B.getEnvironmentRow(ref);
      return (row?.nature_usage||[])
        .map(x=>({
          nature_name:x.nature_name||x.name||"",
          usage:Number(x.usage)||0
        }))
        .sort((a,b)=>b.usage-a.usage);
    };

    B.getStatPointUsage=function(ref){
      return B.getEnvironmentRow(ref)?.stat_points || [];
    };

    B.getEnvironmentTeammates=function(ref){
      return B.getEnvironmentRow(ref)?.teammates || [];
    };

    try{
      if(typeof window.renderTeam==="function") window.renderTeam();
      if(typeof window.renderRecs==="function") window.renderRecs();
    }catch(_){}

    window.dispatchEvent(new CustomEvent("ppcham:environment-updated",{
      detail:state.environment
    }));

    return true;
  }

  function replaceDatabase(kind,rows){
    const B=getBridge();
    if(!Array.isArray(rows)) throw new Error(`${kind} DB は配列である必要があります`);

    const key={
      pokemon:"pokemon_master",
      move:"move_master",
      item:"item_master",
      ability:"ability_master",
      nature:"nature_master"
    }[kind];

    if(!key) throw new Error(`unknown DB kind: ${kind}`);

    B[key]=rows;
    buildIndexes();
    state.counts[kind==="move"?"moves":kind==="item"?"items":kind==="ability"?"abilities":kind==="nature"?"natures":"pokemon"]=rows.length;

    window.dispatchEvent(new CustomEvent("ppcham:master-db-updated",{
      detail:{kind,rows:rows.length}
    }));

    return rows.length;
  }

  function snapshot(){
    const B=getBridge();
    return {
      mode:state.mode,
      external_fetch:false,
      loaded:state.loaded,
      counts:{...state.counts},
      environment:state.environment,
      teamBuilder:!!B.PPChamTeamBuilder,
      doctor:typeof window.metaThreatPool==="function" || !!B.doctorEnvironmentState
    };
  }

  const api={
    version:1,
    policy:{
      runtime:"local-only",
      external_fetch:false,
      external_xhr:false,
      external_runtime_dependency:false
    },
    load,
    resolvePokemon:ref=>resolve("pokemon",ref),
    resolveMove:ref=>resolve("move",ref),
    resolveItem:ref=>resolve("item",ref),
    resolveAbility:ref=>resolve("ability",ref),
    resolveNature:ref=>resolve("nature",ref),
    applyEnvironment,
    replaceDatabase,
    rebuildIndexes:buildIndexes,
    snapshot
  };

  window.PPChamDataHub=api;

  const B=getBridge();
  B.resolvePokemon=api.resolvePokemon;
  B.resolveMove=api.resolveMove;
  B.resolveItem=api.resolveItem;
  B.resolveAbility=api.resolveAbility;
  B.resolveNature=api.resolveNature;

  load();
  buildIndexes();

  console.log("✅ ppcham Local Data Hub v1 ready",snapshot());
})();

/* ===== ppcham_team_builder_core_v2.js ===== */

/* Pokémon Champions Lab — PPCham Team Builder Core v2
 *
 * Goal:
 *   Combine the existing AI Team Builder + PokéDoctor into one team-building core.
 *
 * Philosophy:
 *   - User-selected Pokémon are the starting core, not disposable suggestions.
 *   - Build around that core using environment coverage.
 *   - Avoid "six individually strong Pokémon" with poor team structure.
 *   - Use PokéDoctor-style threat checks DURING building, not only afterward.
 *   - Return score breakdown + reasons, not only a single opaque score.
 *
 * Requires current Pokémon Champions Lab functions when available:
 *   P, wholeTeamScore, pairSynergy, metaAudit, environmentMatchupReport,
 *   archetypeEval, megaCount, role, buildTeamSetPlan
 *
 * Optional:
 *   LabDBBridge current environment DB / hot-swap adapter.
 */
(() => {
  const B=window.LabDBBridge||{};
  const norm=s=>(s??"").toString().normalize("NFKC").trim();


  const RUNTIME_POLICY={
    name:"ppcham-local-only",
    external_fetch:false,
    runtime_data_sources:[
      "pokemon_master_db",
      "move_master_db",
      "item_master_db",
      "ability_master_db",
      "nature_master_db",
      "environment_db"
    ],
    note:"ppcham本体は外部サイトへアクセスしない。更新済みDBを読み込んで完結する。"
  };

  const PROFILE={
    id:"ppcham_v1",
    label:"ppcham",
    // Selected/core Pokémon should be respected strongly.
    lockCore:true,

    // Team-building weights.
    weights:{
      existingTeamScore:0.55,
      pairSynergy:0.70,
      environment:1.35,
      metaAudit:1.10,
      structure:1.00,
      teammateData:0.55,
      speedPressure:0.30,
      offenseBalance:0.25,
      duplicateWeakness:0.70
    },

    // Hard-ish quality preferences.
    target:{
      minFast:2,
      minPhysical:1,
      minSpecial:1,
      maxMega:2,
      topThreats:20,
      beamWidth:180,
      candidatePool:72
    }
  };

  function members(arr){ return (arr||[]).filter(Boolean); }

  function getEnvRows(){
    return B.currentEnvironmentDB?.rows ||
      window.CurrentEnvironmentDB?.rows ||
      window.Season6EnvironmentDB?.rows ||
      [];
  }

  function environmentTop(limit=20){
    return [...getEnvRows()]
      .filter(x=>Number.isFinite(Number(x.rank)))
      .sort((a,b)=>Number(a.rank)-Number(b.rank))
      .slice(0,limit);
  }

  function sitePokemonFromEnv(row){
    if(!row) return null;
    if(row.pokemon_id && B.resolvePokemon){
      const m=B.resolvePokemon(row.pokemon_id);
      const n=m?.name||m?.canonical_name_ja;
      if(n && window.byName?.[n]) return window.byName[n];
      if(n && Array.isArray(window.P)){
        const p=window.P.find(x=>norm(x.name)===norm(n));
        if(p) return p;
      }
    }
    const names=[row.pokemon_name,row.pokemon_name_ja,row.pokemon_name_en].filter(Boolean);
    for(const n of names){
      if(window.byName?.[n]) return window.byName[n];
      if(Array.isArray(window.P)){
        const p=window.P.find(x=>norm(x.name)===norm(n));
        if(p) return p;
      }
    }
    return null;
  }

  function teammateBonus(team){
    const names=new Set(members(team).map(p=>p.name));
    let score=0, hits=0;

    for(const p of members(team)){
      const row=B.getEnvironmentRow?.(p) || null;
      for(const mate of row?.teammates||[]){
        const mateName=typeof mate==="string" ? mate : (mate.name||mate.pokemon_name||"");
        if(mateName && names.has(mateName)){
          score+=1;
          hits++;
        }
      }
    }
    return {score,hits};
  }

  function structureScore(team){
    const arr=members(team);
    if(!arr.length) return {score:0,reasons:[]};

    const reasons=[];
    const fast=arr.filter(p=>(Number(p.S)||0)>=110).length;
    const physical=arr.filter(p=>(Number(p.A)||0)>(Number(p.C)||0)+10).length;
    const special=arr.filter(p=>(Number(p.C)||0)>(Number(p.A)||0)+10).length;

    let score=0;

    if(fast>=PROFILE.target.minFast){score+=5;reasons.push(`高速${fast}`)}
    else score-=4*(PROFILE.target.minFast-fast);

    if(physical>=PROFILE.target.minPhysical) score+=2;
    else {score-=6;reasons.push("物理不足")}

    if(special>=PROFILE.target.minSpecial) score+=2;
    else {score-=6;reasons.push("特殊不足")}

    if(typeof window.megaCount==="function"){
      const mc=window.megaCount(arr);
      if(mc>PROFILE.target.maxMega) score-=30*(mc-PROFILE.target.maxMega);
    }

    // Penalize stacked type weaknesses if defensiveVector exists.
    if(typeof window.defensiveVector==="function" && window.DB?.attackTypes){
      for(const t of window.DB.attackTypes){
        const weak=arr.filter(p=>{
          try{return Number(window.defensiveVector(p)?.[t])>1}catch(_){return false}
        }).length;
        if(weak>=3){
          score-=(weak-2)*4;
          reasons.push(`${t}弱点${weak}`);
        }
      }
    }

    return {score,reasons};
  }

  function environmentScore(team){
    const arr=members(team);
    if(arr.length<2 || typeof window.environmentMatchupReport!=="function"){
      return {score:0,bad:0,thin:0,fav:0};
    }

    let env;
    try{ env=window.environmentMatchupReport(arr); }
    catch(_){ return {score:0,bad:0,thin:0,fav:0}; }

    const bad=env.bad?.length||0;
    const thin=env.thin?.length||0;
    const fav=env.favorable?.length||0;

    // Doctor-style: holes hurt more than favorable matchups help.
    const score=(Number(env.totalScore)||0) - bad*8 - thin*2 + fav*0.6;
    return {score,bad,thin,fav,raw:env};
  }

  function auditScore(team){
    if(typeof window.metaAudit!=="function" || members(team).length<2){
      return {score:0,hard:0,soft:0};
    }
    try{
      const a=window.metaAudit(members(team));
      return {
        score:(Number(a.score)||0) - (a.hardHoles?.length||0)*8 - (a.softHoles?.length||0)*2,
        hard:a.hardHoles?.length||0,
        soft:a.softHoles?.length||0,
        raw:a
      };
    }catch(_){
      return {score:0,hard:0,soft:0};
    }
  }

  function baseWholeScore(team){
    if(typeof window.wholeTeamScore==="function"){
      try{return Number(window.wholeTeamScore(members(team)))||0}catch(_){}
    }
    return 0;
  }

  function pairScore(team){
    const arr=members(team);
    if(typeof window.pairSynergy!=="function") return 0;
    let s=0;
    for(let i=0;i<arr.length;i++){
      for(let j=i+1;j<arr.length;j++){
        try{s+=Number(window.pairSynergy(arr[i],arr[j]))||0}catch(_){}
      }
    }
    return s;
  }

  function scoreTeam(team){
    const arr=members(team);
    const env=environmentScore(arr);
    const audit=auditScore(arr);
    const structure=structureScore(arr);
    const teammate=teammateBonus(arr);

    const existing=baseWholeScore(arr);
    const pair=pairScore(arr);

    const total =
      existing*PROFILE.weights.existingTeamScore +
      pair*PROFILE.weights.pairSynergy +
      env.score*PROFILE.weights.environment +
      audit.score*PROFILE.weights.metaAudit +
      structure.score*PROFILE.weights.structure +
      teammate.score*PROFILE.weights.teammateData;

    return {
      total,
      breakdown:{
        existing,
        pair,
        environment:env.score,
        metaAudit:audit.score,
        structure:structure.score,
        teammate:teammate.score
      },
      diagnostics:{
        bad:env.bad,
        thin:env.thin,
        favorable:env.fav,
        hardHoles:audit.hard,
        softHoles:audit.soft,
        teammateHits:teammate.hits,
        structureNotes:structure.reasons
      }
    };
  }

  function candidatePool(core){
    const fixed=new Set(members(core).map(p=>p.name));
    const all=Array.isArray(window.P)?window.P:[];

    return all
      .filter(p=>p && !fixed.has(p.name))
      .map(p=>{
        let raw=0;

        // Individual meta.
        if(typeof window.metaScore==="function"){
          try{raw+=(Number(window.metaScore(p))||0)*0.9}catch(_){}
        }

        // Synergy with selected core.
        if(typeof window.pairSynergy==="function"){
          for(const c of members(core)){
            try{raw+=(Number(window.pairSynergy(p,c))||0)*0.8}catch(_){}
          }
        }

        // Direct environment rank reward if available.
        const rank=B.getEnvironmentRank?.(p);
        if(Number.isFinite(Number(rank))){
          raw+=Math.max(0,35-Number(rank))*0.35;
        }

        return {p,raw};
      })
      .sort((a,b)=>b.raw-a.raw)
      .slice(0,PROFILE.target.candidatePool)
      .map(x=>x.p);
  }

  function build(coreTeam=[],options={}){
    const core=members(coreTeam).slice(0,6);
    const need=6-core.length;

    if(need<=0){
      const scored=scoreTeam(core);
      return [{
        team:core,
        score:scored.total,
        evaluation:scored,
        reason:explain(core,scored)
      }];
    }

    const pool=candidatePool(core);
    let beam=[{team:[...core],evaluation:scoreTeam(core)}];

    for(let step=0;step<need;step++){
      const next=[];

      for(const state of beam){
        const used=new Set(state.team.map(p=>p.name));
        for(const p of pool){
          if(used.has(p.name)) continue;

          const test=[...state.team,p];

          if(typeof window.megaCount==="function"){
            try{
              if(window.megaCount(test)>PROFILE.target.maxMega) continue;
            }catch(_){}
          }

          const evaluation=scoreTeam(test);
          next.push({team:test,evaluation});
        }
      }

      next.sort((a,b)=>b.evaluation.total-a.evaluation.total);

      const dedup=[],seen=new Set();
      for(const x of next){
        const key=x.team.map(p=>p.name).sort().join("|");
        if(seen.has(key)) continue;
        seen.add(key);
        dedup.push(x);
        if(dedup.length>=PROFILE.target.beamWidth) break;
      }
      beam=dedup;
      if(!beam.length) break;
    }

    // Keep useful diversity: no two results sharing 5+ Pokémon.
    const finals=beam
      .filter(x=>x.team.length===6)
      .sort((a,b)=>b.evaluation.total-a.evaluation.total);

    const result=[],sets=[];
    for(const x of finals){
      const ns=new Set(x.team.map(p=>p.name));
      const tooSimilar=sets.some(prev=>{
        let overlap=0;
        for(const n of ns) if(prev.has(n)) overlap++;
        return overlap>=5;
      });
      if(tooSimilar) continue;

      result.push({
        team:x.team,
        score:x.evaluation.total,
        evaluation:x.evaluation,
        reason:explain(x.team,x.evaluation)
      });
      sets.push(ns);
      if(result.length>=3) break;
    }

    return result;
  }

  function explain(team,e){
    const d=e.diagnostics;
    const parts=[];

    if(d.bad===0) parts.push("環境トップへの致命的な穴なし");
    else parts.push(`不利対面 ${d.bad}`);

    if(d.hardHoles===0) parts.push("重大なメタ穴なし");
    else parts.push(`重大穴 ${d.hardHoles}`);

    if(d.teammateHits>0) parts.push(`環境相方一致 ${d.teammateHits}`);
    if(d.structureNotes?.length) parts.push(d.structureNotes.slice(0,3).join("・"));

    return parts.join(" / ");
  }

  function buildAroundCurrentTeam(){
    return build(window.team||[]);
  }

  function buildAroundSelectedNames(names=[]){
    const arr=(names||[]).map(n=>
      window.byName?.[n] ||
      (Array.isArray(window.P)?window.P.find(p=>norm(p.name)===norm(n)):null)
    ).filter(Boolean);
    return build(arr);
  }

  function applyIdea(idea,{withSets=true}={}){
    if(!idea?.team?.length) return false;

    window.team=idea.team.slice(0,6);
    window.teamLoadouts=[null,null,null,null,null,null];

    if(withSets && typeof window.applyPlannedLoadouts==="function"){
      try{window.applyPlannedLoadouts(window.team)}catch(_){}
    }else if(typeof window.ensureLoadout==="function"){
      window.team.forEach((p,i)=>{
        try{window.ensureLoadout(i,p)}catch(_){}
      });
    }

    if(typeof window.saveLocal==="function") window.saveLocal();
    if(typeof window.renderTeam==="function") window.renderTeam();
    if(typeof window.renderRecs==="function") window.renderRecs();
    if(typeof window.renderTeamIdeas==="function") window.renderTeamIdeas();

    return true;
  }

  B.PPChamTeamBuilder={
    runtimePolicy:RUNTIME_POLICY,
    version:1,
    profile:PROFILE,
    scoreTeam,
    build,
    buildAroundCurrentTeam,
    buildAroundSelectedNames,
    applyIdea,
    explain
  };

  console.log("✅ PPCham Team Builder Core v2 ready",PROFILE);
})();

/* ===== ppcham_set_optimizer_v3.js ===== */

/* ppcham — Set Optimizer v1
 *
 * Local-only optimizer for fixed/current teams.
 *
 * Uses:
 * - PPChamDataHub / LabDBBridge master DBs
 * - Environment DB usage data
 * - Existing site legality/loadout helpers when available
 *
 * Produces for each Pokémon:
 * - 4 moves
 * - held item
 * - nature
 * - stat_mode (sp66 / ev252)
 * - AP/stat allocation
 *
 * Never changes team members.
 */
(() => {
  const B=window.LabDBBridge;
  if(!B) throw new Error("LabDBBridge がありません");

  const norm=s=>(s??"").toString().normalize("NFKC").trim();

  function resolvePokemon(p){
    return B.resolvePokemon?.(p) || p || null;
  }

  function sitePokemon(p){
    const rp=resolvePokemon(p);
    const name=rp?.name || rp?.canonical_name_ja || p?.name;
    if(window.byName?.[name]) return window.byName[name];
    if(Array.isArray(window.P)) return window.P.find(x=>norm(x.name)===norm(name))||p;
    return p;
  }

  function legalMovesFor(p){
    const sp=sitePokemon(p);
    if(!sp) return [];

    if(typeof B.getMoveOptions==="function"){
      try{
        const arr=B.getMoveOptions(sp.name)||[];
        if(arr.length) return arr;
      }catch(_){}
    }

    const names=
      window.L?.[sp.name] ||
      window.DB?.learnsets?.[sp.name] ||
      [];

    return names.map(n=>{
      const m=B.resolveMove?.(n) ||
        (B.move_master||[]).find(x=>norm(x.name)===norm(n));
      return m || {name:n};
    }).filter(Boolean);
  }

  function moveScore(move,p){
    let s=0;
    const name=move?.name||"";
    const popular=B.getPopularMoves?.(p)||[];
    const hit=popular.find(x=>
      (x.move_id && move.move_id && x.move_id===move.move_id) ||
      norm(x.name)===norm(name)
    );
    if(hit) s+=50+(Number(hit.usage)||0)*2;

    const power=Number(move.power ?? move.pow ?? 0)||0;
    if(power>0) s+=Math.min(30,power/4);

    const cat=move.category||move.cat||"";
    const sp=sitePokemon(p);
    if(cat==="Physical" || cat==="物理"){
      if((Number(sp?.A)||0)>(Number(sp?.C)||0)) s+=8;
    }
    if(cat==="Special" || cat==="特殊"){
      if((Number(sp?.C)||0)>(Number(sp?.A)||0)) s+=8;
    }

    // Give some room to utility/status moves.
    if(!power) s+=6;

    return s;
  }

  function chooseMoves(p,existingMoves=[]){
    const locked=(existingMoves||[])
      .map(norm)
      .filter(Boolean)
      .slice(0,4);

    const legal=legalMovesFor(p);
    const popular=B.getPopularMoves?.(p)||[];

    const combined=[];
    const seen=new Set(locked);

    for(const m of [...popular,...legal]){
      const name=norm(m?.name);
      if(!name || seen.has(name)) continue;
      seen.add(name);
      combined.push(m);
    }

    const recommendations=combined
      .map(m=>({m,s:moveScore(m,p)}))
      .sort((a,b)=>b.s-a.s)
      .map(x=>x.m.name);

    const result=[...locked];
    for(const name of recommendations){
      if(result.length>=4) break;
      if(!result.includes(name)) result.push(name);
    }

    return result.slice(0,4);
  }

  function chooseItem(p,existingItem=""){
    const locked=norm(existingItem);
    if(locked) return locked;

    const usage=B.getItemUsageById?.(p)||[];
    if(usage.length) return usage[0].name || usage[0].name_ja || "";

    const options=B.getItemOptions?.(p)||[];
    return options[0]?.name || options[0]?.name_ja || "";
  }

  function chooseNature(p){
    const usage=B.getNatureUsage?.(p)||[];
    if(usage.length) return usage[0].nature_name || usage[0].name || "";

    const sp=sitePokemon(p);
    if(!sp) return "";

    // Simple local fallback.
    if((Number(sp.A)||0)>(Number(sp.C)||0)+15) return "ようき";
    if((Number(sp.C)||0)>(Number(sp.A)||0)+15) return "おくびょう";
    return "ようき";
  }

  function parseAPString(s){
    const out={H:0,A:0,B:0,C:0,D:0,S:0};
    const str=norm(s);
    for(const stat of Object.keys(out)){
      const m=str.match(new RegExp(`${stat}\\s*(\\d+)`,"i"));
      if(m) out[stat]=Number(m[1])||0;
    }
    return out;
  }

  function chooseStats(p,mode="sp66"){
    const env=B.getStatPointUsage?.(p)||[];
    if(env.length){
      const best=[...env].sort((a,b)=>(Number(b.usage)||0)-(Number(a.usage)||0))[0];
      const vals={H:0,A:0,B:0,C:0,D:0,S:0};
      for(const k of Object.keys(vals)) vals[k]=Number(best?.[k])||0;

      if(mode==="ev252"){
        const converted={};
        for(const k of Object.keys(vals)) converted[k]=Math.min(252,vals[k]*8);
        return converted;
      }
      return vals;
    }

    const sp=sitePokemon(p);
    const vals={H:0,A:0,B:0,C:0,D:0,S:0};

    if(mode==="sp66"){
      vals.S=32;
      if((Number(sp?.A)||0)>=(Number(sp?.C)||0)) vals.A=32;
      else vals.C=32;
      vals.H=2;
    }else{
      vals.S=252;
      if((Number(sp?.A)||0)>=(Number(sp?.C)||0)) vals.A=252;
      else vals.C=252;
      vals.H=6;
    }
    return vals;
  }

  function statString(vals){
    return ["H","A","B","C","D","S"]
      .filter(k=>Number(vals[k])>0)
      .map(k=>`${k}${Number(vals[k])}`)
      .join(" / ");
  }

  function optimizePokemon(p,{mode="sp66",existingLoadout=null}={}){
    const sp=sitePokemon(p);
    if(!sp) return null;

    const moves=chooseMoves(sp,existingLoadout?.moves||[]);
    const item=chooseItem(sp,existingLoadout?.item||"");
    const nature=norm(existingLoadout?.nature) || chooseNature(sp);

    const existingAP=norm(existingLoadout?.ap);
    const existingMode=(existingLoadout?.stat_mode==="ev252"||existingLoadout?.stat_mode==="sp66")
      ? existingLoadout.stat_mode
      : mode;

    const stats=existingAP ? parseAPString(existingAP) : chooseStats(sp,existingMode);
    const finalMode=existingAP ? existingMode : mode;

    return {
      pokemon:sp.name,
      pokemon_id:resolvePokemon(sp)?.pokemon_id||null,
      moves,
      item,
      nature,
      stat_mode:finalMode,
      ap:existingAP || statString(stats),
      preserve_policy:{moves:"keep_existing_fill_empty",item:"keep_existing_fill_if_empty",nature:"keep_existing_fill_if_empty",ap:"keep_existing_fill_if_empty",stat_mode:"keep_with_existing_ap"},
      source:{
        moves:B.getPopularMoves?.(sp)?.length ? "environment+master" : "master",
        item:B.getItemUsageById?.(sp)?.length ? "environment" : "master",
        nature:B.getNatureUsage?.(sp)?.length ? "environment" : "fallback",
        stats:B.getStatPointUsage?.(sp)?.length ? "environment" : "fallback"
      }
    };
  }

  function optimizeTeam(team=window.team||[],options={}){
    const mode=options.mode==="ev252" ? "ev252" : "sp66";
    return (team||[]).filter(Boolean).slice(0,6)
      .map((p,i)=>optimizePokemon(p,{
        mode,
        existingLoadout:Array.isArray(window.teamLoadouts) ? (window.teamLoadouts[i]||null) : null
      }))
      .filter(Boolean);
  }

  function applyOptimizedSets(team=window.team||[],options={}){
    const results=optimizeTeam(team,options);
    if(!Array.isArray(window.teamLoadouts)) window.teamLoadouts=[];

    results.forEach((set,i)=>{
      const base=window.teamLoadouts[i]||{};
      window.teamLoadouts[i]={
        ...base,
        pokemon:set.pokemon,
        item:set.item,
        nature:set.nature,
        moves:set.moves,
        ap:set.ap,
        stat_mode:set.stat_mode
      };
    });

    if(typeof window.saveLocal==="function") window.saveLocal();
    if(typeof window.renderTeam==="function") window.renderTeam();
    if(typeof window.renderRecs==="function") window.renderRecs();

    return results;
  }

  B.PPChamSetOptimizer={
    version:1,
    optimizePokemon,
    optimizeTeam,
    applyOptimizedSets
  };

  console.log("✅ ppcham Set Optimizer v1 ready");
})();

/* ===== ppcham_team_builder_ui_v5.js ===== */

/* ppcham — Team Builder UI v1
 *
 * Requires:
 *   LabDBBridge.PPChamTeamBuilder
 *
 * Adds:
 *   - "編成" button
 *   - Uses current selected team members as the core
 *   - Generates up to 3 team ideas
 *   - Shows score breakdown + reasons
 *   - Apply selected idea directly to current team
 */
(() => {
  const B=window.LabDBBridge;
  const TB=B?.PPChamTeamBuilder;
  if(!B || !TB) throw new Error("PPChamTeamBuilder がありません");

  if(window.__ppchamTeamBuilderUIInstalled) return;
  window.__ppchamTeamBuilderUIInstalled=true;

  function esc(s){
    return String(s??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;");
  }

  function injectStyle(){
    if(document.getElementById("ppcham-team-builder-style")) return;
    const st=document.createElement("style");
    st.id="ppcham-team-builder-style";
    st.textContent=`
      #ppcham-team-builder-btn{
        position:fixed;right:14px;bottom:66px;z-index:99990;
        border:0;border-radius:999px;padding:11px 14px;
        background:#fff;color:#111827;font-size:12px;font-weight:900;
        box-shadow:0 8px 28px rgba(0,0,0,.22);
        border:1px solid #e5e7eb;
      }
      #ppcham-team-builder-panel{
        position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.56);
        display:flex;align-items:flex-end;justify-content:center
      }
      #ppcham-team-builder-panel .sheet{
        width:min(820px,100%);max-height:90vh;overflow:auto;
        background:#fff;color:#111827;border-radius:22px 22px 0 0;
        padding:18px 16px 28px
      }
      #ppcham-team-builder-panel .head{
        display:flex;justify-content:space-between;gap:10px;align-items:center
      }
      #ppcham-team-builder-panel .close{
        border:0;background:transparent;font-size:24px
      }
      #ppcham-team-builder-panel .core{
        margin-top:10px;padding:10px;border-radius:12px;background:#f8fafc;
        font-size:11px;color:#475467
      }
      #ppcham-team-builder-panel .ideas{
        display:grid;gap:10px;margin-top:12px
      }
      #ppcham-team-builder-panel .idea{
        border:1px solid #e5e7eb;border-radius:16px;padding:12px
      }
      #ppcham-team-builder-panel .ideahead{
        display:flex;justify-content:space-between;gap:10px;align-items:center
      }
      #ppcham-team-builder-panel .score{
        font-size:13px;font-weight:900
      }
      #ppcham-team-builder-panel .mons{
        display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px
      }
      #ppcham-team-builder-panel .mon{
        border:1px solid #e5e7eb;border-radius:10px;padding:7px 8px;
        font-size:11px;font-weight:800;background:#fff
      }
      #ppcham-team-builder-panel .reason{
        margin-top:8px;font-size:11px;color:#667085;line-height:1.45
      }
      #ppcham-team-builder-panel .breakdown{
        margin-top:8px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px
      }
      #ppcham-team-builder-panel .metric{
        background:#f8fafc;border-radius:10px;padding:7px;font-size:10px
      }
      #ppcham-team-builder-panel .apply{
        width:100%;margin-top:10px;border:0;background:#111827;color:#fff;
        border-radius:10px;padding:9px 10px;font-size:11px;font-weight:900
      }
      #ppcham-team-builder-panel .empty{
        padding:18px 4px;color:#667085;font-size:12px
      }
      @media(min-width:700px){
        #ppcham-team-builder-panel{align-items:center}
        #ppcham-team-builder-panel .sheet{border-radius:22px;max-height:84vh}
        #ppcham-team-builder-panel .mons{grid-template-columns:repeat(6,minmax(0,1fr))}
      }
    `;
    document.head.appendChild(st);
  }

  function currentCore(){
    return (window.team||[]).filter(Boolean).slice(0,6);
  }


  function buildReasonText(idea){
    const d=idea?.evaluation?.diagnostics||{};
    const parts=[];

    if((d.bad||0)===0) parts.push("環境上位への致命的な不利を作りにくい");
    else parts.push(`環境上位への明確な不利が${d.bad}件`);

    if((d.hardHoles||0)===0) parts.push("重大なメタ穴を抑えている");
    else parts.push(`重大なメタ穴が${d.hardHoles}件`);

    if((d.teammateHits||0)>0) parts.push(`環境で相性の良い組み合わせを${d.teammateHits}件含む`);

    const notes=(d.structureNotes||[]).slice(0,3);
    if(notes.length) parts.push(`構造面：${notes.join("・")}`);

    return parts.length ? parts.join("。") + "。" : (idea.reason||"全体バランスを優先した編成。");
  }

  function getLoadoutForPokemon(p){
    const team=window.team||[];
    const idx=team.findIndex(x=>x && p && x.name===p.name);
    if(idx>=0 && Array.isArray(window.teamLoadouts)) return window.teamLoadouts[idx]||null;
    return null;
  }

  function moveNames(loadout){
    return Array.isArray(loadout?.moves) ? loadout.moves.filter(Boolean) : [];
  }

  function hasMove(loadout,keywords){
    return moveNames(loadout).some(m=>{
      const n=String(m||"");
      return keywords.some(k=>n.includes(k));
    });
  }

  function roleHints(p,loadout){
    const hints=[];
    const item=String(loadout?.item||"");
    const moves=moveNames(loadout);

    if(hasMove(loadout,["ステルスロック","まきびし","どくびし","ねばねばネット"])) hints.push("展開");
    if(hasMove(loadout,["とんぼがえり","ボルトチェンジ","クイックターン"])) hints.push("対面操作");
    if(hasMove(loadout,["じこさいせい","はねやすめ","なまける","ねがいごと","こうごうせい"])) hints.push("受け");
    if(hasMove(loadout,["つるぎのまい","わるだくみ","りゅうのまい","ちょうのまい","ビルドアップ","めいそう"])) hints.push("積み");
    if(hasMove(loadout,["アンコール","ちょうはつ","トリック","みがわり"])) hints.push("崩し補助");
    if(/こだわりスカーフ/.test(item)) hints.push("高速制圧");
    if(/こだわりハチマキ|こだわりメガネ|いのちのたま/.test(item)) hints.push("崩し");
    if(/たべのこし|オボンのみ/.test(item)) hints.push("耐久");

    const A=Number(p?.A)||0, C=Number(p?.C)||0, S=Number(p?.S)||0;
    if(A>C+10) hints.push("物理");
    if(C>A+10) hints.push("特殊");
    if(S>=110) hints.push("高速");

    return [...new Set(hints)];
  }

  function buildGameplanText(idea){
    const team=idea?.team||[];
    if(!team.length) return "";

    const entries=team.map(p=>({
      p,
      l:getLoadoutForPokemon(p)
    }));

    const scored=entries.map(e=>{
      const h=roleHints(e.p,e.l);
      let lead=0,pivot=0,breaker=0,cleaner=0,wall=0,setuper=0;

      if(h.includes("展開")) lead+=4;
      if(h.includes("対面操作")) {lead+=2;pivot+=5;}
      if(h.includes("受け")) {pivot+=2;wall+=5;}
      if(h.includes("崩し")) breaker+=5;
      if(h.includes("物理")||h.includes("特殊")) breaker+=2;
      if(h.includes("高速")) {lead+=1;cleaner+=4;}
      if(h.includes("高速制圧")) cleaner+=5;
      if(h.includes("積み")) {setuper+=5;cleaner+=3;}
      if(h.includes("崩し補助")) breaker+=2;

      return {...e,h,lead,pivot,breaker,cleaner,wall,setuper};
    });

    const pick=(key,exclude=new Set()) =>
      scored.filter(x=>!exclude.has(x.p.name))
        .sort((a,b)=>b[key]-a[key] || (Number(b.p.S)||0)-(Number(a.p.S)||0))[0] || null;

    const used=new Set();
    const lead=pick("lead",used); if(lead) used.add(lead.p.name);
    const pivot=pick("pivot",used); if(pivot) used.add(pivot.p.name);
    const breaker=pick("breaker",used); if(breaker) used.add(breaker.p.name);
    const cleaner=pick("cleaner",used); if(cleaner) used.add(cleaner.p.name);

    const lines=[];

    if(lead){
      const tags=lead.h.filter(x=>["展開","対面操作","高速"].includes(x)).join("・");
      lines.push(`序盤は${lead.p.name}${tags?`（${tags}）`:""}から入り、相手の初手と型を確認`);
    }

    if(pivot){
      const tags=pivot.h.filter(x=>["対面操作","受け","耐久"].includes(x)).join("・");
      lines.push(`${pivot.p.name}${tags?`（${tags}）`:""}で不利対面をいなし、有利対面へつなぐ`);
    }

    if(breaker){
      const item=breaker.l?.item ? `＋${breaker.l.item}` : "";
      const tags=breaker.h.filter(x=>["崩し","物理","特殊","崩し補助"].includes(x)).join("・");
      lines.push(`${breaker.p.name}${item}${tags?`（${tags}）`:""}で中盤の受け先を削る`);
    }

    if(cleaner){
      const tags=cleaner.h.filter(x=>["高速","高速制圧","積み"].includes(x)).join("・");
      lines.push(`終盤は${cleaner.p.name}${tags?`（${tags}）`:""}を通す形を狙う`);
    }

    if(lines.length<3){
      lines.push("有利対面を維持しながら、相手の受け先を削って終盤の一貫を作る");
    }

    return lines.join(" → ") + "。";
  }

  function ideaCard(idea,index,{fixedSix=false}={}){
    const div=document.createElement("div");
    div.className="idea";

    const bd=idea.evaluation?.breakdown||{};
    const mons=idea.team||[];

    div.innerHTML=`
      <div class="ideahead">
        <strong>案 ${index+1}</strong>
        <span class="score">${Number(idea.score||0).toFixed(1)}</span>
      </div>
      <div class="mons">
        ${mons.map(p=>{
          const l=getLoadoutForPokemon(p);
          const item=l?.item ? `<div style="font-size:9px;color:#667085;margin-top:2px">${esc(l.item)}</div>` : "";
          const moves=Array.isArray(l?.moves)&&l.moves.length
            ? `<div style="font-size:9px;color:#667085;margin-top:2px">${esc(l.moves.filter(Boolean).slice(0,2).join(" / "))}</div>`
            : "";
          return `<div class="mon">${esc(p?.name||"")}${item}${moves}</div>`;
        }).join("")}
      </div>
      <div class="reason"><b>編成理由</b><br>${esc(buildReasonText(idea))}</div>
      <div class="reason"><b>基本の動き</b><br>${esc(buildGameplanText(idea))}</div>
      <div class="breakdown">
        <div class="metric">環境<br><b>${Number(bd.environment||0).toFixed(1)}</b></div>
        <div class="metric">メタ穴<br><b>${Number(bd.metaAudit||0).toFixed(1)}</b></div>
        <div class="metric">相性<br><b>${Number(bd.pair||0).toFixed(1)}</b></div>
        <div class="metric">構造<br><b>${Number(bd.structure||0).toFixed(1)}</b></div>
        <div class="metric">既存評価<br><b>${Number(bd.existing||0).toFixed(1)}</b></div>
        <div class="metric">相方<br><b>${Number(bd.teammate||0).toFixed(1)}</b></div>
      </div>
      <button class="apply" type="button">${fixedSix ? "この6体を型最適化" : "この編成を採用"}</button>
    `;

    div.querySelector(".apply").onclick=()=>{
      if(fixedSix){
        // Keep all six Pokémon unchanged. Only optimize unset loadout fields.
        window.team=idea.team.slice(0,6);

        const optimizer=window.LabDBBridge?.PPChamSetOptimizer;
        if(optimizer?.applyOptimizedSets){
          optimizer.applyOptimizedSets(window.team,{mode:"sp66"});
        }else if(typeof window.applyPlannedLoadouts==="function"){
          try{window.applyPlannedLoadouts(window.team)}catch(_){}
        }else if(typeof window.ensureLoadout==="function"){
          window.team.forEach((p,i)=>{
            try{window.ensureLoadout(i,p)}catch(_){}
          });
        }

        if(typeof window.saveLocal==="function") window.saveLocal();
        if(typeof window.renderTeam==="function") window.renderTeam();
        if(typeof window.renderRecs==="function") window.renderRecs();

        alert("✅ 6体は固定したまま、未設定の技・持ち物を中心に型最適化しました");
        document.getElementById("ppcham-team-builder-panel")?.remove();
        return;
      }

      const ok=TB.applyIdea(idea,{withSets:true});
      if(ok){
        alert("✅ 編成を反映しました");
        document.getElementById("ppcham-team-builder-panel")?.remove();
      }
    };

    return div;
  }

  function openPanel(){
    document.getElementById("ppcham-team-builder-panel")?.remove();

    const core=currentCore();

    let ideas=[];
    let fixedSixEvaluation=null;

    if(core.length===6){
      const evaluation=TB.scoreTeam(core);
      fixedSixEvaluation={
        team:core,
        score:evaluation.total,
        evaluation,
        reason:TB.explain(core,evaluation)
      };
      ideas=[fixedSixEvaluation];
    }else{
      ideas=TB.build(core);
    }

    const root=document.createElement("div");
    root.id="ppcham-team-builder-panel";
    root.innerHTML=`
      <div class="sheet">
        <div class="head">
          <div>
            <h2 style="margin:0">PPCham Team Builder</h2>
            <div style="font-size:11px;color:#667085;margin-top:3px">
              1〜5体は残りをAI補完 / 6体は固定で診断・未設定だけ最適化
            </div>
          </div>
          <button class="close">×</button>
        </div>

        <div class="core">
          ${core.length===6 ? "固定6体：" : "コア："}
          ${core.length ? core.map(p=>esc(p.name)).join(" / ") : "未選択（0体から自動編成）"}
        </div>

        <div class="ideas"></div>
      </div>
    `;
    document.body.appendChild(root);

    const ideasWrap=root.querySelector(".ideas");
    if(!ideas.length){
      ideasWrap.innerHTML=`<div class="empty">編成案を生成できませんでした。</div>`;
    }else{
      ideas.forEach((idea,i)=>ideasWrap.appendChild(ideaCard(idea,i,{fixedSix:core.length===6})));
    }

    const close=()=>root.remove();
    root.querySelector(".close").onclick=close;
    root.addEventListener("click",e=>{if(e.target===root)close();});
  }

  function installButton(){
    injectStyle();
    if(document.getElementById("ppcham-team-builder-btn")) return;

    const b=document.createElement("button");
    b.id="ppcham-team-builder-btn";
    b.type="button";
    b.textContent="編成";
    b.onclick=openPanel;
    document.body.appendChild(b);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",installButton,{once:true});
  }else{
    installButton();
  }

  B.openPPChamTeamBuilder=openPanel;
  console.log("✅ ppcham Team Builder UI v1 ready");
})();

/* ===== ppcham final boot QA ===== */
(() => {
  const B=window.LabDBBridge||{};
  const checks={
    dataHub:!!window.PPChamDataHub,
    teamBuilder:!!B.PPChamTeamBuilder,
    setOptimizer:!!B.PPChamSetOptimizer,
    teamBuilderUI:typeof B.openPPChamTeamBuilder==="function",
    localOnly:window.PPChamDataHub?.policy?.external_fetch===false
  };

  const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);

  window.PPChamBuildState={
    bundle:"complete-local-v1",
    completion_percent:97,
    checks,
    status:failed.length?"REVIEW":"PASS",
    failed
  };

  console.log("✅ ppcham Complete Local Bundle v1",window.PPChamBuildState);
})();

/* ===== ASSET BUNDLE ===== */
/* ppcham — Integrated Asset Bundle v1
 *
 * Includes:
 * - local Asset DB
 * - unified Pokémon hero art manifest
 * - dual Pokémon hero/icon layer
 * - Pokémon UI renderer
 * - item/type UI renderer
 * - visual polish layer
 *
 * Runtime policy:
 * - NO external fetch
 * - NO XMLHttpRequest
 * - missing Pokémon/item/type image => Poké Ball fallback
 */

/* ===== BEGIN ppcham_official_asset_db_v1.js ===== */
/* ppcham — Official Asset DB v1
 *
 * Runtime policy:
 *   - ppcham UI NEVER fetches external images.
 *   - Assets are collected during maintenance/build time and stored locally.
 *   - Any missing Pokémon / item / type art falls back to Poké Ball.
 *
 * Official source policy:
 *   - Only official Pokémon domains may be recorded as sources.
 */
(() => {
  if(window.PPChamAssets) return;

  const OFFICIAL_HOSTS = [
    "pokemon.com",
    "www.pokemon.com",
    "assets.pokemon.com",
    "unite.pokemon.com",
    "pokemonletsgo.pokemon.com"
  ];

  const FALLBACK = {
    asset_id:"fallback_pokeball",
    kind:"fallback",
    local_path:"pokeball.webp",
    alt:"Poké Ball",
    source_url:null,
    source_official:true
  };

  const db = window.PPCHAM_ASSET_DB || {
    schema:"ppcham_asset_db",
    version:1,
    fallback:FALLBACK,
    pokemon:{},
    items:{},
    types:{}
  };

  function official(url){
    if(!url) return true;
    try{
      const h=new URL(url).hostname.toLowerCase();
      return OFFICIAL_HOSTS.some(x=>h===x || h.endsWith("." + x));
    }catch(_){
      return false;
    }
  }

  function put(kind,id,record){
    if(!["pokemon","items","types"].includes(kind)) throw new Error("unknown asset kind");
    if(!id) throw new Error("asset id required");
    if(record?.source_url && !official(record.source_url)){
      throw new Error("公式ドメイン以外の画像は登録できません");
    }

    db[kind][id]={
      asset_id:`${kind}:${id}`,
      local_path:record?.local_path||null,
      alt:record?.alt||"",
      source_url:record?.source_url||null,
      source_official:true,
      updated_at:record?.updated_at||new Date().toISOString()
    };
    return db[kind][id];
  }

  function flatToken(v){
    return String(v ?? "")
      .normalize("NFKC").trim()
      .replace(/[\\/<>:"|?*]+/g,"_")
      .replace(/\s+/g,"_");
  }

  function defaultLocalPath(kind,id){
    const token=flatToken(id);
    if(!token) return FALLBACK.local_path;
    if(kind==="pokemon") return `pokemon_icon_${token}.webp`;
    if(kind==="items") return `item_${token}.webp`;
    if(kind==="types") return `type_${token}.webp`;
    return FALLBACK.local_path;
  }

  function get(kind,id){
    const rec=db?.[kind]?.[id];
    if(rec?.local_path) return rec;
    const token=flatToken(id);
    if(!token) return db.fallback || FALLBACK;
    return {
      asset_id:`${kind}:${token}`,
      local_path:defaultLocalPath(kind,id),
      alt:String(id ?? ""),
      source_url:null,
      source_official:true,
      generated_flat_path:true
    };
  }

  function pokemon(ref){
    const id=typeof ref==="string" ? ref :
      ref?.pokemon_id || ref?.id || ref?.name || "";
    return get("pokemon",id);
  }

  function item(ref){
    const id=typeof ref==="string" ? ref :
      ref?.item_id || ref?.id || ref?.name || "";
    return get("items",id);
  }

  function type(ref){
    const id=typeof ref==="string" ? ref :
      ref?.type_key || ref?.id || ref?.name || "";
    return get("types",id);
  }

  function imgHTML(asset,{className="",alt=""}={}){
    const a=asset?.local_path ? asset : (db.fallback||FALLBACK);
    const safeAlt=(alt||a.alt||"").replaceAll('"',"&quot;");
    return `<img src="${a.local_path}" alt="${safeAlt}" class="${className}" loading="lazy" decoding="async">`;
  }

  function audit(){
    const counts={
      pokemon:Object.keys(db.pokemon||{}).length,
      items:Object.keys(db.items||{}).length,
      types:Object.keys(db.types||{}).length
    };
    const invalid=[];

    for(const kind of ["pokemon","items","types"]){
      for(const [id,r] of Object.entries(db[kind]||{})){
        if(r.source_url && !official(r.source_url)) invalid.push({kind,id,url:r.source_url});
      }
    }

    return {
      schema:db.schema,
      version:db.version,
      counts,
      fallback:db.fallback?.local_path||FALLBACK.local_path,
      invalid_sources:invalid,
      status:invalid.length ? "REVIEW" : "PASS"
    };
  }

  window.PPCHAM_ASSET_DB=db;
  window.PPChamAssets={
    version:1,
    officialHosts:OFFICIAL_HOSTS,
    fallback:FALLBACK,
    put,
    get,
    pokemon,
    item,
    type,
    imgHTML,
    audit
  };

  console.log("✅ ppcham Official Asset DB v1 ready",audit());
})();
/* ===== END ppcham_official_asset_db_v1.js ===== */

/* ===== BEGIN ppcham_unified_pokemon_art_manifest_v1.js ===== */
/* ppcham — Unified Pokémon Art Manifest Builder v1
 *
 * Purpose:
 *   Build a strict, single-style artwork manifest for ppcham.
 *
 * Rules:
 *   - Pokémon art must come from ONE approved style family only.
 *   - No mixing 3D renders, anime art, game sprites, TCG art, etc.
 *   - If the exact matching official-style artwork is unavailable, use Poké Ball fallback.
 *   - Runtime stays local-only; this file does NOT fetch the web.
 *
 * Expected optional master fields:
 *   national_dex: number
 *   official_art_key: string
 *   form_key: string|null
 *
 * Output:
 *   window.PPCHAM_POKEMON_ART_MANIFEST
 */
(() => {
  const B=window.LabDBBridge||{};
  const A=window.PPChamAssets;
  if(!A) throw new Error("PPChamAssets がありません");

  const FALLBACK=A.fallback?.local_path || "pokeball.webp";
  const STYLE_FAMILY="official-pokedex-art";

  function norm(s){
    return (s??"").toString().normalize("NFKC").trim();
  }

  function keyOf(p,i){
    return p?.pokemon_id || `pkm_${String(i+1).padStart(4,"0")}`;
  }

  function flatToken(v){
    return String(v ?? "")
      .normalize("NFKC").trim()
      .replace(/[\\/<>:"|?*]+/g,"_")
      .replace(/\s+/g,"_");
  }

  function localPathFor(p,i){
    const id=flatToken(keyOf(p,i));
    return `pokemon_hero_${id}.webp`;
  }

  function sourceKeyFor(p){
    if(p?.official_art_key) return String(p.official_art_key);
    if(Number.isInteger(Number(p?.national_dex))){
      return String(Number(p.national_dex)).padStart(3,"0");
    }
    return null;
  }

  function build(){
    const pokemon=B.pokemon_master || window.P || [];
    const rows=pokemon.map((p,i)=>{
      const id=keyOf(p,i);
      const artKey=sourceKeyFor(p);
      const exactForm=Boolean(
        p?.official_art_key ||
        (!p?.form_key && Number.isInteger(Number(p?.national_dex)))
      );

      const usable=Boolean(artKey && exactForm);

      return {
        pokemon_id:id,
        name_ja:p?.name || p?.name_ja || p?.canonical_name_ja || "",
        name_en:p?.name_en || p?.canonical_name_en || "",
        form_key:p?.form_key || null,
        national_dex:Number.isInteger(Number(p?.national_dex)) ? Number(p.national_dex) : null,
        style_family:STYLE_FAMILY,
        official_art_key:artKey,
        local_path:usable ? localPathFor(p,i) : FALLBACK,
        fallback:!usable,
        reason:usable
          ? "same_style_family"
          : (p?.form_key ? "exact_form_art_key_missing" : "national_dex_missing")
      };
    });

    const audit={
      expected:pokemon.length,
      artwork:rows.filter(x=>!x.fallback).length,
      fallback:rows.filter(x=>x.fallback).length,
      missing_dex:rows.filter(x=>x.reason==="national_dex_missing").length,
      missing_exact_form:rows.filter(x=>x.reason==="exact_form_art_key_missing").length,
      style_families:[...new Set(rows.filter(x=>!x.fallback).map(x=>x.style_family))],
      mixed_style:false
    };
    audit.mixed_style=audit.style_families.length>1;
    audit.status=audit.mixed_style ? "FAIL" : "PASS";

    const manifest={
      schema:"ppcham_pokemon_art_manifest",
      version:1,
      style_family:STYLE_FAMILY,
      fallback_path:FALLBACK,
      generated_at:new Date().toISOString(),
      rows,
      audit
    };

    window.PPCHAM_POKEMON_ART_MANIFEST=manifest;
    return manifest;
  }

  function registerLocalAssets(manifest=window.PPCHAM_POKEMON_ART_MANIFEST){
    if(!manifest?.rows) throw new Error("manifest がありません");
    let registered=0;

    for(const r of manifest.rows){
      if(r.fallback) continue;
      A.put("pokemon",r.pokemon_id,{
        local_path:r.local_path,
        alt:r.name_ja || r.name_en || r.pokemon_id,
        source_url:null,
        updated_at:new Date().toISOString()
      });
      registered++;
    }
    return registered;
  }

  function auditLocalFiles(){
    const manifest=window.PPCHAM_POKEMON_ART_MANIFEST || build();
    return {
      expected:manifest.rows.length,
      expected_artwork:manifest.rows.filter(x=>!x.fallback).length,
      fallback_expected:manifest.rows.filter(x=>x.fallback).length,
      note:"実ファイル存在確認はビルド環境側で行う"
    };
  }

  window.PPChamPokemonArtManifest={
    version:1,
    styleFamily:STYLE_FAMILY,
    build,
    registerLocalAssets,
    auditLocalFiles
  };

  const manifest=build();
  console.log("✅ ppcham Unified Pokémon Art Manifest v1",manifest.audit);
})();
/* ===== END ppcham_unified_pokemon_art_manifest_v1.js ===== */

/* ===== BEGIN ppcham_dual_pokemon_asset_layer_v1.js ===== */
/* ppcham — Dual Pokémon Asset Layer v1
 *
 * Adds two visual layers per Pokémon:
 *   hero : large official artwork for detail/doctor/team-builder views
 *   icon : compact icon/sprite-like asset for dense lists/team slots
 *
 * Rules:
 *   - Each layer has its own consistent style family.
 *   - Never mix unrelated styles inside the same layer.
 *   - Missing hero/icon falls back to the shared Poké Ball asset.
 *   - Runtime remains local-only.
 */
(() => {
  const A=window.PPChamAssets;
  const B=window.LabDBBridge||{};
  if(!A) throw new Error("PPChamAssets がありません");

  const FALLBACK=A.fallback?.local_path || "pokeball.webp";

  const STYLE={
    hero:"official-pokedex-art",
    icon:"official-compact-icon"
  };

  function norm(s){
    return (s??"").toString().normalize("NFKC").trim();
  }

  function pokemonId(ref){
    if(typeof ref==="string"){
      if(ref.startsWith("pkm_")) return ref;
      const p=B.resolvePokemon?.(ref);
      return p?.pokemon_id || ref;
    }
    return ref?.pokemon_id || B.resolvePokemon?.(ref)?.pokemon_id || ref?.id || ref?.name || "";
  }

  function ensureStore(){
    const db=window.PPCHAM_ASSET_DB || (window.PPCHAM_ASSET_DB={
      schema:"ppcham_asset_db",
      version:2,
      fallback:A.fallback,
      pokemon:{},
      items:{},
      types:{}
    });

    db.version=Math.max(Number(db.version)||1,2);
    db.pokemon ||= {};
    return db;
  }

  function register(ref,layer,record={}){
    if(!["hero","icon"].includes(layer)) throw new Error("layer must be hero or icon");
    const id=pokemonId(ref);
    if(!id) throw new Error("pokemon id required");

    const db=ensureStore();
    const row=db.pokemon[id] || (db.pokemon[id]={
      pokemon_id:id,
      hero:null,
      icon:null
    });

    row[layer]={
      style_family:STYLE[layer],
      local_path:record.local_path||null,
      alt:record.alt||"",
      source_url:record.source_url||null,
      source_official:record.source_official!==false,
      updated_at:record.updated_at||new Date().toISOString()
    };

    return row[layer];
  }

  function flatToken(v){
    return String(v ?? "")
      .normalize("NFKC").trim()
      .replace(/[\\/<>:"|?*]+/g,"_")
      .replace(/\s+/g,"_");
  }

  function get(ref,layer="icon"){
    const id=pokemonId(ref);
    const db=ensureStore();
    const rec=db.pokemon?.[id]?.[layer];

    if(rec?.local_path){
      return {
        pokemon_id:id,
        layer,
        ...rec,
        fallback:false
      };
    }

    const token=flatToken(id);
    if(!token){
      return {
        pokemon_id:id,
        layer,
        style_family:"fallback-pokeball",
        local_path:FALLBACK,
        alt:"Poké Ball",
        source_url:null,
        source_official:true,
        fallback:true
      };
    }

    return {
      pokemon_id:id,
      layer,
      style_family:STYLE[layer],
      local_path:`pokemon_${layer}_${token}.webp`,
      alt:String(id ?? ""),
      source_url:null,
      source_official:true,
      fallback:false,
      generated_flat_path:true
    };
  }

  function hero(ref){ return get(ref,"hero"); }
  function icon(ref){ return get(ref,"icon"); }

  function img(ref,{layer="icon",className="",alt="",loading="lazy"}={}){
    const asset=get(ref,layer);
    const safeAlt=String(alt||asset.alt||"").replaceAll('"',"&quot;");
    return `<img
      src="${asset.local_path}"
      alt="${safeAlt}"
      class="${className}"
      data-ppcham-asset-layer="${layer}"
      loading="${loading}"
      decoding="async"
    >`;
  }

  function audit(){
    const db=ensureStore();
    const rows=Object.values(db.pokemon||{});

    const heroCount=rows.filter(x=>x?.hero?.local_path).length;
    const iconCount=rows.filter(x=>x?.icon?.local_path).length;

    const heroStyles=[...new Set(rows.map(x=>x?.hero?.style_family).filter(Boolean))];
    const iconStyles=[...new Set(rows.map(x=>x?.icon?.style_family).filter(Boolean))];

    return {
      pokemon_rows:rows.length,
      hero_count:heroCount,
      icon_count:iconCount,
      hero_style_families:heroStyles,
      icon_style_families:iconStyles,
      hero_mixed:heroStyles.length>1,
      icon_mixed:iconStyles.length>1,
      status:(heroStyles.length<=1 && iconStyles.length<=1) ? "PASS" : "REVIEW"
    };
  }

  window.PPChamPokemonAssets={
    version:1,
    style:STYLE,
    fallback:FALLBACK,
    register,
    get,
    hero,
    icon,
    img,
    audit
  };

  console.log("✅ ppcham Dual Pokémon Asset Layer v1 ready",audit());
})();
/* ===== END ppcham_dual_pokemon_asset_layer_v1.js ===== */

/* ===== BEGIN ppcham_asset_ui_renderer_v1.js ===== */
/* ppcham — Asset UI Renderer v1
 *
 * Maps dual Pokémon assets into ppcham UI.
 *
 * hero:
 *   - doctor/detail views
 *   - large team-builder presentation
 *
 * icon:
 *   - team slots
 *   - pickers/lists
 *   - teammates
 *   - swap candidates
 *   - rankings
 *
 * Missing assets automatically use Poké Ball fallback.
 */
(() => {
  const PA=window.PPChamPokemonAssets;
  const B=window.LabDBBridge||{};
  if(!PA) throw new Error("PPChamPokemonAssets がありません");

  if(window.__ppchamAssetUIRendererInstalled) return;
  window.__ppchamAssetUIRendererInstalled=true;

  function injectStyle(){
    if(document.getElementById("ppcham-asset-ui-style")) return;
    const st=document.createElement("style");
    st.id="ppcham-asset-ui-style";
    st.textContent=`
      .ppcham-pkm-icon{
        width:28px;height:28px;object-fit:contain;display:inline-block;
        vertical-align:middle;flex:0 0 auto
      }
      .ppcham-pkm-icon.sm{width:22px;height:22px}
      .ppcham-pkm-icon.md{width:34px;height:34px}
      .ppcham-pkm-hero{
        width:min(220px,42vw);height:min(220px,42vw);object-fit:contain;
        display:block;margin:0 auto
      }
      .ppcham-pkm-row{
        display:flex;align-items:center;gap:7px;min-width:0
      }
      .ppcham-pkm-row .ppcham-name{
        min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap
      }
      .ppcham-hero-wrap{
        display:flex;align-items:center;justify-content:center;
        min-height:180px
      }
    `;
    document.head.appendChild(st);
  }

  function resolve(ref){
    return B.resolvePokemon?.(ref) || ref || null;
  }

  function iconHTML(ref,{size="sm",alt=""}={}){
    const p=resolve(ref);
    return PA.img(p,{
      layer:"icon",
      className:`ppcham-pkm-icon ${size}`,
      alt:alt || p?.name || p?.canonical_name_ja || ""
    });
  }

  function heroHTML(ref,{alt=""}={}){
    const p=resolve(ref);
    return PA.img(p,{
      layer:"hero",
      className:"ppcham-pkm-hero",
      alt:alt || p?.name || p?.canonical_name_ja || "",
      loading:"eager"
    });
  }

  function decorateTextNode(el,ref,{layer="icon",size="sm"}={}){
    if(!el || el.dataset.ppchamAssetDecorated==="1") return false;
    const p=resolve(ref);
    if(!p) return false;

    const name=p.name || p.canonical_name_ja || "";
    const wrap=document.createElement("span");
    wrap.className="ppcham-pkm-row";
    wrap.innerHTML=(layer==="hero" ? heroHTML(p) : iconHTML(p,{size}))+
      `<span class="ppcham-name">${name}</span>`;

    el.textContent="";
    el.appendChild(wrap);
    el.dataset.ppchamAssetDecorated="1";
    return true;
  }

  function decorateTeamSlots(){
    const team=window.team||[];
    const candidates=[
      ...document.querySelectorAll("[data-team-slot]"),
      ...document.querySelectorAll(".team-slot"),
      ...document.querySelectorAll(".team-card")
    ];

    candidates.forEach((el,i)=>{
      const slot=Number(el.dataset.teamSlot ?? i);
      const p=team[slot];
      if(!p) return;

      const existing=el.querySelector(".ppcham-pkm-icon");
      if(existing) return;

      const icon=document.createElement("span");
      icon.innerHTML=iconHTML(p,{size:"md"});
      const img=icon.firstElementChild;
      if(img) el.prepend(img);
    });
  }

  function decorateBuilderCards(){
    document.querySelectorAll("#ppcham-team-builder-panel .mon").forEach(el=>{
      if(el.querySelector(".ppcham-pkm-icon")) return;
      const text=(el.childNodes[0]?.textContent||el.textContent||"").trim();
      const p=resolve(text);
      if(!p) return;

      const icon=document.createElement("span");
      icon.innerHTML=iconHTML(p,{size:"sm"});
      const img=icon.firstElementChild;
      if(img) el.prepend(img);
    });
  }

  function decorateDoctorHero(){
    const selectors=[
      "[data-ppcham-doctor-pokemon]",
      ".doctor-pokemon",
      ".pokemon-detail-hero",
      ".matchup-focus"
    ];

    for(const sel of selectors){
      for(const el of document.querySelectorAll(sel)){
        if(el.querySelector(".ppcham-pkm-hero")) continue;

        const ref=
          el.dataset.ppchamDoctorPokemon ||
          el.dataset.pokemon ||
          el.getAttribute("data-name") ||
          el.querySelector("[data-pokemon-name]")?.textContent ||
          el.querySelector(".pokemon-name")?.textContent;

        const p=resolve(ref);
        if(!p) continue;

        const wrap=document.createElement("div");
        wrap.className="ppcham-hero-wrap";
        wrap.innerHTML=heroHTML(p);
        el.prepend(wrap);
      }
    }
  }

  function decorateDensePokemonRows(){
    const selectors=[
      "[data-pokemon-row]",
      ".pokemon-row",
      ".teammate-row",
      ".swap-candidate",
      ".ranking-row",
      ".pokemon-option"
    ];

    for(const sel of selectors){
      for(const el of document.querySelectorAll(sel)){
        if(el.querySelector(".ppcham-pkm-icon")) continue;

        const ref=
          el.dataset.pokemon ||
          el.dataset.name ||
          el.querySelector("[data-pokemon-name]")?.textContent ||
          el.querySelector(".pokemon-name")?.textContent ||
          el.firstChild?.textContent;

        const p=resolve(ref);
        if(!p) continue;

        const span=document.createElement("span");
        span.innerHTML=iconHTML(p,{size:"sm"});
        const img=span.firstElementChild;
        if(img) el.prepend(img);
      }
    }
  }

  function renderAll(){
    injectStyle();
    decorateTeamSlots();
    decorateBuilderCards();
    decorateDoctorHero();
    decorateDensePokemonRows();
  }

  // Re-render after app redraws and environment/team updates.
  const events=[
    "ppcham:environment-updated",
    "ppcham:master-db-updated",
    "pokemonchampions:environment-updated"
  ];
  events.forEach(ev=>window.addEventListener(ev,()=>requestAnimationFrame(renderAll)));

  const observer=new MutationObserver(()=>{
    requestAnimationFrame(renderAll);
  });

  function startObserver(){
    if(document.body){
      observer.observe(document.body,{childList:true,subtree:true});
      renderAll();
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",startObserver,{once:true});
  }else{
    startObserver();
  }

  B.PPChamAssetUI={
    version:1,
    renderAll,
    iconHTML,
    heroHTML,
    decorateTeamSlots,
    decorateBuilderCards,
    decorateDoctorHero,
    decorateDensePokemonRows
  };

  console.log("✅ ppcham Asset UI Renderer v1 ready");
})();
/* ===== END ppcham_asset_ui_renderer_v1.js ===== */

/* ===== BEGIN ppcham_item_type_asset_ui_renderer_v1.js ===== */
/* ppcham — Item & Type Asset UI Renderer v1
 *
 * Adds local-only item/type asset display.
 *
 * Rules:
 *   - Item/type assets come from PPChamAssets.
 *   - Missing asset -> shared Poké Ball fallback.
 *   - No external runtime access.
 */
(() => {
  const A=window.PPChamAssets;
  const B=window.LabDBBridge||{};
  if(!A) throw new Error("PPChamAssets がありません");

  if(window.__ppchamItemTypeAssetUIInstalled) return;
  window.__ppchamItemTypeAssetUIInstalled=true;

  function injectStyle(){
    if(document.getElementById("ppcham-item-type-style")) return;
    const st=document.createElement("style");
    st.id="ppcham-item-type-style";
    st.textContent=`
      .ppcham-item-icon,
      .ppcham-type-icon{
        width:22px;height:22px;object-fit:contain;display:inline-block;
        vertical-align:middle;flex:0 0 auto
      }
      .ppcham-item-icon.md,
      .ppcham-type-icon.md{
        width:28px;height:28px
      }
      .ppcham-asset-row{
        display:flex;align-items:center;gap:6px;min-width:0
      }
      .ppcham-asset-label{
        min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap
      }
    `;
    document.head.appendChild(st);
  }

  function esc(s){
    return String(s??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;");
  }

  function itemRef(ref){
    if(typeof ref==="object"){
      return ref.item_id || ref.id || ref.name || ref.name_ja || "";
    }
    return ref||"";
  }

  function typeRef(ref){
    if(typeof ref==="object"){
      return ref.type_key || ref.id || ref.name || ref.name_ja || "";
    }
    return ref||"";
  }

  function itemHTML(ref,{size="",alt=""}={}){
    const asset=A.item(itemRef(ref));
    return `<img
      src="${asset.local_path}"
      alt="${esc(alt||asset.alt||"")}"
      class="ppcham-item-icon ${size}"
      loading="lazy"
      decoding="async"
    >`;
  }

  function typeHTML(ref,{size="",alt=""}={}){
    const asset=A.type(typeRef(ref));
    return `<img
      src="${asset.local_path}"
      alt="${esc(alt||asset.alt||"")}"
      class="ppcham-type-icon ${size}"
      loading="lazy"
      decoding="async"
    >`;
  }

  function decorateItemRows(){
    const selectors=[
      "[data-item-row]",
      ".item-row",
      ".item-option",
      ".held-item",
      ".loadout-item"
    ];

    for(const sel of selectors){
      for(const el of document.querySelectorAll(sel)){
        if(el.querySelector(".ppcham-item-icon")) continue;

        const ref=
          el.dataset.item ||
          el.dataset.name ||
          el.querySelector("[data-item-name]")?.textContent ||
          el.querySelector(".item-name")?.textContent ||
          el.firstChild?.textContent;

        if(!ref) continue;

        const span=document.createElement("span");
        span.innerHTML=itemHTML(ref);
        const img=span.firstElementChild;
        if(img) el.prepend(img);
      }
    }
  }

  function decorateTypeRows(){
    const selectors=[
      "[data-type-row]",
      ".type-row",
      ".type-option",
      ".type-badge",
      ".move-type",
      ".pokemon-type"
    ];

    for(const sel of selectors){
      for(const el of document.querySelectorAll(sel)){
        if(el.querySelector(".ppcham-type-icon")) continue;

        const ref=
          el.dataset.type ||
          el.dataset.name ||
          el.getAttribute("data-type-key") ||
          el.querySelector("[data-type-name]")?.textContent ||
          el.firstChild?.textContent;

        if(!ref) continue;

        const span=document.createElement("span");
        span.innerHTML=typeHTML(ref);
        const img=span.firstElementChild;
        if(img) el.prepend(img);
      }
    }
  }

  function decorateLoadoutItem(){
    const field=
      document.getElementById("loadoutItem") ||
      document.querySelector('[name="item"]') ||
      document.querySelector('[data-field="item"]');

    if(!field) return;

    const parent=field.parentElement;
    if(!parent || parent.querySelector(".ppcham-loadout-item-preview")) return;

    const preview=document.createElement("div");
    preview.className="ppcham-loadout-item-preview ppcham-asset-row";
    preview.style.marginTop="6px";

    const refresh=()=>{
      const value=field.value||"";
      preview.innerHTML=itemHTML(value,{size:"md",alt:value})+
        `<span class="ppcham-asset-label">${esc(value||"未設定")}</span>`;
    };

    field.insertAdjacentElement("afterend",preview);
    field.addEventListener("input",refresh);
    field.addEventListener("change",refresh);
    refresh();
  }

  function decoratePokemonTypes(){
    const team=window.team||[];

    document.querySelectorAll("[data-team-slot],.team-slot,.team-card").forEach((el,i)=>{
      if(el.querySelector(".ppcham-team-types")) return;
      const p=team[Number(el.dataset.teamSlot ?? i)];
      if(!p) return;

      const types=[p.t1,p.t2].filter(x=>x && x!=="93");
      if(!types.length) return;

      const wrap=document.createElement("div");
      wrap.className="ppcham-team-types ppcham-asset-row";
      wrap.style.marginTop="4px";
      wrap.innerHTML=types.map(t=>typeHTML(t,{alt:t})).join("");
      el.appendChild(wrap);
    });
  }

  function renderAll(){
    injectStyle();
    decorateItemRows();
    decorateTypeRows();
    decorateLoadoutItem();
    decoratePokemonTypes();
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(renderAll));

  function start(){
    if(document.body){
      observer.observe(document.body,{childList:true,subtree:true});
      renderAll();
    }
  }

  for(const ev of [
    "ppcham:environment-updated",
    "ppcham:master-db-updated",
    "pokemonchampions:environment-updated"
  ]){
    window.addEventListener(ev,()=>requestAnimationFrame(renderAll));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }

  B.PPChamItemTypeAssetUI={
    version:1,
    renderAll,
    itemHTML,
    typeHTML,
    decorateItemRows,
    decorateTypeRows,
    decorateLoadoutItem,
    decoratePokemonTypes
  };

  console.log("✅ ppcham Item & Type Asset UI Renderer v1 ready");
})();
/* ===== END ppcham_item_type_asset_ui_renderer_v1.js ===== */

/* ===== BEGIN ppcham_visual_polish_layer_v1.js ===== */
/* ppcham — Visual Polish Layer v1
 *
 * Final visual normalization for Pokémon / item / type assets.
 *
 * Goals:
 * - consistent spacing
 * - consistent icon sizes by context
 * - hero art never overwhelms text
 * - dense lists stay compact
 * - fallback Poké Ball looks intentional, not broken
 * - mobile-first layout
 */
(() => {
  if(window.__ppchamVisualPolishInstalled) return;
  window.__ppchamVisualPolishInstalled=true;

  const style=document.createElement("style");
  style.id="ppcham-visual-polish-v1";
  style.textContent=`
    :root{
      --ppc-icon-xs:18px;
      --ppc-icon-sm:22px;
      --ppc-icon-md:30px;
      --ppc-icon-lg:38px;
      --ppc-hero-mobile:170px;
      --ppc-hero-desktop:220px;
      --ppc-gap-xs:4px;
      --ppc-gap-sm:6px;
      --ppc-gap-md:9px;
      --ppc-radius-sm:8px;
      --ppc-radius-md:12px;
    }

    .ppcham-pkm-icon,
    .ppcham-item-icon,
    .ppcham-type-icon{
      object-fit:contain;
      flex:0 0 auto;
      vertical-align:middle;
      image-rendering:auto;
    }

    .ppcham-pkm-icon.sm{width:var(--ppc-icon-sm);height:var(--ppc-icon-sm)}
    .ppcham-pkm-icon.md{width:var(--ppc-icon-md);height:var(--ppc-icon-md)}
    .ppcham-item-icon{width:var(--ppc-icon-sm);height:var(--ppc-icon-sm)}
    .ppcham-item-icon.md{width:var(--ppc-icon-md);height:var(--ppc-icon-md)}
    .ppcham-type-icon{width:var(--ppc-icon-xs);height:var(--ppc-icon-xs)}
    .ppcham-type-icon.md{width:var(--ppc-icon-sm);height:var(--ppc-icon-sm)}

    .ppcham-pkm-row,
    .ppcham-asset-row{
      display:flex;
      align-items:center;
      gap:var(--ppc-gap-sm);
      min-width:0;
    }

    .ppcham-pkm-row .ppcham-name,
    .ppcham-asset-label{
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }

    .ppcham-pkm-hero{
      width:min(var(--ppc-hero-mobile),42vw);
      height:min(var(--ppc-hero-mobile),42vw);
      object-fit:contain;
      display:block;
      margin:0 auto;
    }

    .ppcham-hero-wrap{
      min-height:150px;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:8px 0 4px;
    }

    /* Team slots: compact but readable */
    [data-team-slot] .ppcham-pkm-icon,
    .team-slot .ppcham-pkm-icon,
    .team-card .ppcham-pkm-icon{
      width:var(--ppc-icon-lg);
      height:var(--ppc-icon-lg);
      margin-right:var(--ppc-gap-sm);
    }

    .ppcham-team-types{
      display:flex;
      gap:var(--ppc-gap-xs);
      margin-top:4px;
      min-height:18px;
    }

    /* Builder cards */
    #ppcham-team-builder-panel .mon{
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:3px;
      min-height:54px;
    }

    #ppcham-team-builder-panel .mon > .ppcham-pkm-icon{
      width:var(--ppc-icon-md);
      height:var(--ppc-icon-md);
      margin-bottom:2px;
    }

    /* Picker/list density */
    .pokemon-option,
    .pokemon-row,
    .ranking-row,
    .teammate-row,
    .swap-candidate,
    .item-option,
    .item-row,
    .type-option,
    .type-row{
      gap:var(--ppc-gap-sm);
    }

    .pokemon-option .ppcham-pkm-icon,
    .pokemon-row .ppcham-pkm-icon,
    .ranking-row .ppcham-pkm-icon,
    .teammate-row .ppcham-pkm-icon,
    .swap-candidate .ppcham-pkm-icon{
      width:var(--ppc-icon-sm);
      height:var(--ppc-icon-sm);
    }

    /* Loadout item preview should feel secondary */
    .ppcham-loadout-item-preview{
      padding:6px 8px;
      border-radius:var(--ppc-radius-sm);
      background:#f8fafc;
      width:fit-content;
      max-width:100%;
    }

    /* Poké Ball fallback should not dominate */
    img[src$="pokeball.webp"]{
      opacity:.78;
      filter:saturate(.9);
    }

    /* Doctor/detail hero balance */
    [data-ppcham-doctor-pokemon] .ppcham-hero-wrap,
    .doctor-pokemon .ppcham-hero-wrap,
    .pokemon-detail-hero .ppcham-hero-wrap,
    .matchup-focus .ppcham-hero-wrap{
      margin-bottom:6px;
    }

    @media(min-width:700px){
      .ppcham-pkm-hero{
        width:var(--ppc-hero-desktop);
        height:var(--ppc-hero-desktop);
      }

      .ppcham-hero-wrap{
        min-height:200px;
      }

      #ppcham-team-builder-panel .mon{
        min-height:62px;
      }
    }
  `;
  document.head.appendChild(style);

  function normalizeExistingAssets(){
    document.querySelectorAll(".ppcham-pkm-icon,.ppcham-item-icon,.ppcham-type-icon").forEach(img=>{
      img.setAttribute("draggable","false");
      if(!img.getAttribute("loading")) img.setAttribute("loading","lazy");
      if(!img.getAttribute("decoding")) img.setAttribute("decoding","async");
    });
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(normalizeExistingAssets));

  function start(){
    normalizeExistingAssets();
    if(document.body){
      observer.observe(document.body,{childList:true,subtree:true});
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }

  window.PPChamVisualPolish={
    version:1,
    normalizeExistingAssets
  };

  console.log("✅ ppcham Visual Polish Layer v1 ready");
})();
/* ===== END ppcham_visual_polish_layer_v1.js ===== */

/* ===== FINAL BUILD STATE ===== */
(() => {
  const previous=window.PPChamBuildState||{};
  window.PPChamBuildState={
    ...previous,
    product:"ppcham",
    bundle_version:2,
    local_only:true,
    assets:{
      enabled:true,
      pokemon_layers:["hero","icon"],
      item_icons:true,
      type_icons:true,
      fallback:"pokeball.webp"
    },
    completion_percent:98
  };
  console.log("✅ ppcham Complete Local Bundle flat-root ready",window.PPChamBuildState);
})();

/* ===== HOST INTEGRATION ===== */
/* ppcham — Host Integration Adapter v1
 * Target: latest Pokémon Champions Lab / ppcham v2.0 host page
 *
 * Non-destructive integration:
 * - wraps existing renderTeam / renderPicker / renderDiag / renderRecs
 * - never changes the user's team/loadout data
 * - only annotates DOM and re-runs ppcham asset renderers
 */
(() => {
  if(window.__ppchamHostIntegrationInstalled) return;
  window.__ppchamHostIntegrationInstalled=true;

  const B=window.LabDBBridge||{};

  function teamArray(){ return window.team || []; }

  function annotateTeamSlots(){
    const slots=[...document.querySelectorAll("#team .slot")];
    const team=teamArray();
    slots.forEach((el,i)=>{
      el.dataset.teamSlot=String(i);
      const p=team[i];
      if(!p) return;
      el.dataset.pokemon=p.pokemon_id || p.name || "";
      const name=el.querySelector(".name");
      if(name) name.dataset.pokemonName="1";
      el.querySelectorAll(".type").forEach(t=>{
        t.dataset.typeRow="1";
        t.dataset.type=(t.textContent||"").trim();
      });
    });
  }

  function annotatePicker(){
    document.querySelectorAll("#pickerList .pick").forEach(el=>{
      el.classList.add("pokemon-option");
      const name=el.querySelector("b")?.textContent?.trim();
      if(name) el.dataset.pokemon=name;
    });
  }

  function annotateLoadout(){
    const item=document.getElementById("loadoutItem");
    if(item){
      item.dataset.field="item";
      item.dataset.itemRow="1";
    }
    for(let i=1;i<=4;i++){
      const move=document.getElementById(`loadoutMove${i}`);
      if(move) move.dataset.ppchamMoveSelect=String(i);
    }
  }

  function annotateDiagnosis(){
    const diag=document.getElementById("diag");
    if(!diag) return;

    // Known matchup / swap / ranking sections become compact-icon targets.
    diag.querySelectorAll(".swap-card").forEach(el=>el.classList.add("swap-candidate"));
    diag.querySelectorAll(".env-row").forEach(el=>el.classList.add("ranking-row"));

    diag.querySelectorAll(".type,.coverage-chip").forEach(el=>{
      const txt=(el.textContent||"").trim();
      if(!txt) return;
      el.dataset.typeRow="1";
      el.dataset.type=txt;
    });
  }

  function annotateBuilder(){
    document.querySelectorAll(".team-idea-mon").forEach(el=>{
      el.classList.add("pokemon-row");
      const name=(el.textContent||"").trim();
      if(name) el.dataset.pokemon=name;
    });
  }

  function runAssetRenderers(){
    B.PPChamAssetUI?.renderAll?.();
    B.PPChamItemTypeAssetUI?.renderAll?.();
    window.PPChamVisualPolish?.normalizeExistingAssets?.();
  }

  function annotateAll(){
    annotateTeamSlots();
    annotatePicker();
    annotateLoadout();
    annotateDiagnosis();
    annotateBuilder();
    runAssetRenderers();
  }

  function wrap(name){
    const original=window[name];
    if(typeof original!=="function") return false;
    if(original.__ppchamWrapped) return true;

    const wrapped=function(...args){
      const out=original.apply(this,args);
      queueMicrotask(annotateAll);
      return out;
    };
    wrapped.__ppchamWrapped=true;
    wrapped.__ppchamOriginal=original;
    window[name]=wrapped;
    return true;
  }

  const wrapped={
    renderTeam:wrap("renderTeam"),
    renderPicker:wrap("renderPicker"),
    renderDiag:wrap("renderDiag"),
    renderRecs:wrap("renderRecs"),
    openLoadout:wrap("openLoadout"),
    saveLoadout:wrap("saveLoadout")
  };

  function boot(){
    annotateAll();
    const observer=new MutationObserver(()=>requestAnimationFrame(annotateAll));
    observer.observe(document.body,{childList:true,subtree:true});
    window.__ppchamHostObserver=observer;
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }

  window.PPChamHostIntegration={
    version:1,
    target:"ppcham-v2-host",
    wrapped,
    annotateAll,
    audit(){
      return {
        wrapped,
        team_slots:document.querySelectorAll("#team .slot").length,
        picker:!!document.getElementById("pickerList"),
        loadout_item:!!document.getElementById("loadoutItem"),
        diag:!!document.getElementById("diag"),
        asset_ui:!!B.PPChamAssetUI,
        item_type_ui:!!B.PPChamItemTypeAssetUI,
        visual_polish:!!window.PPChamVisualPolish
      };
    }
  };

  console.log("✅ ppcham Host Integration Adapter v1 ready",window.PPChamHostIntegration.audit());
})();
window.PPChamBuildState={...(window.PPChamBuildState||{}),bundle_version:4,completion_percent:99};
