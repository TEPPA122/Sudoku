class ThermometerGenerator {
  constructor(solution) {
    this.solution = solution;
    this.thermometers = [];
    this.usedCells = new Set();
  }

  generateThermometers() {
    this.thermometers = [];
    this.usedCells.clear();

    const targetCount = Math.floor(Math.random() * 4) + 4;
    let attempts = 0;
    const maxAttempts = 500;

    const longThermometer = this.generateThermometerByLength(6);
    if (longThermometer) {
      this.addThermometer(longThermometer);
    }

    while (this.thermometers.length < targetCount && attempts < maxAttempts) {
      attempts++;
      const length = Math.floor(Math.random() * 4) + 4;
      const thermometer = this.generateThermometerByLength(length);
      
      if (thermometer) {
        this.addThermometer(thermometer);
      }
    }

    return this.thermometers;
  }

  generateThermometerByLength(targetLength) {
    const maxAttempts = Math.min(200, targetLength > 5 ? 300 : 100);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const startRow = Math.floor(Math.random() * 9);
      const startCol = Math.floor(Math.random() * 9);
      const startKey = `${startRow}-${startCol}`;

      if (this.usedCells.has(startKey)) {
        continue;
      }

      const path = this.generatePath(startRow, startCol, targetLength);

      if (this.isPathValid(path)) {
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
          !visited.has(key) &&
          !this.usedCells.has(key)
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

  isPathValid(path) {
    if (!path || path.length < 4 || path.length > 7) {
      return false;
    }

    const visited = new Set();
    for (let i = 0; i < path.length; i++) {
      const key = `${path[i].row}-${path[i].col}`;

      if (visited.has(key)) {
        return false;
      }
      visited.add(key);

      if (this.usedCells.has(key)) {
        return false;
      }

      if (i > 0) {
        const prevCell = path[i - 1];
        const currCell = path[i];
        const isAdjacent =
          (Math.abs(prevCell.row - currCell.row) === 1 &&
            prevCell.col === currCell.col) ||
          (Math.abs(prevCell.col - currCell.col) === 1 &&
            prevCell.row === currCell.row);

        if (!isAdjacent) {
          return false;
        }
      }
    }

    for (let i = 1; i < path.length; i++) {
      const prevValue = this.solution[path[i - 1].row][path[i - 1].col];
      const currValue = this.solution[path[i].row][path[i].col];
      if (prevValue >= currValue) {
        return false;
      }
    }

    return true;
  }

  addThermometer(thermometer) {
    this.thermometers.push(thermometer);
    thermometer.forEach(cell => {
      this.usedCells.add(`${cell.row}-${cell.col}`);
    });
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
          cell: prevCell
        });
        errors.push({
          cell: currCell
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
