export class Ripples {
    constructor() {
        this.ripples = [];
        this.lastRippleTime = 0;
        this.waitTimeBetweenRippleSpawns = 50;
        this.maxRipples = 100;
        this.rippleIndex = 0;
    }

    reset() {
        this.ripples = [];
        this.lastRippleTime = 0;
        this.rippleIndex = 0;
    }

    clearRipples() {
        this.ripples = [];
    }

    getNumRipples() {
        return this.ripples.length;
    }

    shouldUpdateRipples(gameTimeMillis) {
        return gameTimeMillis > this.lastRippleTime + this.waitTimeBetweenRippleSpawns;
    }

    isMaxRipples() {
        return this.getNumRipples() >= this.maxRipples;
    }

    updateRipples(p, gameTimeMillis) {
        this.lastRippleTime = gameTimeMillis;
        if (this.isMaxRipples()) {
            this.ripples[this.rippleIndex].resetRipple({ x: p.mouseX, y: p.mouseY });
            this.rippleIndex = (this.rippleIndex + 1) % this.maxRipples;
        } else {
            this.ripples.push(new Ripple(p.createVector(p.mouseX, p.mouseY)));
        }
    }

    draw(p, rippleColor, numFishKilled, TOTAL_NUM_FISH, isSharksInKillZone) {
        this.ripples.forEach(ripple => {
            ripple.updateRipples(p.millis());
            const progress = numFishKilled / TOTAL_NUM_FISH;

            ripple.draw(p, rippleColor, progress, isSharksInKillZone);
        });
    }
}



export class Ripple {
    constructor(position, startTimeMillis = 0, updateIntervalMillis = 100) {
        this.position = position;
        this.lastUpdateTimeMillis = startTimeMillis;
        this.diameter = 7;
        this.opacity = .15;
        this.updateIntervalMillis = updateIntervalMillis;
        this.opacityUpdateAmt = 0.007;
        this.diameterUpdateAmt = 10;
        this.isDone = false;
        this.random = Math.random() * 3;
    }

    resetRipple(position) {
        this.position = position;
        this.lastUpdateTimeMillis = 0;
        this.diameter = 7;
        this.opacity = .15;
        this.isDone = false;
        this.random = Math.random() * 3;
    }

    updateRipples(gameTimeMillis) {
        this.lastUpdateTimeMillis = gameTimeMillis;
        this.opacity -= this.opacityUpdateAmt;
        if (this.opacity < 0) { this.isDone = true; }
        this.diameter += (this.diameterUpdateAmt + this.random);
    }

    draw(p, rippleColor, progress, isSharksInKillZone) {
        if (this.isDone) return;
        const c = p.lerpColor(p.color(rippleColor.toString()), p.color('#ff0000ff'), isSharksInKillZone ? 1 : 0);
        c.setAlpha(this.opacity * 255)
        p.stroke(c);
        p.strokeWeight(isSharksInKillZone ? 4 : 3);
        p.noFill();
        p.ellipse(this.position.x, this.position.y, this.diameter);
    }
}