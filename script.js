(() => {
  document.querySelectorAll('[data-app-notice]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      window.alert('현재 앱 준비중입니다');
    });
  });

  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.navlinks');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', '메뉴 열기');
      }
    });
  }

  const carousels = [...document.querySelectorAll('[data-carousel]')];
  carousels.forEach((carousel) => {
    const track = carousel.querySelector('.carousel-track');
    const slides = [...carousel.querySelectorAll('.carousel-slide')];
    const count = carousel.querySelector('.carousel-count');
    const dotsWrap = carousel.querySelector('.carousel-dots');
    if (!track || slides.length < 2) return;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dotsWrap?.appendChild(dot);
      return dot;
    });

    let active = 0;
    const setActive = (i) => {
      active = Math.max(0, Math.min(slides.length - 1, i));
      if (count) count.textContent = `${active + 1} / ${slides.length}`;
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === active));
    };

    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        setActive(idx);
      });
    }, { passive: true });

    // Touch devices use the browser's native horizontal swipe.
    // On desktop, allow click-and-drag without adding visible arrow controls.
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      dragging = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('dragging');
      track.setPointerCapture?.(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerType !== 'mouse') return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });
    const finishDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
      try { track.releasePointerCapture?.(e.pointerId); } catch (_) {}
      const idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      track.scrollTo({ left: track.clientWidth * idx, behavior: 'smooth' });
      setActive(idx);
    };
    track.addEventListener('pointerup', finishDrag);
    track.addEventListener('pointercancel', finishDrag);
    track.addEventListener('dragstart', (e) => e.preventDefault());
  });
})();
