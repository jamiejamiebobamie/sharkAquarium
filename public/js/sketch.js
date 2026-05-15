import Boid from './boid.js';
import { Flock, FlockShark } from './Flock.js';
import { Sprite } from './Sprite.js';
import { Ripples } from './Ripples.js';


// IMGS - - - -IMGS
let bloodCloud;
var fishFlocks;
var flockShark;
let fish1;
let fish2;
let shark1;
let shark2;
let gameOverShark;
let sharkCursor;
let trans;
// IMGS - - - - IMGS

// CONSTANTS - - - - CONSTANTS
const NUM_FISH_FLOCKS = 4;
const NUM_FISH = 25; // per flock
const MAX_WINDOW_WIDTH = 4000;
const NUM_SHARKS = 3; // per game
const TOTAL_NUM_FISH = NUM_FISH_FLOCKS * NUM_FISH;
const BLOOD_RED_COLOR = '#880808';
const SEA_BLUE_BACKGROUND_COLOR = "#003366";
// CONSTANTS - - - - CONSTANTS

// GLOBAL STATE VARS - - - - GLOBAL STATE VARS
let backgroundColor = SEA_BLUE_BACKGROUND_COLOR;
let numFishKilled = 0;
let isScreenClickedOnce = false;
let isGameOver = false;
let isRemoveSharks = false;
let isRemoveGameOverShark = false;
let feed = false;
let bloodClouds = [];
const ripples = new Ripples();
let rippleColor; // used for score text too
let gameOverSharkSprite;
let sharkCursorSprite;



