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

// Form Submission Handler - Multi-Service Backup
class PrixFormHandler {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }
  
  async handleSubmit(e) {
    e.preventDefault(); // Prevent default to handle multiple services
    
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
      // 1. Store in localStorage as backup
      const submissions = JSON.parse(localStorage.getItem('prix_submissions') || '[]');
      submissions.push(data);
      localStorage.setItem('prix_submissions', JSON.stringify(submissions));
      
      console.log('💾 Candidature sauvegardée localement:', data);
      
      // 2. Send to Webhook as secondary backup
      await this.sendToWebhook(data);
      
      // 3. Let FormSubmit handle primary email
      console.log('✉️ Envoi email via FormSubmit vers arenalse22@gmail.com...');
      this.form.submit(); // Submit to FormSubmit
      
    } catch (error) {
      console.error('Erreur:', error);
      // Still submit to FormSubmit even if backup fails
      this.form.submit();
    }
  }
  
  async sendToWebhook(data) {
    try {
      // Send to Make.com/Zapier webhook or direct email API
      const webhookUrl = 'https://hook.eu2.make.com/your-webhook-id'; // Placeholder
      
      // Also try FormBackend as backup
      await fetch('https://www.formbackend.com/f/your-form-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          _to: 'arenalse22@gmail.com',
          _subject: '🏆 Nouvelle inscription Prix Littéraires !',
          _service: 'backup'
        })
      });
      
      console.log('📤 Backup envoyé avec succès');
    } catch (error) {
      console.log('⚠️ Backup webhook échoué (non critique)');
    }
  }
}

// Email Direct Handler (fallback)
function setupEmailDirectButton() {
  const btn = document.getElementById('email-direct-btn');
  if (!btn) return;
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const form = document.getElementById('prix-inscription-form');
    const formData = new FormData(form);
    
    const nom = formData.get('nom') || '';
    const email = formData.get('email') || '';
    const prix = formData.get('prix') || '';
    const livre_titre = formData.get('livre_titre') || '';
    const message = formData.get('message') || '';
    
    const subject = encodeURIComponent('🏆 Inscription Prix Littéraires');
    const body = encodeURIComponent(`
📝 NOUVELLE INSCRIPTION PRIX LITTÉRAIRES

Nom: ${nom}
Email: ${email}
Prix: ${prix}
Titre du livre: ${livre_titre}
Message: ${message}

---
Date: ${new Date().toLocaleString('fr-FR')}
    `.trim());
    
    // Open default email client
    window.location.href = `mailto:arenalse22@gmail.com?subject=${subject}&body=${body}`;
    
    // Save to localStorage
    const data = { nom, email, prix, livre_titre, message, date: new Date().toISOString() };
    const submissions = JSON.parse(localStorage.getItem('prix_submissions') || '[]');
    submissions.push(data);
    localStorage.setItem('prix_submissions', JSON.stringify(submissions));
    
    // Show confirmation
    alert('✅ Votre client email va s\'ouvrir. Envoyez simplement le message pré-rempli !');
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Start golden particles animation
  new GoldenParticles();
  
  // Initialize form handler (multi-service backup)
  new PrixFormHandler('prix-inscription-form');
  
  // Setup email direct button as fallback
  setupEmailDirectButton();
  
  console.log('✨ Prix Littéraires - System Ready');
  console.log('📧 Primary: FormSubmit (hash) → arenalse22@gmail.com');
  console.log('📧 Secondary: Email Direct Button (fallback)');
  console.log('💾 Local backup: localStorage → prix_submissions');
});
