var fishFlocks;
var flockShark;
let velocity;
let fish1;
let fish2;
let interv;
let shark1;
let shark2;
let trans;
let feed;

let spriteSheet;
let spriteWidth = 320;  // Width of one frame
let spriteHeight = 385; // Height of one frame
let totalFrames = 9;   // Total animation steps
let currentFrame = 0;
let currMilli = 0;
let animSpeed = 150; // in milliseconds
let animDelay = 500; // in milliseconds
let gameOverSharkScale = 3;
let timeout;


const NUM_FISH_FLOCKS = 5;
const NUM_FISH = 20;
const MAX_WINDOW_WIDTH = 4000;
const NUM_SHARKS = 3;
const TOTAL_NUM_FISH = NUM_FISH_FLOCKS * NUM_FISH;
const BLOOD_RED_COLOR = '#880808';
const SEA_BLUE_BACKGROUND_COLOR = "#003366";

let backgroundColor = SEA_BLUE_BACKGROUND_COLOR;
let numFishKilled = 0;
let isScreenClickedOnce = false;
let isGameOver = false;
let isRemoveSharks = false;
let isRemoveGameOverShark = false;
let isDrawGameOverShark = false;


function setup() {
    var canvas = createCanvas(windowWidth, windowHeight);

    if (windowWidth < MAX_WINDOW_WIDTH) {
        canvas = createCanvas(windowWidth, windowHeight);
    } else {
        canvas = createCanvas(MAX_WINDOW_WIDTH, windowHeight);
    }
    canvas.parent('sketch-holder');
    imageMode(CENTER);

    fish1 = loadImage('../images/fish1Resized_BW.png');
    fish2 = loadImage('../images/fish2Resized_BW.png');
    fish1WHITE = loadImage('../images/fish1ResizedWHITE.png');
    fish2WHITE = loadImage('../images/fish2ResizedWHITE.png');
    trans = loadImage('../images/transparency.png');
    shark1 = loadImage('../images/shark1Resized.png');
    shark2 = loadImage('../images/shark2Resized.png');
    gameOverShark = loadImage('./images/final_spritesheet2.png');

    resetGame();

}

function resetGame() {

    backgroundColor = SEA_BLUE_BACKGROUND_COLOR;
    numFishKilled = 0;
    isScreenClickedOnce = false;
    isGameOver = false;
    isRemoveSharks = false;
    isRemoveGameOverShark = false;
    isDrawGameOverShark = false;
    feed = false;
    currentFrame = 0;
    timeout = undefined;

    const spawnPoints = [[0, 0], [windowWidth, windowHeight], [0, windowHeight / 2], [windowWidth / 2, windowHeight / 2], [windowWidth / 2, 0], [0, windowWidth], [0, windowHeight], [windowWidth, windowHeight], [windowWidth / 1.5, windowHeight / 1.5]]

    flockShark = new FlockShark();
    for (var i = 0; i < NUM_SHARKS; i++) {
        var b = new Boid(
            spawnPoints[i][0], spawnPoints[i][1],
            // Math.random()*windowWidth, Math.random() * windowHeight,
            "shark", flockShark);
        flockShark.addBoid(b);
    }

    fishFlocks = Array(NUM_FISH_FLOCKS).fill(0).map((_, j) => {
        const flock = new Flock(j);
        flock.sharks = flockShark;
        // Add an initial set of boids into the system
        for (var i = 0; i < NUM_FISH; i++) {
            var b = new Boid(
                spawnPoints[j][0], spawnPoints[j][1],
                // Math.random()*windowWidth/4,Math.random()*windowHeight/4
                "fish", flock);
            flock.addBoid(b);
        }
        return flock;
    })
}

function windowResized() {
    if (windowWidth < MAX_WINDOW_WIDTH) {
        resizeCanvas(windowWidth, windowHeight);
    } else {
        resizeCanvas(MAX_WINDOW_WIDTH, windowHeight);
    }
}

