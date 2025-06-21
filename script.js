document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const startScreen = document.querySelector('.start-screen');
    const gameScreen = document.querySelector('.game-screen');
    const gameOverScreen = document.querySelector('.game-over-screen');
    const bird = document.querySelector('.bird-game');
    const pipesContainer = document.querySelector('.pipes');
    const ground = document.querySelector('.ground');
    const currentScoreDisplay = document.querySelector('.current-score');
    const finalScoreDisplay = document.querySelector('.score-value');
    const bestScoreDisplay = document.querySelector('.best-value');
    const tryAgainBtn = document.querySelector('.try-again-btn');
    const top1Display = document.querySelector('.top1');
    const top2Display = document.querySelector('.top2');
    const top3Display = document.querySelector('.top3');
    const medal = document.querySelector('.medal');
    const particlesContainer = document.querySelector('.particles');
    
    // Audio elements
    const flapSound = document.getElementById('flapSound');
    const hitSound = document.getElementById('hitSound');
    const pointSound = document.getElementById('pointSound');
    
    // Game variables
    let gameIsRunning = false;
    let birdPosition = 250;
    let birdVelocity = 0;
    let gravity = 0.5;
    let jumpForce = -10;
    let pipes = [];
    let gameSpeed = 2;
    let score = 0;
    let bestScores = [0, 0, 0];
    let gameAreaWidth = 400;
    let gameAreaHeight = 600;
    let pipeGap = 180;
    let pipeFrequency = 1500; // ms
    let lastPipeTime = 0;
    let animationId;
    let groundOffset = 0;
    let gameStartTime;
    
    // Load best scores from localStorage
    loadBestScores();
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    gameScreen.addEventListener('click', handleJump);
    tryAgainBtn.addEventListener('click', restartGame);
    
    // Start screen animation
    createParticles();
    
    function handleKeyDown(e) {
        if (e.code === 'Space') {
            if (!gameIsRunning && startScreen.style.display !== 'none') {
                startGame();
            } else if (gameIsRunning) {
                handleJump();
            } else if (!gameIsRunning && gameOverScreen.style.display === 'flex') {
                restartGame();
            }
        }
    }
    
    function handleJump() {
        if (!gameIsRunning) return;
        
        birdVelocity = jumpForce;
        flapSound.currentTime = 0;
        flapSound.play();
        
        // Add jump animation
        bird.style.transform = 'rotate(-30deg)';
        setTimeout(() => {
            bird.style.transform = 'rotate(0deg)';
        }, 300);
        
        // Create jump particles
        createJumpParticles();
    }
    
    function startGame() {
        // Hide start screen, show game screen
        startScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        
        // Reset game state
        resetGame();
        gameIsRunning = true;
        gameStartTime = Date.now();
        
        // Start game loop
        gameLoop();
    }
    
    function resetGame() {
        // Reset bird position
        birdPosition = 250;
        bird.style.top = `${birdPosition}px`;
        bird.style.left = '50px';
        birdVelocity = 0;
        
        // Reset pipes
        pipesContainer.innerHTML = '';
        pipes = [];
        
        // Reset score
        score = 0;
        currentScoreDisplay.textContent = '0';
        
        // Reset ground
        groundOffset = 0;
        ground.style.backgroundPositionX = '0px';
    }
    
    function gameLoop() {
        if (!gameIsRunning) return;
        
        // Update bird position
        birdVelocity += gravity;
        birdPosition += birdVelocity;
        bird.style.top = `${birdPosition}px`;
        
        // Rotate bird based on velocity
        const rotation = Math.min(Math.max(birdVelocity * 3, -30), 90);
        bird.style.transform = `rotate(${rotation}deg)`;
        
        // Generate pipes
        const currentTime = Date.now();
        if (currentTime - lastPipeTime > pipeFrequency) {
            createPipe();
            lastPipeTime = currentTime;
        }
        
        // Move pipes
        movePipes();
        
        // Move ground
        groundOffset -= gameSpeed;
        ground.style.backgroundPositionX = `${groundOffset}px`;
        
        // Check collisions
        if (checkCollisions()) {
            gameOver();
            return;
        }
        
        // Continue game loop
        animationId = requestAnimationFrame(gameLoop);
    }
    
    function createPipe() {
        // Random gap position
        const gapPosition = Math.random() * (gameAreaHeight - pipeGap - 200) + 100;
        
        // Create top pipe
        const topPipe = document.createElement('div');
        topPipe.className = 'pipe pipe-top';
        topPipe.style.height = `${gapPosition}px`;
        topPipe.style.left = `${gameAreaWidth}px`;
        
        // Add cap to top pipe
        const topCap = document.createElement('div');
        topCap.className = 'pipe-cap';
        topPipe.appendChild(topCap);
        
        // Create bottom pipe
        const bottomPipe = document.createElement('div');
        bottomPipe.className = 'pipe pipe-bottom';
        bottomPipe.style.height = `${gameAreaHeight - gapPosition - pipeGap - 60}px`;
        bottomPipe.style.left = `${gameAreaWidth}px`;
        
        // Add cap to bottom pipe
        const bottomCap = document.createElement('div');
        bottomCap.className = 'pipe-cap';
        bottomPipe.appendChild(bottomCap);
        
        // Add pipes to DOM and array
        pipesContainer.appendChild(topPipe);
        pipesContainer.appendChild(bottomPipe);
        pipes.push({
            element: topPipe,
            x: gameAreaWidth,
            height: gapPosition,
            top: true,
            passed: false
        });
        pipes.push({
            element: bottomPipe,
            x: gameAreaWidth,
            height: gameAreaHeight - gapPosition - pipeGap - 60,
            top: false,
            passed: false
        });
        
        // Add pipe creation particles
        createPipeParticles(gameAreaWidth, gapPosition);
    }
    
    function movePipes() {
        for (let i = pipes.length - 1; i >= 0; i--) {
            const pipe = pipes[i];
            pipe.x -= gameSpeed;
            pipe.element.style.left = `${pipe.x}px`;
            
            // Check if pipe is passed by bird
            if (!pipe.passed && pipe.x < 50 && pipe.top) {
                pipe.passed = true;
                score++;
                currentScoreDisplay.textContent = score;
                pointSound.currentTime = 0;
                pointSound.play();
                
                // Create score particles
                createScoreParticles();
                
                // Increase difficulty
                if (score % 5 === 0) {
                    gameSpeed += 0.2;
                    pipeFrequency = Math.max(800, pipeFrequency - 50);
                }
            }
            
            // Remove pipes that are off screen
            if (pipe.x < -60) {
                pipes.splice(i, 1);
                pipe.element.remove();
            }
        }
    }
    
    function checkCollisions() {
        // Check if bird hits ground or ceiling
        if (birdPosition > gameAreaHeight - 60 - 40 || birdPosition < 0) {
            return true;
        }
        
        // Check pipe collisions
        const birdRect = {
            x: 50,
            y: birdPosition,
            width: 40,
            height: 40
        };
        
        for (const pipe of pipes) {
            const pipeRect = {
                x: pipe.x,
                y: pipe.top ? 0 : gameAreaHeight - pipe.height - 60,
                width: 60,
                height: pipe.height
            };
            
            if (
                birdRect.x < pipeRect.x + pipeRect.width &&
                birdRect.x + birdRect.width > pipeRect.x &&
                birdRect.y < pipeRect.y + pipeRect.height &&
                birdRect.y + birdRect.height > pipeRect.y
            ) {
                return true;
            }
        }
        
        return false;
    }
    
    function gameOver() {
        gameIsRunning = false;
        cancelAnimationFrame(animationId);
        
        // Play hit sound
        hitSound.play();
        
        // Add death animation
        bird.style.transform = 'rotate(90deg)';
        
        // Show game over screen
        setTimeout(() => {
            gameScreen.style.display = 'none';
            gameOverScreen.style.display = 'flex';
            
            // Update scores
            finalScoreDisplay.textContent = score;
            updateBestScores(score);
            bestScoreDisplay.textContent = bestScores[0];
            
            // Show medal based on score
            showMedal(score);
            
            // Create explosion particles
            createExplosionParticles();
        }, 500);
    }
    
    function restartGame() {
        gameOverScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        startGame();
    }
    
    function updateBestScores(newScore) {
        if (newScore > bestScores[0]) {
            bestScores[2] = bestScores[1];
            bestScores[1] = bestScores[0];
            bestScores[0] = newScore;
        } else if (newScore > bestScores[1]) {
            bestScores[2] = bestScores[1];
            bestScores[1] = newScore;
        } else if (newScore > bestScores[2]) {
            bestScores[2] = newScore;
        }
        
        // Update displays
        top1Display.textContent = bestScores[0];
        top2Display.textContent = bestScores[1];
        top3Display.textContent = bestScores[2];
        
        // Save to localStorage
        localStorage.setItem('flappyBirdBestScores', JSON.stringify(bestScores));
    }
    
    function loadBestScores() {
        const savedScores = localStorage.getItem('flappyBirdBestScores');
        if (savedScores) {
            bestScores = JSON.parse(savedScores);
            top1Display.textContent = bestScores[0];
            top2Display.textContent = bestScores[1];
            top3Display.textContent = bestScores[2];
        }
    }
    
    function showMedal(score) {
        medal.textContent = '';
        medal.style.background = '';
        
        if (score >= 50) {
            medal.textContent = '🏆';
            medal.style.background = 'radial-gradient(circle at 30% 30%, #FFD700, #C0C0C0)';
        } else if (score >= 30) {
            medal.textContent = '🥇';
            medal.style.background = 'radial-gradient(circle at 30% 30%, #FFD700, #FFA500)';
        } else if (score >= 20) {
            medal.textContent = '🥈';
            medal.style.background = 'radial-gradient(circle at 30% 30%, #C0C0C0, #A9A9A9)';
        } else if (score >= 10) {
            medal.textContent = '🥉';
            medal.style.background = 'radial-gradient(circle at 30% 30%, #CD7F32, #A67C52)';
        } else {
            medal.style.display = 'none';
        }
    }
    
    // Particle effects
    function createParticles() {
        for (let i = 0; i < 50; i++) {
            createParticle(
                Math.random() * gameAreaWidth,
                Math.random() * gameAreaHeight,
                Math.random() * 4 + 1,
                Math.random() * 360,
                `hsl(${Math.random() * 60 + 180}, 70%, 70%)`,
                Math.random() * 10 + 5
            );
        }
    }
    
    function createJumpParticles() {
        const birdRect = bird.getBoundingClientRect();
        const x = birdRect.left + birdRect.width / 2;
        const y = birdRect.top + birdRect.height;
        
        for (let i = 0; i < 15; i++) {
            createParticle(
                x,
                y,
                Math.random() * 3 + 2,
                Math.random() * 60 + 240,
                `hsl(${Math.random() * 30 + 40}, 100%, 70%)`,
                Math.random() * 3 + 2,
                true
            );
        }
    }
    
    function createPipeParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            createParticle(
                x,
                y + pipeGap / 2,
                Math.random() * 4 + 2,
                Math.random() * 360,
                `hsl(${Math.random() * 60 + 100}, 70%, 60%)`,
                Math.random() * 4 + 2,
                true
            );
        }
    }
    
    function createScoreParticles() {
        const scoreRect = currentScoreDisplay.getBoundingClientRect();
        const x = scoreRect.left + scoreRect.width / 2;
        const y = scoreRect.top + scoreRect.height / 2;
        
        for (let i = 0; i < 10; i++) {
            createParticle(
                x,
                y,
                Math.random() * 5 + 3,
                Math.random() * 360,
                `hsl(${Math.random() * 60 + 50}, 100%, 70%)`,
                Math.random() * 4 + 2,
                true
            );
        }
    }
    
    function createExplosionParticles() {
        const birdRect = bird.getBoundingClientRect();
        const x = birdRect.left + birdRect.width / 2;
        const y = birdRect.top + birdRect.height / 2;
        
        for (let i = 0; i < 30; i++) {
            createParticle(
                x,
                y,
                Math.random() * 8 + 4,
                Math.random() * 360,
                `hsl(${Math.random() * 30 + 10}, 100%, 60%)`,
                Math.random() * 5 + 3,
                true
            );
        }
    }
    
    function createParticle(x, y, speed, angle, color, size, fade = false) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        particlesContainer.appendChild(particle);
        
        const radians = angle * (Math.PI / 180);
        const vx = Math.cos(radians) * speed;
        const vy = Math.sin(radians) * speed;
        
        let posX = x;
        let posY = y;
        let opacity = 1;
        let life = 100;
        
        function animateParticle() {
            posX += vx;
            posY += vy;
            life--;
            
            if (fade) {
                opacity = life / 100;
                particle.style.opacity = opacity;
            }
            
            particle.style.left = `${posX}px`;
            particle.style.top = `${posY}px`;
            
            if (life > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        }
        
        requestAnimationFrame(animateParticle);
    }
});
