class ThermometerGenerator {
  constructor(solution) {
    this.solution = solution;
    this.thermometers = [];
    this.usedCells = new Set();
  }

  generateThermometers(options = {}) {
    this.thermometers = [];
    this.usedCells.clear();

    const {
      minCount = 4,
      maxCount = 7,
      minLength = 4,
      maxLength = 7,
      requiredLongLength = 6
    } = options;

    const targetCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    const candidates = this.buildCandidatePaths(minLength, maxLength);
    const selected = this.selectThermometerSet(candidates, targetCount, requiredLongLength);

    selected.forEach(thermometer => this.addThermometer(thermometer));

    return this.thermometers;
  }

  buildCandidatePaths(minLength, maxLength) {
    const candidates = [];

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        this.collectPathsFromCell(row, col, minLength, maxLength, candidates);
      }
    }

    return this.shuffleArray(candidates);
  }

  collectPathsFromCell(row, col, minLength, maxLength, candidates) {
    const path = [{ row, col }];
    const visited = new Set([`${row}-${col}`]);

    const extendPath = () => {
      if (path.length >= minLength) {
        candidates.push(path.map(cell => ({ ...cell })));
      }

      if (path.length === maxLength) {
        return;
      }

      const current = path[path.length - 1];
      const currentValue = this.solution[current.row][current.col];
      const nextCells = this.getIncreasingNeighbors(current, currentValue, visited);

      for (const next of nextCells) {
        const key = `${next.row}-${next.col}`;
        visited.add(key);
        path.push(next);
        extendPath();
        path.pop();
        visited.delete(key);
      }
    };

    extendPath();
  }

  getIncreasingNeighbors(cell, currentValue, visited) {
    return this.shuffleArray([
      { row: cell.row - 1, col: cell.col },
      { row: cell.row + 1, col: cell.col },
      { row: cell.row, col: cell.col - 1 },
      { row: cell.row, col: cell.col + 1 }
    ].filter(next => {
      const key = `${next.row}-${next.col}`;
      return (
        next.row >= 0 && next.row < 9 &&
        next.col >= 0 && next.col < 9 &&
        !visited.has(key) &&
        this.solution[next.row][next.col] > currentValue
      );
    }));
  }

  selectThermometerSet(candidates, targetCount, requiredLongLength) {
    let bestSet = [];
    let bestScore = -1;
    const attempts = 160;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const used = new Set();
      const selected = [];
      const shuffledCandidates = this.shuffleArray([...candidates]).sort((a, b) => {
        const aLong = a.length === requiredLongLength ? 1 : 0;
        const bLong = b.length === requiredLongLength ? 1 : 0;
        return bLong - aLong || a.length - b.length;
      });

      for (const candidate of shuffledCandidates) {
        if (selected.length === targetCount) {
          break;
        }

        if (this.canUsePath(candidate, used)) {
          selected.push(candidate);
          candidate.forEach(cell => used.add(`${cell.row}-${cell.col}`));
        }
      }

      const longest = Math.max(...selected.map(thermometer => thermometer.length), 0);
      const hasRequiredLong = longest >= requiredLongLength ? 1 : 0;
      const score = selected.length * 100 + hasRequiredLong * 10 + longest;

      if (score > bestScore) {
        bestSet = selected.map(path => path.map(cell => ({ ...cell })));
        bestScore = score;
      }

      if (selected.length === targetCount && hasRequiredLong) {
        break;
      }
    }

    return bestSet;
  }

  canUsePath(path, used) {
    return path.every(cell => !used.has(`${cell.row}-${cell.col}`));
  }

  generateThermometerByLength(targetLength, minLength = 4, maxLength = 7) {
    const maxAttempts = targetLength > 5 ? 30 : 12;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const starts = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          starts.push({ row, col });
        }
      }
      this.shuffleArray(starts);

      for (const { row, col } of starts) {
        const startKey = `${row}-${col}`;

        if (this.usedCells.has(startKey)) {
          continue;
        }

        const path = this.generatePath(row, col, targetLength);

        if (this.isPathValid(path, minLength, maxLength)) {
          return path;
        }
      }
    }
    return null;
  }

  generatePath(startRow, startCol, targetLength) {
    const path = [{ row: startRow, col: startCol }];
    const visited = new Set([`${startRow}-${startCol}`]);

    const extendPath = () => {
      if (path.length === targetLength) {
        return true;
      }

      const current = path[path.length - 1];
      const currentValue = this.solution[current.row][current.col];
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
          !this.usedCells.has(key) &&
          this.solution[dir.row][dir.col] > currentValue
        );
      });

      this.shuffleArray(directions);

      for (const next of directions) {
        const key = `${next.row}-${next.col}`;
        visited.add(key);
        path.push(next);

        if (extendPath()) {
          return true;
        }

        path.pop();
        visited.delete(key);
      }

      return false;
    };

    if (!extendPath()) {
      return null;
    }

    return path;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  isPathValid(path, minLength = 4, maxLength = 7) {
    if (!path || path.length < minLength || path.length > maxLength) {
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
