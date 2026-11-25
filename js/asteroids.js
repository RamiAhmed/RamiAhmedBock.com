// Background mini-game: hold the mouse (or a finger) down to shoot at the falling squares.
document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("background-canvas");
    const ctx = canvas.getContext('2d');

    // Colour of everything the game draws; must stay readable on the page background in css/site.css.
    const inkColor = 'rgb(220, 220, 220)';

    // Mouse
    canvas.onmouseup = onMouseUp;
    canvas.onmousedown = onMouseDown;
    canvas.onmousemove = onMouseMove;

    // Touch: aim at the finger as soon as it touches down, not only once it moves.
    canvas.ontouchstart = function (evt) {
        aimAtTouch(evt);
        onMouseDown(evt);
    };
    canvas.ontouchend = onMouseUp;
    canvas.ontouchmove = aimAtTouch;

    function aimAtTouch(evt) {
        const touch = evt.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });

        canvas.dispatchEvent(mouseEvent);
    }

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    if (canvas.getContext) {
        runGame();
    }
    else {
        alert("Your browser does not support HTML5. Please upgrade or use a different browser.");
    }

    /* Types */

    let gameEnd = false;

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
            const length = Math.sqrt(this.x * this.x + this.y * this.y);
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
            ctx.fillStyle = inkColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        die(bullets) {
            const index = bullets.indexOf(this);
            bullets.splice(index, 1);
        }

        tick(bullets) {
            const velocity = this.direction.multiply(this.speed);
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
            ctx.fillStyle = inkColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        die(aliens) {
            const index = aliens.indexOf(this);
            aliens.splice(index, 1);
            //console.log("alien die");
        }

        tick(_) {
            this.y += this.speed;

            if (this.y > height) {
                gameEnd = true;
                //console.log("game over");
            }

            //console.log("alien pos: " + this.position.x  + ", " + this.position.y);
        }
    }

    /* Mechanics */

    let width = canvas.width;
    let height = canvas.height;

    let cursor = new Vector2(0, 0);
    let mouseDown = false;

    let bullets = [];
    let aliens = [];
    let frame = 0;

    const tankSize = 25;
    let tankPosition = new Vector2(width * 0.5, height - tankSize - 10);

    let aliensKilled = 0;

    function runGame() {
        const framesPerSecond = 60;
        setInterval(update, 1000 / framesPerSecond);
    }

    function update() {
        ctx.clearRect(0, 0, width, height);

        if (gameEnd) {
            const x = width * 0.5;
            let y = height * 0.5;
            ctx.textAlign = "center";
            ctx.font = "14px Arial";
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
        ctx.fillStyle = inkColor;
        ctx.fillRect(tankPosition.x, tankPosition.y, tankSize, tankSize);
        drawBarrel();

        ctx.textAlign = "left";
        ctx.font = "14px Arial";
        ctx.fillText("Frame: " + frame + " | Killed: " + aliensKilled, 5, height - 5);

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

    let alienSpeed = alienSpeedStart;
    let alienSpawnRate = alienSpawnStart;
    let alienSize = 8;

    let nextSpawn = 0;

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

        const pos = new Vector2(alienSize + (Math.random() * (width - alienSize * 2)), 0);
        const alien = new Alien(pos, alienSize, alienSize, alienSpeed);
        aliens.push(alien);
    }

    /* BULLETS */

    const bulletSpeed = 3;
    const bulletSize = 4;
    // Attack speed grows with the kill count, so the player keeps up as aliens fall faster.
    // Frames between shots: starts at fireIntervalStart and drops by fireIntervalPerKill
    // for each kill, down to fireIntervalMin (30 -> 8 frames takes 87 kills).
    const fireIntervalStart = 30;
    const fireIntervalPerKill = 0.25;
    const fireIntervalMin = 8;
    let nextFire = 0;
    let fireOrigin = tankPosition.add(new Vector2(tankSize * 0.5, 0));

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

        nextFire = frame + fireInterval();

        const direction = cursor.subtract(fireOrigin);
        const bullet = new Bullet(fireOrigin, bulletSize, bulletSize, direction, bulletSpeed);
        bullets.push(bullet);
    }

    function fireInterval() {
        return Math.round(Math.max(fireIntervalMin, fireIntervalStart - aliensKilled * fireIntervalPerKill));
    }

    // Barrel on top of the tank, always pointing at the cursor/finger so the player can aim before shooting.
    const barrelLength = 20;

    function drawBarrel() {
        const toCursor = cursor.subtract(fireOrigin);
        if (toCursor.x === 0 && toCursor.y === 0) {
            return; // cursor exactly on the barrel's base: no direction to point in
        }

        const tip = fireOrigin.add(toCursor.normalize().multiply(barrelLength));
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = bulletSize;
        ctx.beginPath();
        ctx.moveTo(fireOrigin.x, fireOrigin.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();
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
        const mousePos = getMousePos(canvas, evt);
        cursor.x = mousePos.x;
        cursor.y = mousePos.y;
        //console.log("mouse move");
    }

    function onMouseDown(_) {
        mouseDown = true;
        //console.log("mouse down");
    }

    function onMouseUp(_) {
        mouseDown = false;
        //console.log("mouse up");
    }
    
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return new Vector2(
            (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    }
    
    resizeCanvas();
});