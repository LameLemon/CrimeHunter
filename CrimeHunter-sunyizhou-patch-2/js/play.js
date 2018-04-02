
var k = 0; // k and m: Use counting instead of timing where the larger makes it rarely move
var m = 0;
var sound;  // Game music
var epsound; // Explosion sound
var gsound; // Shotgun sound

// levels: playerX, playerY, civY, lane1, lane2, lane3, lane4, civNumber, enemyNumber, enemyY, levelName, layerName, collision, boundsX, boundsY
var level0 = [300, 3150, 2900, 110, 180, 275, 335, 100, 1, 2900, 'level0', 'Tile Layer 1', [42, 43], 480, 3200];
var level1 = [300, 3600, 3350, 110, 180, 275, 335, 200, 2, 3350, 'level1', 'Tile Layer 1', [2, 3], 480, 3680];
var level2 = [300, 3950, 3700, 110, 180, 275, 335, 300, 3, 3750, 'level2', 'Tile Layer 1', [25], 480, 4000];

var lane = [];

var playState = {
		// Global variables declaration
    player: null,
    enemies: null,
    enemy: null,
    addhealth: null,
    curLevel: null,
    curLevelInt: null,
    noKills: null,
    healthbag: null,

		// Instantiate and assign game objects
    create: function () {
      this.curLevelInt = localStorage.getItem("level");

      if (this.curLevelInt == 0){
        this.curLevel = level0;
        this.curLevelInt = 0;
      } else if (this.curLevelInt == 1) {
        this.curLevel = level1;
        this.curLevelInt = 1;
      } else if (this.curLevelInt == 2) {
        this.curLevel = level2;
        this.curLevelInt = 2;
      }

      // World variables
      var playerX = this.curLevel[0];
      var playerY = this.curLevel[1];
      var civY = this.curLevel[2];
      var lane1 = this.curLevel[3];
      var lane2 = this.curLevel[4];
      var lane3 = this.curLevel[5];
      var lane4 = this.curLevel[6];
      var civNumber = this.curLevel[7];
      var enemyNumber = this.curLevel[8];
      var enemyY = this.curLevel[9];
      var levelName = this.curLevel[10];
      var layerName = this.curLevel[11];
      var collision = this.curLevel[12];
      var boundsX = this.curLevel[13];
      var boundsY = this.curLevel[14];

      //Tilemap
      var map = game.add.tilemap(levelName);
      map.addTilesetImage('Tileset_Master', 'tile_master')
      map.setCollision(collision);
      this.layer = map.createLayer(layerName);
      game.world.setBounds(0, 0, boundsX, boundsY);

      // Sound
      sound = game.add.audio('gmusic');
      //sound.play();
      epsound = game.add.audio('boom');
      gsound = game.add.audio('gunshot');

      this.player = new Player(playerX, playerY);

      game.camera.x = game.world.centerX;
      game.camera.y = game.world.centerY;
      game.physics.enable(this.player, Phaser.Physics.ARCADE);

      this.myHealthBar = new HealthBar(this.game, {x: 45, y: 20, height: 10, width: 80});
      this.myHealthBar.setBarColor('#ff1c1c');
      this.myHealthBar.setFixedToCamera(true);

      //Player weapon: hand gun
      this.handgun = game.add.weapon(7, 'bullet');    // ammo 7
      this.handgun.bulletAngleOffset = 90;
      this.handgun.bulletSpeed = 750;
      this.handgun.fireRate = 600;
      game.physics.arcade.enable(this.player);
      this.handgun.trackSprite(this.player, -2, -80);
      this.handgun.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS;
      fireButton = this.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

      // Player weapon: utlskill
      this.ultskill = game.add.weapon(7, 'ultskill');
      this.ultskill.bulletAngleOffset = 90;
      this.ultskill.bulletSpeed = 2000;
      this.ultskill.fireRate = 5000;
      this.ultskill.trackSprite(this.player, -2, -80);
      this.ultskill.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS;
      ultskillButton = this.input.keyboard.addKey(Phaser.KeyCode.Z);
      //ultskill cooldown shows
      //this.player.skillText = game.add.text(0, 50, "Unique skill : 1 hit / 8 sec  (press z)", { font: "20px", fill: "#ffffff", align: "centre" });
      //this.player.skillText.fixedToCamera = true;

      // this.addhealth = game.add.sprite(game.world.centerX+100, game.world.centerY+100, 'addhealth');
      // game.physics.enable(this.addhealth, Phaser.Physics.ARCADE);

      // Set player score to the latest score in array
      var myJSON = localStorage.getItem("highScore");
      var p = JSON.parse(myJSON);
      var curScore = p.shift();
      this.player.score = curScore;
      p.unshift(curScore);

      // Display player scor eon screen
      this.player.scoreText = game.add.text(3, 30, "Score " + this.player.score, { font: "20px", fill: "#ffffff", align: "centre" });
      this.player.scoreText.fixedToCamera = true;


      //HealthBag allow player recover health
        this.healthbag = game.add.group();

        this.healthbag.enableBody = true;

        this.healthbag.physicsBodyType = Phaser.Physics.ARCADE;

        var mx = game.width - game.cache.getImage('addhealth').width;
        var my = game.height - game.cache.getImage('addhealth').height;

        // add 1 health bag per level
        for (var i = 0; i < this.curLevelInt+1; i++)
        {
            // add health bag (left to right, start point to end point, bag picture)
         this.healthbag.create(Math.floor(Math.random()*lane2)+lane1 ,Math.floor(Math.random()*(this.player.y-500))+1000 , 'addhealth');

        }

        //Trap can damage player
        this.trap = game.add.group();

        this.trap.enableBody = true;

        this.trap.physicsBodyType = Phaser.Physics.ARCADE;


        // add 5 health bag per level
        for (var i = 0; i < this.curLevelInt+5; i++)
        {
            // add health bag (left to right, start point to end point, bag picture)
            this.trap.create(Math.floor(Math.random()*lane2)+lane1 ,Math.floor(Math.random()*(this.player.y))+1000 , 'addtrap');

        }



      // Enemy
      this.enemies = game.add.group();
      var y = enemyY;

    	var numberOfRandomCars = enemyNumber;
        var lanes = [lane1, lane2, lane3, lane4];
    	for (var i=0; i < numberOfRandomCars; i++) {
        var x = lanes[Math.floor(Math.random()*lanes.length)];
        this.enemies.add(Enemy(x,y));
        y -=150;
      }

      this.enemies.forEach(function(enemy, index){
        game.physics.enable(enemy,Phaser.Physics.ARCADE);
        enemy.body.immovable = true;
      });
      this.enemies.enableBody = true;

	    // Civil Cars (Random Cars)
      this.civils = game.add.group();
      addLanes([lane1, lane2, lane3, lane4]);     // Add an array of lanes to lane
    	this.civils.enableBody = true;


      var numberOfRandomCars = civNumber;
      var startingYAxis = civY;
      this.civils = addRandomCars(this.civils,numberOfRandomCars,startingYAxis);
      /* If you want to reset the random cars for every level, one suggestion is
      to use the following code in update: function() {}:

      addLanes([ list of lanes you want to set ]);
      this.civils = addRandomCars(this.civils, number Of RandomCars you want , starting Y-Axis of the first random car);
      */
    },  // create

    // Anything that needs to be checked, collisions, user input etc...
    update: function () {
      // Keyboard controls
      if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT) && game.input.keyboard.isDown(Phaser.Keyboard.UP)){
        this.player.setDest(this.player.x - 30, this.player.y - 30);
      }
      else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) && game.input.keyboard.isDown(Phaser.Keyboard.UP)){
        this.player.setDest(this.player.x + 30, this.player.y - 30);
      }
      else if (game.input.keyboard.isDown(Phaser.Keyboard.UP)){
        this.player.setDest(this.player.x, this.player.y - 38);
      }
      else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN) && game.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
        this.player.setDest(this.player.x - 25, this.player.y + 25);
      }
      else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN) && game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
        this.player.setDest(this.player.x + 25, this.player.y + 25);
      }
      else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)){
        this.player.setDest(this.player.x, this.player.y + 23);
      }

      if (fireButton.isDown){
        this.handgun.fire();
        this.player.animations.play('runningShoot');
        //gsound.play();
      }
      if (ultskillButton.isDown){
        this.ultskill.fire();
        this.player.animations.play('runningShoot');
        //gsound.play();
        }



      // Mouse contorls
      if (game.input.activePointer.isDown) {
        this.player.setDest(game.input.x, game.input.y);
      }

	    //Enemy update
      this.enemies.forEach(function(enemy, index){
        enemy.update();
      });

      this.player.update();


      /*
       1. Civil's Car Movement Update
	        the smaller k equal to, the higher frequency NPC movement can be

       2. If the player is within the range of NPC cars, the NPC cars need move away from the player.
          2.1 The player is inside range is when the player is (plyer.Y-Axis - 200 Y-Axis) away behind the NPC cars
              or (player.Y-Axis + 200 Y-Axis) in front of the NPC cars, and
              within X-Axis ranges of NPC cars in which the range of each NPC car is [car.x-30, car.x+30].
          2.2 Another condition of range is when the player is (plyer.Y-Axis - 100 Y-Axis) away behind the NPC cars
              or (player.Y-Axis + 100 Y-Axis) in front of the NPC cars,
              and the NPC cars need to switch lanes, if it needs to, on the X-Axis where if its X-Axis > player.x,
              it needs to switch lanes to the one where X-Axis is larger than player.x, and vice versa to avoid collision.
      */
      var temY = this.player.body.y;
      var temX = this.player.body.x;

      /* Random Lanes Assignment After the Time Interval
         We use 'k' counting as the timer where it assigns random lanes to each cars
         once k value is reached. Since update function() occurs approximately 60 times per second
         we can consider the time to be equal to k/60.
         So if k==300, it takes around 5 seconds to assign random lanes each time.
      */
      if (k==300) {
        this.civils.forEach(function(car){
          var moveOrNot = [false, true];
          var moveCar = moveOrNot[Math.floor(Math.random()*moveOrNot.length)];
          if (moveCar == true) {
              car.xDest = (lane)[Math.floor(Math.random()*(lane).length)];
          }
        });
        k = 0;
      }

      // The function that is implemented after Alpha Release
      // Described in 2. above
      this.civils.forEach(function(car){
        if (((car.y < temY) && (car.y >= temY-200)) || ((car.y >= temY) && (car.y <= temY+200))) {
          /* The NPC car need to move away if the player moves along the X-Axis of range [temX-30, temX+30]
             In this case, the player is either behind or in front of NPC car.
          */
          if ((car.xDest <= temX+30) && (car.xDest >= temX-30)) {
            while ((car.xDest <= temX+30) && (car.xDest >= temX-30)) {
              car.xDest = (lane)[Math.floor(Math.random()*(lane).length)];
            }
          }
          /* The NPC car need to stay on the right side if the player moves along the left side of its X-Axis,
              and it plans to move to the left.
          */
          else if (((car.y < temY) && (car.y >= temY-100)) || ((car.y >= temY) && (car.y <= temY+100))) {
            if ((car.xDest <= temX) && (car.body.x > temX)) {
              while ((car.xDest <= temX) && (car.body.x > temX)) {
                car.xDest = (lane)[Math.floor(Math.random()*(lane).length)];
              }
            }
            /* The NPC car need to stay on the left side if the player moves along the right side of its X-Axis,
                and it plans to move to the right.
            */
            else if ((car.xDest > temX) && (car.body.x <= temX)) {
              while ((car.xDest > temX) && (car.body.x <= temX)) {
                car.xDest = (lane)[Math.floor(Math.random()*(lane).length)];
              }
            }
          }
        }

        car.update();
      });

      k++;



		// enemy's Car Movement Update
		// the smaller m equal to , the higher frequency enemy movement can be

	    if (m==15) {         // Use counting instead of timing where the larger makes it rarely move
        this.enemies.forEach(function(enemy){
          var moving = [false, true];

          var moveEnemy = moving[Math.floor(Math.random()*moving.length)];
          if (moveEnemy == true) {
			    var lanes = [110, 180, 275, 325];
				if (lanes.includes(enemy.xDest)) {
              enemy.xDest = lanes[Math.floor(Math.random()*lanes.length)];
            }
		  }
          enemy.update();
        });
        m = 0;
      }
      m++;

      game.physics.arcade.collide(this.player, this.enemies, function(p,e){
        //console.log("crash! Player + Enemy");
        p.health = p.health - 5;
      });


        game.physics.arcade.overlap(this.healthbag,this.player,  function(b,e){

           // b.kill();
            this.player.health = 100;

        }, null, this);

        game.physics.arcade.overlap(this.trap,this.player,  function(b,e){

            // b.kill();
            this.player.health = this.player.health - 1;

        }, null, this);

      game.physics.arcade.overlap(this.handgun.bullets, this.enemies, function(b,e){
        //console.log("hit! Bullet + Enemy");
        //epsound.play();
        e.stop(this.player);
        b.kill();
        //this.enemies.kill();
        this.player.score = this.player.score + 5;
        this.player.scoreText.setText("Score " + this.player.score);
      }, null, this);

      game.physics.arcade.overlap(this.handgun.bullets, this.civils, function(b,c){
        //console.log("hit! Bullet + Civil");
        //epsound.play();
        c.kill();
        b.kill();
        this.player.score = this.player.score - 5;
        this.player.scoreText.setText("Score " + this.player.score);
      }, null, this);

      game.physics.arcade.overlap(this.ultskill.bullets, this.enemies, function(b,e){
        //console.log("hit! Bullet + Enemy");
        e.stop(this.player);
        b.kill();
        this.player.score = this.player.score + 5;
        this.player.scoreText.setText("Score " + this.player.score);
      }, null, this);


      game.physics.arcade.overlap(this.ultskill.bullets, this.civils, function(b,c){
        //console.log("hit! Bullet + Civil");
        c.kill();
        this.player.score = this.player.score - 5;
        this.player.scoreText.setText("Score " + this.player.score);
      }, null, this);


      game.physics.arcade.overlap(this.enemies, this.civils, function(e,c){
        //console.log("crash! Enemy + Civil");
        //epsound.play();
        c.kill();
      }, null, this);

      game.physics.arcade.overlap(this.player, this.civils, function(p,c){
        //console.log("crash! Player + Civil");
        //epsound.play();
        c.kill();
        p.health = p.health - 10;
      }, null, this);

      game.physics.arcade.collide(this.player, this.layer, function(p, l){
        p.stop();
        //console.log("side of road");
      });

      //updateScore(this.player);
      this.myHealthBar.setPercent(this.player.health)

      if (this.player.y < 100){
        nextLevel(this.player, this.curLevel[8], this.curLevelInt);
      } else if ((this.player.y > this.curLevel[14]) && (game.input.keyboard.isDown(Phaser.Keyboard.DOWN))) {
        this.player.stopY();
      }
    } // update
}; // playState

