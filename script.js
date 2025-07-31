class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.gameContainer = document.querySelector('.tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        this.gameMessage = document.querySelector('.game-message');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.keepPlayingBtn = document.querySelector('.keep-playing-button');
        this.retryBtn = document.querySelector('.retry-button');
        
        // 调试日志
        console.log('Game2048 constructor called');
        console.log('newGameBtn found:', this.newGameBtn);
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        console.log('Initializing new game...');
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.updateScore();
        this.clearGrid();
        this.addNewTile();
        this.addNewTile();
        this.updateDisplay();
        this.hideMessage();
        console.log('New game initialized');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 确保按钮元素存在再添加事件监听器
        if (this.newGameBtn) {
            console.log('Adding click listener to newGameBtn');
            this.newGameBtn.addEventListener('click', () => {
                console.log('New Game button clicked!');
                this.init();
            });
        } else {
            console.error('newGameBtn not found!');
        }
        
        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', () => this.init());
        }
        if (this.keepPlayingBtn) {
            this.keepPlayingBtn.addEventListener('click', () => this.hideMessage());
        }
        
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        const gameContainer = document.querySelector('.game-container');
        
        gameContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        gameContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
            e.preventDefault();
        }, { passive: false });
        
        gameContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const threshold = 50;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > threshold) {
                this.move('right');
            } else if (diffX < -threshold) {
                this.move('left');
            }
        } else {
            if (diffY > threshold) {
                this.move('down');
            } else if (diffY < -threshold) {
                this.move('up');
            }
        }
    }
    
    handleKeyPress(e) {
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.move(direction);
        }
    }
    
    move(direction) {
        const previousGrid = this.grid.map(row => [...row]);
        let moved = false;
        
        switch (direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }
        
        if (moved) {
            this.addNewTile();
            this.updateDisplay();
            
            if (this.hasWon() && !this.gameMessage.classList.contains('game-won')) {
                this.showMessage('You Win!', 'game-won');
            } else if (this.isGameOver()) {
                this.showMessage('Game Over!', 'game-over');
            }
        }
    }
    
    moveLeft() {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const newRow = this.slideAndMerge(this.grid[row]);
            if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                moved = true;
                this.grid[row] = newRow;
            }
        }
        
        return moved;
    }
    
    moveRight() {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const reversed = [...this.grid[row]].reverse();
            const newRow = this.slideAndMerge(reversed).reverse();
            if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                moved = true;
                this.grid[row] = newRow;
            }
        }
        
        return moved;
    }
    
    moveUp() {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const column = [this.grid[0][col], this.grid[1][col], this.grid[2][col], this.grid[3][col]];
            const newColumn = this.slideAndMerge(column);
            if (JSON.stringify(newColumn) !== JSON.stringify(column)) {
                moved = true;
                for (let row = 0; row < this.size; row++) {
                    this.grid[row][col] = newColumn[row];
                }
            }
        }
        
        return moved;
    }
    
    moveDown() {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const column = [this.grid[0][col], this.grid[1][col], this.grid[2][col], this.grid[3][col]];
            const reversed = [...column].reverse();
            const newColumn = this.slideAndMerge(reversed).reverse();
            if (JSON.stringify(newColumn) !== JSON.stringify(column)) {
                moved = true;
                for (let row = 0; row < this.size; row++) {
                    this.grid[row][col] = newColumn[row];
                }
            }
        }
        
        return moved;
    }
    
    slideAndMerge(line) {
        const newLine = line.filter(cell => cell !== 0);
        
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                this.score += newLine[i];
                newLine.splice(i + 1, 1);
            }
        }
        
        while (newLine.length < this.size) {
            newLine.push(0);
        }
        
        return newLine;
    }
    
    addNewTile() {
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    updateDisplay() {
        this.clearGrid();
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] !== 0) {
                    this.createTile(row, col, this.grid[row][col]);
                }
            }
        }
        
        this.updateScore();
    }
    
    createTile(row, col, value) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value} tile-new`;
        tile.textContent = value;
        tile.style.transform = `translate(${col * 121.25}px, ${row * 121.25}px)`;
        
        setTimeout(() => {
            tile.classList.remove('tile-new');
        }, 200);
        
        this.gameContainer.appendChild(tile);
    }
    
    clearGrid() {
        this.gameContainer.innerHTML = '';
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
        this.bestElement.textContent = this.bestScore;
    }
    
    hasWon() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }
    
    isGameOver() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const current = this.grid[row][col];
                if (
                    (row < this.size - 1 && current === this.grid[row + 1][col]) ||
                    (col < this.size - 1 && current === this.grid[row][col + 1])
                ) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    showMessage(text, className) {
        this.gameMessage.querySelector('p').textContent = text;
        this.gameMessage.className = `game-message ${className}`;
    }
    
    hideMessage() {
        this.gameMessage.className = 'game-message';
    }
}

// 确保DOM完全加载后再初始化游戏
function initializeGame() {
    console.log('DOM loaded, initializing game...');
    const game = new Game2048();
    
    // 添加事件委托作为备用方案
    document.addEventListener('click', (e) => {
        if (e.target.id === 'newGameBtn' || e.target.classList.contains('new-game-btn')) {
            console.log('New Game button clicked via event delegation!');
            game.init();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    // DOM已经加载完成，直接初始化
    initializeGame();
}