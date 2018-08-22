$(function () {
    var canvas = document.getElementById("background-canvas");
    var ctx = canvas.getContext('2d');

    // Mouse
    canvas.onmouseup = onMouseUp;
    canvas.onmousedown = onMouseDown;
    canvas.onmousemove = onMouseMove;

    // Touch
    canvas.ontouchstart = onMouseDown;
    canvas.ontouchend = onMouseUp;
    canvas.ontouchmove = onMouseMove;

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    if (canvas.getContext) {
        runGame();
    }
    else {
        alert("need HTMl5 plx");
    }

    /* Types */

    var gameEnd = false;

    class Vector2 {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        subtract(pos) {
            return new Vector2(this.x - pos.x, this.y - pos.y);
        }

        add(pos) {
            return new Vector2(this.x + pos.x, this.y + pos.y);
        }

        multiply(factor) {
            return new Vector2(this.x * factor, this.y * factor);
        }

        normalize() {
            var length = Math.sqrt(this.x * this.x + this.y * this.y);
            return new Vector2(this.x / length, this.y / length);
        }
    }

    class Rectangle extends Vector2 {
        constructor(x, y, width, height) {
            super(x, y);
            this.width = width;
            this.height = height;
        }

        get left() { return this.x; }

        get right() { return this.x + this.width; }

        get bottom() { return this.y; }

        get top() { return this.y + this.height; }

        get position() { return new Vector2(this.x, this.y); }
        set position(pos) { this.x = pos.x; this.y = pos.y; }

        intersects(other) {
            return !(other.left > this.right ||
                    other.right < this.left ||
                    other.top < this.bottom ||
                    other.bottom > this.top);
        }
    }

    class Bullet extends Rectangle {
        constructor(pos, width, height, direction, speed) {
            super(pos.x, pos.y, width, height);
            this.direction = direction.normalize();
            this.speed = speed;

            //console.log("bullet lives at: " + this.x + ", " + this.y + ", direction: " + direction.x + ", " + direction.y + ", speed: " + this.speed);
        }

        draw(ctx) {
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        die(bullets) {
            var index = bullets.indexOf(this);
            bullets.splice(index, 1);
        }

        tick(bullets) {
            var velocity = this.direction.multiply(this.speed);
            this.position = this.position.add(velocity);

            if (this.y < 0 || this.x < 0 || this.x > width) {
                this.die(bullets);
            }

            //console.log("tick, bullet at: " + this.x + ", " + this.y);
        }
    }

    class Alien extends Rectangle {
        constructor(pos, width, height, speed) {
            super(pos.x, pos.y, width, height);
            this.speed = speed;
        }

        draw(ctx) {
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        die(aliens) {
            var index = aliens.indexOf(this);
            aliens.splice(index, 1);
            //console.log("alien die");
            logEvent("Alien Death");
        }

        tick(aliens) {
            this.y += this.speed;

            if (this.y > height) {
                gameEnd = true;
                //console.log("game over");
            }

            //console.log("alien pos: " + this.position.x  + ", " + this.position.y);
        }
    }

    /* Mechanics */

    var width = canvas.width;
    var height = canvas.height;

    var cursor = new Vector2(0, 0);
    var mouseDown = false;

    var bullets = [];
    var aliens = [];
    var frame = 0;

    const tankSize = 25;
    var tankPosition = new Vector2(width * 0.5, height - tankSize - 10);

    var aliensKilled = 0;

    function runGame() {
        const framesPerSecond = 60;
        setInterval(update, 1000 / framesPerSecond);
        logEvent("Game Loaded");
    }

    function update() {
        ctx.clearRect(0, 0, width, height);

        if (gameEnd) {
            var x = width * 0.5;
            var y = height * 0.5;
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER!", x, y);
            y += 20;
            ctx.fillText("Killed: " + aliensKilled, x, y);
            y += 20;
            ctx.fillText("Click to restart", x, y);

            if (mouseDown) {
                resetGame();
            }

            return;
        }

        // Player tank
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(tankPosition.x, tankPosition.y, tankSize, tankSize);

        ctx.textAlign = "left";
        ctx.fillText("Frame: " + frame + " | Killed: " + aliensKilled, 2, height - 2);

        if (mouseDown) {
            fireBullet();
        }

        checkIntersections(bullets, aliens);
        tickBullets(ctx);
        tickAliens(ctx);
        frame++;
    }

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;

        tankPosition = new Vector2(width * 0.5, height - tankSize - 10);
        fireOrigin = tankPosition.add(new Vector2(tankSize * 0.5, 0));

        /**
         * Your drawings need to be inside this function otherwise they will be reset when 
         * you resize the browser window and the canvas goes will be cleared.
         */
        update();
    }

    /* ALIENS */

    const alienSpeedStart = 0.2;
    const alienSpawnStart = 200;
    const alienSpeedGain = 0.00001;
    const alienSpawnGain = 0.00001;
    const alienMaxSpeed = 40;

    var alienSpeed = alienSpeedStart;
    var alienSpawnRate = alienSpawnStart;
    var alienSize = 8;

    var nextSpawn = 0;

    function tickAliens(ctx) {
        aliens.forEach(function (alien) {
            alien.draw(ctx);
            alien.tick(aliens);
        });

        if (frame < nextSpawn) {
            return;
        }

        nextSpawn = frame + alienSpawnRate;

        alienSpawnRate = Math.max(1, alienSpawnStart - frame * alienSpawnGain);
        alienSpeed = Math.min(alienMaxSpeed, alienSpeedStart + frame * alienSpeedGain);

        var pos = new Vector2(alienSize + (Math.random() * (width - alienSize * 2)), 0);
        var alien = new Alien(pos, alienSize, alienSize, alienSpeed);
        aliens.push(alien);
    }

    /* BULLETS */

    const bulletSpeed = 3;
    const bulletSize = 4;
    const fireRate = 30; // every 30th frame
    var nextFire = 0;
    var fireOrigin = tankPosition.add(new Vector2(tankSize * 0.5, 0));

    function tickBullets(ctx) {
        bullets.forEach(function (bullet) {
            bullet.draw(ctx);
            bullet.tick(bullets);
        });
    }

    function fireBullet() {
        if (frame < nextFire) {
            return;
        }

        nextFire = frame + fireRate;

        var direction = cursor.subtract(fireOrigin);
        var bullet = new Bullet(fireOrigin, bulletSize, bulletSize, direction, bulletSpeed);
        bullets.push(bullet);
    }

    /* Collision Detection */

    function checkIntersections(bullets, aliens) {
        bullets.forEach(function (bullet) {
            aliens.forEach(function (alien) {
                if (bullet.intersects(alien)) {
                    alien.die(aliens);
                    bullet.die(bullets);
                    aliensKilled++;
                }
            });
        });
    }

    function resetGame() {
        logEvent("Reset Game");
        gameEnd = false;
        aliensKilled = 0;
        frame = 0;
        bullets = [];
        aliens = [];
        nextSpawn = 0;
        nextFire = 0;
    }

    /* MOUSE */

    function onMouseMove(evt) {
        var mousePos = getMousePos(canvas, evt);
        cursor.x = mousePos.x;
        cursor.y = mousePos.y;
        //console.log("mouse move");
    }

    function onMouseDown(evt) {
        mouseDown = true;
        //console.log("mouse down");
    }

    function onMouseUp(evt) {
        mouseDown = false;
        //console.log("mouse up");
    }
    
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return new Vector2(
            (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    }

    function logEvent(eventName) {
        gtag('event', 'game', {
            'event_category': eventName
        });
    }

    resizeCanvas();
});