import fs from 'node:fs';

const files=['index.html','styles.css','script.js','blog.html','blog.css','blog.js','post.html','post.js','page-shell.js','assets/logo-mark.svg'];
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

  for(const needle of ['id="trajtimet"','wa.me/38649884785','tel:+38649884785','id="sherbimet"','id="qasja"','id="pse-ne"','id="pyetje"','data-home-blog','href="blog.html"']){
    if(!index.includes(needle))failures.push('index missing: '+needle);
  }
  for(const needle of ['data-blog-list','data-blog-featured','data-blog-search','a1lswl1z']){
    if(!(blog+blogJs).includes(needle))failures.push('blog missing: '+needle);
  }
  for(const needle of ['data-article-body','data-related-posts','a1lswl1z','renderPortableText']){
    if(!(post+postJs).includes(needle))failures.push('post missing: '+needle);
  }
  if(!css.includes('@media (max-width:390px)'))failures.push('Missing 390px responsive breakpoint');
  if(!css.includes('prefers-reduced-motion'))failures.push('Reduced-motion support missing');
  if(!script.includes('IntersectionObserver'))failures.push('Reveal behavior missing');
  if(blog.includes('>SK<'))failures.push('Legacy SK placeholder logo remains in blog header');
}

if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Site structure check: PASS');
