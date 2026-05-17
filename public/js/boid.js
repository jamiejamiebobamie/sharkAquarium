class P5Boid {
    constructor({ p, getWidth }) {
        this.p = p;
        this.getWidth = getWidth;
    }
}

class BaseBoid extends P5Boid {
    constructor({ p, getWidth, x, y, FlockRef = { index: 0 }, maxSpeed = 8, imgs = {}, getAreSharksFeeding = () => { }, getIsGameOver = () => { } }) {
        super({ p, getWidth });
        this.acceleration = p.createVector(0, 0);
        this.position = p.createVector(x, y);
        this.maxForce = 0.05;
        this.FlockRef = FlockRef;
        this.maxSpeed = maxSpeed;
        this.storedMaxSpeed = maxSpeed;
        this.velocity = p.createVector(FlockRef.index * -1 * p.random(-10, 10) + 1 * p.random(-2, 2), FlockRef.index * -1 * p.random(-10, 10) + 1 * p.random(-2, 2))
        this.tintColor = [150, 150, 150, p.random(200, 255)];
        this.imgs = imgs; // anim info
        this.lastImage = undefined; // anim info
        this.getAreSharksFeeding = getAreSharksFeeding;
        this.getIsGameOver = getIsGameOver;

        this.circleRadius = 50;
        this.dieRadius = this.circleRadius;
    }

    getIsImgChange() {
        let percentOfMaxSpeed = this.velocity.mag() / this.maxSpeed;
        percentOfMaxSpeed = (isNaN(percentOfMaxSpeed) ? 0.0 : percentOfMaxSpeed);
        const randomFrac = Math.random() / 2;
        const inversePercentChanceOfChange = 0.5;
        const isChange = (randomFrac + percentOfMaxSpeed / 5 * Math.random()) > inversePercentChanceOfChange;
        return isChange;
    }

    flock(boids, sepMult = 1.7, aliMult = 1.5, cohMult = 1.5, desiredSeparation) {
        var sep = this.separate(boids, desiredSeparation);   // Separation
        var ali = this.align(boids);      // Alignment
        var coh = this.cohesion(boids);   // Cohesion

        // Arbitrarily weight these forces
        sep.mult(sepMult);
        ali.mult(aliMult);
        coh.mult(cohMult);

        // Add the force vectors to acceleration
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    update() {
        // Update velocity
        this.velocity.add(this.acceleration);
        // Limit speed
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        // Reset accelertion to 0 each cycle
        this.acceleration.mult(0);
    }

    separate(boids, desiredSeparation = 60) {
        var steer = this.p.createVector(0, 0);
        var count = 0;
        for (var i = 0; i < boids.length; i++) {
            var d = p5.Vector.dist(this.position, boids[i].position);
            if ((d > 0) && (d < desiredSeparation)) {
                var diff = p5.Vector.sub(this.position, boids[i].position);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.div(count);
        }
        if (steer.mag() > 0) {
            steer.normalize();
            steer.mult(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
        }
        return steer;
    }

    align(boids) {
        var neighbordist = 100;
        var sum = this.p.createVector(0, 0);
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
            sum.mult(this.maxSpeed);
            var steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxForce);
            return steer;
        } else {
            return this.p.createVector(0, 0);
        }
    }

    cohesion(boids) {
        var neighborDist = 100;
        var sum = this.p.createVector(0, 0);
        var count = 0;
        for (var i = 0; i < boids.length; i++) {
            var d = p5.Vector.dist(this.position, boids[i].position);
            if ((d > 0) && (d < neighborDist)) {
                sum.add(boids[i].position);
                count++;
            }
        }
        if (count > 0) {
            sum.div(count);
            return this.seek(sum);
        } else {
            return this.p.createVector(0, 0);
        }
    }

    seek(target) {
        var desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxSpeed);
        // Steering = Desired minus Velocity
        var steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);  // Limit to maximum steering force
        return steer;
    }
}


export class SharkBoid extends BaseBoid {
    constructor({ p, getWidth, x, y, FlockRef = { index: 0 }, maxSpeed, getAreSharksFeeding, getIsGameOver, index = 0, imgs = { shark1: undefined, shark2: undefined } }) {
        super({ p, getWidth, x, y, FlockRef, maxSpeed, getAreSharksFeeding, getIsGameOver });
        // shark circling logic
        this.index = index;
        this.updateCirclePosInterval = Math.PI * this.circleRadius;
        this.lastCirclePosUpdate = 0;
        // - - -
        // shark attack and seek logic
        this.goHere = this.p.createVector(0, 0);
        // - - -
        this.imgs = imgs; // anim info
        this.lastImage = imgs.shark1; // anim info

        this.tintColor = [150, 150, 150, this.p.random(200, 255)];
    }

