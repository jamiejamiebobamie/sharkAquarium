export class Flock {
    constructor() {
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
    constructor() {
        super();
        this.lastCirclePosUpdate = 0;
        this.intervalTimeout = undefined;
        this.circlePosUpdateInterval = 100;
    }

    getLastCirclePosUpdate(){
        return this.lastCirclePosUpdate;
    }

    startSharkCirclePositionsInterval() {
        this.intervalTimeout = setInterval(() => { this.lastCirclePosUpdate += 30; }, this.circlePosUpdateInterval)
    }

    clearUpdateSharkCirclePositionsInterval() {
        clearInterval(this.intervalTimeout);
    }

}

export class FishFlock extends Flock {
    constructor(index) {
        super();
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