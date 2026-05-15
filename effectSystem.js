class EffectSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.effects = [];
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    createCrushEffect(x, y, color, text) {
        const maxParticles = 30;
        const maxFragments = Math.min(text.length, 8);
        const maxSparks = 20;
        const maxShards = 10;
        
        this.effects.push({
            type: 'crush',
            x: x,
            y: y,
            color: color,
            time: 0,
            duration: 1.0,
            alive: true,
            particles: this.createExplosionParticles(x, y, color, maxParticles),
            sparks: this.createSparks(x, y, color, maxSparks),
            fragments: this.createTextFragments(x, y, color, text, maxFragments),
            shards: this.createShards(x, y, color, maxShards),
            flash: 1.0,
            shockwaveRings: this.createShockwaveRings(x, y, color),
            coreBurst: { radius: 0, maxRadius: 60, opacity: 1 }
        });
        
        this.triggerScreenShake(12);
    }
    
    createExplosionParticles(x, y, color, count) {
        const particles = new Array(count);
        const hue = this.hexToHue(color);
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.6 - 0.3;
            const speed = Math.random() * 500 + 200;
            const size = Math.random() * 8 + 4;
            
            particles[i] = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: `hsl(${hue + Math.random() * 30 - 15}, 100%, ${50 + Math.random() * 20}%)`,
                opacity: 1,
                decay: Math.random() * 0.6 + 0.8,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 12,
                gravity: 350 + Math.random() * 200
            };
        }
        
        return particles;
    }
    
    createSparks(x, y, color, count) {
        const sparks = new Array(count);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 700 + 400;
            
            sparks[i] = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                color: color,
                opacity: 1,
                decay: Math.random() * 1.5 + 2,
                life: 0
            };
        }
        
        return sparks;
    }
    
    createTextFragments(x, y, color, text, maxChars) {
        const chars = text.split('');
        const fragCount = Math.min(chars.length, maxChars);
        const fragments = new Array(fragCount);
        
        for (let i = 0; i < fragCount; i++) {
            const angle = (Math.PI * 2 / fragCount) * i + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * 250 + 150;
            
            fragments[i] = {
                char: chars[i],
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 250,
                rotation: (Math.random() - 0.5) * Math.PI,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1,
                color: color,
                size: Math.random() * 10 + 18
            };
        }
        
        return fragments;
    }
    
    createShards(x, y, color, count) {
        const shards = new Array(count);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 400 + 250;
            
            shards[i] = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 15,
                opacity: 1,
                decay: Math.random() * 0.5 + 1,
                width: Math.random() * 15 + 8,
                height: Math.random() * 4 + 2,
                color: color
            };
        }
        
        return shards;
    }
    
    createShockwaveRings(x, y, color) {
        return [
            { x, y, radius: 0, maxRadius: 200, speed: 400, opacity: 0.8, lineWidth: 4, color },
            { x, y, radius: 0, maxRadius: 160, speed: 300, opacity: 0.6, lineWidth: 3, color, delay: 0.05 },
            { x, y, radius: 0, maxRadius: 120, speed: 200, opacity: 0.4, lineWidth: 2, color, delay: 0.1 }
        ];
    }
    
    hexToHue(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let hue = 0;
        
        if (max !== min) {
            const d = max - min;
            if (max === r) hue = ((g - b) / d) % 6;
            else if (max === g) hue = (b - r) / d + 2;
            else hue = (r - g) / d + 4;
            hue *= 60;
            if (hue < 0) hue += 360;
        }
        
        return hue;
    }
    
    triggerScreenShake(intensity) {
        this.screenShake.intensity = intensity;
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.88;
            
            if (this.screenShake.intensity < 0.5) {
                this.screenShake.intensity = 0;
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            }
        }
    }
    
    update(deltaTime) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        this.updateScreenShake(deltaTime);
        
        const len = this.effects.length;
        let writeIdx = 0;
        
        for (let i = 0; i < len; i++) {
            const effect = this.effects[i];
            if (!effect.alive) continue;
            
            effect.time += deltaTime;
            
            if (effect.time >= effect.duration) {
                continue;
            }
            
            this.drawEffect(effect, deltaTime);
            
            if (writeIdx !== i) {
                this.effects[writeIdx] = effect;
            }
            writeIdx++;
        }
        this.effects.length = writeIdx;
    }
    
    drawEffect(effect, deltaTime) {
        const ctx = this.ctx;
        const sx = this.screenShake.x;
        const sy = this.screenShake.y;
        
        if (effect.flash > 0) {
            this.drawFlash(effect);
            effect.flash -= deltaTime * 8;
        }
        
        this.drawCoreBurst(effect, sx, sy);
        this.drawShockwaveRings(effect, sx, sy, deltaTime);
        this.drawParticles(effect, sx, sy);
        this.drawSparks(effect, sx, sy);
        this.drawShards(effect, sx, sy);
        this.drawFragments(effect, sx, sy);
    }
    
    drawFlash(effect) {
        const ctx = this.ctx;
        const alpha = Math.max(0, effect.flash * 0.7);
        if (alpha <= 0) return;
        
        const grad = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, 250);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.4, `rgba(255, 255, 255, ${alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawCoreBurst(effect, sx, sy) {
        const ctx = this.ctx;
        const burst = effect.coreBurst;
        const lifeRatio = effect.time / effect.duration;
        
        burst.radius += 300 * 0.016;
        burst.opacity = Math.max(0, 1 - lifeRatio * 2);
        
        if (burst.opacity <= 0) return;
        
        const grad = ctx.createRadialGradient(
            effect.x + sx, effect.y + sy, 0,
            effect.x + sx, effect.y + sy, burst.radius
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${burst.opacity * 0.6})`);
        grad.addColorStop(0.3, `${effect.color}${Math.floor(burst.opacity * 100).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(effect.x + sx, effect.y + sy, burst.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawShockwaveRings(effect, sx, sy, deltaTime) {
        const ctx = this.ctx;
        const lifeRatio = effect.time / effect.duration;
        
        for (let i = 0; i < effect.shockwaveRings.length; i++) {
            const ring = effect.shockwaveRings[i];
            if (effect.time < (ring.delay || 0)) continue;
            
            ring.radius += ring.speed * deltaTime;
            
            if (ring.radius > ring.maxRadius) continue;
            
            const opacity = ring.opacity * (1 - ring.radius / ring.maxRadius);
            if (opacity <= 0) continue;
            
            ctx.beginPath();
            ctx.arc(ring.x + sx, ring.y + sy, ring.radius, 0, Math.PI * 2);
            ctx.strokeStyle = ring.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = ring.lineWidth * (1 - ring.radius / ring.maxRadius);
            ctx.stroke();
        }
    }
    
    drawParticles(effect, sx, sy) {
        const ctx = this.ctx;
        const lifeRatio = effect.time / effect.duration;
        const dt = 0.016;
        
        const len = effect.particles.length;
        for (let i = 0; i < len; i++) {
            const p = effect.particles[i];
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.vx *= 0.98;
            p.opacity = Math.max(0, 1 - lifeRatio * p.decay);
            p.rotation += p.rotationSpeed * dt;
            
            if (p.opacity <= 0) continue;
            
            ctx.save();
            ctx.translate(p.x + sx, p.y + sy);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            
            ctx.restore();
        }
    }
    
    drawSparks(effect, sx, sy) {
        const ctx = this.ctx;
        const lifeRatio = effect.time / effect.duration;
        const dt = 0.016;
        
        const len = effect.sparks.length;
        for (let i = 0; i < len; i++) {
            const s = effect.sparks[i];
            
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vy += 500 * dt;
            s.vx *= 0.96;
            s.life += dt;
            s.opacity = Math.max(0, 1 - s.life * s.decay);
            
            if (s.opacity <= 0) continue;
            
            ctx.globalAlpha = s.opacity;
            ctx.fillStyle = '#ffffff';
            
            const sparkLen = s.size * 4;
            const angle = Math.atan2(s.vy, s.vx);
            ctx.save();
            ctx.translate(s.x + sx, s.y + sy);
            ctx.rotate(angle);
            ctx.fillRect(-sparkLen / 2, -0.5, sparkLen, 1);
            ctx.restore();
        }
    }
    
    drawShards(effect, sx, sy) {
        const ctx = this.ctx;
        const lifeRatio = effect.time / effect.duration;
        const dt = 0.016;
        
        const len = effect.shards.length;
        for (let i = 0; i < len; i++) {
            const sh = effect.shards[i];
            
            sh.x += sh.vx * dt;
            sh.y += sh.vy * dt;
            sh.vy += 400 * dt;
            sh.opacity = Math.max(0, 1 - lifeRatio * sh.decay);
            sh.rotation += sh.rotationSpeed * dt;
            
            if (sh.opacity <= 0) continue;
            
            ctx.save();
            ctx.translate(sh.x + sx, sh.y + sy);
            ctx.rotate(sh.rotation);
            ctx.globalAlpha = sh.opacity;
            ctx.fillStyle = sh.color;
            
            ctx.beginPath();
            ctx.moveTo(-sh.width / 2, 0);
            ctx.lineTo(0, -sh.height / 2);
            ctx.lineTo(sh.width / 2, 0);
            ctx.lineTo(0, sh.height / 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    drawFragments(effect, sx, sy) {
        const ctx = this.ctx;
        const lifeRatio = effect.time / effect.duration;
        const dt = 0.016;
        
        const len = effect.fragments.length;
        for (let i = 0; i < len; i++) {
            const f = effect.fragments[i];
            
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.vy += 450 * dt;
            f.rotation += f.rotationSpeed * dt;
            f.opacity = Math.max(0, 1 - lifeRatio * 1.2);
            
            if (f.opacity <= 0) continue;
            
            ctx.save();
            ctx.translate(f.x + sx, f.y + sy);
            ctx.rotate(f.rotation);
            ctx.globalAlpha = f.opacity;
            
            ctx.font = `bold ${f.size}px 'Orbitron', 'Noto Sans SC', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = f.color;
            ctx.fillText(f.char, 0, 0);
            
            ctx.restore();
        }
    }
    
    getScreenShake() {
        return this.screenShake;
    }
}