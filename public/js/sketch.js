import { SharkBoid, FishBoid } from './boid.js';
import { SharkFlock, FishFlock } from './Flock.js';
import { Sprite } from './Sprite.js';
import { Ripples } from './Ripples.js';
import { Scoreboard } from './Scoreboard.js'

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
let fishScoreBoardImg;
let seaweedImg;
let gameSharkImg;
let gameFishImg;
// IMGS - - - - IMGS

// CONSTANTS - - - - CONSTANTS
const NUM_FISH_FLOCKS = 4;
const NUM_FISH = 25; // per flock
const MAX_WINDOW_WIDTH = 4000;
const NUM_SHARKS = 3; // per game
const TOTAL_NUM_FISH = NUM_FISH_FLOCKS * NUM_FISH;
const BLOOD_RED_COLOR = '#880808';
const SEA_BLUE_BACKGROUND_COLOR = "#003366";
const NUM_SEAWEED_STRANDS = 2;
// CONSTANTS - - - - CONSTANTS

// GLOBAL STATE VARS - - - - GLOBAL STATE VARS
let backgroundColor = SEA_BLUE_BACKGROUND_COLOR;
let numFishKilled = 0;
let isScreenClickedOnce = false;
let isGameOver = false;
let isRemoveSharks = false;
let isRemoveGameOverShark = false;
let isFeeding = false;
let isReset = false;
let bloodClouds = [];
let seaweed = [];
const ripples = new Ripples();
let fishScoreBoard;
let rippleColor; // used for score text too
let gameOverSharkSprite;
let sharkCursorSprite;
let gameSharkSprite;
let gameFishSprite;
let scoreBoardOpacity = 0;
let intervalRef;
let progress = 0;
let fishRespawnTimeout = [];

