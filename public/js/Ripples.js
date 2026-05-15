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

    draw(p, rippleColor, numFishKilled, TOTAL_NUM_FISH) {
        this.ripples.forEach(ripple => {
            ripple.updateRipples(p.millis());
            const progress = numFishKilled / TOTAL_NUM_FISH;

            ripple.draw(p, rippleColor, progress);
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
        this.diameter = 5;
        this.opacity = .25;
        this.isDone = false;
        this.random = Math.random() * 3;
    }

    updateRipples(gameTimeMillis) {
        const diff = gameTimeMillis - this.lastUpdateTimeMillis;
        // if (!(diff > this.updateIntervalMillis)) {
        this.lastUpdateTimeMillis = gameTimeMillis;
        this.opacity -= this.opacityUpdateAmt;
        if (this.opacity < 0) { this.isDone = true; }
        this.diameter += (this.diameterUpdateAmt + this.random);
        // }
    }

    draw(p, rippleColor, progress) {
        if (this.isDone) return;
        const c = p.color(rippleColor.toString());
        c.setAlpha(this.opacity * 255)
        p.stroke(c);
        // p.strokeWeight(progress * (3 - 1) + 1);
        p.noFill();
        p.ellipse(this.position.x, this.position.y, this.diameter);
    }
}