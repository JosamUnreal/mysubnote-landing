(() => {
  document.querySelectorAll('[data-app-notice]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      window.alert('현재 앱 준비중입니다');
    });
  });

  const introVideo = document.querySelector('[data-intro-video]');
  const videoPoster = introVideo?.querySelector('.intro-video-poster');
  if (introVideo && videoPoster) {
    videoPoster.addEventListener('click', () => {
      const videoId = introVideo.dataset.videoId;
      if (!videoId) return;

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
      iframe.title = '마이서브노트 소개 영상';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      introVideo.replaceChildren(iframe);
    });
  }

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

  document.querySelectorAll('[data-session-viewer]').forEach((viewer) => {
    const tabs = [...viewer.querySelectorAll('.session-tab')];
    const sessionList = viewer.querySelector('.session-list');
    const poster = viewer.querySelector('[data-video-poster]');
    const embed = viewer.querySelector('[data-video-embed]');
    const stageThumb = viewer.querySelector('[data-stage-thumb]');
    const detailTitle = viewer.querySelector('[data-detail-title]');
    const detailDesc = viewer.querySelector('[data-detail-desc]');
    const viewerStep = viewer.querySelector('[data-viewer-step]');
    const videoId = viewer.dataset.videoId;
    let activeIndex = 0;

    if (!tabs.length || !sessionList || !poster || !embed || !stageThumb) return;

    const stopVideo = () => {
      embed.replaceChildren();
      embed.hidden = true;
      poster.hidden = false;
    };

    const selectTab = (tab, index) => {
      activeIndex = index;
      stopVideo();
      tabs.forEach((item, itemIndex) => {
        const selected = itemIndex === index;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      stageThumb.src = tab.dataset.thumb;
      stageThumb.alt = `${tab.dataset.title} 튜토리얼 대표 이미지`;
      poster.setAttribute('aria-label', `${tab.dataset.title} 영상 재생`);
      if (detailTitle) detailTitle.textContent = tab.dataset.title;
      if (detailDesc) detailDesc.textContent = tab.dataset.desc;
      if (viewerStep) viewerStep.textContent = `${index + 1} / ${tabs.length}`;
    };

    tabs.forEach((tab, index) => {
      tab.setAttribute('aria-pressed', String(index === 0));
      tab.addEventListener('click', () => selectTab(tab, index));
    });

    poster.addEventListener('click', () => {
      const tab = tabs[activeIndex];
      if (!videoId || !tab) return;
      const start = Number(tab.dataset.start || 0);
      const end = Number(tab.dataset.end || 0);
      const endParam = end > start ? `&end=${end}` : '';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&controls=0&fs=0&disablekb=1&iv_load_policy=3&start=${start}${endParam}`;
      iframe.title = `${tab.dataset.title} | 마이서브노트 사용가이드`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      poster.hidden = true;
      embed.hidden = false;
      embed.replaceChildren(iframe);
    });

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let suppressClick = false;
    sessionList.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || sessionList.scrollWidth <= sessionList.clientWidth) return;
      dragging = true;
      suppressClick = false;
      startX = event.clientX;
      startScroll = sessionList.scrollLeft;
      sessionList.classList.add('dragging');
      sessionList.setPointerCapture?.(event.pointerId);
    });
    sessionList.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 4) suppressClick = true;
      sessionList.scrollLeft = startScroll - distance;
    });
    const finishDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      sessionList.classList.remove('dragging');
      try { sessionList.releasePointerCapture?.(event.pointerId); } catch (_) {}
      setTimeout(() => { suppressClick = false; }, 0);
    };
    sessionList.addEventListener('pointerup', finishDrag);
    sessionList.addEventListener('pointercancel', finishDrag);
    sessionList.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    sessionList.addEventListener('wheel', (event) => {
      if (sessionList.scrollWidth <= sessionList.clientWidth) return;
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        sessionList.scrollLeft += event.deltaY;
      }
    }, { passive: false });
    sessionList.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      const next = Math.max(0, Math.min(tabs.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
      tabs[next].focus();
      tabs[next].click();
      tabs[next].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });
})();
