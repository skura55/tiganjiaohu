class HandTracker {
    constructor(videoElement, handCanvas, onUpdate) {
        this.video = videoElement;
        this.canvas = handCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.onUpdate = onUpdate;
        
        this.hands = {
            left: { landmarks: null, isFist: false, confidence: 0, position: { x: 0, y: 0 } },
            right: { landmarks: null, isFist: false, confidence: 0, position: { x: 0, y: 0 } }
        };
        
        this.handTrails = {
            left: [],
            right: []
        };
        
        this.maxTrailLength = 15;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    async init() {
        try {
            const hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
                }
            });
            
            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 0,
                minDetectionConfidence: 0.6,
                minTrackingConfidence: 0.5
            });
            
            hands.onResults((results) => this.onResults(results));
            
            const camera = new Camera(this.video, {
                onFrame: async () => {
                    await hands.send({ image: this.video });
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            return true;
        } catch (error) {
            console.error('摄像头初始化失败:', error);
            return false;
        }
    }
    
    onResults(results) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.hands.left.landmarks = null;
        this.hands.right.landmarks = null;
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index].label.toLowerCase();
                const handKey = handedness === 'left' ? 'left' : 'right';
                
                this.hands[handKey].landmarks = landmarks;
                this.hands[handKey].isFist = this.detectFist(landmarks);
                this.hands[handKey].confidence = results.multiHandedness[index].score;
                
                const palmCenter = this.getPalmCenter(landmarks);
                this.hands[handKey].position = palmCenter;
                
                this.updateTrail(handKey, palmCenter);
                this.drawHand(landmarks, handKey);
                this.drawTrail(handKey);
            });
        }
        
        if (this.onUpdate) {
            this.onUpdate(this.hands);
        }
    }
    
    detectFist(landmarks) {
        const palmIdx = [0, 5, 9, 13, 17];
        let palmX = 0, palmY = 0;
        for (let i = 0; i < palmIdx.length; i++) {
            palmX += landmarks[palmIdx[i]].x;
            palmY += landmarks[palmIdx[i]].y;
        }
        palmX /= palmIdx.length;
        palmY /= palmIdx.length;
        
        const palmRadius = Math.sqrt(
            (landmarks[9].x - palmX) * (landmarks[9].x - palmX) +
            (landmarks[9].y - palmY) * (landmarks[9].y - palmY)
        );
        
        const tipToPalmThreshold = palmRadius * 1.5;
        const tipToPalmThresholdSq = tipToPalmThreshold * tipToPalmThreshold;
        
        const fingertips = [8, 12, 16, 20];
        let curledFingers = 0;
        for (let i = 0; i < fingertips.length; i++) {
            const tip = fingertips[i];
            const p = landmarks[tip];
            const d = (p.x - palmX) * (p.x - palmX) + (p.y - palmY) * (p.y - palmY);
            if (d < tipToPalmThresholdSq) curledFingers++;
        }
        
        return curledFingers >= 4;
    }
    
    getPalmCenter(landmarks) {
        const wrist = landmarks[0];
        const mcp = landmarks[9];
        
        return {
            x: (wrist.x + mcp.x) / 2,
            y: (wrist.y + mcp.y) / 2
        };
    }
    
    updateTrail(handKey, position) {
        const trail = this.handTrails[handKey];
        trail.push({ x: position.x, y: position.y });
        
        if (trail.length > this.maxTrailLength) {
            trail.shift();
        }
    }
    
    drawHand(landmarks, handKey) {
        const isFist = this.hands[handKey].isFist;
        const baseColor = isFist ? '#ff0066' : '#00ff88';
        
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20],
            [0, 17]
        ];
        
        const ctx = this.ctx;
        
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 3;
        
        for (let i = 0; i < connections.length; i++) {
            const s = landmarks[connections[i][0]];
            const e = landmarks[connections[i][1]];
            ctx.beginPath();
            ctx.moveTo((1 - s.x) * this.width, s.y * this.height);
            ctx.lineTo((1 - e.x) * this.width, e.y * this.height);
            ctx.stroke();
        }
        
        for (let i = 0; i < landmarks.length; i++) {
            const lm = landmarks[i];
            const px = (1 - lm.x) * this.width;
            const py = lm.y * this.height;
            const isTip = [4, 8, 12, 16, 20].includes(i);
            const size = isTip ? 7 : 4;
            
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
        }
        
        this.drawPalmHologram(landmarks, handKey, isFist);
    }
    
    drawPalmHologram(landmarks, handKey, isFist) {
        const baseColor = isFist ? 'rgba(255, 0, 102, 0.15)' : 'rgba(0, 255, 136, 0.15)';
        const borderColor = isFist ? 'rgba(255, 0, 102, 0.4)' : 'rgba(0, 255, 136, 0.4)';
        
        const palmIdx = [0, 5, 9, 13, 17];
        const ctx = this.ctx;
        
        ctx.beginPath();
        for (let i = 0; i < palmIdx.length; i++) {
            const lm = landmarks[palmIdx[i]];
            const px = (1 - lm.x) * this.width;
            const py = lm.y * this.height;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    drawTrail(handKey) {
        const trail = this.handTrails[handKey];
        if (trail.length < 2) return;
        
        const isFist = this.hands[handKey].isFist;
        const trailColor = isFist ? '#ff0066' : '#00ff88';
        const ctx = this.ctx;
        
        for (let i = 1; i < trail.length; i++) {
            const alpha = i / trail.length;
            const p1 = trail[i - 1];
            const p2 = trail[i];
            
            ctx.strokeStyle = trailColor + Math.floor(alpha * 180).toString(16).padStart(2, '0');
            ctx.lineWidth = alpha * 4;
            ctx.beginPath();
            ctx.moveTo((1 - p1.x) * this.width, p1.y * this.height);
            ctx.lineTo((1 - p2.x) * this.width, p2.y * this.height);
            ctx.stroke();
        }
    }
    
    getHandsData() {
        return this.hands;
    }
}