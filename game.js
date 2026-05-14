import { SudokuGame } from './sudoku.js';
import { ThermometerGenerator } from './thermometers.js';

class GameController {
  constructor() {
    this.sudoku = new SudokuGame();
    this.thermometerGenerator = null;
    this.selectedCell = null;
    this.selectedDifficulty = 'medium';
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.errorCount = 0;
    this.cellErrors = new Set();
    this.thermoErrors = new Map();

    this.initializeElements();
    this.attachEventListeners();
    this.startNewGame();
  }

  initializeElements() {
    this.boardElement = document.getElementById('sudokuBoard');
    this.timerElement = document.getElementById('timer');
    this.errorCountElement = document.getElementById('errorCount');
    this.messageElement = document.getElementById('message');
    this.newGameBtn = document.getElementById('newGameBtn');
    this.checkBtn = document.getElementById('checkBtn');
    this.clearBoardBtn = document.getElementById('clearBoardBtn');
    this.clearCellBtn = document.getElementById('clearCellBtn');
    this.numButtons = document.querySelectorAll('.num-btn');
    this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
  }

  attachEventListeners() {
    this.newGameBtn.addEventListener('click', () => this.startNewGame());
    this.checkBtn.addEventListener('click', () => this.checkGame());
    this.clearBoardBtn.addEventListener('click', () => this.clearBoard());
    this.clearCellBtn.addEventListener('click', () => this.clearSelectedCell());

    this.numButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const number = parseInt(e.target.dataset.number);
        this.inputNumber(number);
      });
    });

    this.difficultyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setDifficulty(e.target.dataset.difficulty);
      });
    });

    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  setDifficulty(difficulty) {
    this.selectedDifficulty = difficulty;
    this.difficultyButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
  }

  startNewGame() {
    this.sudoku.createGame(this.selectedDifficulty);
    this.thermometerGenerator = new ThermometerGenerator(this.sudoku.solution);
    this.thermometerGenerator.generateThermometers();

    this.selectedCell = null;
    this.elapsedSeconds = 0;
    this.errorCount = 0;
    this.cellErrors.clear();
    this.thermoErrors.clear();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.startTimer();

    this.renderBoard();
    this.drawThermometers();
    this.clearMessage();

    this.errorCountElement.textContent = '0';
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    this.timerElement.textContent = 
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  renderBoard() {
    this.boardElement.innerHTML = '';
    const board = this.sudoku.getBoard();

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = this.createCell(row, col, board[row][col]);
        this.boardElement.appendChild(cell);
      }
    }
  }

  createCell(row, col, value) {
    const cell = document.createElement('div');
    cell.className = 'sudoku-cell';
    cell.dataset.row = row;
    cell.dataset.col = col;

    const isLocked = this.sudoku.isLocked(row, col);
    const cellKey = `${row}-${col}`;

    if (isLocked) {
      cell.classList.add('locked');
      if (value !== 0) {
        cell.textContent = value;
      }
    } else {
      if (value !== 0) {
        cell.textContent = value;
      } else {
        cell.classList.add('empty');
      }
    }

    if (this.cellErrors.has(cellKey)) {
      cell.classList.add('error');
    }

    const thermoErrors = this.thermoErrors.get(cellKey);
    if (thermoErrors && thermoErrors.length > 0) {
      cell.classList.add('thermo-error');
    }

    cell.addEventListener('click', () => this.selectCell(row, col));

    return cell;
  }

  selectCell(row, col) {
    if (this.sudoku.isLocked(row, col)) return;

    if (this.selectedCell) {
      const prevCell = document.querySelector(
        `.sudoku-cell[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`
      );
      if (prevCell) prevCell.classList.remove('selected');
    }

    this.selectedCell = { row, col };
    const cell = document.querySelector(
      `.sudoku-cell[data-row="${row}"][data-col="${col}"]`
    );
    if (cell) cell.classList.add('selected');
  }

  inputNumber(number) {
    if (!this.selectedCell) {
      this.showMessage('Виберіть клітинку', 'info');
      return;
    }

    this.sudoku.setCell(this.selectedCell.row, this.selectedCell.col, number);
    this.renderBoard();
    this.selectCell(this.selectedCell.row, this.selectedCell.col);
    this.checkForErrors();
  }

  clearSelectedCell() {
    if (!this.selectedCell) return;

    this.sudoku.setCell(this.selectedCell.row, this.selectedCell.col, 0);
    this.renderBoard();
    this.selectCell(this.selectedCell.row, this.selectedCell.col);
    this.checkForErrors();
  }

  clearBoard() {
    if (confirm('Ви впевнені, що хочете очистити поле?')) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!this.sudoku.isLocked(row, col)) {
            this.sudoku.setCell(row, col, 0);
          }
        }
      }
      this.cellErrors.clear();
      this.thermoErrors.clear();
      this.renderBoard();
      this.drawThermometers();
      this.clearMessage();
    }
  }

  checkForErrors() {
    this.cellErrors.clear();
    this.thermoErrors.clear();

    const sudokuErrors = this.sudoku.checkAll();
    sudokuErrors.forEach(error => {
      this.cellErrors.add(`${error.row}-${error.col}`);
    });

    const thermoErrors = this.thermometerGenerator.checkAllThermometers(
      this.sudoku.getBoard()
    );
    thermoErrors.forEach(thermoError => {
      thermoError.errors.forEach(error => {
        const cellKey = `${error.cell.row}-${error.cell.col}`;
        if (!this.thermoErrors.has(cellKey)) {
          this.thermoErrors.set(cellKey, []);
        }
        this.thermoErrors.get(cellKey).push(thermoError.thermometerIndex);
      });
    });

    this.renderBoard();
    this.drawThermometers();
  }

  checkGame() {
    if (!this.sudoku.isComplete()) {
      this.showMessage('Заповніть усі клітинки', 'warning');
      return;
    }

    this.checkForErrors();

    if (this.cellErrors.size > 0) {
      this.showMessage('Знайдено помилки в судоку', 'error');
      return;
    }

    const thermoErrors = this.thermometerGenerator.checkAllThermometers(
      this.sudoku.getBoard()
    );

    if (thermoErrors && thermoErrors.length > 0) {
      this.showMessage('Знайдено помилки в термометрах', 'error');
      return;
    }

    clearInterval(this.timerInterval);
    this.showMessage('🎉 Вітаємо! Ви розв\'язали судоку!', 'success');
  }

  drawThermometers() {
    const svg = document.getElementById('thermometerSvg');
    svg.innerHTML = '';

    const cellSize = 50;
    const cellRadius = 25;

    const thermometers = this.thermometerGenerator.getThermometers();

    thermometers.forEach((thermometer, thermoIndex) => {
      const isErrorThermo = Array.from(this.thermoErrors.values())
        .some(errors => errors.includes(thermoIndex));

      const strokeColor = isErrorThermo ? '#ef4444' : '#646464';
      const fillColor = isErrorThermo ? '#ef4444' : '#646464';

      for (let i = 0; i < thermometer.length - 1; i++) {
        const currentCell = thermometer[i];
        const nextCell = thermometer[i + 1];

        const x1 = currentCell.col * cellSize + cellRadius;
        const y1 = currentCell.row * cellSize + cellRadius;
        const x2 = nextCell.col * cellSize + cellRadius;
        const y2 = nextCell.row * cellSize + cellRadius;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('opacity', '0.85');

        svg.appendChild(line);
      }

      const startCell = thermometer[0];
      const startX = startCell.col * cellSize + cellRadius;
      const startY = startCell.row * cellSize + cellRadius;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', startX);
      circle.setAttribute('cy', startY);
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', fillColor);
      circle.setAttribute('opacity', '0.8');

      svg.appendChild(circle);
    });
  }

  handleKeyboard(e) {
    if (!this.selectedCell) return;

    const key = e.key;

    if (/^[1-9]$/.test(key)) {
      e.preventDefault();
      this.inputNumber(parseInt(key));
      return;
    }

    if (key === 'Delete' || key === 'Backspace') {
      e.preventDefault();
      this.clearSelectedCell();
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      const newRow = Math.max(0, this.selectedCell.row - 1);
      this.selectCell(newRow, this.selectedCell.col);
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      const newRow = Math.min(8, this.selectedCell.row + 1);
      this.selectCell(newRow, this.selectedCell.col);
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      const newCol = Math.max(0, this.selectedCell.col - 1);
      this.selectCell(this.selectedCell.row, newCol);
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      const newCol = Math.min(8, this.selectedCell.col + 1);
      this.selectCell(this.selectedCell.row, newCol);
    }
  }

  showMessage(text, type = 'info') {
    this.messageElement.textContent = text;
    this.messageElement.className = 'message-area';
    if (type) {
      this.messageElement.classList.add(type);
    }

    if (type === 'info' || type === 'warning') {
      setTimeout(() => this.clearMessage(), 3000);
    }
  }

  clearMessage() {
    this.messageElement.textContent = '';
    this.messageElement.className = 'message-area';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new GameController();
  window.gameController = game;
  const easyBtn = document.querySelector('[data-difficulty="medium"]');
  if (easyBtn) easyBtn.click();
});