    getCirclePos() {
        const angleRads = this.p.radians(this.index * 120 + this.lastCirclePosUpdate);
        const x = this.goHere.x + this.p.cos(angleRads) * this.circleRadius * 3;
        const y = this.goHere.y + this.p.sin(angleRads) * this.circleRadius * 3;
        return this.p.createVector(x, y);
    }

    getSharkImg() {
        const isChange = this.getIsImgChange();
        if (isChange) {
            const lastImg = this.lastImage;
            this.lastImage = lastImg == this.imgs.shark1 ? this.imgs.shark2 : this.imgs.shark1;
        }
        return this.lastImage;
    }

    run() {
        const isFeeding = this.getAreSharksFeeding();

        this.flock(this.FlockRef.boids);
        this.update();

        if (isFeeding == true) {
            this.maxSpeed = this.storedMaxSpeed + 2
            this.maxForce = .7;

        } else {
            this.maxForce = .05;
            this.maxSpeed = this.storedMaxSpeed;
        }

        this.render();
    }

    flock(boids) {
        const isFeeding = this.getAreSharksFeeding();
        const desiredSeparation = 150;
        super.flock(boids, 2.5, .5, 2.0, desiredSeparation);
        var atk = this.attack(boids); // Attack
        atk.mult(isFeeding ? 5 : 2.0);//60.0 : 25.0);
        this.applyForce(atk);
    }

    attack(boids) {
        const isGameOver = this.getIsGameOver();
        const isFeeding = this.getAreSharksFeeding();
        const { windowHeight } = this.p;
        if (isGameOver || !isFeeding) {
            const onScreenPos = this.p.createVector(this.getWidth() / 2, windowHeight / 2);
            const offScreenDist = this.getWidth() > windowHeight ? this.getWidth() / 2 : windowHeight / 2;
            var d = p5.Vector.dist(onScreenPos, this.position);
            return d > offScreenDist || !boids.length || isGameOver ? this.seek(onScreenPos) : this.p.createVector(0, 0); // seek the midpoint of the screen if the sharks start going offscreen
        } else if (isFeeding) {
            if (p5.Vector.dist(this.position, this.goHere) <= this.circleRadius * 4) {
                return this.getForceTowardsCirclePosition()  // should be managed at the Flock class level...
            } else {
                return this.getForceTowardsMouse();
            }
        }
    }

    getForceTowardsCirclePosition() {
        // sharks circle mouse position if within range of circle
        if (p5.Vector.dist(this.getCirclePos(), this.position) <= 60) {
            const lastCirclePosUpdate = this.FlockRef.getLastCirclePosUpdate();
            this.lastCirclePosUpdate = lastCirclePosUpdate;
        }
        return this.seek(this.getCirclePos());
    }

    getForceTowardsMouse() {
        return this.seek(this.goHere);;
    }

    render() {
        var theta = this.velocity.heading();

        this.p.fill(127);
        this.p.fill("#003366")
        this.p.stroke('#0052A2');
        this.p.push();
        this.p.translate(this.position.x, this.position.y);

        this.p.rotate(theta);
        const [r, g, b, a] = this.tintColor
        this.p.tint(r, g, b, a)
        this.p.image(this.getSharkImg(), -100, 0);
        this.p.pop();
    }
}

export class FishBoid extends BaseBoid {
    constructor({ p, getWidth, getAreSharksFeeding, getIsGameOver, FlockRef = { index: 0 }, maxSpeed, doDeathLogic = () => { }, flockShark, imgs = { fish1: undefined, fish2: undefined, trans: undefined } }) {
        super({ p, getWidth, FlockRef, maxSpeed, flockShark, getAreSharksFeeding, getIsGameOver });
        this.borderAmt = 20.0;
        this.isDead = false;

        this.imgs = imgs; // anim info
        this.lastImage = imgs.fish1; // anim info

        this.tintColor = [this.p.random(30, 50), this.p.random(0, 25), this.p.random(80, 125), this.p.random(100, 255)];

        this.doDeathLogic = doDeathLogic;
        this.flockShark = flockShark;
        this.dieRadius = this.circleRadius;
    }

