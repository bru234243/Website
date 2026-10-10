const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

// Make the project-card arrow controls real links to the contact section.
document.querySelectorAll('.project-arrow').forEach(arrow => {
  const projectName = arrow.closest('.project-card')?.querySelector('.project-info h3')?.textContent || 'this project';
  const link = document.createElement('a');
  link.className = arrow.className;
  link.href = '#contact';
  link.setAttribute('aria-label', `Ask about a project like ${projectName}`);
  link.innerHTML = arrow.innerHTML;
  arrow.replaceWith(link);
});

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
    nav.classList.toggle('is-open', !open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      menuButton.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    const header = menuButton.closest('.site-header');
    if (menuButton.getAttribute('aria-expanded') === 'true' && header && !header.contains(event.target)) {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
    }
  });
}

const revealItems = document.querySelectorAll('.reveal');
const headingItems = document.querySelectorAll('.section-heading');
revealItems.forEach(item => {
  const siblings = [...item.parentElement.querySelectorAll(':scope > .reveal')];
  item.style.setProperty('--reveal-delay', `${Math.max(0, siblings.indexOf(item)) * 95}ms`);
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  [...revealItems, ...headingItems].forEach(item => observer.observe(item));
} else {
  [...revealItems, ...headingItems].forEach(item => item.classList.add('is-visible'));
}

// A fine progress line and a gently compacting navigation bar.
const progress = document.createElement('div');
progress.className = 'page-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);
const header = document.querySelector('.site-header');
const art = document.querySelector('.hero-art');
let scrollFrame = 0;
function updateScrollDetails() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--page-progress', range > 0 ? String(window.scrollY / range) : '0');
    header?.classList.toggle('scrolled', window.scrollY > 24);
    const artBounds = art?.getBoundingClientRect();
    if (artBounds && artBounds.bottom > 0 && artBounds.top < window.innerHeight) {
      const centerOffset = (artBounds.top + artBounds.height / 2 - window.innerHeight / 2) / window.innerHeight;
      art.style.setProperty('--hero-drift', `${(-centerOffset * 16).toFixed(1)}px`);
    }
  });
}
window.addEventListener('scroll', updateScrollDetails, { passive: true });
updateScrollDetails();

// The desk illustration follows the pointer by only a few pixels for soft depth.
const desk = art?.querySelector('.desk-scene');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (art && desk && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  let pointX = 0, pointY = 0, currentX = 0, currentY = 0, pointerFrame = 0;
  const moveArt = () => {
    currentX += (pointX - currentX) * 0.075;
    currentY += (pointY - currentY) * 0.075;
    desk.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
    if (Math.abs(pointX - currentX) > 0.05 || Math.abs(pointY - currentY) > 0.05) {
      pointerFrame = requestAnimationFrame(moveArt);
    } else {
      pointerFrame = 0;
    }
  };
  art.addEventListener('pointermove', event => {
    const bounds = art.getBoundingClientRect();
    pointX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 9;
    pointY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 7;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(moveArt);
  });
  art.addEventListener('pointerleave', () => {
    pointX = 0;
    pointY = 0;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(moveArt);
  });
}

// Give each project preview a restrained, pointer-following 3D tilt.
if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.project-visual').forEach(card => {
    card.addEventListener('pointermove', event => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty('--tilt-x', `${(x * 3).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(-y * 3).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}
