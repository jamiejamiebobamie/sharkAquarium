export class Scoreboard {
    constructor(p, getWidth, fishScoreImg) {
        this.p = p;
        this.getWidth = getWidth;
        this.score = 0;
        this.fishScoreImg = fishScoreImg;
        this.imageScale = .6;
        this.imgWidth = 400 * this.imageScale;
        this.imgHeight = 345 * this.imageScale;
        this.horizontalPlacement = (this.imgWidth / 2) + 40;
        this.verticalPlacement = (this.imgHeight / 2) + 10;
        this.goldColor = p.color('#FFD700');
        this.blackColor = p.color("black");
        this.darkGoldColor = p.color('#42380299');
    }

    display({ isGameOver, scoreBoardOpacity, getWidth, numFishKilled, TOTAL_NUM_FISH }) {
        this.p.push();
        this.p.tint(isGameOver ? 255 : 105 + 150 * scoreBoardOpacity, isGameOver ? 255 : 105 + 150 * scoreBoardOpacity);
        this.p.image(this.fishScoreImg, this.getWidth() - this.horizontalPlacement, this.verticalPlacement, this.imgWidth, this.imgHeight);
        this.p.strokeWeight(1);
        this.p.textSize(30);
        const c = this.p.lerpColor(this.darkGoldColor, this.goldColor, scoreBoardOpacity);
        c.setAlpha(isGameOver ? 255 : 105 + 150 * scoreBoardOpacity);
        this.p.fill(c);
        this.p.stroke(this.blackColor);
        this.p.text(`${numFishKilled} / ${TOTAL_NUM_FISH}`, getWidth() - 163, 174.5);
        this.p.pop();
    }
}