    respawn(doRespawnFishLogic) {
        if (!doRespawnFishLogic()) return false;
        this.position = this.p.createVector(Math.random() * this.getWidth(), Math.random() * this.p.windowHeight);
        this.acceleration = this.p.createVector(0, 0);
        this.velocity = this.p.createVector(this.getWidth() / 2 - this.position.x, this.p.windowHeight / 2 - this.position.y).normalize().mult(this.maxSpeed);
        this.isDead = false;
        return true;
    }

    getFishImg() {
        const isChange = this.getIsImgChange();
        if (this.isDead) {
            return this.imgs.trans;
        }
        if (isChange) {
            const lastImg = this.lastImage;
            this.lastImage = lastImg == this.imgs.fish1 ? this.imgs.fish2 : this.imgs.fish1;
        }
        return this.lastImage;
    }

    run() {
        const isFeeding = this.getAreSharksFeeding();
        this.flock(this.FlockRef.boids.filter(({ dead }) => !dead));
        this.update();
        if (isFeeding == true && !this.isDead) {
            this.maxSpeed = this.storedMaxSpeed + 2;
            // possibly...
            this.die();
        } else {
            this.maxSpeed = this.storedMaxSpeed;
        }
        this.borders();
        this.render();
    }

    flock(boids) {
        super.flock(boids, 2.5, 1.5, 2.0);
        const isFeeding = this.getAreSharksFeeding();
        var atk = this.attack(); // Attack
        atk.mult(isFeeding ? 25 : 2.7);
        this.applyForce(atk);
    }

    die() {
        let died = false;
        for (var i = 0; i < this.flockShark.boids.length; i++) {
            var distToMouse = p5.Vector.dist(this.position, this.p.createVector(this.p.mouseX, this.p.mouseY));
            var distToShark = p5.Vector.dist(this.position, this.flockShark.boids[i].position);
            const death = distToMouse < (this.dieRadius * 2) && distToShark < this.dieRadius;
            if (death) {
                died = death || died;
                this.isDead = true;
            }
        }
        if (died) this.doDeathLogic({ posX: this.position.x, posY: this.position.y, velocity: this.velocity });
    }

    borders() {
        const width = this.getWidth();
        const height = this.p.windowHeight;
        if (this.position.x < -this.borderAmt) this.position.x = width + this.borderAmt;
        if (this.position.y < -this.borderAmt) this.position.y = height + this.borderAmt;
        if (this.position.x > width + this.borderAmt) this.position.x = -this.borderAmt;
        if (this.position.y > height + this.borderAmt) this.position.y = -this.borderAmt;
    }

    render() {
        var theta = this.velocity.heading() + this.p.radians(180);
        this.p.fill(127);
        this.p.fill("#003366")
        this.p.stroke('#0052A2');
        this.p.push();
        this.p.translate(this.position.x, this.position.y);
        this.p.rotate(theta);
        const tintColor = [...this.tintColor];
        if (this.FlockRef.index < tintColor.length) {
            tintColor[this.FlockRef.index] += 70;
        } else if (tintColor.length - this.FlockRef.index > -1) {
            tintColor[tintColor.length - this.FlockRef.index] -= 115;
        }
        const [r, g, b] = tintColor;
        this.p.tint(r, g, b, this.tintColor[3]);
        this.p.image(this.getFishImg(), 0, 0);
        this.p.pop();
    }

    attack() {
        if (!!this.flockShark && !!this.flockShark.boids && !!this.flockShark.boids.length) {
            const desiredSeparationFromShark = 100.0;

            const closeSharks = this.flockShark.boids
                .filter(
                    ({ position }) => p5.Vector.dist(this.position, position) < desiredSeparationFromShark
                );

            const dirAway = !closeSharks.length ? this.p.createVector(0.0, 0.0) : closeSharks.reduce(
                (acc, { position }) => acc.add(position), this.p.createVector(0.0, 0.0)
            ).div(closeSharks.length)
                .normalize()
                .mult(-1);

            if (dirAway.mag() > 0) {
                dirAway.mult(this.maxSpeed);
                dirAway.sub(this.velocity);
                dirAway.limit(this.maxForce);
            }
            return dirAway;
        } else {
            return this.p.createVector(0, 0);
        }
    }
}


