(()=>{
  const CONFIG_URL='/api/clerk-config';
  const loadScript=(src)=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(new Error('ClerkJS could not load'));document.head.append(s)});
  const injectStyles=()=>{if(document.getElementById('site-auth-styles'))return;const style=document.createElement('style');style.id='site-auth-styles';style.textContent=`
    .site-auth{display:flex;align-items:center;gap:9px;margin-left:8px;min-height:40px}
    .site-auth-button{appearance:none;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;border-radius:999px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap;transition:transform .2s ease,background .2s ease,border-color .2s ease}
    .site-auth-button:hover{transform:translateY(-1px);background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.28)}
    .site-auth-dashboard{font-size:.88em;text-decoration:none;color:inherit;opacity:.88;white-space:nowrap}.site-auth-dashboard:hover{opacity:1}
    #clerk-user-button{display:flex;align-items:center;min-height:40px}
    .clerk-loading{font-size:.82rem;opacity:.65}
    @media(max-width:860px){.site-auth{margin:8px 0 0;justify-content:flex-start;width:100%}.site-auth-button{width:100%}.site-auth-dashboard{padding:10px 0}}
  `;document.head.append(style)};
  const getMount=()=>{let host=document.getElementById('clerk-auth');if(host)return host;const nav=document.querySelector('[data-site-nav]');if(!nav)return null;host=document.createElement('div');host.id='clerk-auth';host.className='site-auth';nav.append(host);return host};
  const showSignedOut=(host,clerk)=>{host.replaceChildren();const b=document.createElement('button');b.className='site-auth-button';b.type='button';b.textContent='Hyr / Regjistrohu';b.onclick=()=>clerk.openSignIn({fallbackRedirectUrl:'/dashboard.html'});host.append(b)};
  const showSignedIn=(host,clerk)=>{host.replaceChildren();const userNode=document.createElement('div');userNode.id='clerk-user-button';host.append(userNode);const dashboard=document.createElement('a');dashboard.className='site-auth-dashboard';dashboard.href='/dashboard.html';dashboard.textContent='Paneli im';host.append(dashboard);clerk.mountUserButton(userNode,{showName:false})};
  async function start(){const host=getMount();if(!host)return;injectStyles();host.innerHTML='<span class="clerk-loading">Po ngarkohet…</span>';try{const r=await fetch(CONFIG_URL,{cache:'no-store'});const cfg=await r.json();if(!r.ok||!cfg?.publishableKey)throw new Error(cfg?.error||'Clerk nuk është konfiguruar');await loadScript('https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js');const clerk=window.Clerk;if(!clerk)throw new Error('ClerkJS nuk u inicializua');await clerk.load({publishableKey:cfg.publishableKey});window.SiteClerk=clerk;window.dispatchEvent(new CustomEvent('site-clerk-ready',{detail:{clerk,user:clerk.user||null}}));if(clerk.isSignedIn)showSignedIn(host,clerk);else showSignedOut(host,clerk);clerk.addListener?.(()=>{if(clerk.isSignedIn)showSignedIn(host,clerk);else showSignedOut(host,clerk)})}catch(error){console.warn('[Clerk]',error);host.replaceChildren();const b=document.createElement('button');b.className='site-auth-button';b.type='button';b.textContent='Hyr / Regjistrohu';b.onclick=()=>window.location.href='/auth.html';host.append(b)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
