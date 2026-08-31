const SANITY_PROJECT_ID='a1lswl1z';
const SANITY_DATASET='production';
const SANITY_API=`https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;

const escapeHtml=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const imageUrl=(ref,width=1200)=>{
  const id=ref?.asset?._ref||'';
  const match=id.match(/^image-([^-]+)-([^-]+)-([a-z0-9]+)$/i);
  return match?`https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${match[1]}-${match[2]}.${match[3]}?auto=format&w=${width}&q=86`:'';
};
const formatDate=(date)=>date?new Intl.DateTimeFormat('sq-AL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(date)):'';
const portableText=(value)=>{
  if(typeof value==='string')return '<p>'+escapeHtml(value)+'</p>';
  if(!Array.isArray(value))return '';
  return value.filter(block=>block?._type==='block').map(block=>{
    const text=(block.children||[]).map(child=>escapeHtml(child.text||'')).join('');
    if(block.style==='h2')return '<h2>'+text+'</h2>';
    if(block.style==='h3')return '<h3>'+text+'</h3>';
    return '<p>'+text+'</p>';
  }).join('');
};

function postCard(post){
  const image=imageUrl(post.coverImage,900);
  const slug=post.slug?.current||'';
  return `<article class="blog-card">
    <a class="blog-card-media" href="post.html?slug=${encodeURIComponent(slug)}">${image?`<img src="${image}" alt="" loading="lazy" decoding="async">`:'<span class="blog-card-placeholder" aria-hidden="true">SK</span>'}</a>
    <div class="blog-card-body">
      <div class="blog-meta"><span>${escapeHtml(post.category?.title||'Fizioterapi')}</span><time datetime="${escapeHtml(post.publishedAt||'')}">${formatDate(post.publishedAt)}</time></div>
      <h2><a href="post.html?slug=${encodeURIComponent(slug)}">${escapeHtml(post.title||'Pa titull')}</a></h2>
      <p>${escapeHtml(post.excerpt||'Këshilla praktike për lëvizjen dhe rehabilitimin.')}</p>
      <a class="blog-read" href="post.html?slug=${encodeURIComponent(slug)}">Lexo artikullin <span>→</span></a>
    </div>
  </article>`;
}

async function fetchJson(query){
  const response=await fetch(`${SANITY_API}?query=${encodeURIComponent(query)}`);
  if(!response.ok)throw new Error('request failed');
  return (await response.json()).result;
}

async function load(){
  const params=new URLSearchParams(location.search);
  const slug=params.get('slug')||'';
  const name=params.get('name')||'';
  if(!slug&&!name)throw new Error('missing author');

  const condition=slug?`slug.current == ${JSON.stringify(slug)}`:`(name == ${JSON.stringify(name)} || fullName == ${JSON.stringify(name)} || title == ${JSON.stringify(name)})`;
  const author=await fetchJson(`*[_type == "author" && ${condition}][0]{_id,name,title,fullName,slug,image,avatar,bio,role}`);
  if(!author)throw new Error('author not found');

  const authorName=author.name||author.fullName||author.title||'Autor';
  const authorSlug=author.slug?.current||slug||'';
  const portrait=imageUrl(author.image||author.avatar,900);
  const initials=authorName.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();

  document.title='Rreth '+authorName+' | Shaban Krasniqi';
  document.querySelector('[data-author-name]').textContent=authorName;
  const role=document.querySelector('[data-author-role]');
  if(author.role){role.textContent=author.role;role.hidden=false}
  document.querySelector('[data-author-bio]').innerHTML=portableText(author.bio)||'<p>Autor i blogut të Fizioterapisë Shaban Krasniqi.</p>';
  document.querySelector('[data-author-image]').innerHTML=portrait?`<img src="${portrait}" alt="${escapeHtml(authorName)}" decoding="async">`:`<span class="author-portrait-fallback" aria-hidden="true">${escapeHtml(initials||'A')}</span>`;
  document.querySelector('[data-author-first-name]').textContent=authorName.split(/\s+/)[0]||authorName;

  const postCondition=authorSlug
    ?`(author->slug.current == ${JSON.stringify(authorSlug)} || author.slug.current == ${JSON.stringify(authorSlug)})`
    :`(author->name == ${JSON.stringify(authorName)} || author.name == ${JSON.stringify(authorName)} || author->fullName == ${JSON.stringify(authorName)} || author.fullName == ${JSON.stringify(authorName)})`;
  const posts=await fetchJson(`*[_type == "post" && defined(publishedAt) && ${postCondition}] | order(publishedAt desc){title,slug,excerpt,publishedAt,coverImage,category->{title}}`)||[];

  document.querySelector('[data-author-post-count]').textContent=posts.length===1?'1 artikull':posts.length+' artikuj';
  document.querySelector('[data-author-posts]').innerHTML=posts.length?posts.map(postCard).join(''):'<div class="blog-empty"><strong>Nuk ka artikuj ende.</strong><span>Artikujt e këtij autori do të shfaqen këtu.</span></div>';

  document.querySelector('[data-author-loading]').hidden=true;
  document.querySelector('[data-author-profile]').hidden=false;
  document.querySelector('[data-author-posts-section]').hidden=false;
}

load().catch(()=>{
  document.querySelector('[data-author-loading]').hidden=true;
  document.querySelector('[data-author-error]').hidden=false;
});