export class Boid {
    constructor({ getWidth, x, y, p, fish = "fish", index = 0, FlockRef = { index: 0 }, imgs = { shark1: undefined, shark2: undefined, fish1: undefined, fish2: undefined, trans: undefined }, createVector = () => { }, random = () => { } }) {
        this.createVector = createVector;
        this.random = random;
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(FlockRef.index * -1 * this.random(-10, 10) + 1 * this.random(-2, 2), FlockRef.index * -1 * this.random(-10, 10) + 1 * this.random(-2, 2))
        this.position = createVector(x, y);
        this.borderAmt = 20.0; //3.0
        this.maxForce = 0.05; // Maximum steering force
        this.tintColor = [150, 150, 150, this.random(100, 255)];
        this.fish = fish;
        this.imgs = imgs;
        this.lastImage = fish == "shark" ? imgs.shark1 : imgs.fish1;
        this.index = index;
        this.circleRadius = 50; // 90
        this.updateCirclePosInterval = Math.PI * this.circleRadius;
        this.goHere = this.createVector(0, 0);
        this.lastCirclePosUpdate = 0;
        this.dieRadius = this.circleRadius; // 50

        if (this.fish == "shark") {
            this.maxSpeed = this.random(7, 8);//this.random(8, 9);
            this.tintColor = [150, 150, 150, this.random(200, 255)];
        } else if (this.fish == "fish") {
            this.maxSpeed = this.random(8, 9);//10;//random(10, 20);
            this.tintColor = [this.random(30, 50), this.random(0, 25), this.random(80, 125), this.random(100, 255)];
        }
        this.FlockRef = FlockRef;
        this.isDead = false;
        this.victimDIST = 1000;
        this.storedMaxSpeed = this.maxSpeed;

        this.attackMult = 0.0;
        this.getWidth = getWidth;
        this.p = p;
    }

    respawn(doRespawnFishLogic) {
        if (!doRespawnFishLogic()) return false;
        this.position = this.createVector(Math.random() * this.getWidth(), Math.random() * this.p.windowHeight);
        this.acceleration = this.createVector(0, 0);
        this.velocity = this.createVector(this.getWidth() / 2 - this.position.x, this.p.windowHeight / 2 - this.position.y).normalize().mult(this.maxSpeed);
        this.isDead = false;
        return true;
    }

    getCirclePos(p) {
        const angleRads = p.radians(this.index * 120 + this.lastCirclePosUpdate);
        const x = this.goHere.x + p.cos(angleRads) * this.circleRadius * 3;
        const y = this.goHere.y + p.sin(angleRads) * this.circleRadius * 3;
        return this.createVector(x, y);
    }

