const SANITY_PROJECT_ID='a1lswl1z';
const SANITY_DATASET='production';
const SANITY_API=`https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;

const escapeHtml=(value='')=>String(value)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

const imageUrl=(ref,width=1200)=>{
  const id=ref?.asset?._ref||'';
  const match=id.match(/^image-([^-]+)-([^-]+)-([a-z0-9]+)$/i);
  return match?`https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${match[1]}-${match[2]}.${match[3]}?auto=format&w=${width}&q=84`:'';
};
const formatDate=(date)=>date?new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(date)):'';
const authorData=(post)=>{
  const author=post?.authorRef||post?.authorInline;
  if(!author||author._ref)return null;
  return {
    name:author.name||author.fullName||author.title||'',
    image:author.image||author.avatar||null,
    role:author.role||'',
    slug:author.slug?.current||author.slug||''
  };
};
const authorBadge=(post,variant='compact')=>{
  const author=authorData(post);
  if(!author?.name)return '';
  const avatar=imageUrl(author.image,160);
  const initials=author.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  const href='author.html?'+(author.slug?'slug='+encodeURIComponent(author.slug):'name='+encodeURIComponent(author.name));
  const size=variant==='featured'?38:34;
  return `<a class="blog-author blog-author-${variant}" href="${href}" aria-label="Rreth autorit ${escapeHtml(author.name)}">${avatar?`<img src="${avatar}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`:`<span class="blog-author-fallback" aria-hidden="true">${escapeHtml(initials||'A')}</span>`}<div><small>Nga</small><strong>${escapeHtml(author.name)}</strong>${author.role&&variant==='featured'?`<em>${escapeHtml(author.role)}</em>`:''}</div></a>`;
};
const query=encodeURIComponent('*[_type == "post" && defined(publishedAt)] | order(publishedAt desc){title,slug,excerpt,publishedAt,featured,coverImage,category->{title,slug},"authorRef":author->{name,title,fullName,image,avatar,bio,role,slug},"authorInline":author}');

let posts=[];
let activeFilter='all';
let searchTerm='';

async function loadPosts(){
  const response=await fetch(`${SANITY_API}?query=${query}`);
  if(!response.ok)throw new Error('Sanity nuk u përgjigj.');
  return (await response.json()).result||[];
}

function card(post){
  const image=imageUrl(post.coverImage,1000);
  const slug=post.slug?.current||'';
  return `<article class="blog-card" data-category="${escapeHtml(post.category?.slug?.current||post.category?.title||'fizioterapi')}">
    <a class="blog-card-media" href="post.html?slug=${encodeURIComponent(slug)}" aria-label="Lexo: ${escapeHtml(post.title||'Artikull')}">
      ${image?`<img src="${image}" alt="" loading="lazy" decoding="async">`:'<span class="blog-card-placeholder" aria-hidden="true">SK</span>'}
    </a>
    <div class="blog-card-body">
      <div class="blog-meta"><span>${escapeHtml(post.category?.title||'Fizioterapi')}</span><time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
      <h2><a href="post.html?slug=${encodeURIComponent(slug)}">${escapeHtml(post.title||'Pa titull')}</a></h2>
      <p>${escapeHtml(post.excerpt||'Këshilla praktike për lëvizjen dhe rehabilitimin.')}</p>
      ${authorBadge(post)}
      <a class="blog-read" href="post.html?slug=${encodeURIComponent(slug)}">Lexo artikullin <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

function featured(post){
  const root=document.querySelector('[data-blog-featured]');
  if(!post){root.hidden=true;return}
  const image=imageUrl(post.coverImage,1800);
  const slug=post.slug?.current||'';
  root.hidden=false;
  root.innerHTML=`<article class="featured-card">
    <a class="featured-media" href="post.html?slug=${encodeURIComponent(slug)}">${image?`<img src="${image}" alt="" decoding="async">`:'<span class="blog-card-placeholder" aria-hidden="true">SK</span>'}</a>
    <div class="featured-copy">
      <span class="featured-label">Artikull i zgjedhur</span>
      <div class="blog-meta"><span>${escapeHtml(post.category?.title||'Fizioterapi')}</span><time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
      <h2><a href="post.html?slug=${encodeURIComponent(slug)}">${escapeHtml(post.title||'Pa titull')}</a></h2>
      <p>${escapeHtml(post.excerpt||'Këshilla praktike për lëvizjen dhe rehabilitimin.')}</p>
      ${authorBadge(post,'featured')}
      <a class="button button-primary featured-cta" href="post.html?slug=${encodeURIComponent(slug)}">Lexo artikullin</a>
    </div>
  </article>`;
}

function renderFilters(){
  const root=document.querySelector('[data-blog-filters]');
  const categories=[...new Map(posts.map(p=>[p.category?.slug?.current||p.category?.title,p.category?.title]).filter(([k,v])=>k&&v)).entries()];
  root.innerHTML='<button type="button" class="is-active" data-blog-filter="all">Të gjitha</button>'+
    categories.map(([slug,title])=>`<button type="button" data-blog-filter="${escapeHtml(slug)}">${escapeHtml(title)}</button>`).join('');
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-blog-filter]');
    if(!button)return;
    activeFilter=button.dataset.blogFilter;
    root.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b===button));
    renderList();
  });
}

function renderList(){
  const root=document.querySelector('[data-blog-list]');
  const count=document.querySelector('[data-blog-count]');
  const filtered=posts.filter(post=>{
    const category=post.category?.slug?.current||post.category?.title||'fizioterapi';
    const matchesFilter=activeFilter==='all'||category===activeFilter;
    const author=authorData(post);
    const haystack=(post.title+' '+(post.excerpt||'')+' '+(post.category?.title||'')+' '+(author?.name||'')).toLocaleLowerCase('sq');
    return matchesFilter&&haystack.includes(searchTerm);
  });
  count.textContent=filtered.length===1?'1 artikull':filtered.length+' artikuj';
  root.innerHTML=filtered.length?filtered.map(card).join(''):`<div class="blog-empty"><strong>Nuk gjetëm artikuj.</strong><span>Provo një fjalë tjetër ose hiq filtrin aktiv.</span></div>`;
}

document.querySelector('[data-blog-search]')?.addEventListener('input',event=>{
  searchTerm=event.target.value.trim().toLocaleLowerCase('sq');
  renderList();
});

loadPosts().then(result=>{
  posts=result;
  const selected=posts.find(p=>p.featured)||posts[0];
  featured(selected);
  renderFilters();
  renderList();
}).catch(()=>{
  document.querySelector('[data-blog-featured]').hidden=true;
  document.querySelector('[data-blog-count]').textContent='';
  document.querySelector('[data-blog-list]').innerHTML=`<div class="blog-empty blog-error"><strong>Nuk mundëm t'i ngarkojmë artikujt.</strong><span>Ky blog përdor Sanity project <code>a1lswl1z</code>. Kontrollo që dataset-i <code>production</code> të jetë publik dhe origin-i i website-it të jetë i lejuar në CORS.</span></div>`;
});
