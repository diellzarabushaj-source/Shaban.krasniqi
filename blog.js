const SANITY_PROJECT_ID = 'a1lswl1z';
const SANITY_DATASET = 'production';
const SANITY_API = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-08-31/data/query/${SANITY_DATASET}`;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const imageUrl = (ref) => {
  if (!ref) return '';
  const id = ref.asset?._ref || '';
  const match = id.match(/image-([^-]+)-([^-]+)-([a-z0-9]+)/i);
  return match ? `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${match[1]}-${match[2]}.${match[3]}` : '';
};

const query = encodeURIComponent(`*[_type == "post"] | order(publishedAt desc){title,slug,excerpt,publishedAt,featured,coverImage,category->{title,slug}}`);

async function loadPosts() {
  const response = await fetch(`${SANITY_API}?query=${query}`);
  if (!response.ok) throw new Error('Sanity nuk u përgjigj.');
  return (await response.json()).result || [];
}

const formatDate = (date) => new Intl.DateTimeFormat('sq-AL', {dateStyle: 'medium'}).format(new Date(date));

function render(posts) {
  const root = document.querySelector('[data-blog-list]');
  if (!posts.length) {
    root.innerHTML = `<div class="blog-empty"><strong>Artikujt po vijnë së shpejti.</strong><span>Publikimet e reja do të shfaqen këtu sapo të krijohen në Sanity Studio.</span></div>`;
    return;
  }
  root.innerHTML = posts.map(post => {
    const image = imageUrl(post.coverImage);
    return `<article class="blog-card">
      ${image ? `<img src="${image}" alt="" loading="lazy">` : '<div class="blog-card-placeholder" aria-hidden="true"></div>'}
      <div class="blog-card-body">
        <div class="blog-meta"><span>${escapeHtml(post.category?.title || 'Fizioterapi')}</span><time datetime="${escapeHtml(post.publishedAt)}">${formatDate(post.publishedAt)}</time></div>
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt || '')}</p>
        <a href="post.html?slug=${encodeURIComponent(post.slug?.current || '')}">Lexo artikullin <span aria-hidden="true">→</span></a>
      </div>
    </article>`;
  }).join('');
}

loadPosts().then(render).catch(() => {
  document.querySelector('[data-blog-list]').innerHTML = `<div class="blog-empty"><strong>Nuk mundëm t'i ngarkojmë artikujt.</strong><span>Kontrollo lidhjen me Sanity dhe provo përsëri.</span></div>`;
});
