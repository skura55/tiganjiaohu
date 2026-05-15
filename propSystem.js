class PropSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.props = [];
        this.maxProps = 12;
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        
        this.propTypes = [
            { text: 'PPT', color: '#FF8C00', glow: '#ff8c00', baseScore: 5, speed: 1.4, size: 0.9, isSpecial: false },
            { text: 'Excel', color: '#00CED1', glow: '#00ced1', baseScore: 5, speed: 1.3, size: 0.95, isSpecial: false },
            { text: 'PDF', color: '#FF3333', glow: '#ff3333', baseScore: 5, speed: 1.0, size: 1.0, isSpecial: false },
            { text: 'AI', color: '#0066FF', glow: '#0066ff', baseScore: 10, speed: 0.8, size: 1.1, isSpecial: true },
            { text: '我还是喜欢第一版', color: '#FFD700', glow: '#ffd700', baseScore: 10, speed: 0.7, size: 1.3, isSpecial: true },
            { text: '我想要五彩斑斓的黑', color: '#9932CC', glow: '#9932cc', baseScore: 10, speed: 0.6, size: 1.4, isSpecial: true }
        ];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    spawnProp() {
        if (this.props.length >= this.maxProps) return;
        
        const type = this.propTypes[Math.floor(Math.random() * this.propTypes.length)];
        const startX = Math.random() * (this.width - 200) + 100;
        const startY = this.height + 50;
        
        const isFastProp = type.speed >= 1.3;
        const baseHeight = this.height * 0.35;
        const specialHeight = this.height * 0.12;
        const targetHeight = isFastProp ? specialHeight : baseHeight;
        
        const gravity = 500 * type.speed;
        const startYOffset = 50;
        const maxApexY = targetHeight;
        const maxHeight = this.height + startYOffset - maxApexY;
        const vy = -Math.sqrt(2 * gravity * maxHeight);
        
        const fontSize = (28 + type.text.length * 0.5) * type.size;
        const radius = 50 * type.size + type.text.length * 6;
        
        const prop = {
            text: type.text,
            color: type.color,
            glow: type.glow,
            x: startX,
            y: startY,
            vx: (Math.random() - 0.5) * 100 * type.speed,
            vy: vy,
            gravity: gravity,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 2.5 * type.speed,
            scale: type.size,
            radius: radius,
            alive: true,
            time: 0,
            baseScore: type.baseScore,
            speed: type.speed,
            size: type.size,
            isSpecial: type.isSpecial,
            wobbleSpeed: Math.random() * 2 + 2,
            wobbleAmount: Math.random() * 12 + 5,
            apexReached: false,
            fontSize: fontSize
        };
        
        this.props.push(prop);
    }
    
    update(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnProp();
            this.spawnTimer = 0;
            this.spawnInterval = Math.random() * 1 + 0.8;
        }
        
        let writeIdx = 0;
        const len = this.props.length;
        for (let i = 0; i < len; i++) {
            const prop = this.props[i];
            if (!prop.alive) continue;
            
            prop.time += deltaTime;
            prop.vy += prop.gravity * deltaTime;
            prop.x += prop.vx * deltaTime;
            prop.y += prop.vy * deltaTime;
            prop.rotation += prop.rotationSpeed * deltaTime;
            
            if (prop.vy > 0 && !prop.apexReached) {
                prop.apexReached = true;
            }
            
            const speedFactor = prop.apexReached ? 
                Math.min(1 + Math.abs(prop.vy) * 0.0015, 1.6) : 
                Math.max(1 - Math.abs(prop.vy) * 0.001, 0.5);
            
            const wobble = Math.sin(prop.time * prop.wobbleSpeed) * prop.wobbleAmount * speedFactor;
            prop.x += wobble * deltaTime;
            
            if (prop.y <= this.height + 100 && 
                prop.x >= -150 && 
                prop.x <= this.width + 150) {
                if (writeIdx !== i) {
                    this.props[writeIdx] = prop;
                }
                writeIdx++;
            }
        }
        this.props.length = writeIdx;
        
        this.drawProps();
    }
    
    drawProps() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        const len = this.props.length;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let idx = 0; idx < len; idx++) {
            const prop = this.props[idx];
            
            ctx.save();
            ctx.translate(prop.x, prop.y);
            ctx.rotate(prop.rotation);
            
            ctx.font = `bold ${prop.fontSize}px 'Orbitron', 'Noto Sans SC', sans-serif`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = prop.glow;
            ctx.strokeStyle = prop.color;
            ctx.lineWidth = 2;
            ctx.strokeText(prop.text, 0, 0);
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = prop.color;
            ctx.fillText(prop.text, 0, 0);
            ctx.globalAlpha = 1;
            
            this.drawAuraEffect(prop);
            
            ctx.restore();
        }
    }
    
    drawAuraEffect(prop) {
        const pulse = Math.sin(prop.time * 4) * 0.5 + 0.5;
        const auraSize = prop.radius * (0.8 + pulse * 0.2);
        
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, auraSize);
        gradient.addColorStop(0, prop.glow + '25');
        gradient.addColorStop(0.5, prop.glow + '10');
        gradient.addColorStop(1, prop.glow + '00');
        
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    checkCollision(handX, handY, collisionRadius) {
        const collisions = [];
        const len = this.props.length;
        
        for (let i = 0; i < len; i++) {
            const prop = this.props[i];
            if (!prop.alive) continue;
            
            const dx = handX - prop.x;
            const dy = handY - prop.y;
            const combinedRadius = collisionRadius + prop.radius;
            
            if (dx * dx + dy * dy < combinedRadius * combinedRadius) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                collisions.push({
                    prop: prop,
                    distance: dist,
                    overlap: 1 - (dist / combinedRadius)
                });
            }
        }
        
        return collisions;
    }
    
    removeProp(prop) {
        prop.alive = false;
    }
}