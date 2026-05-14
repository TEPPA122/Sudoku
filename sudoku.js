class SudokuGame {
  constructor() {
    this.solution = [];
    this.board = [];
    this.lockedCells = new Set();
    this.initialBoard = [];
  }

  generateSolution() {
    this.solution = Array(9).fill(0).map(() => Array(9).fill(0));
    this.fillSudoku(this.solution);
    return this.solution;
  }

  fillSudoku(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const numbers = this.getShuffledNumbers();
          for (const num of numbers) {
            if (this.isValid(board, row, col, num)) {
              board[row][col] = num;
              if (this.fillSudoku(board)) {
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  getShuffledNumbers() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  }

  isValid(board, row, col, num) {
    if (this.isNumberInRow(board, row, num)) return false;
    if (this.isNumberInColumn(board, col, num)) return false;
    if (this.isNumberInBox(board, row, col, num)) return false;
    return true;
  }

  isNumberInRow(board, row, num) {
    return board[row].includes(num);
  }

  isNumberInColumn(board, col, num) {
    return board.some(row => row[col] === num);
  }

  isNumberInBox(board, row, col, num) {
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (board[i][j] === num) return true;
      }
    }
    return false;
  }

  createGame(difficulty = 'medium') {
    this.generateSolution();
    this.initialBoard = this.solution.map(row => [...row]);
    
    const cellsToRemove = this.getCellsToRemove(difficulty);
    this.lockedCells.clear();

    this.board = this.solution.map(row => [...row]);
    
    for (let i = 0; i < cellsToRemove; i++) {
      let row, col;
      do {
        row = Math.floor(Math.random() * 9);
        col = Math.floor(Math.random() * 9);
      } while (this.board[row][col] === 0);

      this.board[row][col] = 0;
    }

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col] !== 0) {
          this.lockedCells.add(`${row}-${col}`);
        }
      }
    }
  }

  getCellsToRemove(difficulty) {
    const removes = {
      easy: 30,
      medium: 45,
      hard: 55
    };
    return removes[difficulty] || removes.medium;
  }

  getBoard() {
    return this.board.map(row => [...row]);
  }

  getSolution() {
    return this.solution.map(row => [...row]);
  }

  setCell(row, col, value) {
    if (this.lockedCells.has(`${row}-${col}`)) {
      return;
    }

    if (value < 0 || value > 9 || !Number.isInteger(value)) {
      return;
    }

    this.board[row][col] = value;
  }

  isLocked(row, col) {
    return this.lockedCells.has(`${row}-${col}`);
  }

  isComplete() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col] === 0) return false;
      }
    }
    return true;
  }

  isSolved() {
    if (!this.isComplete()) return false;
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col] !== this.solution[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  checkCell(row, col) {
    const value = this.board[row][col];
    if (value === 0) return { isValid: true, errors: [] };

    const errors = [];

    if (this.isNumberInRow(this.board, row, value) && 
        this.board[row].filter(v => v === value).length > 1) {
      errors.push('row');
    }

    if (this.isNumberInColumn(this.board, col, value) && 
        this.board.filter((r, i) => i !== row && r[col] === value).length > 0) {
      errors.push('column');
    }

    if (this.isNumberInBox(this.board, row, col, value)) {
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      let count = 0;
      for (let i = boxRow; i < boxRow + 3; i++) {
        for (let j = boxCol; j < boxCol + 3; j++) {
          if (!(i === row && j === col) && this.board[i][j] === value) {
            count++;
          }
        }
      }
      if (count > 0) errors.push('box');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  checkAll() {
    const errors = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col] !== 0) {
          const check = this.checkCell(row, col);
          if (!check.isValid) {
            errors.push({ row, col, types: check.errors });
          }
        }
      }
    }

    return errors;
  }
}

export { SudokuGame };
