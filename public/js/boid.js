
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

    flock(boids, { sepMult = 1.7, aliMult = 1.5, cohMult = 1.5 }, desiredSeparation) {

        console.log({ this: this, sepMult, aliMult, cohMult, desiredSeparation  })
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

    separate(boids, desiredSeparation = 90) {
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
    constructor({ p, getWidth, gameSharkSprite, x, y, FlockRef = { index: 0 }, maxSpeed, getAreSharksFeeding, getIsGameOver, index = 0, imgs = { shark1: undefined, shark2: undefined } }) {
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
        this.gameSharkSprite = gameSharkSprite;
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

        // const animSpeed = this.velocity.mag() / this.maxSpeed * 75;
        // this.gameSharkSprite.updateAnimSpeed(animSpeed);

        if (isFeeding == true) {
            this.maxSpeed = this.storedMaxSpeed + 2
            this.maxForce = .7;

        } else {
            this.maxSpeed = this.storedMaxSpeed;
            this.maxForce = .05;

            // const animSpeed = this.velocity.mag() / this.maxSpeed * 1000;
            // this.gameSharkSprite.updateAnimSpeed(animSpeed);
        }

        this.render();
    }

    flock(boids) {
        const isFeeding = this.getAreSharksFeeding();
        const isGameOver = this.getIsGameOver();
        const desiredSeparation = this.circleRadius * 1.5;
        super.flock(boids, { sepMult: 2.7, aliMult: 0.5, cohMult: 2.0 }, desiredSeparation)
        // super.flock(boids, isFeeding ? 2.5 : 0.0, isFeeding ? 0.0 : 0.5, isFeeding ? 2.5 : 2.0, desiredSeparation);
        var atk = this.attack(boids); // Attack
        atk.mult(isFeeding || isGameOver ? 2.5 : 2.0);//60.0 : 25.0);
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
            // seek the midpoint of the screen if the sharks start going offscreen
            return d > offScreenDist || !boids.length || isGameOver ? this.seek(onScreenPos) : this.p.createVector(0, 0);
        } else if (isFeeding) {
            if (p5.Vector.dist(this.position, this.goHere) <= this.circleRadius * 4.0) {
                return this.getForceTowardsCirclePosition();
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

    getCirclePos() {
        const angleRads = this.p.radians(this.index * (360 / this.FlockRef.boids.length) + this.lastCirclePosUpdate);
        const x = this.goHere.x + this.p.cos(angleRads) * this.circleRadius * 3;
        const y = this.goHere.y + this.p.sin(angleRads) * this.circleRadius * 3;
        return this.p.createVector(x, y);
    }

    getForceTowardsMouse() {
        return this.seek(this.goHere);;
    }

    render() {
        var theta = this.velocity.heading() + this.p.radians(360);;//+ this.p.radians(90);

        this.p.fill(127);
        this.p.fill("#003366")
        this.p.stroke('#0052A2');
        this.p.push();
        this.p.translate(this.position.x, this.position.y);

        this.p.rotate(theta);
        const [r, g, b, a] = this.tintColor
        this.p.tint(r, g, b, a)
        this.p.image(this.getSharkImg(), -100, 0);
        // this.gameSharkSprite.draw(this.p.millis());
        this.p.pop();
    }
}

export class FishBoid extends BaseBoid {
    constructor({ p, gameFishSprite, getWidth, getAreSharksFeeding, getIsGameOver, FlockRef = { index: 0 }, maxSpeed, doDeathLogic = () => { }, flockShark, imgs = { fish1: undefined, fish2: undefined, trans: undefined } }) {
        super({ p, getWidth, FlockRef, maxSpeed, flockShark, getAreSharksFeeding, getIsGameOver });
        this.borderAmt = 20.0;
        this.isDead = false;

        this.imgs = imgs; // anim info
        this.lastImage = imgs.fish1; // anim info

        this.tintColor = [this.p.random(30, 50), this.p.random(0, 25), this.p.random(80, 125), this.p.random(100, 255)];

        this.doDeathLogic = doDeathLogic;
        this.flockShark = flockShark;
        this.dieRadius = this.circleRadius;
        this.gameFishSprite = gameFishSprite;
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
        this.flock(this.FlockRef.boids.filter(({ isDead }) => !isDead));
        this.update();
        if (isFeeding == true && !this.isDead) {
            this.maxSpeed = this.storedMaxSpeed + 2;

            // const animSpeed = this.velocity.mag() / this.maxSpeed;
            // this.gameFishSprite.updateAnimSpeed(animSpeed);

            // possibly...
            this.die();
        } else {
            this.maxSpeed = this.storedMaxSpeed;

            // const animSpeed = this.velocity.mag() / this.maxSpeed;
            // this.gameFishSprite.updateAnimSpeed(animSpeed);
        }
        this.borders();
        this.render();
    }

    flock(boids) {
        super.flock(boids, { sepMult: 1.7, aliMult: 1.5, cohMult: 1.5 });
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
        // var theta = this.velocity.heading();// + this.p.radians(90);
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
        // this.gameFishSprite.draw(this.p.millis());
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