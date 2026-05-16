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
    this.notesMode = false;
    this.confirmedCells = new Set();
    this.notes = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set())
    );

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
    this.clearBoardBtn = document.getElementById('clearBoardBtn');
    this.clearCellBtn = document.getElementById('clearCellBtn');
    this.notesToggleBtn = document.getElementById('notesToggleBtn');
    this.numButtons = document.querySelectorAll('.num-btn');
    this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
  }

  attachEventListeners() {
    this.newGameBtn.addEventListener('click', () => this.startNewGame());
    this.clearBoardBtn.addEventListener('click', () => this.clearBoard());
    this.clearCellBtn.addEventListener('click', () => this.clearSelectedCell());
    this.notesToggleBtn.addEventListener('click', () => this.toggleNotesMode());

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
    this.confirmedCells.clear();
    this.clearAllNotes();
    this.notesMode = false;
    this.notesToggleBtn.classList.remove('active');

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.startTimer();

    this.refreshNotesElimination();
    this.renderBoard();
    this.drawThermometers();
    this.updateNumberButtons();
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

    if (row === 0) cell.classList.add('border-top');
    if (col === 0) cell.classList.add('border-left');
    if (col === 2 || col === 5 || col === 8) cell.classList.add('border-right');
    if (row === 2 || row === 5 || row === 8) cell.classList.add('border-bottom');

    const isLocked = this.sudoku.isLocked(row, col);
    const cellKey = `${row}-${col}`;
    const isConfirmed = this.confirmedCells.has(cellKey);

    if (isLocked) {
      cell.classList.add('locked');
      if (value !== 0) {
        const content = document.createElement('div');
        content.className = 'sudoku-cell-content';
        content.textContent = value;
        cell.appendChild(content);
      }
    } else if (isConfirmed) {
      cell.classList.add('confirmed');
      if (value !== 0) {
        const content = document.createElement('div');
        content.className = 'sudoku-cell-content';
        content.textContent = value;
        cell.appendChild(content);
      }
    } else {
      if (value !== 0) {
        const content = document.createElement('div');
        content.className = 'sudoku-cell-content';
        content.textContent = value;
        cell.appendChild(content);
      } else {
        cell.classList.add('empty');
        const notesContainer = this.renderNotes(row, col);
        if (notesContainer) {
          cell.appendChild(notesContainer);
        }
      }
    }

    if (this.cellErrors.has(cellKey)) {
      cell.classList.add('error');
    }

    const thermoErrors = this.thermoErrors.get(cellKey);
    if (thermoErrors && thermoErrors.length > 0) {
      cell.classList.add('thermo-error');
    }

    if (this.selectedCell) {
      const isSameRow = row === this.selectedCell.row;
      const isSameCol = col === this.selectedCell.col;
      const isSelected = isSameRow && isSameCol;

      if ((isSameRow || isSameCol) && !isSelected) {
        cell.classList.add('highlight-cross');
      }

      if (isSelected) {
        cell.classList.add('selected');
      }
    }

    cell.addEventListener('click', () => this.selectCell(row, col));

    return cell;
  }

  renderNotes(row, col) {
    const noteSet = this.notes[row][col];
    if (!noteSet || noteSet.size === 0) {
      return null;
    }

    const notesContainer = document.createElement('div');
    notesContainer.className = 'sudoku-cell-notes';

    for (let i = 1; i <= 9; i++) {
      const noteDiv = document.createElement('div');
      if (noteSet.has(i)) {
        noteDiv.className = 'note-digit';
        noteDiv.textContent = i;
      }
      notesContainer.appendChild(noteDiv);
    }

    return notesContainer;
  }

  toggleNotesMode() {
    this.notesMode = !this.notesMode;
    this.notesToggleBtn.classList.toggle('active', this.notesMode);
  }

  toggleNote(row, col, number) {
    const noteSet = this.notes[row][col];
    if (noteSet.has(number)) {
      noteSet.delete(number);
    } else {
      noteSet.add(number);
    }
  }

  clearCellNotes(row, col) {
    this.notes[row][col].clear();
  }

  clearNotesForDigitInRegion(number, row, col) {
    for (let c = 0; c < 9; c++) {
      this.notes[row][c].delete(number);
    }

    for (let r = 0; r < 9; r++) {
      this.notes[r][col].delete(number);
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        this.notes[r][c].delete(number);
      }
    }
  }

  purgeDigitFromAllNotes(digit) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this.notes[r][c].delete(digit);
      }
    }
  }

  refreshNotesElimination() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const value = this.sudoku.getBoard()[r][c];
        if (value === 0) continue;

        const cellKey = `${r}-${c}`;
        const isDefinitive =
          this.sudoku.isLocked(r, c) || this.confirmedCells.has(cellKey);

        if (isDefinitive && value === this.sudoku.solution[r][c]) {
          this.clearNotesForDigitInRegion(value, r, c);
        }
      }
    }

    for (let digit = 1; digit <= 9; digit++) {
      if (this.isNumberCompleted(digit)) {
        this.purgeDigitFromAllNotes(digit);
      }
    }
  }

  clearAllNotes() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        this.notes[row][col].clear();
      }
    }
  }

  resetCurrentPuzzle() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (!this.sudoku.isLocked(row, col)) {
          this.sudoku.setCell(row, col, 0);
        }
      }
    }
    this.errorCount = 0;
    this.cellErrors.clear();
    this.thermoErrors.clear();
    this.confirmedCells.clear();
    this.clearAllNotes();
    this.refreshNotesElimination();
    this.errorCountElement.textContent = '0';
    this.renderBoard();
    this.drawThermometers();
    this.updateNumberButtons();
  }

  selectCell(row, col) {
    const cellKey = `${row}-${col}`;
    if (this.sudoku.isLocked(row, col) || this.confirmedCells.has(cellKey)) {
      return;
    }

    this.selectedCell = { row, col };
    this.renderBoard();
    this.drawThermometers();
  }

    inputNumber(number) {
      if (!this.selectedCell) {
        this.showMessage('Виберіть клітинку', 'info');
        return;
      }

      if (this.isNumberCompleted(number)) {
        this.showMessage(`Усі ${number} вже знайдені`, 'info');
        return;
      }

      if (this.notesMode) {
        this.toggleNote(this.selectedCell.row, this.selectedCell.col, number);
        this.refreshNotesElimination();
        this.renderBoard();
      } else {
      const row = this.selectedCell.row;
      const col = this.selectedCell.col;
      const cellKey = `${row}-${col}`;

      this.sudoku.setCell(row, col, number);
      this.clearCellNotes(row, col);
      this.clearNotesForDigitInRegion(number, row, col);

      const correctValue = this.sudoku.solution[row][col];
      if (number === correctValue) {
        this.confirmedCells.add(cellKey);
      } else {
        this.errorCount++;
        this.errorCountElement.textContent = this.errorCount.toString();
        if (this.errorCount >= 3) {
          this.resetCurrentPuzzle();
          this.showMessage('Ви зробили 3 помилки. Поле очищено, спробуйте ще раз.', 'error');
          return;
        }
      }

      this.refreshNotesElimination();
      this.checkForErrors();
      this.updateNumberButtons();
      this.selectCell(row, col);
      this.checkWinCondition();
      }
  }

  clearSelectedCell() {
    if (!this.selectedCell) return;

    const row = this.selectedCell.row;
    const col = this.selectedCell.col;
    const cellKey = `${row}-${col}`;
    
    if (this.confirmedCells.has(cellKey)) {
      return;
    }

    this.sudoku.setCell(row, col, 0);
    this.clearCellNotes(row, col);
    this.checkForErrors();
    this.updateNumberButtons();
    this.selectCell(row, col);
    this.checkWinCondition();
  }

  clearBoard() {
    if (confirm('Ви впевнені, що хочете очистити поле?')) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!this.sudoku.isLocked(row, col)) {
            this.sudoku.setCell(row, col, 0);
            this.clearCellNotes(row, col);
          }
        }
      }
      this.errorCount = 0;
      this.cellErrors.clear();
      this.thermoErrors.clear();
      this.confirmedCells.clear();
      this.errorCountElement.textContent = '0';
      this.renderBoard();
      this.drawThermometers();
      this.updateNumberButtons();
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

  checkWinCondition() {
    if (!this.sudoku.isComplete()) {
      return;
    }

    this.checkForErrors();

    if (this.cellErrors.size > 0 || this.thermoErrors.size > 0) {
      return;
    }

    if (!this.sudoku.isSolved()) {
      return;
    }

    clearInterval(this.timerInterval);
    this.showMessage('🎉 Вітаємо! Ви перемогли!', 'success');
  }

  drawThermometers() {
    const svg = document.getElementById('thermometerSvg');
    svg.innerHTML = '';

    const boardSize = this.boardElement.offsetWidth;
    const cellSize = boardSize / 9;
    const cellRadius = cellSize / 2;

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
        line.setAttribute('stroke-width', '5');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('opacity', '0.3');

        svg.appendChild(line);
      }

      const startCell = thermometer[0];
      const startX = startCell.col * cellSize + cellRadius;
      const startY = startCell.row * cellSize + cellRadius;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', startX);
      circle.setAttribute('cy', startY);
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', fillColor);
      circle.setAttribute('opacity', '0.3');

      svg.appendChild(circle);
    });
  }
  isNumberCompleted(number) {
  const board = this.sudoku.getBoard();
  let count = 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (
        board[row][col] === number &&
        this.sudoku.solution[row][col] === number
      ) {
        count++;
      }
    }
  }

  return count >= 9;
}

updateNumberButtons() {
  this.numButtons.forEach(btn => {
    const number = parseInt(btn.dataset.number);
    const isCompleted = this.isNumberCompleted(number);

    btn.disabled = isCompleted;
    btn.classList.toggle('completed', isCompleted);
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
