import fs from 'node:fs';

const files=['index.html','styles.css','script.js','blog.html','blog.css','blog.js','post.html','post.js','author.html','author.js','page-shell.js','assets/branding/logo-site-light.webp','assets/branding/logo-site-dark.webp','assets/branding/favicon-64.png'];
const missing=files.filter(file=>!fs.existsSync(file));
const failures=missing.map(file=>'Missing file: '+file);

if(!missing.length){
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('styles.css','utf8');
  const script=fs.readFileSync('script.js','utf8');
  const blog=fs.readFileSync('blog.html','utf8');
  const blogJs=fs.readFileSync('blog.js','utf8');
  const post=fs.readFileSync('post.html','utf8');
  const postJs=fs.readFileSync('post.js','utf8');
  const author=fs.readFileSync('author.html','utf8');
  const authorJs=fs.readFileSync('author.js','utf8');
  const sanityCode=script+'\n'+blogJs+'\n'+postJs+'\n'+authorJs;

  for(const needle of ['id="trajtimet"','wa.me/38649884785','tel:+38649884785','id="sherbimet"','id="qasja"','id="pse-ne"','id="pyetje"','data-home-blog','href="blog.html"']){
    if(!index.includes(needle))failures.push('index missing: '+needle);
  }

  for(const needle of [
    'category->{title,slug,description}',
    'author->{',
    'coverImage{',
    'asset->{_id,url}',
    'slug.current == $slug',
    'references(^._id)',
    'shortBio',
    'specialties',
    'education',
    'experience',
    'languages',
    'approach',
    'seo{'
  ]){
    if(!sanityCode.includes(needle))failures.push('Sanity contract missing: '+needle);
  }

  for(const forbidden of ['authorRef','authorInline','fullName','avatar']){
    if(sanityCode.includes(forbidden))failures.push('Non-schema author field remains: '+forbidden);
  }

  for(const needle of ['data-article-body','data-related-posts','data-article-author']){
    if(!(post+postJs).includes(needle))failures.push('post missing: '+needle);
  }
  for(const needle of ['data-author-profile','data-author-posts','data-author-details','data-author-jsonld']){
    if(!(author+authorJs).includes(needle))failures.push('author flow missing: '+needle);
  }
  if(!post.includes('meta name="author"'))failures.push('Article author meta missing');
  if(!post.includes('rel="canonical"')||!author.includes('rel="canonical"'))failures.push('Canonical tags missing');
  // Official logo pack contract
  for(const [pageName,pageHtml] of Object.entries({index,blog,post,author})){
    if(!pageHtml.includes('assets/branding/logo-site-light.webp'))failures.push(pageName+' missing official light logo');
    if(!pageHtml.includes('assets/branding/favicon-64.png'))failures.push(pageName+' missing official favicon');
    if(pageHtml.includes('assets/logo-mark.svg'))failures.push(pageName+' still references legacy logo mark');
  }
  if(!index.includes('assets/branding/logo-site-dark.webp'))failures.push('index missing official dark logo');
  if(!css.includes('.brand-official')||!css.includes('.official-closing-logo'))failures.push('Official logo CSS missing');
  if(!css.includes('@media (max-width:390px)'))failures.push('Missing 390px responsive breakpoint');
  if(!css.includes('prefers-reduced-motion'))failures.push('Reduced-motion support missing');
  if(!script.includes('IntersectionObserver'))failures.push('Reveal behavior missing');
}

if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Site structure check: PASS (exact Sanity schema contract)');
