export default class Boid {
    constructor({ x, y, fish = "fish", FlockRef = {index: 0}, imgs = { shark1: undefined, shark2: undefined, fish1: undefined, fish2: undefined, trans: undefined}, createVector= () => {}, random= () => {} }) {
        this.createVector = createVector;
        this.random = random;
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(FlockRef.index * -1 * this.random(-10, 10) + 1 * this.random(-2, 2), FlockRef.index * -1 * this.random(-10, 10) + 1 * this.random(-2, 2))
        this.position = createVector(x, y);
        this.r = 20.0; //3.0
        this.maxforce = 0.05; // Maximum steering force
        this.t = [150, 150, 150, this.random(100, 255)];
        this.fish = fish;
        this.prey = undefined;
        this.imgs = imgs;
        this.lastImage = fish == "shark" ? imgs.shark1 : imgs.fish1;

        if (this.fish == "shark") {
            this.maxspeed = this.random(8, 9);
            this.t = [150, 150, 150, this.random(200, 255)];
        } else if (this.fish == "fish") {
            this.maxspeed = 10;//random(10, 20);
            this.t = [this.random(30, 50), this.random(0, 25), this.random(80, 125), this.random(100, 255)];
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

        this.goHere = this.createVector(0, 0);
    }

    // homing() {
    //     let closest;
    //     if (this.attackBool == false) {
    //         closest = {
    //             number: undefined,
    //             distance: 3000,
    //             boid: undefined
    //         };
    //         fishFlocks.forEach(fishFlock => {
    //             for (var i = 0; i < fishFlock.boids.length; i++) {
    //                 if (fishFlock.boids[i].dead == false) {
    //                     var d = p5.Vector.dist(this.position, fishFlock.boids[i].position);
    //                     if (d < closest.distance) {
    //                         closest.number = i
    //                         closest.boid = fishFlock.boids[i]
    //                         closest.boid.victim = true;
    //                         closest.distance = d
    //                     }
    //                 }
    //                 this.attackBool = true
    //             }
    //         })
    //         return closest
    //     }
    // }

    drawFishy() {
        let percentOfMaxSpeed = this.velocity.mag() / this.maxspeed;
        percentOfMaxSpeed = (isNaN(percentOfMaxSpeed) ? 0.0 : percentOfMaxSpeed);
        const randomFrac = Math.random() * Math.random() * Math.random() * Math.random() * 1.5;
        const inversePercentChanceOfChange = 0.5;
        const isChange = (randomFrac + percentOfMaxSpeed * Math.random() * Math.random()) > inversePercentChanceOfChange;

        if (this.fish == "fish") {
            if (this.dead) {
                return this.imgs.trans;
            }
            if (isChange) {
                const lastImg = this.lastImage;
                this.lastImage = lastImg == this.imgs.fish1 ? this.imgs.fish2 : this.imgs.fish1;
            }
            return this.lastImage;
        } else if (this.fish == "shark") {
            if (isChange) {
                const lastImg = this.lastImage;
                this.lastImage = lastImg == this.imgs.shark1 ? this.imgs.shark2 : this.imgs.shark1;
            }
            return this.lastImage;
        }
    }

    run({ feed, isGameOver, doDeathLogic, flockShark, fishFlocks, p }) {
        if (this.fish == "fish") {
            this.flock({ feed, boids: this.FlockRef.boids.filter(({ dead }) => !dead), p, isGameOver });
            this.update();
            if (feed == true && this.dead == false) {
                this.maxspeed = this.storedMaxSpeed + 5; //35
                this.die(flockShark, doDeathLogic); // possibly...
            } else {
                this.maxspeed = this.storedMaxSpeed;
            }
        } else if (this.fish == "shark") {
            this.flock({ feed, boids: flockShark.boids, p, isGameOver });
            this.update();
            if (feed == true && this.fish == "shark") {
                if (this.enter == true) {
                    // this.target = this.homing()
                    this.maxspeed = this.storedMaxSpeed + 7; //35
                    this.maxforce = .7; //.3
                    this.enter = false;
                }
                this.attackMult = 7;
            } else {
                // this.target = undefined;
                this.attackMult = 0;
                this.maxforce = .05;
                this.maxspeed = this.storedMaxSpeed;
                this.attackBool = false;
                this.enter = true;
            }
        }
        this.borders(p);
        this.render({ fishFlocks, p });
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    flock({ feed, boids, p, isGameOver }) {
        var sep = this.separate(boids);   // Separation
        var ali = this.align(boids);      // Alignment
        var coh = this.cohesion(boids);   // Cohesion

        //******--------
        //WRITE A NEW FUNCTION
        var atk = this.attack({ boids, isGameOver, feed, p });//this.target); // Attack

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
        return steer;
    }

    //##############
    render({ fishFlocks, p }) {
        if (this.fish == "fish") {
            var theta = this.velocity.heading() + p.radians(180)
        } else if (this.fish == "shark") {
            var theta = this.velocity.heading()
        }

        p.fill(127);
        p.fill("#003366")
        p.stroke('#0052A2');
        p.push();
        p.translate(this.position.x, this.position.y);

        p.rotate(theta);
        if (this.fish == "shark") {
            const [r, g, b, a] = this.t
            p.tint(r, g, b, a)
            p.image(this.drawFishy(), -100, 0);
        } else if (this.fish == "fish") {
            const tintColor = this.t;
            if (this.FlockRef.index < fishFlocks.length) {
                tintColor[this.FlockRef.index] += 70;
            } else if (fishFlocks.length - this.FlockRef.index > -1) {
                tintColor[fishFlocks.length - this.FlockRef.index] -= 115;
            }
            const [r,g,b,a] = tintColor;
            p.tint(r, g, b, this.t[3]);
            p.image(this.drawFishy(), 0, 0);
        }
        p.pop();
    }

    //##############
    borders(p) {
        const width = p.windowWidth;
        const height = p.windowHeight;
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
        var steer = this.createVector(0, 0);
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
        var sum = this.createVector(0, 0);
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
            return this.createVector(0, 0);
        }
    }

    cohesion(boids) {
        var neighbordist = 100; //70
        var sum = this.createVector(0, 0);   // Start with empty vector to accumulate all locations
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
            return this.createVector(0, 0);
        }
    }