const sketch = (p) => {

    const getAreSharksFeeding = () => isFeeding;

    const getIsGameOver = () => isGameOver;

    const computeRippleColor = progress => {
        rippleColor = p.lerpColor(p.color('#017efbff'), p.color('#f96969ff'), progress);
    }

    const computeBackgroundColor = progress => {
        backgroundColor = p.lerpColor(p.color(SEA_BLUE_BACKGROUND_COLOR), p.color(BLOOD_RED_COLOR), progress);
    }

    const doRespawnFishLogic = () => {
        if (isGameOver) return false;
        numFishKilled -= 1;
        updateVisuals();
        return true;
    }

    const updateVisuals = () => {
        progress = numFishKilled / TOTAL_NUM_FISH
        computeRippleColor(progress);
        computeBackgroundColor(progress);
    }

    const doFishDeathLogic = ({ posX, posY, velocity }) => {
        numFishKilled += 1;
        isGameOver = TOTAL_NUM_FISH == numFishKilled;

        if (isGameOver) isFeeding = false;
        else {
            fishRespawnTimeout.forEach(timeout => clearTimeout(timeout));
            fishRespawnTimeout = [];
            fishRespawnTimeout.push(restartFishRespawn(3000));
        }

        updateVisuals();

        scoreBoardOpacity = 2;
        clearInterval(intervalRef);
        intervalRef = setInterval(() => {
            if (scoreBoardOpacity <= 0) clearInterval(intervalRef);
            scoreBoardOpacity -= .1;
        }, 100);
        isScreenClickedOnce = true;
        const bc = new Sprite({
            p,
            spriteSheet: bloodCloud,
            animScale: .45,
            posX: posX,
            posY: posY,
            spriteWidth: 352,
            spriteHeight: 385,
            totalFrames: 7,
            animSpeed: 150,
            rotation: velocity.heading() + p.radians(180)
        });
        const bcScaleIntervalRef = setInterval(() => {
            if (bc.animScale >= .75) clearTimeout(bcScaleIntervalRef);
            const scale = .30 * (bc.currentFrame / bc.totalFrames);
            bc.updateAnimScale(.45 + scale);
        }, bc.animSpeed)
        bloodClouds.push(bc);
    }

    p.preload = () => {
        fish1 = p.loadImage('../images/fish1Resized_BW.png');
        fish2 = p.loadImage('../images/fish2Resized_BW.png');
        trans = p.loadImage('../images/transparency.png');
        shark1 = p.loadImage('../images/shark1Resized.png');
        shark2 = p.loadImage('../images/shark2Resized.png');
        gameOverShark = p.loadImage('./images/spritesheets/final_spritesheet.png');
        bloodCloud = p.loadImage('./images/spritesheets/bloodCloud.png');
        sharkCursor = p.loadImage('./images/spritesheets/sharkCursor_sprite_sheet.png');
        fishScoreBoardImg = p.loadImage('./images/fish_scoreboard.png');
        seaweedImg = p.loadImage('./images/spritesheets/kelp_spritesheet.png');
        gameSharkImg = p.loadImage('./images/spritesheets/gameshark_sprite_sheet.png');
        gameFishImg = p.loadImage('./images/spritesheets/gamefish_sprite_sheet.png');

    }

    p.setup = () => {
        var canvas = p.createCanvas(getWidth(), p.windowHeight);
        canvas.parent('sketch-holder');
        p.imageMode(p.CENTER);
        p.textAlign(p.CENTER, p.CENTER);

        fishScoreBoard = new Scoreboard(p, getWidth, fishScoreBoardImg);

        rippleColor = p.color('#017efbff');

        const sizeGroups = [
            { heightAdjustment: 0, scale: 1.5 },
            // {heightAdjustment: 20, scale: 1},
            // {heightAdjustment: 40, scale: .8},
            // {heightAdjustment: 40, scale: .8},
            { heightAdjustment: 20, scale: 1 },
            // {heightAdjustment: 0, scale: 1.5},
        ];
        const seaweedHorizontalPlacement = [
            // 0, 
            getWidth() * (1 / 16),
            // getWidth() * (2 / 16), getWidth() * (14 / 16), 
            getWidth() * (15 / 16),
            // getWidth()
        ];
        Array(NUM_SEAWEED_STRANDS).fill(0).forEach((_, i) => {
            const strand = new Sprite({
                p,
                spriteSheet: seaweedImg,
                animScale: sizeGroups[i].scale,
                posX: seaweedHorizontalPlacement[i],
                posY: p.windowHeight - 180 + sizeGroups[i].heightAdjustment,
                spriteWidth: 111,
                spriteHeight: 429,
                totalFrames: 8,
                animSpeed: 300,
                animDelayInMillis: Math.abs(p.sin(Math.PI * i * 100)) * 100,
                isRepeat: true
            });
            seaweed.push(strand);
        });



        // gameFishSprite = new Sprite({
        //     p,
        //     spriteSheet: gameFishImg,//gameSharkImg,
        //     animScale: .2,
        //     posX: 0,
        //     posY: 0,
        //     spriteWidth: 258,
        //     spriteHeight: 592,
        //     totalFrames: 7,
        //     animSpeed: 200, // 50 (fast) to 1000 (slow) ... maybe anim.stop() then play on interval if not "isFeeding"?
        //     isRepeat: true,
        //     // isStopped: true
        // });

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
            posX: getWidth() / 2 - 50,
            posY: p.windowHeight / 2,
            spriteWidth: 320,
            spriteHeight: 385,
            totalFrames: 9,
            animSpeed: 150,
            animDelayInMillis: 1000,//500,
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
        isFeeding = false;

        gameOverSharkSprite.reset();
        sharkCursorSprite.reset({ isStopped: true });

        p.noCursor();

        const spawnPoints = [
            [0, 0], [getWidth(), p.windowHeight], [0, p.windowHeight], [getWidth() / 2, p.windowHeight / 2], [getWidth() / 4, 0], [0, getWidth() / 2], [0, p.windowHeight / 2], [getWidth(), p.windowHeight], [getWidth() / 1.5, p.windowHeight / 1.5]
        ]

        flockShark = new SharkFlock(p);
        for (var i = 0; i < NUM_SHARKS; i++) {
            gameSharkSprite = new Sprite({
                p,
                spriteSheet: gameSharkImg,
                animScale: .5,
                posX: 0,
                posY: 0,
                spriteWidth: 258,
                spriteHeight: 592,
                totalFrames: 7,
                animSpeed: 200, // 50 (fast) to 1000 (slow) ... maybe anim.stop() then play on interval if not "isFeeding"?
                isRepeat: true,
                // isStopped: true
            });
            var b = new SharkBoid({
                p,
                getWidth,
                x: spawnPoints[i + 5][0],
                y: spawnPoints[i + 5][1],
                FlockRef: flockShark,
                imgs: { shark1, shark2 },
                gameSharkImg,
                index: i,
                maxSpeed: p.random(11, 14),
                getAreSharksFeeding,
                getIsGameOver,
                gameSharkSprite
            });
            flockShark.addBoid(b);
        }

        fishFlocks = Array(NUM_FISH_FLOCKS).fill(0).map((_, j) => {
            const flock = new FishFlock(p, j);
            flock.sharks = flockShark;
            for (var i = 0; i < NUM_FISH; i++) {
                var b = new FishBoid(
                    {
                        p,
                        getWidth,
                        x: spawnPoints[j][0],
                        y: spawnPoints[j][1],
                        FlockRef: flock,
                        imgs: { fish1, fish2, trans },
                        // gameFishSprite,
                        index: i,
                        maxSpeed: p.random(8, 9),
                        doDeathLogic: doFishDeathLogic,
                        flockShark,
                        getAreSharksFeeding,
                        getIsGameOver
                    });
                flock.addBoid(b);
            }
            return flock;
        })
        fishRespawnTimeout.forEach(timeout => clearTimeout(timeout));
        fishRespawnTimeout = [];
    }

    const restartFishRespawn = (delay = 3000) => {
        return setTimeout(() => {
            if (isGameOver || numFishKilled <= 0) {
                fishRespawnTimeout.forEach(timeout => clearTimeout(timeout));
                fishRespawnTimeout = [];
                return;
            }
            if (!isGameOver && numFishKilled > 0) {
                const flocksWithDeadFish = fishFlocks.filter(({ boids }) => boids.some(({ isDead }) => isDead));
                let respawnAmt = 1;
                const randIndex = Math.floor(Math.random() * flocksWithDeadFish.length);
                flocksWithDeadFish[randIndex].respawn(doRespawnFishLogic, respawnAmt);

                const timeDelay = delay - fishRespawnTimeout.length * 25;
                fishRespawnTimeout.push(restartFishRespawn(delay));
                fishRespawnTimeout.push(restartFishRespawn(timeDelay > 1000 ? timeDelay : 1000));
            }
        }, delay);
    }

    const getWidth = () => {
        return p.windowWidth < MAX_WINDOW_WIDTH ? p.windowWidth : MAX_WINDOW_WIDTH;
    }

    p.windowResized = () => {
        p.resizeCanvas(getWidth(), p.windowHeight);

        gameOverSharkSprite.updateAnimPos({
            posX: getWidth() / 2 - 50,
            posY: p.windowHeight / 2
        })

        // seaweed.forEach(strand => strand.draw(p.millis()));

    }

    p.draw = () => {
        p.background(backgroundColor);

        drawBackground();

        if (!isScreenClickedOnce)
            showInstructions();

        if (isRemoveGameOverShark)
            showResetText();

        drawBloodClouds();

        bloodClouds.forEach(bc => bc.draw(p.millis()));

        fishFlocks.forEach(fishFlock => fishFlock.run());

        if (isGameOver && !isRemoveGameOverShark)
            gameOverSharkSprite.draw(p.millis());

        if (!isRemoveSharks) flockShark.run();

        // seaweed.forEach(strand => strand.draw(p.millis()));

        // const update = gameSharkSprite.animSpeed - (flockShark.boids[0].velocity.mag() / flockShark.boids[0].maxSpeed) * gameSharkSprite.animSpeed / 2
        // gameSharkSprite.updateAnimSpeed(update); 
        // gameSharkSprite.draw(p.millis());

        if (!isRemoveGameOverShark)
            fishScoreBoard.display({ isGameOver, scoreBoardOpacity, getWidth, numFishKilled, TOTAL_NUM_FISH });

        if (!isGameOver) {
            if (isFeeding && ripples.shouldUpdateRipples(p.millis())) {
                ripples.updateRipples(p, p.millis(),);
            }
            const isSharksInKillZone = isGetSharksInKillZone(flockShark);
            ripples.draw(p, rippleColor, numFishKilled, TOTAL_NUM_FISH, isSharksInKillZone);
            sharkCursorSprite.updateAnimPos({ posX: p.mouseX, posY: p.mouseY });
            sharkCursorSprite.draw(p.millis());
        }
    }

    const drawBackground = () => {
        let gradient = p.drawingContext.createLinearGradient(0, 0, 0, p.windowHeight);
        gradient.addColorStop(0, backgroundColor);
        gradient.addColorStop(1, p.lerpColor(p.color('#001d3b'), p.color(backgroundColor), progress));
        p.drawingContext.fillStyle = gradient;
        p.drawingContext.fillRect(0, 0, getWidth(), p.windowHeight);
    }

    const showInstructions = () => {
        p.strokeWeight(1);
        p.textSize(25);
        p.fill('#6db5fc');
        p.stroke('#6db5fc');
        p.text('click and hold to eat the fish', getWidth() / 2 - 30, p.windowHeight / 2);
    }

    const showResetText = () => {
        p.strokeWeight(1);
        p.textSize(75);
        // p.fill('#000');
        // p.stroke('#000');
        p.fill('#3f0000ff');
        p.stroke('#3f0000ff');
        p.text('thanks for playing!', getWidth() / 2 - 20, p.windowHeight / 2 - 40);
        p.textSize(30);
        p.text('(click to reset)', getWidth() / 2 - 30, p.windowHeight / 2 + 25);
    }

    const drawBloodClouds = () => {
        bloodClouds.forEach(bc => bc.draw(p.millis()));

    }

    const isGetSharksInKillZone = (flockShark) => {
        let isInDistance = false;
        flockShark.boids.forEach(shark => {
            isInDistance = isInDistance || ((shark.dieRadius * 3) >= p5.Vector.dist(shark.position, p.createVector(p.mouseX, p.mouseY)));
        });
        return isInDistance;
    }

    const goHere = (mouseX, mouseY) => {
        if (isFeeding) {
            for (let i = 0; i < flockShark.boids.length; i++) {
                flockShark.boids[i].goHere = p.createVector(mouseX, mouseY)
            }
        }
    }
    p.mouseDragged = () => {
        if (!isGameOver) {
            goHere(p.mouseX, p.mouseY);
        }
    }

    p.mousePressed = () => {
        if (isGameOver && isRemoveGameOverShark && isRemoveSharks && !isReset) {
            isReset = true;
        }
        if (!isGameOver) {
            isFeeding = true;
            sharkCursorSprite.play();
            goHere(p.mouseX, p.mouseY);
            flockShark.startSharkCirclePositionsInterval();
        }
    }
    p.mouseReleased = () => {
        if (isGameOver && isRemoveGameOverShark && isRemoveSharks && isReset) {
            resetGame();
        }
        isFeeding = false;
        sharkCursorSprite.stop();
        flockShark.clearUpdateSharkCirclePositionsInterval();

    }
};

new p5(sketch);