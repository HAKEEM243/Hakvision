// Système de particules dorées animées ultra premium
class GoldenParticles {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 80;
    
    this.setupCanvas();
    this.createParticles();
    this.animate();
    
    window.addEventListener('resize', () => this.setupCanvas());
  }
  
  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = document.documentElement.scrollHeight;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);
  }
  
  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 4 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * -1 - 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.05 + 0.02
      });
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.twinkle += particle.twinkleSpeed;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      
      // Twinkle effect
      const twinkleOpacity = particle.opacity * (0.5 + Math.sin(particle.twinkle) * 0.5);
      
      // Draw particle with glow
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      
      // Gradient for glow effect
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      gradient.addColorStop(0, `rgba(255, 215, 0, ${twinkleOpacity})`);
      gradient.addColorStop(0.5, `rgba(255, 165, 0, ${twinkleOpacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

// Countdown Timer Spectaculaire
class CountdownTimer {
  constructor(targetDate, elementId) {
    this.targetDate = new Date(targetDate).getTime();
    this.element = document.getElementById(elementId);
    this.update();
    setInterval(() => this.update(), 1000);
  }
  
  update() {
    const now = new Date().getTime();
    const distance = this.targetDate - now;
    
    if (distance < 0) {
      this.element.innerHTML = '<div class="countdown-expired">🎉 LANCEMENT OFFICIEL ! 🎉</div>';
      return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    this.element.innerHTML = `
      <div class="countdown-container">
        <div class="countdown-item">
          <div class="countdown-value">${days}</div>
          <div class="countdown-label">Jours</div>
        </div>
        <div class="countdown-separator">:</div>
        <div class="countdown-item">
          <div class="countdown-value">${hours.toString().padStart(2, '0')}</div>
          <div class="countdown-label">Heures</div>
        </div>
        <div class="countdown-separator">:</div>
        <div class="countdown-item">
          <div class="countdown-value">${minutes.toString().padStart(2, '0')}</div>
          <div class="countdown-label">Minutes</div>
        </div>
        <div class="countdown-separator">:</div>
        <div class="countdown-item">
          <div class="countdown-value">${seconds.toString().padStart(2, '0')}</div>
          <div class="countdown-label">Secondes</div>
        </div>
      </div>
    `;
  }
}

// Form Submission Handler
class PrixFormHandler {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(this.form);
    const data = {
      nom: formData.get('nom'),
      email: formData.get('email'),
      prix: formData.get('prix'),
      livre_titre: formData.get('livre_titre'),
      message: formData.get('message'),
      date: new Date().toISOString()
    };
    
    // Show loading
    const submitBtn = this.form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;
    
    try {
      // Store in localStorage as backup
      const submissions = JSON.parse(localStorage.getItem('prix_submissions') || '[]');
      submissions.push(data);
      localStorage.setItem('prix_submissions', JSON.stringify(submissions));
      
      // Show success message
      this.showMessage('success', '🎉 Votre candidature a été enregistrée avec succès ! Nous vous contacterons bientôt.');
      this.form.reset();
      
      // Log to console for admin
      console.log('Nouvelle candidature enregistrée:', data);
      
    } catch (error) {
      this.showMessage('error', '❌ Une erreur est survenue. Veuillez réessayer ou nous contacter par email.');
      console.error('Erreur:', error);
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }
  
  showMessage(type, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message form-message-${type}`;
    messageDiv.innerHTML = message;
    
    this.form.insertAdjacentElement('beforebegin', messageDiv);
    
    setTimeout(() => {
      messageDiv.style.opacity = '0';
      setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Start particles
  new GoldenParticles();
  
  // Start countdown (set target date to 90 days from now)
  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + 90);
  new CountdownTimer(launchDate, 'countdown-timer');
  
  // Initialize form handler
  new PrixFormHandler('prix-inscription-form');
});
