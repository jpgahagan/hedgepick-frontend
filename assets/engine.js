/* HedgePick Debate Engine — a live diagram of the real 12-agent pipeline.
   HPEngine.mount(el, {mode:'auto'|'manual', data:[...]})
   auto:   replays published debates (bull/bear excerpts typed, verdict lands)
   manual: api.setStage(n) highlights a stage (used for scroll-driven sections) */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COL={blue:'#5b93f5',green:'#22c27a',red:'#f0606e',gold:'#e3a83a',dim:'rgba(255,255,255,.55)'};
  var N=[ // id, label, x, y, w, h, group
    ['tec','Technicals',4,8,86,32,'an'],['sen','Sentiment',98,8,86,32,'an'],['nws','News & macro',192,8,100,32,'an'],['fnd','Fundamentals',300,8,96,32,'an'],
    ['bul','Bull researcher',20,94,156,42,'bul'],['ber','Bear researcher',224,94,156,42,'ber'],
    ['rsm','Research manager',118,168,164,34,'rsm'],
    ['trd','Trader',150,222,100,30,'trd'],
    ['agg','Aggressive',12,274,112,30,'rsk'],['neu','Neutral',144,274,112,30,'rsk'],['con','Conservative',276,274,112,30,'rsk'],
    ['pm','Portfolio manager',104,328,164,38,'pm']
  ];
  function nb(id){for(var i=0;i<N.length;i++)if(N[i][0]===id)return N[i]}
  function bc(id){var n=nb(id);return [n[2]+n[4]/2,n[3]+n[5]]}
  function tc(id){var n=nb(id);return [n[2]+n[4]/2,n[3]]}
  function curve(a,b){var my=(a[1]+b[1])/2;return 'M'+a[0]+' '+a[1]+' C'+a[0]+' '+my+' '+b[0]+' '+my+' '+b[0]+' '+b[1]}
  var E=[]; // id, d
  ['tec','sen','nws','fnd'].forEach(function(a){E.push([a+'-bul',curve(bc(a),tc('bul'))]);E.push([a+'-ber',curve(bc(a),tc('ber'))])});
  E.push(['bul-ber','M176 106 C 192 92, 208 92, 224 106']);
  E.push(['ber-bul','M224 124 C 208 138, 192 138, 176 124']);
  E.push(['bul-rsm',curve(bc('bul'),tc('rsm'))]);E.push(['ber-rsm',curve(bc('ber'),tc('rsm'))]);
  E.push(['rsm-trd',curve(bc('rsm'),tc('trd'))]);
  ['agg','neu','con'].forEach(function(r){E.push(['trd-'+r,curve(bc('trd'),tc(r))]);E.push([r+'-pm',curve(bc(r),tc('pm'))])});
  E.push(['pm-v','M268 347 L 300 347']);

  // Stages: lit nodes, active edges (flow), colour, caption
  var S=[
    {n:[],e:[],c:COL.blue},
    {n:['tec','sen','nws','fnd'],e:['tec-bul','tec-ber','sen-bul','sen-ber','nws-bul','nws-ber','fnd-bul','fnd-ber'],c:COL.blue,
      k:'Stage 1 · Evidence',t:'Four analysts work separately: price and technicals, sentiment, news and macro, and the company’s financials.'},
    {n:['bul'],e:['bul-ber'],c:COL.green,k:'Stage 2 · Bull researcher',t:''},
    {n:['ber'],e:['ber-bul'],c:COL.red,k:'Stage 2 · Bear researcher',t:''},
    {n:['rsm'],e:['bul-rsm','ber-rsm'],c:COL.blue,k:'Stage 3 · Research manager',t:''},
    {n:['trd','agg','neu','con'],e:['rsm-trd','trd-agg','trd-neu','trd-con','agg-pm','neu-pm','con-pm'],c:COL.gold,
      k:'Stage 4 · Trader and risk desk',t:'The trader turns the plan into a position. Aggressive, neutral and conservative risk analysts argue over size, stop loss and target.'},
    {n:['pm'],e:['pm-v'],c:COL.gold,k:'Stage 5 · Portfolio manager',t:''},
    {n:['bul','ber'],e:['bul-ber','ber-bul'],c:COL.blue,ord:3.5}
  ];
  var GROUP_STAGE={an:1,bul:2,ber:3,rsm:4,trd:5,rsk:5,pm:6};

  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
  function money(p){return p==null?'—':'$'+Number(p).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function sd(iso){try{return new Date(iso+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}catch(e){return iso}}
  function clip(s,n){s=String(s||'').replace(/\s+/g,' ').replace(/\*\*/g,'').trim();return s.length>n?s.slice(0,n).replace(/\s+\S*$/,'')+'…':s}

  function buildSVG(host){
    var svg=el('svg',{viewBox:'0 0 400 372',class:'eng-svg',role:'img','aria-label':'Diagram of the HedgePick debate pipeline'});
    var gE=el('g',{class:'eng-edges'},svg),gN=el('g',{class:'eng-nodes'},svg),gP=el('g',{class:'eng-pulses'},svg);
    var edges={},nodes={};
    E.forEach(function(x){edges[x[0]]=el('path',{d:x[1],class:'eng-e'},gE)});
    N.forEach(function(n){
      var g=el('g',{class:'eng-n g-'+n[6],'data-g':n[6]},gN);
      el('rect',{x:n[2],y:n[3],width:n[4],height:n[5],rx:8},g);
      var t=el('text',{x:n[2]+n[4]/2,y:n[3]+n[5]/2+4,'text-anchor':'middle'},g);t.textContent=n[1];
      nodes[n[0]]=g;
    });
    var vg=el('g',{class:'eng-v'},svg);
    el('rect',{x:300,y:330,width:92,height:34,rx:8},vg);
    var vt=el('text',{x:346,y:352,'text-anchor':'middle'},vg);vt.textContent='—';
    host.appendChild(svg);
    return {svg:svg,edges:edges,nodes:nodes,pulses:gP,vg:vg,vt:vt};
  }

  function mount(host,opts){
    opts=opts||{};
    var G=buildSVG(host.querySelector('.eng-stage')||host);
    var flows=[],raf=0,vis=true,stage=0,lastT=0;
    function lens(id){var p=G.edges[id];return p._len||(p._len=p.getTotalLength())}
    function setStage(n,color){
      stage=n;var st=S[n]||S[0],ord=st.ord||n;
      N.forEach(function(x){
        var g=G.nodes[x[0]],sn=GROUP_STAGE[x[6]];
        g.classList.toggle('lit',st.n.indexOf(x[0])>=0);
        g.classList.toggle('done',sn<ord&&st.n.indexOf(x[0])<0);
      });
      for(var id in G.edges){G.edges[id].classList.toggle('on',st.e.indexOf(id)>=0);G.edges[id].style.stroke=st.e.indexOf(id)>=0?(color||st.c):''}
      host.dataset.stage=n;
      var ec=function(id){return id==='bul-ber'?COL.green:id==='ber-bul'?COL.red:(color||st.c)};
      for(var k in G.edges){if(st.e.indexOf(k)>=0)G.edges[k].style.stroke=ec(k)}
      flows=st.e.map(function(id,i){return {id:id,off:(i*0.17)%1,c:ec(id)}});
      if(!RM)loop();
    }
    function loop(){if(raf)return;raf=requestAnimationFrame(tick)}
    function tick(t){
      raf=0;if(!vis||RM){G.pulses.innerHTML='';return}
      G.pulses.innerHTML='';
      var ph=(t/1400)%1;
      flows.forEach(function(f){
        var L=lens(f.id),p=(ph+f.off)%1,pt=G.edges[f.id].getPointAtLength(L*p);
        var c=el('circle',{cx:pt.x,cy:pt.y,r:2.6,fill:f.c},G.pulses);
        c.style.opacity=String(Math.sin(p*Math.PI));
        var p2=Math.max(0,p-.06),pt2=G.edges[f.id].getPointAtLength(L*p2);
        var c2=el('circle',{cx:pt2.x,cy:pt2.y,r:1.6,fill:f.c},G.pulses);c2.style.opacity=String(Math.sin(p*Math.PI)*.4);
      });
      if(flows.length)raf=requestAnimationFrame(tick);
    }
    function verdict(v){
      G.vg.setAttribute('class','eng-v'+(v?' on '+v:''));G.vt.textContent=v||'—';
    }
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){es.forEach(function(e){var was=vis;vis=e.isIntersecting;if(vis&&!was&&flows.length)loop();if(api.onVis)api.onVis(vis,was)})},{threshold:.15}).observe(host);
    }
    var api={setStage:setStage,verdict:verdict,host:host};
    if(opts.mode==='auto')autoplay(api,host,opts);
    return api;
  }

  function autoplay(api,host,opts){
    var $=function(s){return host.querySelector(s)};
    var cap=$('.eng-cap'),capK=$('.eng-cap-k'),capT=$('.eng-cap-t');
    var DATA=opts.data&&opts.data.length?opts.data:[],idx=0,step=0,steps=[],timers=[],paused=false,running=false,held=false;
    function T(fn,ms){timers.push(setTimeout(fn,ms))}
    function clearT(){timers.forEach(clearTimeout);timers=[]}
    function words(t){return String(t||'').split(/\s+/).filter(Boolean).length}
    // Reading time: ~230 words a minute, never less than 4.5s, never more than 13s.
    function dwell(t){return Math.max(4500,Math.min(13000,1600+words(t)*260))}
    function build(a){
      var fin=a.verdict==='HOLD'?'Neither side carried it decisively. The portfolio manager holds.':(a.verdict==='BUY'?'The bull case carried it. The portfolio manager rules BUY.':'The bear case carried it. The portfolio manager rules SELL.');
      return [
        {st:1,k:S[1].k,t:S[1].t},
        {st:2,k:S[2].k,t:'“'+clip(a.bull_excerpt,230)+'”',cls:'v-BUY',typed:1},
        {st:3,k:S[3].k,t:'“'+clip(a.bear_excerpt,230)+'”',cls:'v-SELL',typed:1},
        {st:4,k:S[4].k,t:clip(a.judge_excerpt,230),typed:1},
        {st:5,k:S[5].k,t:S[5].t},
        {st:6,k:'Final ruling · '+a.verdict,t:fin,cls:'v-'+a.verdict,v:a.verdict,hold:2500}
      ];
    }
    function show(s,typed,done){
      api.setStage(s.st);api.verdict(s.v||'');
      capK.textContent=s.k;cap.className='eng-cap '+(s.cls||'');
      if(!typed||RM){capT.textContent=s.t;capT.classList.remove('typing');done&&done();return}
      var i=0;capT.textContent='';capT.classList.add('typing');
      (function tk(){i+=2;capT.textContent=s.t.slice(0,i);if(i<s.t.length)timers.push(setTimeout(tk,24));else{capT.classList.remove('typing');done&&done()}})();
    }
    function run(j){
      clearT();step=j;var s=steps[j];running=true;
      show(s,s.typed,function(){T(advance,dwell(s.t)+(s.hold||0))});
    }
    function advance(){if(held||paused)return;if(step<steps.length-1)run(step+1);else play(idx+1)}
    function header(a){
      $('.eng-tk').textContent=a.ticker;$('.eng-nm').textContent=a.name||a.ticker;
      $('.eng-px').textContent=money(a.price);$('.eng-dt').textContent=sd(a.date);
      var l=$('.eng-link');if(l)l.href=a.url;
      var d=$('.eng-dots');if(d)d.innerHTML=DATA.map(function(x,i){return '<button type="button" aria-label="Show '+x.ticker+'"'+(i===idx?' class="on"':'')+' data-i="'+i+'"></button>'}).join('');
    }
    function final(){if(!steps.length)return;clearT();running=false;step=steps.length-1;show(steps[step],false)}
    function play(i){
      if(!DATA.length)return;
      clearT();idx=(i+DATA.length)%DATA.length;steps=build(DATA[idx]);header(DATA[idx]);run(0);
    }
    // Press and hold any stage to pause on it; let go and the loop carries on.
    var hint=document.createElement('span');hint.className='eng-hint';
    var HINT=('ontouchstart' in window)?'Hold a step to pause':'Hold any step to pause';
    hint.textContent=HINT;var foot=$('.eng-foot');if(foot)foot.insertBefore(hint,$('.eng-dots'));
    var pend=0,downAt=0,target=null;
    function stageOf(e){
      var n=e.target.closest&&e.target.closest('.eng-n');if(n)return GROUP_STAGE[n.getAttribute('data-g')];
      if(e.target.closest&&e.target.closest('.eng-cap,.eng-v'))return step+1;
      return 0;
    }
    function beginHold(st){
      held=true;clearT();host.classList.add('held');hint.textContent='Paused · let go to continue';
      if(steps.length){step=Math.max(0,Math.min(steps.length-1,st-1));show(steps[step],false)}
      if(window.gtag)gtag('event','engine_hold',{stage:st});
    }
    function endHold(){
      if(!held)return;held=false;host.classList.remove('held');hint.textContent=HINT;
      var quick=Date.now()-downAt<700;
      if(!paused&&steps.length)T(advance,quick?dwell(steps[step].t):1800);
    }
    host.addEventListener('pointerdown',function(e){
      if(e.button>0)return;var st=stageOf(e);if(!st||!DATA.length)return;
      downAt=Date.now();target=st;clearTimeout(pend);
      if(e.pointerType==='mouse'){e.preventDefault();beginHold(st)}else pend=setTimeout(function(){beginHold(st)},140);
    });
    function up(e){if(pend){clearTimeout(pend);pend=0;if(e.type==='pointerup'&&!held&&target){beginHold(target);}}target=null;endHold()}
    window.addEventListener('pointerup',up);window.addEventListener('pointercancel',function(){clearTimeout(pend);pend=0;target=null;endHold()});
    host.addEventListener('contextmenu',function(e){if(e.target.closest('.eng-stage,.eng-cap'))e.preventDefault()});
    var pb=$('.eng-pause'),nx=$('.eng-next'),dt=$('.eng-dots');
    if(nx)nx.addEventListener('click',function(){paused=false;if(pb){pb.textContent='Pause';pb.setAttribute('aria-pressed','false')}play(idx+1);if(window.gtag)gtag('event','engine_next')});
    if(dt)dt.addEventListener('click',function(e){var b=e.target.closest('button');if(b)play(+b.dataset.i)});
    if(pb)pb.addEventListener('click',function(){paused=!paused;pb.textContent=paused?'Play':'Pause';pb.setAttribute('aria-pressed',paused);if(paused)clearT();else advance()});
    api.onVis=function(v,was){if(held)return;if(!v&&running){final()}else if(v&&!was&&!paused&&DATA.length){play(idx+1)}};
    document.addEventListener('visibilitychange',function(){if(document.hidden&&running&&!held)final()});
    api.load=function(list){
      var ok=(list||[]).filter(function(a){return a.bull_excerpt&&a.bear_excerpt&&a.verdict});
      if(!ok.length)return;var seen={},lead=[],rest=[];
      ok.forEach(function(a){(seen[a.verdict]?rest:lead).push(a);seen[a.verdict]=1});
      DATA=lead.concat(rest).slice(0,6);if(!paused)play(0);
    };
    if(DATA.length)play(0);
  }
  window.HPEngine={mount:mount,stages:S};
})();
