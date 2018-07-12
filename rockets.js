var population;
var generation = 1;
var lifespan = 450;
var averageFitness = 0;
var maxFitness = 0;
var genP;
var lifeP;
var fitnessP;
var maxFitP;
var count = 0;
var target;
var maxforce = 0.2;

var frame_width = 400;
var frame_height = 400;

var rw = 110;
var rh = 10;
var rx = (frame_width - rw) / 2;
var ry = 150;

var comp_multiplier = 20;   // the number with which we multiply the fitness, if the rocket reaches the target
var crash_divisor = 10;     // the number with which we divide the fitness, if the rocket crashes

function setup() {
  createCanvas(frame_width, frame_height);
  population = new Population();
  genP = createP();
  fitnessP = createP();
  maxFitP = createP();
  lifeP = createP();
  target = createVector(width/2, 50);
}

function draw() {
  background(0);
  population.run();
  genP.html("Generation: " + generation);
  fitnessP.html("Average fitness: " + averageFitness);
  maxFitP.html("Maximum fitness: " + maxFitness);
  lifeP.html("Generation " + Math.floor(count / lifespan * 100) + "%" + " completed");

  if (count >= lifespan) {
    population.evaluate();
    population.selection();
    count = 0;
    generation++;
  }

  count++;

  fill(0, 255, 0);
  rect(rx, ry, rw, rh);
  ellipse(target.x, target.y, 16, 16);
}

function Population() {
  this.rockets = [];
  this.popsize = 25;
  this.matingpool = [];

  for (var i = 0; i < this.popsize; i++) {
    this.rockets[i] = new Rocket();
  }

  this.evaluate = function() {
    var maxfit = 0;
    averageFitness = 0;

    for (var i = 0; i < this.popsize; i++) {
      this.rockets[i].calcFitness();
      if (this.rockets[i].fitness > maxfit) {
        maxfit = this.rockets[i].fitness;       // get the maximum fitness
      }

      averageFitness += this.rockets[i].fitness;
    }
    averageFitness /= this.popsize;
    maxFitness = maxfit;

    console.log("Generation " + generation + " completed");

    for (var i = 0; i < this.popsize; i++) {    // normalize the fitnesses
      this.rockets[i].fitness /= maxfit;
    }

    this.matingpool = [];

    for (var i = 0; i < this.popsize; i++) {
      var n = this.rockets[i].fitness * 100;
      for (var j = 0; j < n; j++) {
        this.matingpool.push(this.rockets[i]);
      }
    }
  }

  this.selection = function() {
    var newRockets = [];
    for (var i = 0; i < this.rockets.length;i++) {
      var parentA = random(this.matingpool).dna;    // gets a random element from the matingpool array (this is a new p5 feature)
      var parentB = random(this.matingpool).dna;
      var child = parentA.crossover(parentB);
      child.mutation();
      newRockets[i] = new Rocket(child);
    }
    this.rockets = newRockets;
  }

  this.run = function() {
    for (var i = 0; i < this.popsize; i++) {
      this.rockets[i].update();
      this.rockets[i].show();
    }
  }
}

function DNA(genes) {
  if (genes) {
    this.genes = genes;
  } else {
    this.genes = [];
    for (var i = 0; i < lifespan; i++) {
      this.genes[i] = p5.Vector.random2D();
      this.genes[i].setMag(maxforce);
    }
  }

  this.crossover = function(partner) {
    var newgenes = [];
    var midpoint = floor(random(this.genes.length));
    for (var i = 0; i < this.genes.length; i++) {
      if (i > midpoint) {
        newgenes[i] = this.genes[i];
      } else {
        newgenes[i] = partner.genes[i];
      }
    }
    return new DNA(newgenes);
  }

  this.mutation = function() {
    for (var i = 0; i < this.genes.length; i++) {
      if (random(1) < 0.01) {
        this.genes[i] = p5.Vector.random2D();
        this.genes[i].setMag(maxforce);
      }
    }
  }
}

function Rocket(dna) {
  this.pos = createVector(width/2, height - 2);
  this.vel = createVector();
  this.acc = createVector();
  this.compcount = 0;
  this.compmult = comp_multiplier;
  this.completed = false;
  this.crashed = false;

  if (dna) {
    this.dna = dna;
  } else {
    this.dna = new DNA();
  }

  this.fitness = 0;

  this.applyForce = function(force) {
    this.acc.add(force);
  }

  this.calcFitness = function() {
    var d = dist(this.pos.x, this.pos.y, target.x, target.y);
    this.fitness = map(d, 0, width, width, 0);

    if (this.completed) {
      this.fitness *= this.compmult;
    }
    if (this.crashed) {
      this.fitness /= crash_divisor;
    }
  }

  this.update = function() {
    var d = dist(this.pos.x, this.pos.y, target.x, target.y);
    if (d < 10) {
      if (!this.completed) this.compcount = count;
      this.compmult = map(this.compcount, 0, lifespan, comp_multiplier, 2);
      this.completed = true;
      this.pos = target.copy();
    }

    if (this.pos.x > rx && this.pos.x < rx + rw && this.pos.y > ry && this.pos.y < ry + rh) { // obstacle
      this.crashed = true;
    }

    if (this.pos.x > width || this.pos.x < 0 || this.pos.y > height || this.pos.y < 0) {    // edge of the window
      this.crashed = true;
    }

    this.applyForce(this.dna.genes[count]);
    if (!this.completed && !this.crashed) {
      this.vel.add(this.acc);
      this.pos.add(this.vel);
      this.acc.mult(0);
    }
  }

  this.show = function() {
    push();
    noStroke();
    fill(0, 228, 0, 150);
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    rectMode(CENTER);
    rect(0, 0, 25, 5);
    pop();
  }
}
