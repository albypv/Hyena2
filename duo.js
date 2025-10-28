// Grab elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const winnerTextEl = document.getElementById('winnerText');
const restartBtn = document.getElementById('restartBtn');

// Left player image & bullet
const leftPlayerImg = new Image();
leftPlayerImg.src = 'assets/hyena.png';

const leftBulletImg = new Image();
leftBulletImg.src = 'assets/berry.jpg';

// Right player image & bullet
let rightPlayerImg = null;
const rightBulletImg = new Image();

// Game state
let bullets = [];
let bulletTrails = [];
let explosions = [];
let gameRunning = false;
let keys = {};

// Players
let playerLeft, playerRight;
const shootCooldown = 300;

// --------------------- Key Listeners ---------------------
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// ---------------- Character → Bullet mapping ----------------
function getBulletForCharacter(characterSrc) {
    if (characterSrc.includes('gandhi.jpg')) return 'assets/loom.jpg';
    if (characterSrc.includes('oochi.jpeg')) return 'assets/star.jpg';
    if (characterSrc.includes('zen.png')) return 'assets/burger.jpg';
    return 'assets/burger.jpg';
}

// ---------------- Character Selection ----------------
document.querySelectorAll('.char-option').forEach(opt => {
    opt.addEventListener('click', () => {
        const imgElement = opt.querySelector('img');
        const chosenSrc = imgElement.src;

        rightPlayerImg = new Image();
        rightPlayerImg.src = chosenSrc;

        // Wait for image to load before starting game
        rightPlayerImg.onload = () => {
            rightBulletImg.src = getBulletForCharacter(chosenSrc);

            startScreen.style.display = 'none';
            canvas.style.display = 'block';

            initGame();
            gameRunning = true;
            update();
        };
    });
});

// ---------------- Restart Button ----------------
restartBtn.addEventListener('click', () => {
    gameRunning = false;

    // Reset everything
    bullets = [];
    bulletTrails = [];
    explosions = [];
    keys = {};
    playerLeft = null;
    playerRight = null;
    rightPlayerImg = null;
    rightBulletImg.src = '';

    gameOverScreen.style.display = 'none';
    canvas.style.display = 'none';
    startScreen.style.display = 'flex';
});

// ---------------- Initialize Game ----------------
function initGame() {
    playerLeft = { x: 50, y: 180, width: 90, height: 150, health: 30, canShoot: true, lastShot: 0 };
    playerRight = { x: 660, y: 180, width: 50, height: 50, health: 30, canShoot: true, lastShot: 0 };
}

// ---------------- Shooting ----------------
function shoot(player, direction, from) {
    bullets.push({
        x: player.x + (direction > 0 ? player.width : -20),
        y: player.y + player.height / 2 - 10,
        width: 40,
        height: 40,
        speed: 5 * direction,
        from: from
    });
}

