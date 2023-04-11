const findItem = (arr, id) => {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      if (arr[i][j].id?.toString() === id?.toString()) return arr[i][j];
    }
  }
};

const flattenArray = (arr) => {
  const flat = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      flat.push(arr[i][j]);
    }
  }
  return flat;
};

const removeItemByCoordinates = (arr, row, col) => {
  if (arr[row].length === 1) {
    arr.splice(row, 1);
  } else arr[row].splice(col, 1);
};

const removeItemById = (arr, itemId) => {
  const itemPos = findItemCoordinates(arr, itemId);
  if (itemPos) removeItemByCoordinates(arr, itemPos.row, itemPos.col);
};

const moveItemToRow = (arr, itemId, toRow, moveDown = true) => {
  if (toRow === arr.length - 1 || toRow < 0) return arr;
  const block = arr.splice(toRow, 1);
  arr.splice(toRow + (moveDown ? -1 : +1), 0, block[0]);
  return arr;
};

const toString = (arr) => {
  let s = "";
  for (let i = 0; i < arr.length; i++) {
    s += "[";
    for (let j = 0; j < arr[i].length; j++) {
      s +=
        "(" +
        i +
        "/" +
        arr[i][j].row +
        "," +
        j +
        "/" +
        arr[i][j].col +
        "," +
        (arr[i][j].content?.toString() || arr[i][j].id) +
        ", dummy: " +
        arr[i][j].isDummy +
        ")";
    }
    s += "], \n";
  }
  return s;
};

const calcRowColPositionsInArray = (arr, copy = true) => {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      if (copy) arr[i][j] = { ...arr[i][j], row: i, col: j };
      else {
        arr[i][j].row = i;
        arr[i][j].col = j;
      }
    }
  }

  return arr;
};

const findItemCoordinates = (arr, id) => {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      if (arr[i][j].id?.toString() === id?.toString())
        return { row: i, col: j };
    }
  }
  return undefined;
};

const getRowOrderedArray = (def = []) => [...def].sort((a, b) => a.row - b.row);
const getColOrderedArray = (def = []) => [...def].sort((a, b) => a.col - b.col);

const getNextRowBlock = (def = [], row) => {
  const ordered = getColOrderedArray(
    [...def].filter((block) => block.row === row + 1)
  );
  return ordered.length > 0 ? ordered[0] : undefined;
};

const getRowOrderedColOrderedArray = (def = []) => {
  const rowSorted = [...def].sort((a, b) => a.row - b.row);
  const rows = [];

  let row = 0;
  let cols = [];

  rowSorted.forEach((element) => {
    if (element.row !== row) {
      rows.push(cols.sort((a, b) => a.col - b.col));
      cols = [];
      row = element.row;
    }
    cols.push(element);
  });
  if (cols.length > 0) rows.push(cols.sort((a, b) => a.col - b.col));

  return rows;
};

const handleCreateChildParentRelation = (def = []) => {
  const groupByRows = def.reduce((group, child) => {
    const { row } = child;
    group[row] = group[row] ?? [];
    group[row].push(child);
    return group;
  }, {});

  const sortedCard = Object.values(groupByRows).reduce((prev, curr, index) => {
    prev[index] = curr.sort((a, b) => a.col - b.col);
    return prev;
  }, {});

  return Object.values(sortedCard).reduce(
    (prev, curr, index) => {
      prev.push({
        id: `droppable${2 * index + 1}`,
        children: curr,
      });
      prev.push({
        id: `droppable${2 * index + 2}`,
        children: [],
      });
      return prev;
    },
    [
      {
        id: "droppable0",
        children: [],
      },
    ]
  );
};

const rowColArray = {
  toString,
  moveItemToRow,
  findItem,
  getNextRowBlock,
  flattenArray,
  getRowOrderedArray,
  removeItemByCoordinates,
  removeItemById,
  calcRowColPositionsInArray,
  findItemCoordinates,
  getRowOrderedColOrderedArray,
  handleCreateChildParentRelation
};

export default rowColArray;
