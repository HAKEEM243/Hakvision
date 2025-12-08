// Navigation Mobile Script - Universal
// Ce script gère le menu hamburger sur toutes les pages

document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  const navLinksItems = document.querySelectorAll('.nav-links li');
  
  if (burger && navLinks) {
    // Toggle menu mobile
    burger.addEventListener('click', () => {
      // Toggle Nav
      navLinks.classList.toggle('nav-active');
      
      // Animate Links
      navLinksItems.forEach((link, index) => {
        if (link.style.animation) {
          link.style.animation = '';
        } else {
          link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
        }
      });
      
      // Burger Animation
      burger.classList.toggle('toggle');
    });
    
    // Fermer le menu au clic sur un lien
    navLinksItems.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-active');
        burger.classList.remove('toggle');
        
        // Reset animations
        navLinksItems.forEach(item => {
          item.style.animation = '';
        });
      });
    });
    
    // Fermer le menu au clic à l'extérieur
    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('nav-active');
        burger.classList.remove('toggle');
        
        navLinksItems.forEach(item => {
          item.style.animation = '';
        });
      }
    });
  }
});
