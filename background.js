class CyberBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.gridLines = [];
        this.time = 0;
        this.resize();
        this.initParticles();
        this.initGrid();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    initParticles() {
        const count = 100;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                color: this.randomNeonColor()
            });
        }
    }
    
    initGrid() {
        const gridSize = 80;
        for (let x = 0; x < this.width; x += gridSize) {
            this.gridLines.push({ x1: x, y1: 0, x2: x, y2: this.height });
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.gridLines.push({ x1: 0, y1: y, x2: this.width, y2: y });
        }
    }
    
    randomNeonColor() {
        const colors = ['#00f0ff', '#ff00ff', '#00ff88', '#ff0066', '#ffdd00'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    drawBackground() {
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawGradientOverlay();
        this.drawGrid();
        this.drawParticles();
        this.drawScanLine();
    }
    
    drawGradientOverlay() {
        const gradient = this.ctx.createRadialGradient(
            this.width * 0.5, this.height * 0.5, 0,
            this.width * 0.5, this.height * 0.5, this.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.03)');
        gradient.addColorStop(1, 'rgba(10, 10, 15, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawGrid() {
        const offsetY = (this.time * 20) % 80;
        
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let y = 0; y < this.height; y += 80) {
            const adjustedY = y + offsetY;
            if (adjustedY > this.height) continue;
            
            const alpha = 0.05 + Math.sin(this.time + y * 0.01) * 0.03;
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, adjustedY);
            this.ctx.lineTo(this.width, adjustedY);
            this.ctx.stroke();
        }
        
        for (let x = 0; x < this.width; x += 80) {
            const alpha = 0.05 + Math.sin(this.time + x * 0.01) * 0.03;
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;
            
            const pulse = Math.sin(this.time * 2 + p.x * 0.01) * 0.5 + 0.5;
            const currentOpacity = p.opacity * (0.5 + pulse * 0.5);
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color + Math.floor(currentOpacity * 255).toString(16).padStart(2, '0');
            this.ctx.fill();
            
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        this.drawParticleConnections();
    }
    
    drawParticleConnections() {
        const maxDist = 150;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * 0.15;
                    this.ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawScanLine() {
        const scanY = (this.time * 100) % this.height;
        const gradient = this.ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        gradient.addColorStop(0, 'rgba(0, 240, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, scanY - 30, this.width, 60);
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        this.drawBackground();
    }
}