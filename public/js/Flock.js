export class Flock {
    constructor(index) {
        this.boids = [];
        this.lenShark = 0;
        this.lenFish = 0;
        this.eaten = 0;
        this.sharks = null;
        this.index = index;
    }

    run(params) {
        for (var i = 0; i < this.boids.length; i++) {
            if (!this.boids[i].dead) this.boids[i].run(params);  // Passing the entire list of boids to each boid individually
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

export class FlockShark {
    constructor() {
        this.boids = [];
        this.lenShark = 0;
        this.lenFish = 0;
    }

    run(params) {
        for (var i = 0; i < this.boids.length; i++) {
            this.boids[i].run(params);  // Passing the entire list of boids to each boid individually
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