// ---------------- Game Loop ----------------
function update() {
    if (!gameRunning) return;

    const now = Date.now();

    // Movement
    if (keys['w'] && playerLeft.y > 0) playerLeft.y -= 4;
    if (keys['s'] && playerLeft.y + playerLeft.height < canvas.height) playerLeft.y += 4;
    if (keys['ArrowUp'] && playerRight.y > 0) playerRight.y -= 4;
    if (keys['ArrowDown'] && playerRight.y + playerRight.height < canvas.height) playerRight.y += 4;

    // Shooting
    if (keys['d'] && playerLeft.canShoot) { shoot(playerLeft, 1, 'left'); playerLeft.canShoot = false; playerLeft.lastShot = now; }
    if (keys['ArrowLeft'] && playerRight.canShoot) { shoot(playerRight, -1, 'right'); playerRight.canShoot = false; playerRight.lastShot = now; }

    if (!playerLeft.canShoot && now - playerLeft.lastShot >= shootCooldown) playerLeft.canShoot = true;
    if (!playerRight.canShoot && now - playerRight.lastShot >= shootCooldown) playerRight.canShoot = true;

    // Update bullets
    for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i];
        b.x += b.speed;

        // Bullet trail
        bulletTrails.push({ x: b.x, y: b.y + b.height / 2, alpha: 0.5, radius: 6 });

        // Remove bullets outside canvas
        if (b.x < 0 || b.x > canvas.width) { bullets.splice(i, 1); i--; continue; }

        // Player collisions
        if (b.from === 'left' && b.x < playerRight.x + playerRight.width && b.x + b.width > playerRight.x &&
            b.y < playerRight.y + playerRight.height && b.y + b.height > playerRight.y) {
            playerRight.health -= 10; bullets.splice(i, 1); i--; continue;
        }
        if (b.from === 'right' && b.x < playerLeft.x + playerLeft.width && b.x + b.width > playerLeft.x &&
            b.y < playerLeft.y + playerLeft.height && b.y + b.height > playerLeft.y) {
            playerLeft.health -= 10; bullets.splice(i, 1); i--; continue;
        }

        // Bullet clash
        for (let j = i + 1; j < bullets.length; j++) {
            const other = bullets[j];
            if (b.from !== other.from && b.x < other.x + other.width && b.x + b.width > other.x &&
                b.y < other.y + other.height && b.y + b.height > other.y) {
                explosions.push({ x: (b.x + other.x)/2, y: (b.y + other.y)/2, radius: 15, duration: 12 });
                bullets.splice(j, 1);
                bullets.splice(i, 1);
                i--; break;
            }
        }
    }

    draw();

    // Check game over
    if (playerLeft.health <= 0 || playerRight.health <= 0) {
        gameRunning = false;
        const winner = playerLeft.health <= 0 ? 'World Peace Achieved' : 'Fruity RULEZ!';
        endGame(winner);
    } else {
        requestAnimationFrame(update);
    }
}

// ---------------- Draw Function ----------------
function draw() {
    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#0a0a0a');
    bgGradient.addColorStop(1, '#222');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Players
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff5722';
    ctx.drawImage(leftPlayerImg, playerLeft.x, playerLeft.y, playerLeft.width, playerLeft.height);
    ctx.shadowColor = '#00bcd4';
    ctx.drawImage(rightPlayerImg, playerRight.x, playerRight.y, playerRight.width, playerRight.height);
    ctx.shadowBlur = 0;

    // Bullets
    bullets.forEach(b => {
        if (b.from === 'left') ctx.drawImage(leftBulletImg, b.x, b.y, b.width, b.height);
        else ctx.drawImage(rightBulletImg, b.x, b.y, b.width, b.height);
    });

    // Bullet trails
    for (let i = 0; i < bulletTrails.length; i++) {
        const t = bulletTrails[i];
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,0,${t.alpha})`;
        ctx.fill();
        ctx.closePath();
        t.alpha -= 0.03;
        if (t.alpha <= 0) bulletTrails.splice(i, 1);
    }

    // Explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,165,0,${exp.duration/12})`;
        ctx.fill();
        ctx.closePath();
        exp.duration--;
        if (exp.duration <= 0) explosions.splice(i, 1);
    }

    // Health bars
    const leftGradient = ctx.createLinearGradient(20,20,playerLeft.health*2+20,20);
    leftGradient.addColorStop(0,'lime'); leftGradient.addColorStop(1,'green');
    ctx.fillStyle = leftGradient; ctx.fillRect(20, 20, playerLeft.health * 2, 10);

    const rightGradient = ctx.createLinearGradient(560,20,560+playerRight.health*2,20);
    rightGradient.addColorStop(0,'red'); rightGradient.addColorStop(1,'darkred');
    ctx.fillStyle = rightGradient; ctx.fillRect(560, 20, playerRight.health * 2, 10);

    // Labels
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Fruity Tyrant', 20, 15);
    ctx.fillText('SAVIOUR', 560, 15);
}

// ---------------- End Game ----------------
function endGame(winnerText) {
    canvas.style.display = 'none';
    winnerTextEl.textContent = winnerText;
    gameOverScreen.style.display = 'flex';
}

// ---------------- Hide canvas & gameOver on page load ----------------
window.onload = () => {
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'none';
};