    drawFishy() {
        let percentOfMaxSpeed = this.velocity.mag() / this.maxSpeed;
        percentOfMaxSpeed = (isNaN(percentOfMaxSpeed) ? 0.0 : percentOfMaxSpeed);
        const randomFrac = Math.random() / 2;
        const inversePercentChanceOfChange = 0.5;
        const isChange = (randomFrac + percentOfMaxSpeed / 5 * Math.random()) > inversePercentChanceOfChange;

        if (this.fish == "fish") {
            if (this.isDead) {
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

    run({ feed, lastCirclePosUpdate, isGameOver, doDeathLogic, flockShark, fishFlocks, p, progress }) {
        if (this.fish == "fish") {
            this.flock({ lastCirclePosUpdate, progress, feed, boids: this.FlockRef.boids.filter(({ dead }) => !dead), p, isGameOver });
            this.update();
            if (feed == true && this.isDead == false) {
                this.maxSpeed = this.storedMaxSpeed + 2;
                this.die(flockShark, doDeathLogic, p); // possibly...
            } else {
                this.maxSpeed = this.storedMaxSpeed;
            }
        } else if (this.fish == "shark") {
            this.flock({ lastCirclePosUpdate, feed, boids: flockShark.boids, p, isGameOver });
            this.update();

            if (feed == true) {
                this.maxSpeed = this.storedMaxSpeed + 2
                this.maxForce = .7;

            } else {
                this.maxForce = .05;
                this.maxSpeed = this.storedMaxSpeed;
            }
        }
        this.borders(p);
        this.render({ fishFlocks, p, feed });
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    flock({ feed, boids, p, isGameOver, progress, lastCirclePosUpdate }) {
        var sep = this.separate(boids);   // Separation
        var ali = this.align(boids);      // Alignment
        var coh = this.cohesion(boids);   // Cohesion

        //******--------
        //WRITE A NEW FUNCTION
        var atk = this.attack({ boids, isGameOver, feed, p, progress, lastCirclePosUpdate }); // Attack

        // Arbitrarily weight these forces
        // sep.mult(this.fish == "shark" ? 4.5 : 1.5);
        // ali.mult(this.fish == "shark" ? 2.5 : 1.0);
        // coh.mult(this.fish == "shark" ? 1.0 : 1.0);
        sep.mult(this.fish == "shark" ? 2.5 : 1.7);
        ali.mult(this.fish == "shark" ? 0.5 : 1.5);
        coh.mult(this.fish == "shark" ? 2.0 : 1.5);

        //******--------
        atk.mult(this.fish == "shark" ? 5.0 : feed ? 60.0 : 25.0);
        // atk.mult(this.fish == "shark" ? 5.0 : feed ? 2.0 : 1.5);

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
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        // Reset accelertion to 0 each cycle
        this.acceleration.mult(0);
    }


    //##############
    seek(target) {
        var desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxSpeed);
        // Steering = Desired minus Velocity
        var steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);  // Limit to maximum steering force
        return steer;
    }

    //##############
    render({ fishFlocks, p, feed }) {
        if (this.fish == "fish") {
            var theta = this.velocity.heading() + p.radians(180);
        } else if (this.fish == "shark") {
            var theta = this.velocity.heading();
        }

        p.fill(127);
        p.fill("#003366")
        p.stroke('#0052A2');
        p.push();
        p.translate(this.position.x, this.position.y);

        p.rotate(theta);
        if (this.fish == "shark") {
            const [r, g, b, a] = this.tintColor
            p.tint(r, g, b, a)
            p.image(this.drawFishy(feed), -100, 0);
        } else if (this.fish == "fish") {
            const tintColor = this.tintColor;
            if (this.FlockRef.index < fishFlocks.length) {
                tintColor[this.FlockRef.index] += 70;
            } else if (fishFlocks.length - this.FlockRef.index > -1) {
                tintColor[fishFlocks.length - this.FlockRef.index] -= 115;
            }
            const [r, g, b, a] = tintColor;
            p.tint(r, g, b, this.tintColor[3]);
            p.image(this.drawFishy(feed), 0, 0);
        }
        p.pop();
    }

    //##############
    borders(p) {
        const width = this.getWidth();
        const height = p.windowHeight;
        if (this.fish == "fish") {
            if (this.position.x < -this.borderAmt) this.position.x = width + this.borderAmt;
            if (this.position.y < -this.borderAmt) this.position.y = height + this.borderAmt;
            if (this.position.x > width + this.borderAmt) this.position.x = -this.borderAmt;
            if (this.position.y > height + this.borderAmt) this.position.y = -this.borderAmt;
        }
    }

    separate(boids) {
        if (this.fish == "fish") {
            var desiredseparation = 60.0; //25.0
        } else if (this.fish == "shark") {
            var desiredseparation = 150.0; //25.0
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
            steer.mult(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
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
            sum.mult(this.maxSpeed);
            var steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxForce);
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

    attack({ boids, isGameOver, feed, p, progress, lastCirclePosUpdate }) {
        const { windowHeight } = p;
        if (this.fish == "shark" && (isGameOver || !feed)) {
            const onScreenPos = this.createVector(this.getWidth() / 2, windowHeight / 2);
            const offScreenDist = this.getWidth() > windowHeight ? this.getWidth() / 2 : windowHeight / 2;
            var d = p5.Vector.dist(onScreenPos, this.position);
            return d > offScreenDist || !boids.length || isGameOver ? this.seek(onScreenPos) : this.createVector(0, 0); // seek the midpoint of the screen if the sharks start going offscreen
        } else if (this.fish == "shark" && feed) {
            if (p5.Vector.dist(this.position, this.goHere) <= this.circleRadius * 4) {
                // circle mouse position if within range of circle
                if (p5.Vector.dist(this.getCirclePos(p), this.position) <= 60) {
                    this.lastCirclePosUpdate = lastCirclePosUpdate;
                }
                return this.seek(this.getCirclePos(p));  // Steer towards the location

            } else {
                // go to mouse position if outside range of circle
                return this.seek(this.goHere);  // Steer towards the location
            }
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
                    dirAway.mult(this.maxSpeed);
                    dirAway.sub(this.velocity);
                    dirAway.limit(this.maxForce);
                }
                return dirAway;
            } else {
                return this.createVector(0, 0);
            }
        }
    }

    die(flockShark, doDeathLogic = () => { }, p) {
        let died = false;
        for (var i = 0; i < flockShark.boids.length; i++) {
            var distToMouse = p5.Vector.dist(this.position, p.createVector(p.mouseX, p.mouseY));
            var distToShark = p5.Vector.dist(this.position, flockShark.boids[i].position);
            const death = distToMouse < (this.dieRadius * 2) && distToShark < this.dieRadius;
            if (death) {
                died = death || died;
                this.isDead = true;
            }
        }

        if (died) doDeathLogic({ posX: this.position.x, posY: this.position.y, velocity: this.velocity });
    }
}
