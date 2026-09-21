const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const progress=document.querySelector('.reading-progress'),nav=document.querySelector('.nav');
let pending=false;
function updateScroll(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max?scrollY/max*100:0)+'%';nav.classList.toggle('scrolled',scrollY>40);pending=false;}
addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateScroll)}},{passive:true});updateScroll();
const portrait=document.querySelector('.portrait-frame'),shell=document.querySelector('.portal-shell');
shell?.addEventListener('pointermove',event=>{
if(reduced||document.body.classList.contains('calm')||event.pointerType!=='mouse')return;
const r=shell.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
portrait.style.transform='rotateY('+x*7+'deg) rotateX('+(-y*7)+'deg)';
});
shell?.addEventListener('pointerleave',()=>portrait.style.transform='');
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
const target=document.getElementById(link.hash.slice(1));
if(target){event.preventDefault();target.scrollIntoView({behavior:reduced||document.body.classList.contains('calm')?'auto':'smooth'})}
}));