function render() {
  game.debug.spriteInfo(player, 20, 32);
  this.handgun.debug();
}

// Helper functions go below
function Player(x, y) {
  var player = game.add.sprite(x, y, 'characters');

  player.frame = 0;
  player.animations.add('runningShoot', [0, 1, 2, 3], 4);
  player.speed = 280;
  player.xDest = x;
  player.yDest = y;
  player.anchor.setTo(.5, 1);

  player.health = 100;
  player.healthText = null;

  player.score = 0;
  player.scoreText = null;

  player.kills= 0;

  player.setDest = function (x, y) {
    player.xDest = x;
    player.yDest = y;
  };

  player.update = function() {
    move(this);
    game.camera.x = this.x - 150;
    game.camera.y = this.y - 300;
    this.animations.play('runningShoot');
    if (player.health < 0){
      player.kill();
      condition = 2;
      game.state.start("preLevel");
    }
  };

  player.stop = function() {
    this.xDest = this.x;
  };

  player.stopY = function() {
    this.yDest = this.y;
  };

  return player;
};

function Enemy(x, y){
	var enemy = game.add.sprite(x, y, 'characters');
	enemy.frame = 4;

	enemy.xDest = x;
	enemy.yDest = -200;

	enemy.goToXY = function(x){
		enemy.xDest = x;
	}

	enemy.update= function(){
		this.speed = 260;
		// this.goToXY(this.x, this.y - 100);

		//enemy.body.velocity.y=-50;
		move(this);
	}
	enemy.stop = function(p){
		this.kill();
    p.kills = p.kills + 1;
	}

	return enemy;
}

