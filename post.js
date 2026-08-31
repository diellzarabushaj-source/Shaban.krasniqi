const SANITY_PROJECT_ID='a1lswl1z';
const SANITY_DATASET='production';
const SANITY_API=`https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;

const ARTICLE_QUERY=`*[_type == "post" && slug.current == $slug][0]{
  ...,
  coverImage{
    asset->{_id,url},
    alt
  },
  seo{
    title,
    description,
    noIndex,
    image{asset->{_id,url},alt}
  },
  category->{title,slug,description},
  author->{
    _id,
    name,
    role,
    slug,
    shortBio,
    image{asset->{_id,url}}
  }
}`;

const RELATED_QUERY=`*[_type == "post" && defined(publishedAt) && slug.current != $slug] | order(publishedAt desc)[0...3]{
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  coverImage{asset->{_id,url},alt},
  category->{title,slug},
  author->{name,role,slug}
}`;

const escapeHtml=(value='')=>String(value)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

function buildSanityUrl(query,params={}){
  const url=new URL(SANITY_API);
  url.searchParams.set('query',query);
  for(const [key,value] of Object.entries(params))url.searchParams.set('$'+key,JSON.stringify(value));
  return url.toString();
}

const imageUrl=(image,width)=>{
  const src=image?.asset?.url;
  if(!src)return '';
  try{
    const url=new URL(src);
    url.searchParams.set('auto','format');
    url.searchParams.set('fit','max');
    if(width)url.searchParams.set('w',String(width));
    return url.toString();
  }catch{return src}
};

const formatDate=(date)=>date
  ?new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(date))
  :'';

function setMeta(selector,value,attribute='content'){
  const el=document.querySelector(selector);
  if(!el||!value)return;
  el.setAttribute(attribute,value);
}
function setSeo(post,slug){
  const title=post.seo?.title||post.title||'';
  const description=post.seo?.description||post.excerpt||'';
  const canonical=new URL('post.html?slug='+encodeURIComponent(slug),location.href).href;
  const ogImage=imageUrl(post.seo?.image||post.coverImage,1600);
  document.title=title;
  setMeta('meta[name="description"]',description);
  setMeta('meta[name="author"]',post.author?.name||'');
  setMeta('meta[property="og:title"]',title);
  setMeta('meta[property="og:description"]',description);
  setMeta('meta[property="og:type"]','article');
  setMeta('meta[property="og:url"]',canonical);
  setMeta('meta[property="og:image"]',ogImage);
  setMeta('meta[name="twitter:title"]',title);
  setMeta('meta[name="twitter:description"]',description);
  setMeta('meta[name="twitter:image"]',ogImage);
  const canonicalEl=document.querySelector('link[rel="canonical"]');
  if(canonicalEl)canonicalEl.href=canonical;
  const robots=document.querySelector('meta[name="robots"]');
  if(robots)robots.content=post.seo?.noIndex?'noindex,nofollow':'index,follow';
}

function marks(text,markDefs=[],marks=[]){
  let output=escapeHtml(text||'');
  for(const mark of marks||[]){
    if(mark==='strong')output='<strong>'+output+'</strong>';
    else if(mark==='em')output='<em>'+output+'</em>';
    else{
      const def=markDefs.find(item=>item._key===mark);
      if(def?._type==='link'&&/^https?:\/\//i.test(def.href||'')){
        output=`<a href="${escapeHtml(def.href)}" target="_blank" rel="noopener noreferrer">${output}</a>`;
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
      if(src)html+=`<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt||'')}" loading="lazy" decoding="async">${block.caption?`<figcaption>${escapeHtml(block.caption)}</figcaption>`:''}</figure>`;
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

function authorMarkup(author){
  if(!author?.name||!author.slug?.current)return '';
  const href='author.html?slug='+encodeURIComponent(author.slug.current);
  const avatar=imageUrl(author.image,160);
  const initials=author.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  return `<a class="article-author-compact" href="${href}" aria-label="Rreth autorit ${escapeHtml(author.name)}">
    ${avatar?`<img src="${escapeHtml(avatar)}" alt="" width="44" height="44" loading="lazy" decoding="async">`:`<span class="article-author-fallback" aria-hidden="true">${escapeHtml(initials)}</span>`}
    <div><small>Shkruar nga</small><strong>${escapeHtml(author.name)}</strong>${author.role?`<em>${escapeHtml(author.role)}</em>`:''}</div>
  </a>`;
}

function relatedCard(post){
  const cover=imageUrl(post.coverImage,900);
  const slug=post.slug?.current||'';
  const href=slug?'post.html?slug='+encodeURIComponent(slug):'#';
  return `<article class="blog-card">
    <a class="blog-card-media" href="${href}">
      ${cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(post.coverImage?.alt||'')}" loading="lazy" decoding="async">`:'<span class="blog-card-placeholder" aria-hidden="true"></span>'}
    </a>
    <div class="blog-card-body">
      <div class="blog-meta">${post.category?.title?`<span>${escapeHtml(post.category.title)}</span>`:''}<time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
      <h2><a href="${href}">${escapeHtml(post.title||'')}</a></h2>
      <a class="blog-read" href="${href}">Lexo artikullin <span>→</span></a>
    </div>
  </article>`;
}

async function load(){
  const slug=new URLSearchParams(location.search).get('slug')||'';
  if(!slug)throw new Error('missing slug');

  const response=await fetch(buildSanityUrl(ARTICLE_QUERY,{slug}));
  if(!response.ok)throw new Error('request failed');
  const post=(await response.json()).result;
  if(!post)throw new Error('not found');

  setSeo(post,slug);
  document.querySelector('[data-article-category]').textContent=post.category?.title||'';
  const time=document.querySelector('[data-article-date]');
  time.textContent=formatDate(post.publishedAt);
  time.dateTime=post.publishedAt||'';
  document.querySelector('[data-article-title]').textContent=post.title||'';
  document.querySelector('[data-article-excerpt]').textContent=post.excerpt||'';

  const heroAuthor=document.querySelector('[data-article-author]');
  const authorHtml=authorMarkup(post.author);
  if(authorHtml){heroAuthor.innerHTML=authorHtml;heroAuthor.hidden=false}

  document.querySelector('[data-article-body]').innerHTML=renderPortableText(post.body||[]);
  const cover=document.querySelector('[data-article-cover]');
  const src=imageUrl(post.coverImage,2000);
  cover.innerHTML=src?`<img src="${escapeHtml(src)}" alt="${escapeHtml(post.coverImage?.alt||'')}" decoding="async">`:'';

  fetch(buildSanityUrl(RELATED_QUERY,{slug}))
    .then(item=>item.ok?item.json():Promise.reject())
    .then(({result=[]})=>{document.querySelector('[data-related-posts]').innerHTML=result.map(relatedCard).join('');})
    .catch(()=>{});

  document.querySelector('[data-article-loading]').hidden=true;
  document.querySelector('[data-article]').hidden=false;
}

load().catch(()=>{
  document.querySelector('[data-article-loading]').hidden=true;
  document.querySelector('[data-article-error]').hidden=false;
});