    attack({ boids, isGameOver, feed, p }) {
        const { windowWidth, windowHeight } = p;
        if (this.fish == "shark" && (isGameOver || !feed)) {
            const onScreenPos = this.createVector(windowWidth / 2, windowHeight / 2);
            const offScreenDist = windowWidth > windowHeight ? windowWidth / 2 : windowHeight / 2;
            var d = p5.Vector.dist(onScreenPos, this.position);
            return d > offScreenDist || !boids.length || isGameOver ? this.seek(onScreenPos) : this.createVector(0, 0); // seek the midpoint of the screen if the sharks start going offscreen
        } else if (this.fish == "shark" && feed) {
            return this.seek(this.goHere);  // Steer towards the location
        } else { // fish
            if (this.FlockRef.sharks && this.FlockRef.sharks.boids && !!this.FlockRef.sharks.boids.length) {
                const desiredSeparationFromShark = 100.0;

                const closeSharks = this.FlockRef.sharks.boids
                    .filter(
                        ({ position }) => p5.Vector.dist(this.position, position) < desiredSeparationFromShark
                    );

                const dirAway = !closeSharks.length ? this.createVector(0.0, 0.0) : closeSharks.reduce(
                    (acc, { position }) => acc.add(position), this.createVector(0.0, 0.0)
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
                return this.createVector(0, 0);
            }
        }
    }

    die(flockShark, doDeathLogic = () => { }) {
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

        if (died) doDeathLogic({ posX: this.position.x, posY: this.position.y });
    }
}
