const SANITY_PROJECT_ID='a1lswl1z';
const SANITY_DATASET='production';
const SANITY_API=`https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;

const escapeHtml=(value='')=>String(value)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');
const imageUrl=(ref,width=1800)=>{
  const id=ref?.asset?._ref||'';
  const match=id.match(/^image-([^-]+)-([^-]+)-([a-z0-9]+)$/i);
  return match?`https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${match[1]}-${match[2]}.${match[3]}?auto=format&w=${width}&q=86`:'';
};
const formatDate=(date)=>date?new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(date)):'';
const authorData=(post)=>{
  const author=post?.authorRef||post?.authorInline;
  if(!author||author._ref)return null;
  return {
    name:author.name||author.fullName||author.title||'',
    image:author.image||author.avatar||null,
    bio:author.bio||'',
    role:author.role||''
  };
};
const plainTextFromPortable=(value)=>{
  if(typeof value==='string')return value;
  if(!Array.isArray(value))return '';
  return value.filter(block=>block?._type==='block').map(block=>(block.children||[]).map(child=>child.text||'').join('')).join(' ');
};
const authorMarkup=(author,compact=false)=>{
  if(!author?.name)return '';
  const avatar=imageUrl(author.image,400);
  const initials=author.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  const photo=avatar?`<img src="${avatar}" alt="" loading="lazy" decoding="async">`:`<span class="article-author-fallback" aria-hidden="true">${escapeHtml(initials||'A')}</span>`;
  if(compact)return `<div class="article-author-compact">${photo}<div><small>Shkruar nga</small><strong>${escapeHtml(author.name)}</strong>${author.role?`<em>${escapeHtml(author.role)}</em>`:''}</div></div>`;
  const bio=plainTextFromPortable(author.bio);
  return `<div class="article-author-card-inner">${photo}<div><span class="section-kicker">Rreth autorit</span><h2>${escapeHtml(author.name)}</h2>${author.role?`<strong class="article-author-role">${escapeHtml(author.role)}</strong>`:''}${bio?`<p>${escapeHtml(bio)}</p>`:''}</div></div>`;
};

function marks(text,markDefs=[],marks=[]){
  let output=escapeHtml(text||'');
  for(const mark of marks||[]){
    if(mark==='strong')output='<strong>'+output+'</strong>';
    else if(mark==='em')output='<em>'+output+'</em>';
    else{
      const def=markDefs.find(item=>item._key===mark);
      if(def?._type==='link'&&def.href){
        const safe=/^https?:\/\//i.test(def.href)?def.href:'#';
        output=`<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${output}</a>`;
      }
    }
  }
  return output;
}

function renderPortableText(blocks=[]){
  let html='';
  let listType=null;
  const closeList=()=>{if(listType){html+=listType==='number'?'</ol>':'</ul>';listType=null;}};
  for(const block of blocks||[]){
    if(block._type==='image'){
      closeList();
      const src=imageUrl(block,1600);
      if(src)html+=`<figure><img src="${src}" alt="${escapeHtml(block.alt||'')}" loading="lazy" decoding="async">${block.caption?`<figcaption>${escapeHtml(block.caption)}</figcaption>`:''}</figure>`;
      continue;
    }
    if(block._type!=='block')continue;
    const inner=(block.children||[]).map(child=>marks(child.text,block.markDefs,child.marks)).join('');
    if(block.listItem){
      const nextType=block.listItem==='number'?'number':'bullet';
      if(listType!==nextType){closeList();listType=nextType;html+=nextType==='number'?'<ol>':'<ul>';}
      html+='<li>'+inner+'</li>';
      continue;
    }
    closeList();
    if(block.style==='h2')html+='<h2>'+inner+'</h2>';
    else if(block.style==='h3')html+='<h3>'+inner+'</h3>';
    else if(block.style==='h4')html+='<h4>'+inner+'</h4>';
    else if(block.style==='blockquote')html+='<blockquote>'+inner+'</blockquote>';
    else html+='<p>'+inner+'</p>';
  }
  closeList();
  return html;
}

function relatedCard(post){
  const image=imageUrl(post.coverImage,900);
  const slug=post.slug?.current||'';
  return `<article class="blog-card">
    <a class="blog-card-media" href="post.html?slug=${encodeURIComponent(slug)}">${image?`<img src="${image}" alt="" loading="lazy">`:'<span class="blog-card-placeholder" aria-hidden="true">SK</span>'}</a>
    <div class="blog-card-body">
      <div class="blog-meta"><span>${escapeHtml(post.category?.title||'Fizioterapi')}</span><time>${formatDate(post.publishedAt)}</time></div>
      <h2><a href="post.html?slug=${encodeURIComponent(slug)}">${escapeHtml(post.title||'Pa titull')}</a></h2>
      ${authorData(post)?.name?`<div class="blog-author blog-author-compact"><span class="blog-author-fallback" aria-hidden="true">${escapeHtml(authorData(post).name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase())}</span><div><small>Nga</small><strong>${escapeHtml(authorData(post).name)}</strong></div></div>`:''}
      <a class="blog-read" href="post.html?slug=${encodeURIComponent(slug)}">Lexo artikullin <span>→</span></a>
    </div>
  </article>`;
}

async function load(){
  const slug=new URLSearchParams(location.search).get('slug')||'';
  if(!slug)throw new Error('missing slug');
  const query=encodeURIComponent(`*[_type == "post" && slug.current == ${JSON.stringify(slug)}][0]{title,slug,excerpt,publishedAt,coverImage,category->{title,slug},body,"authorRef":author->{name,title,fullName,image,avatar,bio,role,slug},"authorInline":author}`);
  const response=await fetch(`${SANITY_API}?query=${query}`);
  if(!response.ok)throw new Error('request failed');
  const post=(await response.json()).result;
  if(!post)throw new Error('not found');

  document.title=(post.title||'Artikull')+' | Shaban Krasniqi';
  document.querySelector('[data-article-category]').textContent=post.category?.title||'Fizioterapi';
  const time=document.querySelector('[data-article-date]');
  time.textContent=formatDate(post.publishedAt);time.dateTime=post.publishedAt||'';
  document.querySelector('[data-article-title]').textContent=post.title||'';
  document.querySelector('[data-article-excerpt]').textContent=post.excerpt||'';
  const author=authorData(post);
  const heroAuthor=document.querySelector('[data-article-author]');
  const fullAuthor=document.querySelector('[data-article-author-card]');
  if(author?.name){
    heroAuthor.innerHTML=authorMarkup(author,true);
    heroAuthor.hidden=false;
    fullAuthor.innerHTML=authorMarkup(author,false);
    fullAuthor.hidden=false;
  }
  document.querySelector('[data-article-body]').innerHTML=renderPortableText(post.body||[]);
  const cover=document.querySelector('[data-article-cover]');
  const src=imageUrl(post.coverImage,2000);
  cover.innerHTML=src?`<img src="${src}" alt="" decoding="async">`:'<div class="article-cover-placeholder" aria-hidden="true"></div>';

  const relatedQuery=encodeURIComponent(`*[_type == "post" && defined(publishedAt) && slug.current != ${JSON.stringify(slug)}] | order(publishedAt desc)[0...3]{title,slug,publishedAt,coverImage,category->{title},"authorRef":author->{name,title,fullName,image,avatar,role},"authorInline":author}`);
  fetch(`${SANITY_API}?query=${relatedQuery}`).then(r=>r.ok?r.json():Promise.reject()).then(({result=[]})=>{
    document.querySelector('[data-related-posts]').innerHTML=result.map(relatedCard).join('');
  }).catch(()=>{});

  document.querySelector('[data-article-loading]').hidden=true;
  document.querySelector('[data-article]').hidden=false;
}

load().catch(()=>{
  document.querySelector('[data-article-loading]').hidden=true;
  document.querySelector('[data-article-error]').hidden=false;
});
