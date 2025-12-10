/**
 * HAKVISION - JavaScript Premium
 * Fonctionnalités pour site d'actualités mondial
 */

// ============ SCROLL PROGRESS BAR ============
window.addEventListener('scroll', () => {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
  }
});

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============ FADE IN ANIMATION ON SCROLL ============
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, observerOptions);

// Observer tous les éléments avec animations
document.querySelectorAll('.article-card, .sidebar-widget, .hero-section, .book-card, .home-feature-card, .home-highlight').forEach(el => {
  observer.observe(el);
});

// ============ BREAKING NEWS TICKER ANIMATION ============
const breakingText = document.querySelector('.breaking-text');
if (breakingText) {
  const text = breakingText.textContent;
  breakingText.innerHTML = `<span>${text}</span><span style="margin-left: 100px;">${text}</span>`;
  
  let position = 0;
  setInterval(() => {
    position -= 1;
    if (Math.abs(position) > breakingText.scrollWidth / 2) {
      position = 0;
    }
    breakingText.style.transform = `translateX(${position}px)`;
  }, 30);
}

// ============ LAZY LOADING IMAGES ============
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ============ SOCIAL SHARE TRACKING ============
document.querySelectorAll('.share-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const platform = this.classList.contains('facebook') ? 'Facebook' :
                    this.classList.contains('twitter') ? 'Twitter' :
                    this.classList.contains('linkedin') ? 'LinkedIn' :
                    this.classList.contains('whatsapp') ? 'WhatsApp' : 'Unknown';
    console.log('Shared on:', platform);
    // Google Analytics tracking peut être ajouté ici
    if (typeof gtag !== 'undefined') {
      gtag('event', 'share', {
        'event_category': 'Social',
        'event_label': platform
      });
    }
  });
});

// ============ NEWSLETTER FORM ============
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    alert(`Merci ${email} ! Vous recevrez bientôt nos actualités.`);
    this.reset();
  });
}

// ============ ACTIVE NAVIGATION HIGHLIGHT ============
const currentPage = window.location.pathname.split('/').pop();
document.querySelectorAll('.press-nav a').forEach(link => {
  const linkPage = link.getAttribute('href');
  if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
    link.classList.add('active');
  }
});

// ============ DYNAMIC DATE IN TOP BAR ============
const dateElement = document.querySelector('.top-bar-content span:not(.live-badge)');
if (dateElement && dateElement.textContent.includes('📅')) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('fr-FR', options);
  dateElement.textContent = `📅 ${today.charAt(0).toUpperCase() + today.slice(1)}`;
}

// ============ CONSOLE LOG ============
console.log('%c🚀 HAKVISION PREMIUM LOADED', 'color: #facc15; font-size: 20px; font-weight: bold;');
console.log('%cSite de presse niveau mondial - Le Monde / BFM TV / L\'Équipe', 'color: #1a1a1a; font-size: 14px;');
