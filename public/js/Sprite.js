export class Sprite {
    constructor({ spriteSheet = undefined, rotation = 0, isStopped = false, animScale = 1, posX = 0, posY = 0, spriteWidth = 0, spriteHeight = 0, totalFrames = 0, animSpeed = 200, animDelayInMillis = 0, isRepeat = false, cleanupFunc = () => { }, duringAnimPlayFunc = () => { }, p }) {
        this.spriteSheet = spriteSheet; // p5.js image object
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.totalFrames = totalFrames;
        this.currentFrame = 0;
        this.animStartTimeMillis = 0; // when the animation starts in millis compared to start of the sketch
        this.animSpeed = animSpeed;
        this.animDelay = animDelayInMillis;
        this.posX = posX;
        this.posY = posY;
        this.animScale = animScale;
        this.isRepeat = isRepeat;
        this.isAnimPlaying = false;
        this.cleanupFunc = cleanupFunc;
        this.duringAnimPlayFunc = duringAnimPlayFunc;
        this.p = p;
        this.isStopped = isStopped;
        this.rotation = rotation;
    }

    reset(overwrites = {}) {
        this.isAnimPlaying = false;
        this.currentFrame = 0;
        this.animStartTimeMillis = 0;
        this.isStopped = false;

        Object.assign(this, overwrites);
    }

    getCurrentFrame() {
        return this.currentFrame;
    }

    updateAnimSpeed(update) {
        this.animSpeed = update;
    }

    updateAnimPos({ posX, posY }) {
        this.posX = posX;
        this.posY = posY;
    }

    updateAnimScale(animScale) {
        this.animScale = animScale;
    }

    stop() {
        this.currentFrame = 0;
        this.isStopped = true;
    }

    play() {
        this.isStopped = false;
        this.reset();
    }

    getIsPlaying() {
        return !this.isStopped;
    }

    repeat(currMilli) {
        this.animStartTimeMillis = currMilli;
        this.currentFrame = 0;
    }

    draw(currMilli) {
        if (!this.isAnimPlaying) {
            this.animStartTimeMillis = currMilli + this.animDelay;
            this.isAnimPlaying = true;
        }
        const isWaitOver = currMilli > this.animStartTimeMillis;
        if (this.isAnimPlaying && isWaitOver) {
            // Calculate source X position of current frame
            const sx = this.currentFrame * this.spriteWidth;
            const sy = 0; // Row 0 on your sprite sheet

            this.p.push();
            this.p.translate(this.posX, this.posY);
            this.p.rotate(this.rotation);
            // Draw the cropped frame onto the canvas
            this.p.image(this.spriteSheet, 0, 0, this.spriteWidth * this.animScale, this.spriteHeight * this.animScale, sx, sy, this.spriteWidth, this.spriteHeight);
            this.p.pop();

            if (!this.isStopped) {
                const isDoNextFrame = (currMilli - this.animStartTimeMillis) > ((this.currentFrame + 1) * this.animSpeed);
                if (isDoNextFrame) {
                    this.duringAnimPlayFunc({
                        totalFrames: this.totalFrames,
                        currentFrame: this.currentFrame,
                        currMilli
                    });

                    const isAnimOver = this.currentFrame + 1 >= this.totalFrames;
                    if (isAnimOver && !this.isRepeat) {
                        this.cleanupFunc();
                        return;
                    } else if (isAnimOver && this.isRepeat) {
                        this.repeat(currMilli);
                    } else {
                        this.currentFrame = (this.currentFrame + 1) % (this.totalFrames + 1);
                    }
                }
            }
        }
    }
}