function draw() {

    if (millis() % 1000) console.log({
        numFishKilled,
        isScreenClickedOnce,
        isGameOver,
        isRemoveSharks,
        isRemoveGameOverShark,
        feed,
        TOTAL_NUM_FISH,
        numFishKilled

    });
    background(backgroundColor);
    textAlign(CENTER, CENTER);
    textSize(25);
    textAlign(CENTER, CENTER);

    if (!isScreenClickedOnce) {
        fill('#6db5fc');
        stroke('#6db5fc');
        text('click and hold to eat the fish', windowWidth / 2 - 30, windowHeight / 2);
    } else if (isRemoveGameOverShark) {
        textSize(25);
        fill('#000');
        stroke('#000');
        // text('there\'s always a bigger fish...', windowWidth / 2 - 15, windowHeight / 2 - 30);
        text('(click to reset)', windowWidth / 2 - 30, windowHeight / 2);
    }

    fishFlocks.forEach(fishFlock => fishFlock.run());

    if (isGameOver && !isRemoveGameOverShark) {
        if (isDrawGameOverShark) {
            // Calculate source X position of current frame
            let sx = currentFrame * spriteWidth;
            let sy = 0; // Row 0 on your sprite sheet

            // Draw the cropped frame onto the canvas
            image(gameOverShark, windowWidth / 2 - 50, windowHeight / 2, spriteWidth * gameOverSharkScale, spriteHeight * gameOverSharkScale, sx, sy, spriteWidth, spriteHeight);

            // Advance to next frame and loop back to 0

            if ((currentFrame + 4) == totalFrames) {
                isRemoveSharks = true;
            }

            if (
                // !timeout && 
                (currentFrame + 1) == totalFrames) {
                isRemoveGameOverShark = true;
                //    timeout = setTimeout(() => { isRemoveGameOverShark = true; }, 1000);
            } else if ((millis() - currMilli) > ((currentFrame + 1) * animSpeed)) {
                currentFrame = (currentFrame + 1) % totalFrames;
            }
        } else if (!timeout) {
            timeout = setTimeout(() => { 
                isDrawGameOverShark = true; 
            }, animDelay);
        }
    } else {
        currMilli = millis() + animDelay; // add animDelay to account for timeout delay above
    }

    if (!isRemoveSharks) flockShark.run();
}

// Add a new boid into the System

function mouseDragged() {
    if (feed) {
        for (let i = 0; i < flockShark.boids.length; i++) {
            flockShark.boids[i].goHere = createVector(mouseX, mouseY)
        }
    }
}

function mousePressed() {
    if (!isGameOver) {
        feed = true;
    }
}
function mouseReleased() {
    if (isGameOver && isRemoveGameOverShark && isRemoveSharks && !feed) {
        resetGame();
    }

    feed = false;
}

class Flock {
    constructor(index) {
        this.boids = [];
        this.lenShark = 0;
        this.lenFish = 0;
        this.eaten = 0;
        this.sharks = null;
        this.index = index;
    }

    run() {
        // console.log(this.eaten, this.lenFish)
        for (var i = 0; i < this.boids.length; i++) {
            if (!this.boids[i].dead) this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
        }
    }

    addBoid(boid) {
        this.boids.push(boid);
        if (boid.fish == "fish") {
            this.lenFish += 1;
        } else if (boid.fish == "shark") {
            this.lenShark += 1;
        }
    }
    //
    // removeBoid(boid){
    //     this.boids.remove(boid);
    // }
}

class FlockShark {
    constructor() {
        this.boids = [];
        this.lenShark = 0;
        this.lenFish = 0;
    }

    run() {
        for (var i = 0; i < this.boids.length; i++) {
            this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
        }
    }

    addBoid(boid) {
        this.boids.push(boid);
        if (boid.fish == "fish") {
            this.lenFish += 1;
        } else if (boid.fish == "shark") {
            this.lenShark += 1;
        }
    }
}

class Boid {
    constructor(x, y, fish = "fish", FlockRef = undefined) {
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(FlockRef.index * -1 * random(-10, 10) + 1 * random(-2, 2), FlockRef.index * -1 * random(-10, 10) + 1 * random(-2, 2))
        this.position = createVector(x, y);
        this.r = 20.0; //3.0
        this.maxforce = 0.05; // Maximum steering force
        this.t = [150, 150, 150, random(100, 255)];
        this.fish = fish;
        this.prey = undefined;
        this.lastImage = fish == "shark" ? shark1 : fish1;

        if (this.fish == "shark") {
            this.maxspeed = random(8, 9);
            this.t = [150, 150, 150, random(200, 255)];
        } else if (this.fish == "fish") {
            this.maxspeed = 10;//random(10, 20);
            this.t = [random(30, 50), random(0, 25), random(80, 125), random(200, 255)];
        }
        this.FlockRef = FlockRef;
        this.attackBool = false;
        this.dead = false;
        this.victim = false;
        this.victimDIST = 1000;
        this.storedMaxSpeed = this.maxspeed;
        this.enter = true;
        this.target = undefined;
        this.preyPredator = undefined;
        this.attackMult = 0.0;

        this.goHere = createVector(0, 0);
    }

