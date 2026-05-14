class ThermometerGenerator {
  constructor(solution) {
    this.solution = solution;
    this.thermometers = [];
    this.usedCells = new Set();
  }

  generateThermometers() {
    this.thermometers = [];
    this.usedCells.clear();

    const thermometerCount = Math.floor(Math.random() * 4) + 4;

    for (let i = 0; i < thermometerCount; i++) {
      const thermometer = this.generateThermometer();
      if (thermometer && thermometer.length >= 3) {
        this.thermometers.push(thermometer);
        thermometer.forEach(cell => {
          this.usedCells.add(`${cell.row}-${cell.col}`);
        });
      }
    }

    return this.thermometers;
  }

  generateThermometer() {
    const maxAttempts = 50;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const startRow = Math.floor(Math.random() * 9);
      const startCol = Math.floor(Math.random() * 9);

      const length = Math.floor(Math.random() * 5) + 3;
      const path = this.generatePath(startRow, startCol, length);

      if (path && path.length >= 3 && this.isValidThermometer(path)) {
        return path;
      }
    }
    return null;
  }

  generatePath(startRow, startCol, targetLength) {
    const path = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow}-${startCol}`]);

    while (path.length < targetLength) {
      const current = path[path.length - 1];
      const directions = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 }
      ].filter(dir => {
        const key = `${dir.row}-${dir.col}`;
        return (
          dir.row >= 0 && dir.row < 9 &&
          dir.col >= 0 && dir.col < 9 &&
          !visited.has(key)
        );
      });

      if (directions.length === 0) break;

      const next = directions[Math.floor(Math.random() * directions.length)];
      const key = `${next.row}-${next.col}`;
      visited.add(key);
      path.push(next);
    }

    return path;
  }

  isValidThermometer(path) {
    for (let i = 1; i < path.length; i++) {
      const prevValue = this.solution[path[i - 1].row][path[i - 1].col];
      const currValue = this.solution[path[i].row][path[i].col];
      if (prevValue >= currValue) {
        return false;
      }
    }
    return true;
  }

  checkThermometer(board, thermometer) {
    const errors = [];

    for (let i = 1; i < thermometer.length; i++) {
      const prevCell = thermometer[i - 1];
      const currCell = thermometer[i];

      const prevValue = board[prevCell.row][prevCell.col];
      const currValue = board[currCell.row][currCell.col];

      if (prevValue === 0 || currValue === 0) {
        continue;
      }

      if (prevValue >= currValue) {
        errors.push({
          cell: currCell,
          thermometerIndex: i
        });
      }
    }

    return errors;
  }

  checkAllThermometers(board) {
    const allErrors = [];

    for (let thermIdx = 0; thermIdx < this.thermometers.length; thermIdx++) {
      const errors = this.checkThermometer(board, this.thermometers[thermIdx]);
      if (errors.length > 0) {
        allErrors.push({
          thermometerIndex: thermIdx,
          errors: errors
        });
      }
    }

    return allErrors;
  }

  getThermometers() {
    return this.thermometers;
  }

  getCellThermometers(row, col) {
    const cellThermometers = [];
    const cellKey = `${row}-${col}`;

    for (let i = 0; i < this.thermometers.length; i++) {
      for (let j = 0; j < this.thermometers[i].length; j++) {
        const cell = this.thermometers[i][j];
        if (`${cell.row}-${cell.col}` === cellKey) {
          cellThermometers.push({
            thermometerIndex: i,
            cellIndex: j,
            isStart: j === 0
          });
        }
      }
    }

    return cellThermometers;
  }
}

export { ThermometerGenerator };
