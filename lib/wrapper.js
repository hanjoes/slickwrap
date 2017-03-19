'use babel';

import { CompositeDisposable, Disposable, Point, Range } from 'atom';

// Side-effects free.

export default {
  // side-effects free method to adjust text within
  // wrap guide
  wrapRow(row, text, guide) {
    // |i am a cake
    // |l         r
    var l = 0;
    var r = text.length - 1;
    var limit = guide;
    var incr = 0;
    var wrapInstructions = [];

    // skip white spaces
    while (this.isWS(text[l]) && l < r) ++l;
    while (this.isWS(text[r]) && l < r) --r;

    // text is longer than our column guide
    // adjust the currentline by inserting newline character(s).
    while (r >= limit) {
      var currentInst;
      var currentRow = row + incr;
      if (l < limit) {
        var li = limit;
        while (!this.isWS(text[li]) && li > l) --li;
        if (li == l) {
          var ri = l;
          while (!this.isWS(text[ri]) && ri < r) ++ri;
          if (ri == r) break;
          var rl = ri;
          while (this.isWS(text[rl])) --rl;
          var rr = ri;
          while (this.isWS(text[rr])) ++rr;
          currentInst = {
            row: currentRow,
            from: rl+1,
            to: rr
          };
        }
        else {
          var ll = li;
          while (this.isWS(text[ll])) --ll;
          var lr = li;
          while (this.isWS(text[lr])) ++lr;
          currentInst = {
            row: currentRow,
            from: ll+1,
            to: lr
          };
        }
      }
      else {
        var ri = l;
        while (!this.isWS(text[ri]) && ri < r) ++ri;
        if (ri == r) break;
        var rl = ri;
        while (this.isWS(text[rl])) --rl;
        var rr = ri;
        while (this.isWS(text[rr])) ++rr;
        currentInst = {
          row: currentRow,
          from: rl+1,
          to: rr
        };
      }
      wrapInstructions.push(currentInst);
      text = text.substr(currentInst.to);
      l = 0;
      r = text.length - 1;
      incr += 1;
    }
    return wrapInstructions;
  },

  isWS(ch) {
    return ch == ' ' || ch == '\t' || ch == '\n';
  },
};