    homing() {
        let closest;
        if (this.attackBool == false) {
            closest = {
                number: undefined,
                distance: 3000,
                boid: undefined
            };
            fishFlocks.forEach(fishFlock => {
                for (var i = 0; i < fishFlock.boids.length; i++) {
                    if (fishFlock.boids[i].dead == false) {
                        var d = p5.Vector.dist(this.position, fishFlock.boids[i].position);
                        if (d < closest.distance) {
                            closest.number = i
                            closest.boid = fishFlock.boids[i]
                            closest.boid.victim = true;
                            closest.distance = d
                        }
                    }
                    this.attackBool = true
                }
            })
            return closest
        }
    }

    drawFishy() {
        let percentOfMaxSpeed = this.velocity.mag() / this.maxspeed;
        percentOfMaxSpeed = (isNaN(percentOfMaxSpeed) ? 0.0 : percentOfMaxSpeed);
        const randomFrac = Math.random() * Math.random() * Math.random() * Math.random() * 1.5;
        const inversePercentChanceOfChange = 0.5;
        const isChange = (randomFrac + percentOfMaxSpeed * Math.random() * Math.random()) > inversePercentChanceOfChange;

        if (this.fish == "fish") {
            if (this.dead) {
                return trans;
            }
            if (isChange) {
                const lastImg = this.lastImage;
                this.lastImage = lastImg == fish1 ? fish2 : fish1;
            }
            return this.lastImage;
        } else if (this.fish == "shark") {
            if (isChange) {
                const lastImg = this.lastImage;
                this.lastImage = lastImg == shark1 ? shark2 : shark1;
            }
            return this.lastImage;
        }
    }

    run() {
        if (this.fish == "fish") {
            this.flock(this.FlockRef.boids.filter(({ dead }) => !dead));
            this.update();
            if (feed == true && this.dead == false) {
                this.maxspeed = this.storedMaxSpeed + 5; //35
                this.die(); // possibly...
            } else {
                this.maxspeed = this.storedMaxSpeed;
            }
        } else if (this.fish == "shark") {
            this.flock(flockShark.boids);
            this.update();
            if (feed == true && this.fish == "shark") {
                if (this.enter == true) {
                    this.target = this.homing()
                    this.maxspeed = this.storedMaxSpeed + 7; //35
                    this.maxforce = .7; //.3
                    this.enter = false;
                }
                this.attackMult = 7;
            } else {
                this.target = undefined;
                this.attackMult = 0;
                this.maxforce = .05;
                this.maxspeed = this.storedMaxSpeed;
                this.attackBool = false;
                this.enter = true;
            }
        }
        this.borders();
        this.render();
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    flock(boids) {
        var sep = this.separate(boids);   // Separation
        var ali = this.align(boids);      // Alignment
        var coh = this.cohesion(boids);   // Cohesion

        //******--------
        //WRITE A NEW FUNCTION
        var atk = this.attack(boids);//this.target); // Attack

        // Arbitrarily weight these forces
        // sep.mult(this.fish == "shark" ? 4.5 : 1.5);
        // ali.mult(this.fish == "shark" ? 2.5 : 1.0);
        // coh.mult(this.fish == "shark" ? 1.0 : 1.0);
        sep.mult(this.fish == "shark" ? 4.5 : 1.5);
        ali.mult(this.fish == "shark" ? 2.5 : 1.5);
        coh.mult(this.fish == "shark" ? 1.0 : 1.5);

        //******--------
        // atk.mult(this.fish == "shark" ? 5.0 : feed ? 60.0 : 25.0);
        atk.mult(this.fish == "shark" ? 5.0 : feed ? 60.0 : 1.5);

        // Add the force vectors to acceleration
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);

        //******--------
        this.applyForce(atk);

    }

    update() {
        // Update velocity
        this.velocity.add(this.acceleration);
        // Limit speed
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        // Reset accelertion to 0 each cycle
        this.acceleration.mult(0);
    }


