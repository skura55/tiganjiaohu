class CollisionDetector {
    constructor() {
        this.collisionCooldowns = { left: 0, right: 0 };
        this.cooldownDuration = 0.3;
        this.collisionRadius = 80;
    }
    
    update(deltaTime, handsData, propSystem, onCrush) {
        this.collisionCooldowns.left -= deltaTime;
        this.collisionCooldowns.right -= deltaTime;
        
        Object.keys(handsData).forEach(handKey => {
            const hand = handsData[handKey];
            
            if (!hand.landmarks || !hand.isFist) return;
            if (this.collisionCooldowns[handKey] > 0) return;
            
            const handX = (1 - hand.position.x) * window.innerWidth;
            const handY = hand.position.y * window.innerHeight;
            
            const collisions = propSystem.checkCollision(handX, handY, this.collisionRadius);
            
            if (collisions.length > 0) {
                collisions.forEach(collision => {
                    if (collision.overlap > 0.3) {
                        propSystem.removeProp(collision.prop);
                        this.collisionCooldowns[handKey] = this.cooldownDuration;
                        
                        if (onCrush) {
                            onCrush(collision.prop, handX, handY, handKey);
                        }
                    }
                });
            }
        });
    }
}