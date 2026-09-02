(()=>{
  const CONFIG_URL='/api/clerk-config';
  const loadScript=(src)=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=true;
    script.crossOrigin='anonymous';
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Failed to load ${src}`));
    document.head.append(script);
  });

  const injectStyles=()=>{
    if(document.getElementById('site-auth-styles'))return;
    const style=document.createElement('style');
    style.id='site-auth-styles';
    style.textContent=`
      .site-auth{display:flex;align-items:center;gap:8px;margin-left:8px;min-height:40px}
      .site-auth-button{appearance:none;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;border-radius:999px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer;white-space:nowrap;transition:transform .2s ease,background .2s ease,border-color .2s ease}
      .site-auth-button:hover{transform:translateY(-1px);background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.28)}
      .site-auth-dashboard{font-size:.88em;text-decoration:none;color:inherit;opacity:.88;white-space:nowrap}
      .site-auth-dashboard:hover{opacity:1}
      #clerk-user-button{display:flex;align-items:center;min-height:40px}
      .clerk-loading{font-size:.82rem;opacity:.65}
      @media(max-width:860px){.site-auth{margin:8px 0 0;justify-content:flex-start;width:100%}.site-auth-button{width:100%}.site-auth-dashboard{padding:10px 0}}
    `;
    document.head.append(style);
  };

  const getMount=()=>{
    let host=document.getElementById('clerk-auth');
    if(host)return host;
    const nav=document.querySelector('[data-site-nav]');
    if(!nav)return null;
    host=document.createElement('div');
    host.id='clerk-auth';
    host.className='site-auth';
    nav.append(host);
    return host;
  };

  const showSignedOut=(host,clerk)=>{
    host.replaceChildren();
    const signIn=document.createElement('button');
    signIn.className='site-auth-button';
    signIn.type='button';
    signIn.textContent='Hyr / Regjistrohu';
    signIn.addEventListener('click',()=>clerk.openSignIn({fallbackRedirectUrl:'/dashboard.html'}));
    host.append(signIn);
  };

  const showSignedIn=(host,clerk)=>{
    host.replaceChildren();
    const userNode=document.createElement('div');
    userNode.id='clerk-user-button';
    host.append(userNode);
    const dashboard=document.createElement('a');
    dashboard.className='site-auth-dashboard';
    dashboard.href='/dashboard.html';
    dashboard.textContent='Paneli im';
    host.append(dashboard);
    clerk.mountUserButton(userNode,{showName:false});
  };

  async function start(){
    const host=getMount();
    if(!host)return;
    injectStyles();
    host.innerHTML='<span class="clerk-loading">Po ngarkohet…</span>';
    try{
      const response=await fetch(CONFIG_URL,{cache:'no-store',headers:{Accept:'application/json'}});
      const config=await response.json();
      if(!response.ok||!config?.publishableKey)throw new Error(config?.error||'Clerk is not configured');

      const publishableKey=config.publishableKey;
      const encoded=publishableKey.split('_').slice(2).join('_');
      const clerkDomain=atob(encoded).replace(/\\$$/,'');
      await loadScript(`https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`);
      await loadScript(`https://${clerkDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`);

      const clerk=window.Clerk;
      if(!clerk)throw new Error('ClerkJS did not initialize');
      await clerk.load({ui:{ClerkUI:window.__internal_ClerkUICtor}});
      window.SiteClerk=clerk;

      if(clerk.isSignedIn)showSignedIn(host,clerk);
      else showSignedOut(host,clerk);
      clerk.addListener?.(()=>{
        if(clerk.isSignedIn)showSignedIn(host,clerk);
        else showSignedOut(host,clerk);
      });
    }catch(error){
      console.warn('[Clerk]',error);
      host.replaceChildren();
      const button=document.createElement('button');
      button.className='site-auth-button';
      button.type='button';
      button.textContent='Hyr / Regjistrohu';
      button.addEventListener('click',()=>alert('Clerk ende nuk është konfiguruar në Vercel.'));
      host.append(button);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
