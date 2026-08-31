const SANITY_PROJECT_ID='a1lswl1z';
const SANITY_DATASET='production';
const SANITY_API=`https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;

const BLOG_QUERY=`*[_type == "post"] | order(publishedAt desc)[0...3]{
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
  category->{title,slug,description},
  author->{
    _id,
    name,
    role,
    slug,
    image{asset->{_id,url}}
  }
}`;

const escapeHtml=(value='')=>String(value)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

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

const authorHref=(author)=>author?.slug?.current
  ?'author.html?slug='+encodeURIComponent(author.slug.current)
  :'';

function authorBadge(author,variant='compact'){
  const href=authorHref(author);
  if(!author?.name||!href)return '';
  const authorImage=imageUrl(author.image,160);
  const initials=author.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  const size=variant==='featured'?38:34;
  return `<a class="blog-author blog-author-${variant}" href="${href}" aria-label="Rreth autorit ${escapeHtml(author.name)}">
    ${authorImage?`<img src="${escapeHtml(avatar)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`:`<span class="blog-author-fallback" aria-hidden="true">${escapeHtml(initials)}</span>`}
    <div><small>Nga</small><strong>${escapeHtml(author.name)}</strong>${variant==='featured'&&author.role?`<em>${escapeHtml(author.role)}</em>`:''}</div>
  </a>`;
}

async function loadPosts(){
  const response=await fetch(SANITY_API+'?query='+encodeURIComponent(BLOG_QUERY));
  if(!response.ok)throw new Error('Sanity nuk u përgjigj.');
  return (await response.json()).result||[];
}

function card(post){
  const cover=imageUrl(post.coverImage,1000);
  const slug=post.slug?.current||'';
  const href=slug?'post.html?slug='+encodeURIComponent(slug):'#';
  const categorySlug=post.category?.slug?.current||'';
  return `<article class="blog-card" data-category="${escapeHtml(categorySlug)}">
    <a class="blog-card-media" href="${href}" aria-label="Lexo: ${escapeHtml(post.title||'')}">
      ${cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(post.coverImage?.alt||'')}" loading="lazy" decoding="async">`:'<span class="blog-card-placeholder" aria-hidden="true"></span>'}
    </a>
    <div class="blog-card-body">
      <div class="blog-meta">${post.category?.title?`<span>${escapeHtml(post.category.title)}</span>`:''}<time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
      <h2><a href="${href}">${escapeHtml(post.title||'')}</a></h2>
      ${post.excerpt?`<p>${escapeHtml(post.excerpt)}</p>`:''}
      ${authorBadge(post.author)}
      <a class="blog-read" href="${href}">Lexo artikullin <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

function featured(post){
  const root=document.querySelector('[data-blog-featured]');
  if(!post){root.hidden=true;return}
  const cover=imageUrl(post.coverImage,1800);
  const slug=post.slug?.current||'';
  const href=slug?'post.html?slug='+encodeURIComponent(slug):'#';
  root.hidden=false;
  root.innerHTML=`<article class="featured-card">
    <a class="featured-media" href="${href}" aria-label="Lexo: ${escapeHtml(post.title||'')}">
      ${cover?`<img src="${escapeHtml(cover)}" alt="${escapeHtml(post.coverImage?.alt||'')}" decoding="async">`:'<span class="blog-card-placeholder" aria-hidden="true"></span>'}
    </a>
    <div class="featured-copy">
      <span class="featured-label">Artikull i zgjedhur</span>
      <div class="blog-meta">${post.category?.title?`<span>${escapeHtml(post.category.title)}</span>`:''}<time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
      <h2><a href="${href}">${escapeHtml(post.title||'')}</a></h2>
      ${post.excerpt?`<p>${escapeHtml(post.excerpt)}</p>`:''}
      ${authorBadge(post.author,'featured')}
      <a class="button button-primary featured-cta" href="${href}">Lexo artikullin</a>
    </div>
  </article>`;
}

let posts=[];
let activeFilter='all';
let searchTerm='';

function renderFilters(){
  const root=document.querySelector('[data-blog-filters]');
  const categories=[...new Map(
    posts.filter(post=>post.category?.slug?.current&&post.category?.title)
      .map(post=>[post.category.slug.current,post.category.title])
  ).entries()];
  root.innerHTML='<button type="button" class="is-active" data-blog-filter="all">Të gjitha</button>'+
    categories.map(([slug,title])=>`<button type="button" data-blog-filter="${escapeHtml(slug)}">${escapeHtml(title)}</button>`).join('');
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-blog-filter]');
    if(!button)return;
    activeFilter=button.dataset.blogFilter;
    root.querySelectorAll('button').forEach(item=>item.classList.toggle('is-active',item===button));
    renderList();
  });
}

function renderList(){
  const root=document.querySelector('[data-blog-list]');
  const count=document.querySelector('[data-blog-count]');
  const filtered=posts.filter(post=>{
    const category=post.category?.slug?.current||'';
    const matchesFilter=activeFilter==='all'||category===activeFilter;
    const haystack=[post.title,post.excerpt,post.category?.title,post.author?.name].filter(Boolean).join(' ').toLocaleLowerCase('sq');
    return matchesFilter&&haystack.includes(searchTerm);
  });
  count.textContent=filtered.length===1?'1 artikull':filtered.length+' artikuj';
  root.innerHTML=filtered.length
    ?filtered.map(card).join('')
    :'<div class="blog-empty"><strong>Nuk u gjet asnjë artikull.</strong><span>Provo një kërkim ose filtër tjetër.</span></div>';
}

document.querySelector('[data-blog-search]')?.addEventListener('input',event=>{
  searchTerm=event.target.value.trim().toLocaleLowerCase('sq');
  renderList();
});

loadPosts().then(result=>{
  posts=result;
  featured(posts.find(post=>post.featured)||posts[0]);
  renderFilters();
  renderList();
}).catch(()=>{
  document.querySelector('[data-blog-featured]').hidden=true;
  document.querySelector('[data-blog-count]').textContent='';
  document.querySelector('[data-blog-list]').innerHTML='<div class="blog-empty blog-error"><strong>Blogu nuk mund të ngarkohet.</strong><span>Sanity është përkohësisht i paarritshëm.</span></div>';
});