    //##############
    seek(target) {
        var desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxspeed);
        // Steering = Desired minus Velocity
        var steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce);  // Limit to maximum steering force
        // console.log(target)
        return steer;
    }

    //##############
    render() {
        if (this.fish == "fish") {
            var theta = this.velocity.heading() + radians(180)
        } else if (this.fish == "shark") {
            var theta = this.velocity.heading()
        }

        fill(127);
        fill("#003366")
        stroke('#0052A2');
        push();
        translate(this.position.x, this.position.y);

        rotate(theta);
        if (this.fish == "shark") {
            tint(this.t[0], this.t[1], this.t[2], this.t[3])
            image(this.drawFishy(), -100, 0);
        } else if (this.fish == "fish") {
            const tintColor = [this.t[0], this.t[1], this.t[2], this.t[3]];
            if (this.FlockRef.index < fishFlocks.length) {
                tintColor[this.FlockRef.index] += 70;
            } else if (fishFlocks.length - this.FlockRef.index > -1) {
                tintColor[fishFlocks.length - this.FlockRef.index] -= 115;
            }
            tint(...tintColor);
            image(this.drawFishy(), 0, 0)
        }
        pop();
    }

    //##############
    borders() {
        if (this.fish == "fish") {
            if (this.position.x < -this.r) this.position.x = width + this.r;
            if (this.position.y < -this.r) this.position.y = height + this.r;
            if (this.position.x > width + this.r) this.position.x = -this.r;
            if (this.position.y > height + this.r) this.position.y = -this.r;
        }
    }

    separate(boids) {
        if (this.fish == "fish") {
            var desiredseparation = 55.0; //25.0
        } else if (this.fish == "shark") {
            var desiredseparation = 500.0; //25.0
        }
        var steer = createVector(0, 0);
        var count = 0;
        // For every boid in the system, check if it's too close
        for (var i = 0; i < boids.length; i++) {
            var d = p5.Vector.dist(this.position, boids[i].position);
            // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
            if ((d > 0) && (d < desiredseparation)) {
                // Calculate vector pointing away from neighbor
                var diff = p5.Vector.sub(this.position, boids[i].position);
                diff.normalize();
                diff.div(d);        // Weight by distance
                steer.add(diff);
                count++;            // Keep track of how many
            }
        }
        // Average -- divide by how many
        if (count > 0) {
            steer.div(count);
        }

        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.normalize();
            steer.mult(this.maxspeed);
            steer.sub(this.velocity);
            steer.limit(this.maxforce);
        }
        return steer;
    }

    align(boids) {
        var neighbordist = 100; //70
        var sum = createVector(0, 0);
        var count = 0;
        for (var i = 0; i < boids.length; i++) {
            var d = p5.Vector.dist(this.position, boids[i].position);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boids[i].velocity);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(this.maxspeed);
            var steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxforce);
            return steer;
        } else {
            return createVector(0, 0);
        }
    }

    cohesion(boids) {
        var neighbordist = 100; //70
        var sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
        var count = 0;
        for (var i = 0; i < boids.length; i++) {
            var d = p5.Vector.dist(this.position, boids[i].position);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boids[i].position); // Add location
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            return this.seek(sum);  // Steer towards the location
        } else {
            return createVector(0, 0);
        }
    }

    attack(boids) {
        if (this.fish == "shark" && (isGameOver || !feed)) {
            const onScreenPos = createVector(windowWidth / 2, windowHeight / 2);
            const offScreenDist = windowWidth > windowHeight ? windowWidth / 2 : windowHeight / 2;
            var d = p5.Vector.dist(onScreenPos, this.position);
            return d > offScreenDist || !boids.length || isGameOver ? this.seek(onScreenPos) : createVector(0, 0); // seek the midpoint of the screen if the sharks start going offscreen
        } else if (this.fish == "shark" && feed) {
            return this.seek(this.goHere);  // Steer towards the location
        } else { // fish
            if (this.FlockRef.sharks && this.FlockRef.sharks.boids && !!this.FlockRef.sharks.boids.length) {
                const desiredSeparationFromShark = 100.0;

                const closeSharks = this.FlockRef.sharks.boids
                    .filter(
                        ({ position }) => p5.Vector.dist(this.position, position) < desiredSeparationFromShark
                    );

                const dirAway = !closeSharks.length ? createVector(0.0, 0.0) : closeSharks.reduce(
                    (acc, { position }) => acc.add(position), createVector(0.0, 0.0)
                ).div(closeSharks.length)
                    .normalize()
                    .mult(-1);

                // As long as the vector is greater than 0
                if (dirAway.mag() > 0) {
                    // Implement Reynolds: Steering = Desired - Velocity
                    dirAway.mult(this.maxspeed);
                    dirAway.sub(this.velocity);
                    dirAway.limit(this.maxforce);
                }
                return dirAway;
            } else {
                return createVector(0, 0);
            }
        }
    }

    die() {
        let died = false;
        for (var i = 0; i < flockShark.boids.length; i++) {
            var d = p5.Vector.dist(this.position, flockShark.boids[i].position);
            const death = d < 50
            if (death) {
                died = death || died;
                this.dead = true;
                this.target = undefined;
                this.enter = true;
            }
        }

        if (died) {
            numFishKilled += 1;
            isGameOver = TOTAL_NUM_FISH == numFishKilled;
            isScreenClickedOnce = true;
            backgroundColor = lerpColor(color(SEA_BLUE_BACKGROUND_COLOR), color(BLOOD_RED_COLOR), numFishKilled / TOTAL_NUM_FISH);
        }
    }
}
