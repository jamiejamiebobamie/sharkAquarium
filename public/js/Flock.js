export class Flock {
    constructor(p) {
        this.p = p;
        this.boids = [];
    }

    run(params) {
        for (var i = 0; i < this.boids.length; i++) {
            this.boids[i].run(params);
        }
    }

    addBoid(boid) {
        this.boids.push(boid);
    }
}

export class SharkFlock extends Flock {
    constructor(p) {
        super(p);
        this.lastCirclePosUpdate = 0;
        this.intervalTimeout = undefined;
        this.circlePosUpdateInterval = 100;//200; // 100
        this.lastMilli = 0;

    }

    getLastCirclePosUpdate(){
        // const diff = this.p.millis() - this.lastMilli;
        // this.lastMilli = diff;
        // this.circlePosUpdateInterval = diff;
        return  this.lastCirclePosUpdate;
    }

    startSharkCirclePositionsInterval() {
        this.intervalTimeout = setInterval(() => { this.lastCirclePosUpdate += 45; }, this.circlePosUpdateInterval) // 30
    }

    clearUpdateSharkCirclePositionsInterval() {
        clearInterval(this.intervalTimeout);
    }

}

export class FishFlock extends Flock {
    constructor(p, index) {
        super(p);
        this.sharks = null;
        this.index = index; // for fish group color
    }

    run(params) {
        for (var i = 0; i < this.boids.length; i++) {
            if (!this.boids[i].isDead) this.boids[i].run(params);
        }
    }

    respawn(doRespawnFishLogic, amtToRespawn = this.boids.length) {
        let count = 0;
        let isGameOver = false;
        this.boids.forEach(boid => {
            if (!isGameOver && count < amtToRespawn) {
                if (boid.isDead) {
                    isGameOver = !boid.respawn(doRespawnFishLogic);
                    if (!isGameOver) count++;
                }
            }
        });
        return count;
    }
}