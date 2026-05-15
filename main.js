class Game {
    constructor() {
        this.score = 0;
        this.crushCount = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.comboTimer = 0;
        this.comboTimeout = 1.0;
        this.lastCrushTime = 0;
        
        this.gameDuration = 50;
        this.timeRemaining = this.gameDuration;
        this.gameRunning = false;
        
        this.lastTime = 0;
        this.fps = 60;
        this.deltaTime = 0.016;
        
        this.background = null;
        this.handTracker = null;
        this.propSystem = null;
        this.effectSystem = null;
        this.collisionDetector = null;
        
        this.startCanvas = null;
        this.startCtx = null;
        this.audioBars = [];
        this.audioContext = null;
        
        this.isInitialized = false;
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API 不支持');
        }
    }
    
    playExplosionSound() {
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const now = this.audioContext.currentTime;
        
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.08));
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.3);
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(oscGain);
        oscGain.connect(this.audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    async init() {
        const bgCanvas = document.getElementById('bg-canvas');
        const gameCanvas = document.getElementById('game-canvas');
        const handCanvas = document.getElementById('hand-canvas');
        const effectCanvas = document.getElementById('effect-canvas');
        const videoElement = document.getElementById('webcam');
        this.startCanvas = document.getElementById('start-canvas');
        this.startCtx = this.startCanvas.getContext('2d');
        
        this.background = new CyberBackground(bgCanvas);
        this.handTracker = new HandTracker(videoElement, handCanvas, (handsData) => this.onHandUpdate(handsData));
        this.propSystem = new PropSystem(gameCanvas);
        this.effectSystem = new EffectSystem(effectCanvas);
        this.collisionDetector = new CollisionDetector();
        
        this.resizeStartCanvas();
        window.addEventListener('resize', () => this.resizeStartCanvas());
        this.initAudioBars();
        
        this.setupStartScreen();
        
        this.isInitialized = true;
        this.lastTime = performance.now();
        this.startScreenLoop(this.lastTime);
    }
    
    resizeStartCanvas() {
        this.startCanvas.width = window.innerWidth;
        this.startCanvas.height = window.innerHeight;
    }
    
    initAudioBars() {
        const barCount = 50;
        for (let i = 0; i < barCount; i++) {
            this.audioBars.push({
                x: (window.innerWidth / (barCount + 1)) * (i + 1),
                height: Math.random() * 100 + 20,
                targetHeight: Math.random() * 150 + 50,
                speed: Math.random() * 200 + 100
            });
        }
    }
    
    setupStartScreen() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveData();
        });
    }
    
    async startGame() {
        document.getElementById('start-screen').style.display = 'none';
        
        this.initAudio();
        
        const cameraReady = await this.handTracker.init();
        
        if (cameraReady) {
            document.getElementById('instructions').style.display = 'none';
        } else {
            document.getElementById('instructions').innerHTML = `
                <p>无法访问摄像头</p>
                <p class="small">请检查浏览器权限设置</p>
            `;
        }
        
        this.gameRunning = true;
        this.timeRemaining = this.gameDuration;
        this.score = 0;
        this.crushCount = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.updateUI();
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    restartGame() {
        document.getElementById('end-screen').style.display = 'none';
        this.propSystem.props = [];
        this.effectSystem.effects = [];
        this.startGame();
    }
    
    saveData() {
        alert('数据存档功能开发中，敬请期待！');
    }
    
    startScreenLoop(currentTime) {
        if (this.gameRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        this.drawStartScreen(deltaTime);
        
        requestAnimationFrame((time) => this.startScreenLoop(time));
    }
    
    drawStartScreen(deltaTime) {
        const ctx = this.startCtx;
        const width = this.startCanvas.width;
        const height = this.startCanvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = width / this.audioBars.length;
        
        this.audioBars.forEach((bar, i) => {
            bar.height += (bar.targetHeight - bar.height) * deltaTime * bar.speed * 0.01;
            
            if (Math.abs(bar.height - bar.targetHeight) < 5) {
                bar.targetHeight = Math.random() * 150 + 50;
            }
            
            const hue = (i / this.audioBars.length) * 120 + 180;
            const gradient = ctx.createLinearGradient(
                bar.x, height,
                bar.x, height - bar.height
            );
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.3)`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0.1)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                bar.x - barWidth / 3,
                height - bar.height,
                barWidth * 0.6,
                bar.height
            );
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.5)`;
            ctx.fillRect(
                bar.x - barWidth / 3,
                height - bar.height,
                barWidth * 0.6,
                3
            );
            ctx.shadowBlur = 0;
        });
        
        const time = currentTime / 1000;
        for (let i = 0; i < 30; i++) {
            const x = (Math.sin(time * 0.5 + i * 0.5) * 0.5 + 0.5) * width;
            const y = (Math.cos(time * 0.3 + i * 0.3) * 0.5 + 0.5) * height * 0.6;
            const size = Math.sin(time + i) * 3 + 5;
            const opacity = Math.sin(time * 0.5 + i * 0.2) * 0.3 + 0.3;
            
            const hue = (i / 30) * 120 + 180;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${opacity})`;
            ctx.fill();
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    gameLoop(currentTime) {
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        this.fps = Math.round(1 / this.deltaTime);
        
        if (this.isInitialized && this.gameRunning) {
            this.timeRemaining -= this.deltaTime;
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.endGame();
            }
            
            this.background.update(this.deltaTime);
            this.propSystem.update(this.deltaTime);
            this.effectSystem.update(this.deltaTime);
            
            this.comboTimer -= this.deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                this.updateUI();
            }
            
            this.updateCountdown();
            
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    endGame() {
        this.gameRunning = false;
        
        document.getElementById('end-score').textContent = this.score;
        document.getElementById('end-crush-count').textContent = this.crushCount;
        document.getElementById('end-max-combo').textContent = `x${this.maxCombo}`;
        document.getElementById('end-screen').style.display = 'flex';
    }
    
    onHandUpdate(handsData) {
        if (!this.isInitialized || !this.gameRunning) return;
        
        this.updateHandStatusUI(handsData);
        
        this.collisionDetector.update(this.deltaTime, handsData, this.propSystem, (prop, x, y, handKey) => {
            this.onCrush(prop, x, y);
        });
    }
    
    onCrush(prop, x, y) {
        const now = performance.now() / 1000;
        const timeSinceLastCrush = now - this.lastCrushTime;
        
        if (timeSinceLastCrush < this.comboTimeout) {
            this.combo = Math.min(this.combo + 1, 10);
        } else {
            this.combo = 1;
        }
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        this.lastCrushTime = now;
        this.comboTimer = this.comboTimeout;
        
        const speedBonus = Math.round(prop.speed * 5);
        const scoreGain = (prop.baseScore + speedBonus) * this.combo;
        
        this.score += scoreGain;
        this.crushCount++;
        
        this.updateUI();
        
        this.playExplosionSound();
        
        this.effectSystem.createCrushEffect(x, y, prop.color, prop.text);
        
        document.getElementById('game-container').classList.add('shake');
        setTimeout(() => {
            document.getElementById('game-container').classList.remove('shake');
        }, 500);
    }
    
    updateCountdown() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const countdownEl = document.getElementById('countdown');
        countdownEl.textContent = display;
        
        if (this.timeRemaining < 300) {
            countdownEl.classList.add('warning');
        } else {
            countdownEl.classList.remove('warning');
        }
    }
    
    updateHandStatusUI(handsData) {
        const leftHandEl = document.getElementById('left-hand');
        const rightHandEl = document.getElementById('right-hand');
        
        if (handsData.left.landmarks) {
            leftHandEl.className = handsData.left.isFist ? 'hand-indicator active' : 'hand-indicator open';
            leftHandEl.querySelector('.hand-state').textContent = handsData.left.isFist ? '握拳' : '张开';
            leftHandEl.querySelector('.hand-state').style.color = '';
        } else {
            leftHandEl.className = 'hand-indicator';
            leftHandEl.querySelector('.hand-state').textContent = '未检测';
            leftHandEl.querySelector('.hand-state').style.color = '#666';
        }
        
        if (handsData.right.landmarks) {
            rightHandEl.className = handsData.right.isFist ? 'hand-indicator active' : 'hand-indicator open';
            rightHandEl.querySelector('.hand-state').textContent = handsData.right.isFist ? '握拳' : '张开';
            rightHandEl.querySelector('.hand-state').style.color = '';
        } else {
            rightHandEl.className = 'hand-indicator';
            rightHandEl.querySelector('.hand-state').textContent = '未检测';
            rightHandEl.querySelector('.hand-state').style.color = '#666';
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('crush-count').textContent = this.crushCount;
        document.getElementById('combo').textContent = `x${this.combo}`;
        
        if (this.combo > 1) {
            document.getElementById('combo').style.color = `hsl(${(this.combo * 30) % 360}, 100%, 60%)`;
            document.getElementById('combo').style.textShadow = `0 0 20px hsl(${(this.combo * 30) % 360}, 100%, 60%)`;
        } else {
            document.getElementById('combo').style.color = '#ffffff';
            document.getElementById('combo').style.textShadow = '0 0 10px currentColor';
        }
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    game.init();
});