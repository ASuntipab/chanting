/**
 * Tamma OS - Cosmic Dhamma Starfield Engine
 * Renders smooth floating stars, nebula clouds, and golden starlight particles
 */

export class CosmicStarfield {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.stars = [];
    this.numStars = 70;
    this.animId = null;
    this.width = 0;
    this.height = 0;
  }

  init() {
    this.canvas = document.getElementById('cosmicCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate peaceful cosmic stars & dharma dust particles
    this.stars = [];
    this.numStars = 85;
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.0 + 0.6,
        baseAlpha: Math.random() * 0.65 + 0.35,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        vy: -(Math.random() * 0.05 + 0.018), // Slow, tranquil & meditative upward floating
        vx: (Math.random() - 0.5) * 0.025,
        color: Math.random() > 0.4 ? '#fbbf24' : (Math.random() > 0.5 ? '#818cf8' : '#38bdf8') // Gold, Indigo, Cyan
      });
    }

    this.start();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const render = () => {
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];

      // Update position
      star.y += star.vy;
      star.x += star.vx;
      star.twinklePhase += star.twinkleSpeed;

      // Wrap around screen
      if (star.y < -10) star.y = this.height + 10;
      if (star.x < -10) star.x = this.width + 10;
      if (star.x > this.width + 10) star.x = -10;

      // Twinkle calculation
      const alpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.25;
      const finalAlpha = Math.max(0.1, Math.min(0.9, alpha));

      this.ctx.save();
      this.ctx.globalAlpha = finalAlpha;
      this.ctx.fillStyle = star.color;
      this.ctx.shadowBlur = star.radius * 5;
      this.ctx.shadowColor = star.color;

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Occasional 4-point sparkle for larger stars
      if (star.radius > 1.8 && Math.sin(star.twinklePhase) > 0.6) {
        this.ctx.strokeStyle = star.color;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(star.x - star.radius * 3, star.y);
        this.ctx.lineTo(star.x + star.radius * 3, star.y);
        this.ctx.moveTo(star.x, star.y - star.radius * 3);
        this.ctx.lineTo(star.x, star.y + star.radius * 3);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }
}

export const starfield = new CosmicStarfield();
