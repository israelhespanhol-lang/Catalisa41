(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const control = document.createElement('button');
  control.className = 'motion-control'; control.type = 'button';
  let calm = reducedMotion;
  function setMotion() {
    document.body.classList.toggle('calm', calm);
    control.textContent = calm ? 'Movimentos reduzidos' : 'Reduzir movimentos';
    control.setAttribute('aria-pressed', String(calm));
  }
  control.onclick = () => { calm = !calm; setMotion(); };
  document.body.append(control); setMotion();

  const photos = [...document.querySelectorAll('.stay-image img, .food-grid img, .food-quad-image img')];
  const viewer = document.createElement('dialog');
  viewer.className = 'image-viewer';
  viewer.setAttribute('aria-labelledby', 'viewer-title');
  viewer.innerHTML = '<div class="viewer-top"><p id="viewer-title"></p><button type="button" aria-label="Fechar galeria">✕</button></div><img alt=""><div class="viewer-bottom"><button type="button" data-direction="-1">← Anterior</button><span class="viewer-count" aria-live="polite"></span><button type="button" data-direction="1">Próxima →</button></div>';
  document.body.append(viewer);
  let selected = 0;
  function show(index) {
    selected = (index + photos.length) % photos.length;
    const source = photos[selected];
    viewer.querySelector('img').src = source.getAttribute('src');
    viewer.querySelector('img').alt = source.alt;
    viewer.querySelector('#viewer-title').textContent = source.alt;
    viewer.querySelector('.viewer-count').textContent = `${selected + 1} / ${photos.length}`;
  }
  photos.forEach((photo, index) => {
    photo.loading = 'lazy'; photo.decoding = 'async';
    const button = document.createElement('button');
    button.className = 'gallery-open'; button.type = 'button';
    button.setAttribute('aria-label', `Ampliar: ${photo.alt}`);
    button.innerHTML = '<span aria-hidden="true">+</span>';
    button.onclick = () => { show(index); viewer.showModal(); };
    photo.parentElement.append(button);
  });
  viewer.querySelector('.viewer-top button').onclick = () => viewer.close();
  viewer.querySelectorAll('[data-direction]').forEach(button => button.onclick = () => show(selected + Number(button.dataset.direction)));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); show(selected + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  viewer.addEventListener('click', event => {
    const rect = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
  });
  let startX = null;
  viewer.addEventListener('touchstart', event => { startX = event.touches[0].clientX; }, {passive:true});
  viewer.addEventListener('touchend', event => { if(startX !== null) { const dx=event.changedTouches[0].clientX-startX; if(Math.abs(dx)>60) show(selected+(dx<0?1:-1)); } startX=null; }, {passive:true});

  const crossing = document.querySelector('.crossing');
  const buttons = [...document.querySelectorAll('[data-chapter]')];
  const chapters = [...document.querySelectorAll('.chapter')];
  function displayChapter(index) {
    document.querySelector('#chapterText').textContent = chapters[index].dataset.copy;
    document.querySelector('.stage-marker span').textContent = chapters[index].dataset.step;
    crossing.style.setProperty('--journey-pct', `${18+index*32}%`);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  buttons.forEach((button, index) => button.onclick = () => {
    if(innerWidth<=700 || calm || reducedMotion) displayChapter(index);
    else scrollTo({top:crossing.offsetTop+(crossing.offsetHeight-innerHeight)*(index/3+.07),behavior:'smooth'});
  });
  let queued=false;
  addEventListener('scroll', () => {
    if(queued || innerWidth<=700 || calm || reducedMotion) return;
    queued=true;
    requestAnimationFrame(() => {
      const p=Math.max(0,Math.min(.999,(scrollY-crossing.offsetTop)/(crossing.offsetHeight-innerHeight)));
      displayChapter(Math.floor(p*3)); queued=false;
    });
  }, {passive:true});
})();
