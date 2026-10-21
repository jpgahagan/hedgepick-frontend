/* HedgePick shared behaviour: header, menu, reveal, signed-in state */
(function(){
  var d=document;
  d.documentElement.classList.add('js');
  try{
    if(localStorage.getItem('hp_email')||localStorage.getItem('hp_session')){
      d.addEventListener('DOMContentLoaded',function(){
        d.querySelectorAll('[data-out]').forEach(function(e){e.style.display='none'});
        d.querySelectorAll('[data-in]').forEach(function(e){e.style.display=''});
      });
    }
  }catch(e){}
  if(typeof window.toggleMenu!=='function'){
    window.toggleMenu=function(){var h=d.getElementById('ham'),m=d.getElementById('mmenu');if(!h||!m)return;h.classList.toggle('open');m.classList.toggle('open');h.setAttribute('aria-expanded',m.classList.contains('open'))};
    window.closeMenu=function(){var h=d.getElementById('ham'),m=d.getElementById('mmenu');if(h)h.classList.remove('open');if(m)m.classList.remove('open')};
  }
  if(typeof window.doSignOut!=='function'){window.doSignOut=function(){localStorage.removeItem('hp_email');localStorage.removeItem('hp_session');location.href='/'}}
  if(typeof window.showSignIn!=='function'){window.showSignIn=function(){location.href=localStorage.getItem('hp_session')?'/dashboard':'/start?signin=1'}}
  function ready(){
    var hdr=d.getElementById('hdr');
    function sc(){if(hdr)hdr.classList.toggle('scrolled',window.scrollY>8)}
    window.addEventListener('scroll',sc,{passive:true});sc();
    var els=d.querySelectorAll('.rv');
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:.06});
      els.forEach(function(el){io.observe(el)});
    }else{els.forEach(function(el){el.classList.add('in')})}
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&window.closeMenu)closeMenu()});
    // Table of contents highlighting (legal pages)
    var toc=d.querySelectorAll('.toc a');
    if(toc.length&&'IntersectionObserver' in window){
      var map={};toc.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
      var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){toc.forEach(function(a){a.classList.remove('on')});var a=map[e.target.id];if(a)a.classList.add('on')}})},{rootMargin:'-20% 0px -70% 0px'});
      d.querySelectorAll('.prose h2[id]').forEach(function(h){io2.observe(h)});
    }
  }
  if(d.readyState!=='loading')ready();else d.addEventListener('DOMContentLoaded',ready);
})();

/* Continue with Google. Hidden unless the backend reports a client id. */
(function(){
  var API='https://web-production-45241.up.railway.app',cfgP=null,gisP=null;
  function cfg(){if(!cfgP)cfgP=fetch(API+'/api/auth/config').then(function(r){return r.ok?r.json():{}}).then(function(j){return j&&j.google_client_id||null}).catch(function(){return null});return cfgP}
  function gis(){if(!gisP)gisP=new Promise(function(ok,no){if(window.google&&google.accounts&&google.accounts.id)return ok();var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=function(){ok()};s.onerror=no;document.head.appendChild(s)});return gisP}
  window.hpGoogle=function(o){
    // o: {wrap, btn, before(), err(msg), width}
    var wrap=document.getElementById(o.wrap),btn=document.getElementById(o.btn);if(!wrap||!btn)return;
    cfg().then(function(id){if(!id)return;return gis().then(function(){
      google.accounts.id.initialize({client_id:id,ux_mode:'popup',auto_select:false,cancel_on_tap_outside:true,callback:function(res){
        if(o.before)try{o.before()}catch(e){}
        fetch(API+'/api/auth/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:res.credential})})
        .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
        .then(function(x){
          if(!x.ok||!x.j.session){if(o.err)o.err(x.j.error||'Google sign-in failed. Please use email instead.');return}
          localStorage.setItem('hp_session',x.j.session);
          try{if(window.gtag)gtag('event',x.j.new?'sign_up':'login',{method:'Google'})}catch(e){}
          location.href='/dashboard'+(x.j.new?'?new=1':'');
        }).catch(function(){if(o.err)o.err('Could not reach the server. Please try again.')});
      }});
      var w=Math.round(btn.getBoundingClientRect().width||wrap.getBoundingClientRect().width||Math.min(360,window.innerWidth-72));w=Math.min(400,Math.max(200,w));
      google.accounts.id.renderButton(btn,{type:'standard',theme:'filled_black',size:'large',shape:'pill',text:o.text||'continue_with',logo_alignment:'center',width:w});
      wrap.hidden=false;wrap.style.display='';
    })}).catch(function(){});
  };
})();
