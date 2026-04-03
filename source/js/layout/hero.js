import { prepare, layoutWithLines } from '../lib/pretext/layout.js';

class Hero {
  constructor() {
    this.canvas = document.getElementById('hero-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.title = this.canvas.dataset.title || '';
    this.subtitle = this.canvas.dataset.subtitle || '';
    this.dpr = window.devicePixelRatio || 1;
    this.lines = [];
    this.animProgress = 0;
    this.startTime = null;
    this.duration = 1800; // ms

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.prepareText();
    this.draw(this.animProgress);
  }

  prepareText() {
    this.lines = [];
    const titleFontSize = Math.min(this.width / 10, 64);
    const subtitleFontSize = Math.min(this.width / 20, 20);
    const titleLineHeight = titleFontSize * 1.3;
    const subtitleLineHeight = subtitleFontSize * 1.6;
    const maxWidth = this.width * 0.8;
    const dpr = this.dpr;

    // Title
    if (this.title) {
      const prepared = prepare(
        this.title,
        `bold ${titleFontSize * dpr}px "Helvetica Neue", Helvetica, Arial, sans-serif`
      );
      const { lines } = layoutWithLines(prepared, maxWidth * dpr, titleLineHeight * dpr);
      for (const line of lines) {
        this.lines.push({
          text: line.text,
          x: (this.width - line.width / dpr) / 2,
          fontSize: titleFontSize,
          lineHeight: titleLineHeight,
          type: 'title',
        });
      }
    }

    // Subtitle
    if (this.subtitle) {
      const prepared = prepare(
        this.subtitle,
        `${subtitleFontSize * dpr}px "Helvetica Neue", Helvetica, Arial, sans-serif`
      );
      const { lines } = layoutWithLines(prepared, maxWidth * dpr, subtitleLineHeight * dpr);
      const titleBlockHeight = this.lines.length > 0
        ? this.lines.length * this.lines[0].lineHeight + 24
        : 0;
      for (const line of lines) {
        this.lines.push({
          text: line.text,
          x: (this.width - line.width / dpr) / 2,
          fontSize: subtitleFontSize,
          lineHeight: subtitleLineHeight,
          y: titleBlockHeight,
          type: 'subtitle',
        });
      }
    }

    // Center vertically
    const totalHeight = (this.lines.filter(l => l.type === 'title').length * titleLineHeight)
      + 24
      + (this.lines.filter(l => l.type === 'subtitle').length * subtitleLineHeight);
    const offsetY = (this.height - totalHeight) / 2;
    for (const line of this.lines) {
      line.y = (line.y || 0) + offsetY;
    }
  }

  easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  animate() {
    this.startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - this.startTime;
      this.animProgress = Math.min(elapsed / this.duration, 1);
      const eased = this.easeOutExpo(this.animProgress);
      this.draw(eased);
      if (this.animProgress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  draw(progress) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      // Stagger each line
      const lineDelay = line.type === 'title' ? i * 0.08 : 0.4 + i * 0.06;
      const lineProgress = Math.max(0, Math.min((progress - lineDelay) / (1 - lineDelay), 1));
      const eased = this.easeOutExpo(lineProgress);

      ctx.save();
      ctx.globalAlpha = eased;
      ctx.translate(0, (1 - eased) * 20); // slide up

      if (line.type === 'title') {
        ctx.font = `bold ${line.fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.textBaseline = 'top';
        ctx.fillText(line.text, line.x, line.y);
      } else {
        ctx.font = `${line.fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textBaseline = 'top';
        ctx.fillText(line.text, line.x, line.y);
      }
      ctx.restore();
    }

    // Decorative line under title
    if (progress > 0.5) {
      const lineProgress = Math.min((progress - 0.5) / 0.5, 1);
      const eased = this.easeOutExpo(lineProgress);
      const titleBlock = this.lines.filter(l => l.type === 'title');
      if (titleBlock.length > 0) {
        const lastTitle = titleBlock[titleBlock.length - 1];
        const lineY = lastTitle.y + lastTitle.lineHeight + 8;
        const lineWidth = 60 * eased;
        ctx.save();
        ctx.globalAlpha = eased * 0.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo((this.width - lineWidth) / 2, lineY);
        ctx.lineTo((this.width + lineWidth) / 2, lineY);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

export default Hero;