const sketch = (p) => {

    const computeRippleColor = () => {
        const progress = numFishKilled / TOTAL_NUM_FISH;
        rippleColor = p.lerpColor(p.color('#017efbff'), p.color('#f96969ff'), progress);
    }

    const doFishDeathLogic = ({ posX, posY }) => {
        numFishKilled += 1;
        isGameOver = TOTAL_NUM_FISH == numFishKilled;
        computeRippleColor();
        isScreenClickedOnce = true;
        backgroundColor = p.lerpColor(p.color(SEA_BLUE_BACKGROUND_COLOR), p.color(BLOOD_RED_COLOR), numFishKilled / TOTAL_NUM_FISH);
        const bc = new Sprite({
            p,
            spriteSheet: bloodCloud,
            animScale: .45,
            posX: posX,
            posY: posY,
            spriteWidth: 352,
            spriteHeight: 385,
            totalFrames: 7,
            animSpeed: 150
        });
        bloodClouds.push(bc);
    }

    p.preload = () => {
        fish1 = p.loadImage('../images/fish1Resized_BW.png');
        fish2 = p.loadImage('../images/fish2Resized_BW.png');
        trans = p.loadImage('../images/transparency.png');
        shark1 = p.loadImage('../images/shark1Resized.png');
        shark2 = p.loadImage('../images/shark2Resized.png');
        gameOverShark = p.loadImage('./images/final_spritesheet.png');
        bloodCloud = p.loadImage('./images/bloodCloud.png');
        sharkCursor = p.loadImage('./images/sharkCursor_sprite_sheet.png');
    }

    p.setup = () => {
        var canvas = p.createCanvas(p.windowWidth, p.windowHeight);

        if (p.windowWidth < MAX_WINDOW_WIDTH) {
            canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        } else {
            canvas = p.createCanvas(MAX_WINDOW_WIDTH, p.windowHeight);
        }
        canvas.parent('sketch-holder');
        p.imageMode(p.CENTER);

        rippleColor = p.color('#017efbff');

        sharkCursorSprite = new Sprite({
            p,
            spriteSheet: sharkCursor,
            animScale: .15,
            posX: p.mouseX,
            posY: p.mouseY,
            spriteWidth: 269,
            spriteHeight: 290,
            totalFrames: 9,
            animSpeed: 75,
            isRepeat: true,
            isStopped: true
        });


        gameOverSharkSprite = new Sprite({
            p,
            spriteSheet: gameOverShark,
            animScale: 3,
            posX: p.windowWidth / 2 - 50,
            posY: p.windowHeight / 2,
            spriteWidth: 320,
            spriteHeight: 385,
            totalFrames: 9,
            animSpeed: 150,
            animDelayInMillis: 500,
            cleanupFunc: () => {
                isRemoveGameOverShark = true;
                p.cursor(p.ARROW);
            },
            duringAnimPlayFunc: ({
                totalFrames,
                currentFrame
            }) => {
                if ((currentFrame + 5) >= totalFrames) isRemoveSharks = true;
            }
        });
        resetGame();
    }

    function resetGame() {

        bloodClouds = [];
        ripples.reset();

        backgroundColor = SEA_BLUE_BACKGROUND_COLOR;
        numFishKilled = 0;
        isScreenClickedOnce = false;
        isGameOver = false;
        isRemoveSharks = false;
        isRemoveGameOverShark = false;
        feed = false;

        gameOverSharkSprite.reset();
        sharkCursorSprite.reset({ isStopped: true });

        p.noCursor();

        const spawnPoints = [
            [0, 0], [p.windowWidth, p.windowHeight], [0, p.windowHeight], [p.windowWidth / 2, p.windowHeight / 2], [p.windowWidth / 4, 0], [0, p.windowWidth / 2], [0, p.windowHeight / 2], [p.windowWidth, p.windowHeight], [p.windowWidth / 1.5, p.windowHeight / 1.5]]

        flockShark = new FlockShark();
        for (var i = 0; i < NUM_SHARKS; i++) {
            var b = new Boid({
                x: spawnPoints[i + 5][0],
                y: spawnPoints[i + 5][1],
                fish: "shark",
                imgs: { shark1, shark2, fish1, fish2, trans },
                createVector: p.createVector,
                random: p.random
            });
            flockShark.addBoid(b);
        }

        fishFlocks = Array(NUM_FISH_FLOCKS).fill(0).map((_, j) => {
            const flock = new Flock(j);
            flock.sharks = flockShark;
            for (var i = 0; i < NUM_FISH; i++) {
                var b = new Boid(
                    {
                        x: spawnPoints[j][0],
                        y: spawnPoints[j][1],
                        fish: "fish",
                        FlockRef: flock,
                        imgs: { shark1, shark2, fish1, fish2, trans },
                        createVector: p.createVector,
                        random: p.random
                    });
                flock.addBoid(b);
            }
            return flock;
        })
    }

    p.windowResized = () => {
        if (p.windowWidth < MAX_WINDOW_WIDTH) {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
        } else {
            p.resizeCanvas(MAX_WINDOW_WIDTH, p.windowHeight);
        }

        gameOverSharkSprite.updateAnimPos({
            posX: p.windowWidth / 2 - 50,
            posY: p.windowHeight / 2
        })
    }

    p.draw = () => {
        p.background(backgroundColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(25);

        if (!isScreenClickedOnce) {
            p.strokeWeight(1);
            p.fill('#6db5fc');
            p.stroke('#6db5fc');
            p.text('click and hold to eat the fish', p.windowWidth / 2 - 30, p.windowHeight / 2);
        } else if (isScreenClickedOnce && !isRemoveGameOverShark) {
            p.strokeWeight(1);
            p.textSize(25);
            p.fill(rippleColor);
            p.stroke(rippleColor);
            p.text(`${numFishKilled} / ${TOTAL_NUM_FISH}`, p.windowWidth - 90, 60);
        } else if (isRemoveGameOverShark) {
            p.strokeWeight(1);
            p.textSize(25);
            p.fill('#000');
            p.stroke('#000');
            p.text('click to reset', p.windowWidth / 2 - 30, p.windowHeight / 2);
        }

        bloodClouds.forEach(bc => bc.draw(p.millis()));

        fishFlocks.forEach(fishFlock => fishFlock.run({ isGameOver, feed, doDeathLogic: doFishDeathLogic, flockShark, fishFlocks, p }));
        if (isGameOver && !isRemoveGameOverShark) {
            gameOverSharkSprite.draw(p.millis());
        }
        if (!isRemoveSharks) flockShark.run({ isGameOver, feed, flockShark, fishFlocks, feed, p });

        if (!isGameOver) {
            if (feed && ripples.shouldUpdateRipples(p.millis())) {
                ripples.updateRipples(p, p.millis());
            }
            ripples.draw(p, rippleColor, numFishKilled, TOTAL_NUM_FISH);
            sharkCursorSprite.updateAnimPos({ posX: p.mouseX, posY: p.mouseY });
            sharkCursorSprite.draw(p.millis());
        }
    }

    p.mouseDragged = () => {
        if (feed) {
            for (let i = 0; i < flockShark.boids.length; i++) {
                flockShark.boids[i].goHere = p.createVector(p.mouseX, p.mouseY)
            }
            console.log({ ripplesNum: ripples.getNumRipples(), isMaxRipples: ripples.isMaxRipples(), shouldUpdateRipples: ripples.shouldUpdateRipples(p.millis()) });
        }
    }

    p.mousePressed = () => {
        if (!isGameOver) {
            feed = true;
            sharkCursorSprite.play();
        }
    }
    p.mouseReleased = () => {
        if (isGameOver && isRemoveGameOverShark && isRemoveSharks && !feed) {
            resetGame();
        }
        feed = false;
        sharkCursorSprite.stop();
    }
};

new p5(sketch);


