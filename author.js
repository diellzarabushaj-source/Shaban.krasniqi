const SANITY_PROJECT_ID='a1lswl1z';
const SANITY_DATASET='production';
const SANITY_API=`https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;

const AUTHOR_QUERY=`*[_type == "author" && slug.current == $slug][0]{
  _id,
  name,
  role,
  slug,
  shortBio,
  image{asset->{_id,url}},
  specialties,
  education,
  experience,
  languages,
  approach,
  bio,
  seo{
    title,
    description,
    noIndex
  },
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc){
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    featured,
    coverImage{
      asset->{_id,url},
      alt
    },
    category->{title,slug},
    author->{name,role,slug}
  }
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
  ?new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(date))
  :'';

function portableText(value){
  if(!Array.isArray(value))return '';
  return value.filter(block=>block?._type==='block').map(block=>{
    const text=(block.children||[]).map(child=>escapeHtml(child.text||'')).join('');
    if(block.style==='h2')return '<h2>'+text+'</h2>';
    if(block.style==='h3')return '<h3>'+text+'</h3>';
    return '<p>'+text+'</p>';
  }).join('');
}

function setMeta(selector,value,attribute='content'){
  const el=document.querySelector(selector);
  if(!el||!value)return;
  el.setAttribute(attribute,value);
}

function setSeo(author,slug){
  const title=author.seo?.title||author.name||'';
  const description=author.seo?.description||author.shortBio||'';
  const canonical='https://shabankrasniqi.com/author/'+encodeURIComponent(slug);
  const image=imageUrl(author.image,1200);
  document.title=title;
  setMeta('meta[name="description"]',description);
  setMeta('meta[property="og:title"]',title);
  setMeta('meta[property="og:description"]',description);
  setMeta('meta[property="og:type"]','profile');
  setMeta('meta[property="og:url"]',canonical);
  setMeta('meta[property="og:image"]',image);
  const canonicalEl=document.querySelector('link[rel="canonical"]');
  if(canonicalEl)canonicalEl.href=canonical;
  const robots=document.querySelector('meta[name="robots"]');
  if(robots)robots.content=author.seo?.noIndex?'noindex,nofollow':'index,follow';

  const jsonLd={
    '@context':'https://schema.org',
    '@type':'Person',
    name:author.name||'',
    jobTitle:author.role||'',
    image:image||undefined,
    description:description||undefined,
    url:canonical
  };
  const node=document.querySelector('[data-author-jsonld]');
  if(node)node.textContent=JSON.stringify(jsonLd);
}

function renderList(items=[]){
  if(!Array.isArray(items)||!items.length)return '';
  return '<ul>'+items.map(item=>'<li>'+escapeHtml(item)+'</li>').join('')+'</ul>';
}

function renderEducation(items=[]){
  if(!Array.isArray(items)||!items.length)return '';
  return items.map(item=>`<article class="author-education-item"><h3>${escapeHtml(item.title||'')}</h3>${item.description?`<p>${escapeHtml(item.description)}</p>`:''}</article>`).join('');
}

function postCard(post){
  const cover=imageUrl(post.coverImage,900);
  const slug=post.slug?.current||'';
  const href=slug?'blog/'+encodeURIComponent(slug):'#';
  return `<article class="blog-card">
    <a class="blog-card-media" href="${href}">
      ${cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(post.coverImage?.alt||'')}" loading="lazy" decoding="async">`:'<span class="blog-card-placeholder" aria-hidden="true"></span>'}
    </a>
    <div class="blog-card-body">
      <div class="blog-meta">${post.category?.title?`<span>${escapeHtml(post.category.title)}</span>`:''}<time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
      <h2><a href="${href}">${escapeHtml(post.title||'')}</a></h2>
      ${post.excerpt?`<p>${escapeHtml(post.excerpt)}</p>`:''}
      <a class="blog-read" href="${href}">Lexo artikullin <span>→</span></a>
    </div>
  </article>`;
}

async function load(){
  const slug=new URLSearchParams(location.search).get('slug')||'';
  if(!slug)throw new Error('missing slug');

  const response=await fetch(buildSanityUrl(AUTHOR_QUERY,{slug}));
  if(!response.ok)throw new Error('request failed');
  const author=(await response.json()).result;
  if(!author)throw new Error('author not found');

  setSeo(author,slug);

  document.querySelector('[data-author-name]').textContent=author.name||'';
  const role=document.querySelector('[data-author-role]');
  if(author.role){role.textContent=author.role;role.hidden=false}

  const portrait=imageUrl(author.image,900);
  const initials=(author.name||'').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  document.querySelector('[data-author-image]').innerHTML=portrait
    ?`<img src="${escapeHtml(portrait)}" alt="${escapeHtml(author.name||'')}" decoding="async">`
    :`<span class="author-portrait-fallback" aria-hidden="true">${escapeHtml(initials)}</span>`;

  const bio=portableText(author.bio);
  const bioRoot=document.querySelector('[data-author-bio]');
  bioRoot.innerHTML=bio||(author.shortBio?`<p>${escapeHtml(author.shortBio)}</p>`:'');
  document.querySelector('[data-author-first-name]').textContent=(author.name||'').split(/\s+/).filter(Boolean).slice(-2,-1)[0]||(author.name||'');

  const details=document.querySelector('[data-author-details]');
  const sections=[
    author.shortBio?`<section class="author-detail-card author-detail-wide"><span class="section-kicker">Profili</span><p>${escapeHtml(author.shortBio)}</p></section>`:'',
    author.specialties?.length?`<section class="author-detail-card"><span class="section-kicker">Specializime</span>${renderList(author.specialties)}</section>`:'',
    author.education?.length?`<section class="author-detail-card"><span class="section-kicker">Edukimi</span>${renderEducation(author.education)}</section>`:'',
    author.experience?`<section class="author-detail-card"><span class="section-kicker">Përvoja</span><p>${escapeHtml(author.experience)}</p></section>`:'',
    author.languages?.length?`<section class="author-detail-card"><span class="section-kicker">Gjuhët</span>${renderList(author.languages)}</section>`:'',
    author.approach?.length?`<section class="author-detail-card"><span class="section-kicker">Qasja</span>${renderList(author.approach)}</section>`:''
  ].filter(Boolean).join('');
  if(sections){details.innerHTML=sections;details.hidden=false}

  const posts=author.posts||[];
  document.querySelector('[data-author-post-count]').textContent=posts.length===1?'1 artikull':posts.length+' artikuj';
  document.querySelector('[data-author-posts]').innerHTML=posts.length
    ?posts.map(postCard).join('')
    :'<div class="blog-empty"><strong>Nuk ka artikuj ende.</strong></div>';

  document.querySelector('[data-author-loading]').hidden=true;
  document.querySelector('[data-author-profile]').hidden=false;
  document.querySelector('[data-author-posts-section]').hidden=false;
}

load().catch(()=>{
  document.querySelector('[data-author-loading]').hidden=true;
  document.querySelector('[data-author-error]').hidden=false;
});
