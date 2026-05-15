export class Sprite {
    constructor({ spriteSheet = undefined, animScale = 1, posX = 0, posY = 0, spriteWidth = 0, spriteHeight = 0, totalFrames = 0, animSpeed = 200, animDelayInMillis = 0, cleanupFunc = () => { }, duringAnimPlayFunc = () => { }, p }) {
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
        this.isAnimPlaying = false;
        this.cleanupFunc = cleanupFunc;
        this.duringAnimPlayFunc = duringAnimPlayFunc;
        this.p = p;
    }

    reset(){
        this.isAnimPlaying = false;
        this.currentFrame = 0;
        this.animStartTimeMillis = 0;
    }

    getCurrentFrame() {
        return this.currentFrame;
    }

    updateAnimPos({ posX, posY }) {
        this.posX = posX;
        this.posY = posY;
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

            // Draw the cropped frame onto the canvas
            this.p.image(this.spriteSheet, this.posX, this.posY, this.spriteWidth * this.animScale, this.spriteHeight * this.animScale, sx, sy, this.spriteWidth, this.spriteHeight);

            const isAnimOver = this.currentFrame + 1 >= this.totalFrames; 
            const isDoNextFrame = (currMilli - this.animStartTimeMillis) > ((this.currentFrame + 1) * this.animSpeed);

            if (isAnimOver) this.cleanupFunc();
            else if (isDoNextFrame) {
                this.duringAnimPlayFunc({
                    totalFrames: this.totalFrames,
                    currentFrame: this.currentFrame,
                    currMilli
                });
                // advance to next frame
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            }
        }
    }
}