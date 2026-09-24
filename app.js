(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // Live clock in the hero eyebrow
  const clock = document.getElementById('clock');
  const tickClock = () => { clock.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); };
  tickClock();
  setInterval(tickClock, 30000);

  // Close mobile menu after choosing a link
  const menu = document.getElementById('menu');
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') && menu.classList.contains('show') && window.bootstrap) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });

  // Scroll reveal + count-up
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduce) { el.textContent = target; return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1500, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
  } else {
    reveals.forEach((el) => { el.classList.add('visible'); el.querySelectorAll('[data-count]').forEach(countUp); });
  }

  // Hero waveform (canvas)
  const canvas = document.getElementById('wave');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let w = 0; let h = 0; let visible = true;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    const lines = [
      { color: 'rgba(215,255,63,.85)', amp: 0.32, freq: 0.012, speed: 1.6, width: 2 },
      { color: 'rgba(143,107,255,.6)', amp: 0.22, freq: 0.019, speed: -1.1, width: 1.5 },
      { color: 'rgba(255,78,146,.45)', amp: 0.16, freq: 0.027, speed: 2.3, width: 1 },
    ];
    const draw = (t) => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        const beat = 0.6 + 0.4 * Math.pow(Math.abs(Math.sin(t / 1000 * Math.PI * 128 / 60)), 6);
        lines.forEach((l) => {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 4) {
            const env = Math.sin((x / w) * Math.PI);
            const y = h / 2 + Math.sin(x * l.freq + t / 1000 * l.speed) * Math.sin(x * l.freq * 0.37 - t / 1400) * h * l.amp * env * beat;
            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.strokeStyle = l.color; ctx.lineWidth = l.width; ctx.stroke();
        });
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // Demo player: toggles play state on the covers
  const toast = document.getElementById('now-playing');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  };
  document.querySelectorAll('.play').forEach((btn) => btn.addEventListener('click', () => {
    const card = btn.closest('.release-card');
    const playing = !card.classList.contains('playing');
    document.querySelectorAll('.release-card.playing').forEach((c) => {
      c.classList.remove('playing');
      const b = c.querySelector('.play');
      b.classList.remove('is-playing'); b.innerHTML = '<i class="bi bi-play-fill"></i>';
      b.setAttribute('aria-label', `Play ${b.dataset.track}`);
    });
    if (playing) {
      card.classList.add('playing');
      btn.classList.add('is-playing'); btn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      btn.setAttribute('aria-label', `Pause ${btn.dataset.track}`);
      showToast(`▶ Now playing — ${btn.dataset.track} (demo)`);
    }
  }));

  // Newsletter (demo: no data is sent)
  const form = document.getElementById('newsletter');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input');
    if (!email.checkValidity()) { status.textContent = 'Please enter a valid email.'; email.focus(); return; }
    status.textContent = "You're on the list ✺ (demo — connect your mailing service)";
    form.reset();
  });

  // Pointer FX: cursor glow + 3D tilt on release cards
  if (finePointer && !reduce) {
    const glow = document.querySelector('.cursor-glow');
    window.addEventListener('pointermove', (e) => {
      glow.style.setProperty('--x', `${e.clientX}px`);
      glow.style.setProperty('--y', `${e.clientY}px`);
    }, { passive: true });
    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-6px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
})();
