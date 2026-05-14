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
    this.board = this.solution.map(row => [...row]);
    this.removeRandomCells(this.getCellsToRemove(difficulty));
    this.updateLockedCells();
  }

  getCellsToRemove(difficulty) {
    const removes = {
      easy: 30,
      medium: 45,
      hard: 64
    };
    return removes[difficulty] || removes.medium;
  }

  createPuzzleWithThermometers(difficulty, thermometers) {
    if (difficulty === 'hard') {
      this.createHardPuzzleWithThermometers(thermometers);
      return;
    }

    this.board = this.solution.map(row => [...row]);
    this.removeRandomCells(this.getCellsToRemove(difficulty));
    this.updateLockedCells();
  }

  createHardPuzzleWithThermometers(thermometers) {
    this.board = this.solution.map(row => [...row]);
    this.updateLockedCells();

    const targetClues = 8;
    this.forceReduceHardPuzzle(thermometers, targetClues);
    this.updateLockedCells();
  }

  forceReduceHardPuzzle(thermometers, targetClues) {
    const cells = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        cells.push({ row, col });
      }
    }

    const startedAt = Date.now();
    const maxAttempts = 180;
    const maxDurationMs = 5000;
    let attempts = 0;
    let removedInPass = true;

    while (this.getClueCount(this.board) > targetClues && attempts < maxAttempts && removedInPass) {
      removedInPass = false;
      this.shuffleArray(cells);

      for (const { row, col } of cells) {
        if (this.board[row][col] === 0 || this.getClueCount(this.board) <= targetClues) {
          continue;
        }

        if (attempts >= maxAttempts || Date.now() - startedAt > maxDurationMs) {
          return;
        }

        const value = this.board[row][col];
        this.board[row][col] = 0;
        attempts++;

        if (
          this.hasUniqueSolutionWithThermometers(this.board, thermometers) &&
          this.isHumanSolvableWithThermometers(this.board, thermometers)
        ) {
          removedInPass = true;
        } else {
          this.board[row][col] = value;
        }
      }
    }
  }

  removeRandomCells(cellsToRemove) {
    const cells = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        cells.push({ row, col });
      }
    }

    this.shuffleArray(cells);
    cells.slice(0, cellsToRemove).forEach(({ row, col }) => {
      this.board[row][col] = 0;
    });
  }

  updateLockedCells() {
    this.lockedCells.clear();
    this.initialBoard = this.board.map(row => [...row]);

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.board[row][col] !== 0) {
          this.lockedCells.add(`${row}-${col}`);
        }
      }
    }
  }

  getClueCount(board) {
    return board.flat().filter(Boolean).length;
  }

  hasUniqueSolutionWithThermometers(board, thermometers) {
    return this.countSolutionsWithThermometers(board, thermometers, 2) === 1;
  }

  isHumanSolvableWithThermometers(board, thermometers) {
    const workingBoard = board.map(row => [...row]);

    if (!this.isBoardStillValidWithThermometers(workingBoard, thermometers)) {
      return false;
    }

    let progress = true;
    while (progress) {
      progress = false;

      if (this.applyNakedSingles(workingBoard, thermometers)) {
        progress = true;
        continue;
      }

      if (this.applyHiddenSingles(workingBoard, thermometers)) {
        progress = true;
      }
    }

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (workingBoard[row][col] !== this.solution[row][col]) {
          return false;
        }
      }
    }

    return true;
  }

  getLogicalCandidates(board, row, col, thermometers) {
    if (board[row][col] !== 0) {
      return [];
    }

    const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(num =>
      this.isClassicMoveValid(board, row, col, num)
    );

    return this.applyThermometerCandidateLimits(candidates, row, col, thermometers, board);
  }

  applyNakedSingles(board, thermometers) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0) {
          continue;
        }

        const candidates = this.getLogicalCandidates(board, row, col, thermometers);
        if (candidates.length === 0) {
          return false;
        }

        if (candidates.length === 1) {
          board[row][col] = candidates[0];
          return true;
        }
      }
    }

    return false;
  }

  applyHiddenSingles(board, thermometers) {
    const units = [];

    for (let i = 0; i < 9; i++) {
      units.push(Array.from({ length: 9 }, (_, col) => ({ row: i, col })));
      units.push(Array.from({ length: 9 }, (_, row) => ({ row, col: i })));
    }

    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        const unit = [];
        for (let row = boxRow; row < boxRow + 3; row++) {
          for (let col = boxCol; col < boxCol + 3; col++) {
            unit.push({ row, col });
          }
        }
        units.push(unit);
      }
    }

    for (const unit of units) {
      for (let num = 1; num <= 9; num++) {
        const positions = [];

        for (const { row, col } of unit) {
          if (board[row][col] !== 0) {
            continue;
          }

          const candidates = this.getLogicalCandidates(board, row, col, thermometers);
          if (candidates.includes(num)) {
            positions.push({ row, col });
          }
        }

        if (positions.length === 1) {
          const { row, col } = positions[0];
          board[row][col] = num;
          return true;
        }
      }
    }

    return false;
  }

  applyThermometerCandidateLimits(candidates, row, col, thermometers, board) {
    return candidates.filter(num =>
      this.isThermometerMoveValid(board, row, col, num, thermometers)
    );
  }

  countSolutionsWithThermometers(board, thermometers, limit = 2) {
    const workingBoard = board.map(row => [...row]);

    if (!this.isBoardStillValidWithThermometers(workingBoard, thermometers)) {
      return 0;
    }

    const solve = () => {
      const bestCell = this.findBestEmptyCell(workingBoard, thermometers);

      if (!bestCell) {
        return this.areAllThermometersValid(workingBoard, thermometers) ? 1 : 0;
      }

      if (bestCell.candidates.length === 0) {
        return 0;
      }

      let count = 0;
      for (const candidate of bestCell.candidates) {
        workingBoard[bestCell.row][bestCell.col] = candidate;
        count += solve();
        workingBoard[bestCell.row][bestCell.col] = 0;

        if (count >= limit) {
          return count;
        }
      }

      return count;
    };

    return solve();
  }

  findBestEmptyCell(board, thermometers) {
    let bestCell = null;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0) {
          continue;
        }

        const candidates = this.getCandidatesWithThermometers(board, row, col, thermometers);
        if (!bestCell || candidates.length < bestCell.candidates.length) {
          bestCell = { row, col, candidates };
        }

        if (candidates.length <= 1) {
          return bestCell;
        }
      }
    }

    return bestCell;
  }

  getCandidatesWithThermometers(board, row, col, thermometers) {
    return this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(num =>
      this.isClassicMoveValid(board, row, col, num) &&
      this.isThermometerMoveValid(board, row, col, num, thermometers)
    ));
  }

  isClassicMoveValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (i !== col && board[row][i] === num) return false;
      if (i !== row && board[i][col] === num) return false;
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if ((i !== row || j !== col) && board[i][j] === num) {
          return false;
        }
      }
    }

    return true;
  }

  isThermometerMoveValid(board, row, col, num, thermometers) {
    for (const thermometer of thermometers) {
      const index = thermometer.findIndex(cell => cell.row === row && cell.col === col);
      if (index === -1) {
        continue;
      }

      if (num < index + 1 || num > 9 - (thermometer.length - index - 1)) {
        return false;
      }

      for (let i = 0; i < thermometer.length; i++) {
        if (i === index) {
          continue;
        }

        const cell = thermometer[i];
        const value = board[cell.row][cell.col];
        if (value === 0) {
          continue;
        }

        const distance = Math.abs(index - i);
        if (i < index && value + distance > num) {
          return false;
        }

        if (i > index && num + distance > value) {
          return false;
        }
      }
    }

    return true;
  }

  isBoardStillValidWithThermometers(board, thermometers) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = board[row][col];
        if (value !== 0 && !this.isClassicMoveValid(board, row, col, value)) {
          return false;
        }
      }
    }

    return this.arePartialThermometersValid(board, thermometers);
  }

  arePartialThermometersValid(board, thermometers) {
    for (const thermometer of thermometers) {
      for (let i = 0; i < thermometer.length; i++) {
        const currentCell = thermometer[i];
        const currentValue = board[currentCell.row][currentCell.col];

        if (currentValue === 0) {
          continue;
        }

        if (currentValue < i + 1 || currentValue > 9 - (thermometer.length - i - 1)) {
          return false;
        }

        for (let j = i + 1; j < thermometer.length; j++) {
          const nextCell = thermometer[j];
          const nextValue = board[nextCell.row][nextCell.col];

          if (nextValue !== 0 && currentValue + (j - i) > nextValue) {
            return false;
          }
        }
      }
    }

    return true;
  }

  areAllThermometersValid(board, thermometers) {
    for (const thermometer of thermometers) {
      for (let i = 1; i < thermometer.length; i++) {
        const prevCell = thermometer[i - 1];
        const currCell = thermometer[i];
        const prevValue = board[prevCell.row][prevCell.col];
        const currValue = board[currCell.row][currCell.col];

        if (prevValue === 0 || currValue === 0 || prevValue >= currValue) {
          return false;
        }
      }
    }

    return true;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
