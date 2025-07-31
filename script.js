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
        this.isAnimating = false;
        
        // 页面加载时自动开始游戏
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.updateScore();
        this.clearGrid();
        this.addNewTile();
        this.addNewTile();
        this.updateDisplay();
        this.hideMessage();
    }
    
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // New Game按钮
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => {
                this.init();
            });
        }
        
        // 重试按钮
        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', () => {
                this.init();
            });
        }
        
        // 继续游戏按钮
        if (this.keepPlayingBtn) {
            this.keepPlayingBtn.addEventListener('click', () => {
                this.hideMessage();
            });
        }
        
        // 触摸控制
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
        if (this.isAnimating) return;
        
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
    
    async move(direction) {
        if (this.isAnimating) return;
        
        const previousGrid = this.grid.map(row => [...row]);
        const moved = this.performMove(direction);
        
        if (moved) {
            this.isAnimating = true;
            await this.animateMove(previousGrid, this.grid);
            
            this.addNewTile();
            this.updateDisplay();
            
            setTimeout(() => {
                this.isAnimating = false;
                
                if (this.hasWon() && !this.gameMessage.classList.contains('game-won')) {
                    this.showMessage('You Win!', 'game-won');
                } else if (this.isGameOver()) {
                    this.showMessage('Game Over!', 'game-over');
                }
            }, 200);
        }
    }
    
    performMove(direction) {
        let moved = false;
        const newGrid = this.grid.map(row => [...row]);
        
        switch (direction) {
            case 'left':
                moved = this.moveLeft(newGrid);
                break;
            case 'right':
                moved = this.moveRight(newGrid);
                break;
            case 'up':
                moved = this.moveUp(newGrid);
                break;
            case 'down':
                moved = this.moveDown(newGrid);
                break;
        }
        
        if (moved) {
            this.grid = newGrid;
        }
        
        return moved;
    }
    
    moveLeft(grid) {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const newRow = this.slideAndMerge(grid[row]);
            if (JSON.stringify(newRow) !== JSON.stringify(grid[row])) {
                moved = true;
                grid[row] = newRow;
            }
        }
        
        return moved;
    }
    
    moveRight(grid) {
        let moved = false;
        
        for (let row = 0; row < this.size; row++) {
            const reversed = [...grid[row]].reverse();
            const newRow = this.slideAndMerge(reversed).reverse();
            if (JSON.stringify(newRow) !== JSON.stringify(grid[row])) {
                moved = true;
                grid[row] = newRow;
            }
        }
        
        return moved;
    }
    
    moveUp(grid) {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const column = [grid[0][col], grid[1][col], grid[2][col], grid[3][col]];
            const newColumn = this.slideAndMerge(column);
            if (JSON.stringify(newColumn) !== JSON.stringify(column)) {
                moved = true;
                for (let row = 0; row < this.size; row++) {
                    grid[row][col] = newColumn[row];
                }
            }
        }
        
        return moved;
    }
    
    moveDown(grid) {
        let moved = false;
        
        for (let col = 0; col < this.size; col++) {
            const column = [grid[0][col], grid[1][col], grid[2][col], grid[3][col]];
            const reversed = [...column].reverse();
            const newColumn = this.slideAndMerge(reversed).reverse();
            if (JSON.stringify(newColumn) !== JSON.stringify(column)) {
                moved = true;
                for (let row = 0; row < this.size; row++) {
                    grid[row][col] = newColumn[row];
                }
            }
        }
        
        return moved;
    }
    
    slideAndMerge(line) {
        const newLine = line.filter(cell => cell !== 0);
        const merged = [];
        
        for (let i = 0; i < newLine.length; i++) {
            if (i < newLine.length - 1 && newLine[i] === newLine[i + 1]) {
                const mergedValue = newLine[i] * 2;
                merged.push(mergedValue);
                this.score += mergedValue;
                i++; // 跳过下一个元素
            } else {
                merged.push(newLine[i]);
            }
        }
        
        while (merged.length < this.size) {
            merged.push(0);
        }
        
        return merged;
    }
    
    async animateMove(previousGrid, newGrid) {
        const tiles = this.gameContainer.querySelectorAll('.tile');
        
        // 标记需要移动的方块
        tiles.forEach(tile => {
            tile.classList.add('tile-moving');
        });
        
        // 添加分数变化动画
        this.scoreElement.classList.add('score-change');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-change');
        }, 500);
        
        return new Promise(resolve => {
            setTimeout(resolve, 200);
        });
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
        }, 300);
        
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
    new Game2048();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}