function move(b){
  if (Math.floor(b.x / 10) == Math.floor(b.xDest / 10)) {
    b.body.velocity.x = 0;
  } else if (Math.floor(b.x) < Math.floor(b.xDest)) {
    b.body.velocity.x = b.speed;
  } else if (Math.floor(b.x) > Math.floor(b.xDest)) {
    b.body.velocity.x = -b.speed;
  }
  if (Math.floor(b.y / 10) == Math.floor(b.yDest / 10)) {
    b.body.velocity.y = 0;
  } else if (Math.floor(b.y) < Math.floor(b.yDest)) {
    b.body.velocity.y = b.speed;
  } else if (Math.floor(b.y) > Math.floor(b.yDest)) {
    b.body.velocity.y = -b.speed;
  }
}

function playerFrame(numB) {
  // control bullet bar
  var bulletBar = document.getElementsByClassName("numBullet");
  var bar = document.getElementsByClassName("nBullet");
  var barWidth = (numB / 1000) * 100;
  bar.css('width', barWidth + "%");
}

function updateScore(b) {
  console.log("UpdateScore");
  var myJSON = localStorage.getItem("highScore");
  var p = JSON.parse(myJSON);
  console.log("p " , p);
  // var sc = p.pop();
  // console.log(sc)
  p.shift();
  p.unshift(b.score);
  console.log(b.score);
  localStorage.setItem("highScore", JSON.stringify(p));
  console.log(localStorage.getItem("highScore"))
}


