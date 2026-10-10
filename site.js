(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const langButton = document.querySelector('.lang-toggle');
  const contactForm = document.querySelector('#contact-form');
  const trustItems = document.querySelector('.trust-strip > div');
  let language = 'mn';

  if (trustItems) {
    const track = document.createElement('div');
    track.className = 'trust-track';
    while (trustItems.firstChild) track.appendChild(trustItems.firstChild);
    const copy = track.cloneNode(true);
    copy.classList.add('trust-track-copy');
    copy.setAttribute('aria-hidden', 'true');
    const lane = document.createElement('div');
    lane.className = 'trust-lane';
    lane.append(track, copy);
    trustItems.appendChild(lane);
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Цэс нээх' : 'Цэс хаах');
    nav.classList.toggle('open', !isOpen);
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Цэс нээх');
    });
  });

  langButton.addEventListener('click', () => {
    language = language === 'mn' ? 'en' : 'mn';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-mn][data-en]').forEach((element) => {
      element.innerHTML = element.dataset[language];
    });
    langButton.textContent = language === 'mn' ? 'EN' : 'MN';
    langButton.setAttribute('aria-label', language === 'mn' ? 'Switch to English' : 'Монгол хэл рүү шилжүүлэх');
    toggle.setAttribute('aria-label', language === 'mn' ? 'Цэс нээх' : 'Open navigation');
  });

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(contactForm);
    const subject = language === 'mn' ? 'Вэбсайтын шинэ төсөл' : 'New website project inquiry';
    const body = [
      'Name: ' + form.get('name'),
      'Email: ' + form.get('email'),
      '',
      'Project details:',
      form.get('message')
    ].join('\n');
    const composeUrl = new URL('https://mail.google.com/mail/');
    composeUrl.searchParams.set('view', 'cm');
    composeUrl.searchParams.set('fs', '1');
    composeUrl.searchParams.set('to', 'javkha.dev@gmail.com');
    composeUrl.searchParams.set('su', subject);
    composeUrl.searchParams.set('body', body);
    window.open(composeUrl.toString(), '_blank');
  });

  const animated = document.querySelectorAll(
    '.hero-kicker, .hero h1, .hero-text, .hero-actions, .hero-meta, ' +
    '.trust-strip > *, .section-heading, .project, .portfolio-note, ' +
    '.service-list article, .local-note, .about-copy, .about-aside, ' +
    '.contact-form, .contact-methods, .contact-location, .footer > *'
  );
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
    animated.forEach((element) => {
      element.classList.add('reveal');
      observer.observe(element);
    });

    const sections = document.querySelectorAll('main section[id]');
    const navLinks = nav.querySelectorAll('a[href^="#"]');
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (range > 0 ? window.scrollY / range : 0) + ')';
      scrollFrame = 0;
    });
  }, { passive: true });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.project-art, .hero-art').forEach((art) => {
      art.addEventListener('pointermove', (event) => {
        const rect = art.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        art.style.setProperty('--parallax-x', (x * 10).toFixed(1) + 'px');
        art.style.setProperty('--parallax-y', (y * 10).toFixed(1) + 'px');
        art.style.setProperty('--tilt-x', (x * 3).toFixed(2) + 'deg');
        art.style.setProperty('--tilt-y', (y * -3).toFixed(2) + 'deg');
      });
      art.addEventListener('pointerleave', () => {
        art.style.setProperty('--parallax-x', '0px');
        art.style.setProperty('--parallax-y', '0px');
        art.style.setProperty('--tilt-x', '0deg');
        art.style.setProperty('--tilt-y', '0deg');
      });
    });
  }
})();
