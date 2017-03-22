'use babel';

export default {
  // side-effects free method to adjust text within
  // wrap guide
  wrapRow(row, text, guide) {
    var instructions = [];
    if (text === undefined || text == null) return instructions;
    // |i am a cake
    // |l         r
    var l = 0;
    var r = text.length - 1;

    // skip leading/trailing WS
    while (isWS(text[l]) && l < r) ++l;
    while (isWS(text[r]) && l < r) --r;

    while (r >= guide) {
      var instruction;
      var currentRow = row + instructions.length;
      if (l < guide) {
        instruction = searchLeftBlank(text, guide, l, currentRow);
        if (instruction == null) {
          instruction = searchRightBlank(text, l, r, currentRow);
        }
      }
      else {
        instruction = searchRightBlank(text, l, r, currentRow);
      }
      if (instruction == null) break;
      instructions.push(instruction);
      text = text.substr(instruction.to);
      l = 0;
      r = text.length - 1;
      while (isWS(text[r]) && l < r) --r;
    }
    return instructions;
  },
};

function searchLeftBlank(text, pivot, start, row) {
  var instruction;
  while (!isWS(text[pivot]) && pivot > start) --pivot;
  if (pivot > start) {
    var ll = pivot;
    while (isWS(text[ll])) --ll;
    var lr = pivot;
    while (isWS(text[lr])) ++lr;
    instruction = {
      row: row,
      from: ll+1,
      to: lr
    };
  }
  return instruction
}

function searchRightBlank(text, pivot, end, row) {
  var instruction;
  while (!isWS(text[pivot]) && pivot < end) ++pivot;
  if (pivot == end) return instruction;
  var rl = pivot;
  while (isWS(text[rl])) --rl;
  var rr = pivot;
  while (isWS(text[rr])) ++rr;
  instruction = {
    row: row,
    from: rl+1,
    to: rr
  };
  return instruction;
}

function isWS(ch) {
  return ch == ' ' || ch == '\t' || ch == '\n';
}
