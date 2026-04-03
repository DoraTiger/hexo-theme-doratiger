import { prepare, layoutWithLines } from '../lib/pretext/layout.js';

class Page404 {
  constructor() {
    this.canvas = document.getElementById('page404-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.particles = [];
    this.startTime = null;
    this.duration = 2000;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createParticles();
    this.animate();
  }

  resize() {
    const container = this.canvas.parentElement;
    this.width = container.clientWidth;
    this.height = Math.min(container.clientWidth * 0.5, 300);
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.draw(1);
  }

  createParticles() {
    // Floating dots for ambiance
    this.particles = [];
    const count = Math.floor(this.width / 20);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
  }

  easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  animate() {
    this.startTime = performance.now();
    let frame = 0;

    const tick = (now) => {
      const elapsed = now - this.startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      this.draw(progress);

      // Move particles
      for (const p of this.particles) {
        p.y -= p.speed;
        if (p.y < -5) {
          p.y = this.height + 5;
          p.x = Math.random() * this.width;
        }
      }

      frame++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  draw(progress) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw particles
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 119, 0, ${p.opacity})`;
      ctx.fill();
    }

    // "404" big text using pretext
    const fontSize = Math.min(this.width / 4, 140);
    const prepared = prepare(
      '404',
      `bold ${fontSize * dpr}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    );
    const { lines } = layoutWithLines(prepared, this.width * dpr, fontSize * 1.2 * dpr);

    const eased = this.easeOutExpo(progress);
    const totalHeight = lines.length * fontSize * 1.2;
    const startY = (this.height - totalHeight) / 2;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineW = line.width / dpr;
      const x = (this.width - lineW) / 2;
      const y = startY + i * fontSize * 1.2;

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.translate(0, (1 - eased) * 30);

      // Glow effect
      ctx.shadowColor = 'rgba(230, 119, 0, 0.5)';
      ctx.shadowBlur = 20 * eased;
      ctx.font = `bold ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.fillStyle = `rgba(230, 119, 0, ${0.15 + eased * 0.15})`;
      ctx.textBaseline = 'top';
      ctx.fillText(line.text, x, y);

      // Outline
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(230, 119, 0, ${0.3 * eased})`;
      ctx.lineWidth = 1;
      ctx.strokeText(line.text, x, y);

      ctx.restore();
    }
  }
}

export default Page404;
