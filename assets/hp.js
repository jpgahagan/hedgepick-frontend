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
  if(typeof window.showSignIn!=='function'){window.showSignIn=function(){location.href=localStorage.getItem('hp_session')?'/dashboard':'/?signin=1'}}
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
