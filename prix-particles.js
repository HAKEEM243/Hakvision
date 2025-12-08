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

// Countdown Timer - REMOVED (remplacé par Timeline Janvier-Mars)

// Form Submission Handler - Backup to localStorage
class PrixFormHandler {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }
  
  async handleSubmit(e) {
    // Don't prevent default - let FormSubmit handle the email
    // Just backup to localStorage before submission
    
    const formData = new FormData(this.form);
    const data = {
      nom: formData.get('nom'),
      email: formData.get('email'),
      prix: formData.get('prix'),
      livre_titre: formData.get('livre_titre'),
      message: formData.get('message'),
      date: new Date().toISOString()
    };
    
    try {
      // Store in localStorage as backup
      const submissions = JSON.parse(localStorage.getItem('prix_submissions') || '[]');
      submissions.push(data);
      localStorage.setItem('prix_submissions', JSON.stringify(submissions));
      
      // Log to console for admin
      console.log('💾 Candidature sauvegardée localement:', data);
      console.log('✉️ Envoi email en cours vers arenalse22@gmail.com...');
      
    } catch (error) {
      console.error('Erreur sauvegarde locale:', error);
    }
    
    // Let FormSubmit handle the rest (email sending + redirect)
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Start golden particles animation
  new GoldenParticles();
  
  // Initialize form handler (backup to localStorage before FormSubmit sends email)
  new PrixFormHandler('prix-inscription-form');
  
  console.log('✨ Prix Littéraires - System Ready');
  console.log('📧 Form submissions will be sent to: arenalse22@gmail.com');
  console.log('💾 Local backup enabled in localStorage: prix_submissions');
});
