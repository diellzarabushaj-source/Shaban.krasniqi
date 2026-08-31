import fs from 'node:fs';

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const js=fs.readFileSync('script.js','utf8');
const failures=[];

for(const needle of ['<html lang="sq">','Fizioterapia Shaban Krasniqi','id="sherbimet"','id="qasja"','id="pse-ne"','id="pyetje"','aria-controls="site-nav"']){
  if(!html.includes(needle))failures.push('Missing: '+needle);
}
if(!css.includes('@media (max-width:390px)'))failures.push('Missing 390px responsive breakpoint');
if(!css.includes('min-height:44px'))failures.push('No explicit 44px minimum touch target');
if(!css.includes('prefers-reduced-motion'))failures.push('Reduced-motion support missing');
if(!js.includes('IntersectionObserver'))failures.push('Reveal behavior missing');

if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Site structure check: PASS');
