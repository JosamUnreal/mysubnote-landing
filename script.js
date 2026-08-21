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
    const videoSrc = viewer.dataset.videoSrc;
    let activeIndex = 0;
    let activeVideo = null;
    let segmentFrame = 0;

    if (!tabs.length || !sessionList || !poster || !embed || !stageThumb) return;

    const stopVideo = () => {
      cancelAnimationFrame(segmentFrame);
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.removeAttribute('src');
        activeVideo.load();
        activeVideo = null;
      }
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
      if (!videoSrc || !tab) return;
      const start = Number(tab.dataset.start || 0);
      const end = Number(tab.dataset.end || 0);
      const segmentLength = Math.max(0, end - start);
      const formatTime = (seconds) => {
        const value = Math.max(0, Math.floor(Number(seconds) || 0));
        return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
      };
      const shell = document.createElement('div');
      shell.className = 'session-video-shell controls-visible';
      const video = document.createElement('video');
      activeVideo = video;
      const mediaFragment = end > start ? `#t=${start},${end}` : (start > 0 ? `#t=${start}` : '');
      video.src = `${videoSrc}${mediaFragment}`;
      video.preload = 'auto';
      video.controls = false;
      video.playsInline = true;
      video.setAttribute('disablePictureInPicture', '');
      video.setAttribute('aria-label', `${tab.dataset.title} | 마이서브노트 사용가이드`);
      video.tabIndex = 0;

      const controls = document.createElement('div');
      controls.className = 'session-video-controls';
      controls.innerHTML = `
        <button class="video-control-toggle" type="button" aria-label="일시정지"><span aria-hidden="true">❚❚</span></button>
        <input class="video-control-progress" type="range" min="0" max="${segmentLength || 1}" step="0.05" value="0" aria-label="재생 위치">
        <span class="video-control-time">0:00 / ${formatTime(segmentLength)}</span>
        <button class="video-control-mute" type="button" aria-label="음소거"><span aria-hidden="true">소리</span></button>
        <button class="video-control-fullscreen" type="button" aria-label="전체 화면"><span aria-hidden="true">전체화면</span></button>`;
      const toggle = controls.querySelector('.video-control-toggle');
      const progress = controls.querySelector('.video-control-progress');
      const time = controls.querySelector('.video-control-time');
      const mute = controls.querySelector('.video-control-mute');
      const fullscreen = controls.querySelector('.video-control-fullscreen');
      let controlsTimer = 0;

      const updateToggle = () => {
        const playing = !video.paused && !video.ended;
        toggle.innerHTML = playing ? '<span aria-hidden="true">❚❚</span>' : '<span aria-hidden="true">▶</span>';
        toggle.setAttribute('aria-label', playing ? '일시정지' : '재생');
      };
      const updateProgress = () => {
        const elapsed = Math.min(segmentLength || Infinity, Math.max(0, video.currentTime - start));
        progress.value = String(Number.isFinite(elapsed) ? elapsed : 0);
        time.textContent = `${formatTime(elapsed)} / ${formatTime(segmentLength)}`;
      };
      const showControls = () => {
        shell.classList.add('controls-visible');
        clearTimeout(controlsTimer);
        if (!video.paused) controlsTimer = setTimeout(() => shell.classList.remove('controls-visible'), 1800);
      };
      const togglePlayback = () => {
        if (video.paused) {
          if (end > start && video.currentTime >= end - 0.05) video.currentTime = start;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      };

      const enforceSegment = () => {
        if (activeVideo !== video) return;
        if (end > start && video.currentTime >= end - 0.05) {
          video.pause();
          video.currentTime = end;
          updateProgress();
          updateToggle();
          showControls();
          return;
        }
        updateProgress();
        segmentFrame = requestAnimationFrame(enforceSegment);
      };

      video.addEventListener('loadedmetadata', () => {
        const playFromStart = () => video.play().catch(() => {});
        if (start > 0 && Math.abs(video.currentTime - start) > 0.25) {
          video.addEventListener('seeked', playFromStart, { once: true });
          video.currentTime = Math.min(start, video.duration || start);
        } else {
          playFromStart();
        }
      }, { once: true });
      video.addEventListener('play', () => {
        if (end > start && (video.currentTime >= end - 0.05 || video.currentTime < start)) {
          video.currentTime = start;
        }
        updateToggle();
        showControls();
        cancelAnimationFrame(segmentFrame);
        segmentFrame = requestAnimationFrame(enforceSegment);
      });
      video.addEventListener('pause', () => {
        cancelAnimationFrame(segmentFrame);
        updateToggle();
        showControls();
      });
      video.addEventListener('seeking', () => {
        if (video.currentTime < start) video.currentTime = start;
        if (end > start && video.currentTime > end) video.currentTime = end;
      });
      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('click', togglePlayback);
      video.addEventListener('keydown', (event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        togglePlayback();
      });
      toggle.addEventListener('click', togglePlayback);
      progress.addEventListener('input', () => {
        video.currentTime = start + Number(progress.value);
        updateProgress();
      });
      mute.addEventListener('click', () => {
        video.muted = !video.muted;
        mute.innerHTML = video.muted ? '<span aria-hidden="true">음소거</span>' : '<span aria-hidden="true">소리</span>';
        mute.setAttribute('aria-label', video.muted ? '음소거 해제' : '음소거');
        showControls();
      });
      fullscreen.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else shell.requestFullscreen?.();
      });
      shell.addEventListener('pointermove', showControls);
      shell.addEventListener('pointerleave', () => {
        if (!video.paused) shell.classList.remove('controls-visible');
      });

      shell.append(video, controls);
      poster.hidden = true;
      embed.hidden = false;
      embed.replaceChildren(shell);
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

    // 본문(영상 + 설명) 영역에서 좌우로 스와이프하면 이전/다음 튜토리얼로 넘어간다.
    // 상단 탭을 직접 누르지 않아도 되도록 하기 위한 것. 모바일에서 특히 편하다.
    const viewerMain = viewer.querySelector('.viewer-main');
    if (viewerMain) {
      let swipeX = null;
      let swipeY = null;
      const goToIndex = (index) => {
        const clamped = Math.max(0, Math.min(tabs.length - 1, index));
        if (clamped === activeIndex) return;
        selectTab(tabs[clamped], clamped);
        // 선택된 탭이 화면 밖에 있으면 보이도록 스크롤해준다(상단 탭 목록과 동기화)
        tabs[clamped].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      };
      viewerMain.addEventListener('touchstart', (event) => {
        // 영상 재생 중에는 스와이프를 받지 않는다 — 재생바 조작과 헷갈리기 때문.
        if (!embed.hidden) { swipeX = null; return; }
        if (event.touches.length !== 1) { swipeX = null; return; }
        swipeX = event.touches[0].clientX;
        swipeY = event.touches[0].clientY;
      }, { passive: true });
      viewerMain.addEventListener('touchend', (event) => {
        if (swipeX === null) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - swipeX;
        const dy = touch.clientY - swipeY;
        swipeX = null;
        // 세로 스크롤과 구분: 가로 이동이 세로보다 확실히 커야 하고, 최소 50px은 움직여야 한다.
        if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
        goToIndex(activeIndex + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }
  });
})();