function nextLevel(player, noOfKills, curLevelInt){
  var level = 0;
  if (player.kills === noOfKills && curLevelInt <= 3) {

    console.log("UpdateScore");
    var myJSON = localStorage.getItem("highScore");
    var p = JSON.parse(myJSON);
    console.log("p " , p);
    // var sc = p.pop();
    // console.log(sc)
    p.shift();
    p.unshift(player.score);
    console.log(player.score);
    localStorage.setItem("highScore", JSON.stringify(p));
    console.log(localStorage.getItem("highScore"))

    level = curLevelInt + 1;
    localStorage.setItem("level", parseInt(level));
    condition = 1;
  } else if (level > 2) {
    condition = 0;
    localStorage.setItem("level", 0);
  } else {
    condition = 3;
    localStorage.setItem("level", curLevelInt);
  }
  //console.log(localStorage.getItem("level"));
  //updateScore(player);

  // console.log("UpdateScore");
  // var myJSON = localStorage.getItem("highScore");
  // var p = JSON.parse(myJSON);
  // console.log("p " , p);
  // // var sc = p.pop();
  // // console.log(sc)
  // p.pop();
  // p.push(b.score);
  // console.log(b.score);
  // localStorage.setItem("highScore", JSON.stringify(p));
  // console.log(localStorage.getItem("highScore"))
  game.state.start("preLevel");

}



function addLanes(listOfLanes) {
  if (lane == []) {         // if no lane has been assigned, assign listOfLanes to it
    lane = listOfLanes;
  } else {
    for (var i=0; i<listOfLanes.length; i++) {
      if (!(lane.includes(listOfLanes[i]))) {   // add only the non-assigned element to lane
        lane.push(listOfLanes[i]);
      }
    }
  }
}

function addRandomCars(civils, numberOfRandomCars, y) {
  for (var i=0; i < numberOfRandomCars; i++) {
    var x = (lane)[Math.floor(Math.random()*(lane).length)];
    var car = civils.create(x, y, 'characters');
    car.xDest = x;
    car.yDest = -200;
    car.update = function() {
      this.speed = 50;
      move(this);
    };
    car.frame = 6;
    y -= 150;
  }
  return civils;
}
