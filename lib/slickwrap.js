'use babel';

import { CompositeDisposable, Disposable, Point, Range } from 'atom';

export default {
  subscriptions: null,

  config: {
    autoHardWrap: {
      type: 'boolean',
      default: true
    },
    columnGuide: {
      type: 'integer',
      default: 80
    }
  },

  // FIXME: May not work for Windows.
  newline: /\n/,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'slickwrap:toggle': () => this.toggle()
    }));

    // Register keyboard event.
    var editor = atom.workspace.getActiveTextEditor();
    var editorView = atom.views.getView(editor);
    this.subscribeEvent(editorView, 'keyup', (event) => {
      // keycode: 32 -> space, 13 -> enter, 9 -> tab
      var code = event.keyCode;
      if (code == 32 || code == 13 || code == 9) {
        if (atom.config.get('slickwrap.autoHardWrap')) {
          this.adjust(code);
        }
      }
    });
  },

  subscribeEvent(observed, type, callback) {
    observed.addEventListener(type, callback);
    this.subscriptions.add(new Disposable(() => {
      observed.removeEventListener(type, callback)}));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    this.adjust();
  },
    // var buffer = editor.getBuffer();
    // var cursorPosition = editor.getCursorBufferPosition();
    // var cursorIndex = buffer.characterIndexForPosition(cursorPosition);

  adjustRow(row) {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    var maxLen = atom.config.get('slickwrap.columnGuide');

    // if the line that contains cursor is longer than our limitation,
    // wrap the line at the closest whitespace before the limitation column.
    var text = buffer.lineForRow(row);
    console.log(text);


    // console.log(text);

    // text is longer than our column guide
    // adjust the currentline by inserting newline character(s).
    if (text.length > maxLen) {
      // |i am a cake
      // |l         r
      var l = 0;
      var r = text.length - 1;

      // skip white spaces
      while (this.isWS(text[l]) && l < r) ++l;
      while (this.isWS(text[r]) && l < r) --r;

      // the actual text is not exceeding boundary so ignore
      if (r < maxLen || l >= r) return;

      // find left "gap", if we can find any, wrap.
      if (l < maxLen) {
        var li = maxLen;
        while (!this.isWS(text[li]) && li > l) --li;
        if (li == l) {
          var ri = maxLen;
          while (!this.isWS(text[ri]) && ri < r) ++ ri;
          if (ri == r) return;
          var rl = ri;
          while (this.isWS(text[rl])) --rl;
          var rr = ri;
          while (this.isWS(text[rr])) ++rr;
          this.setText(row, rl+1, rr);
        }
        var ll = li;
        while (this.isWS(text[ll])) --ll;
        var lr = li;
        while (this.isWS(text[lr])) ++lr;
        this.setText(row, ll+1, lr);
      //   var left = new Point(cursor.row, wrap);
      //   var right = new Point(cursor.row, r + 1);
      //   buffer.setTextInRange(new Range(left, right), '\n');

      }

      // find right "gap" if no left "gap", and wrap if we find any



      // var r = text.length - 1
      //
      // // find the most recent whitespace character (' ' or '\t')
      // // ignore the leading spaces
      // var l = 0;
      // while (this.isWhiteSpace(text[l]) && l < cursor.column) {
      //   l += 1;
      // }
      //
      // r = maxLen
      // var r = cursor.column - 2 > maxLen ? maxLen : cursor.column - 2;
      // while (!this.isWhiteSpace(text[r]) && r > l) {
      //   r -= 1;
      // }
      //
      // var wrap = r;
      // while (wrap > l && this.isWhiteSpace(text[wrap - 1])) {
      //   wrap -= 1;
      // }
      //
      // if (wrap > l && wrap <= r) {
      //   var left = new Point(cursor.row, wrap);
      //   var right = new Point(cursor.row, r + 1);
      //   buffer.setTextInRange(new Range(left, right), '\n');
      // }

      // we wrap right after the character before ws
    }

  },

  setText(row, left, right) {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    var lbound = new Point(row, left);
    var rbound = new Point(row, right);
    buffer.setTextInRange(new Range(lbound, rbound), '\n');
  },

  // Adjust the current line and set cursor to the end.
  // mimicing the emacs behavior.
  adjust(code) {
    var editor = atom.workspace.getActiveTextEditor();
    var cursor = editor.getCursorBufferPosition();

    // if it's enter, we look at the previous row
    var row = (code == 13) ? cursor.row - 1 : cursor.row;

    this.adjustRow(row);

    // var editor = atom.workspace.getActiveTextEditor();
    // var endColumn = atom.config.get('slickwrap.columnGuide');
    // var cursorPos = editor.getCursorBufferPosition();
    // if (cursorPos.column <= endColumn) {
    //   return;
    // }
    //
    // var text = editor.getText();
    // var lines = text.split(/\r?\n/);
    // var resultLines = [];
    // var cursorPosition = editor.getCursorBufferPosition();
    // var i = 0;
    // while (i < lines.length) {
    //   resultLines.push.apply(resultLines, this.adjusted(lines[i], endColumn, pos, i));
    //   ++i;
    // }
    //
    // var len = resultLines.length;
    // if (len > 0) {
    //   // FIXME: This doesn't support windows.
    //   var newText = resultLines.join('\n');
    //   editor.setText(newText);
    //   var lastRow = len - 1;
    //   var lastCol = resultLines[len - 1].length - 1;
    //   editor.setCursorBufferPosition([lastRow, lastCol]);
    // }
  },

  isWS(ch) {
    return ch == ' ' || ch == '\t';
  },

  // adjusted(line, limit, cursorPosition, index) {
    // var resultLines = [];
    // if (line && line.length > limit) {
    //   var currentLength = 0;
    //   var currentLine = "";
    //   var lineRemaining = line;
    //   while (true) {
    //     var ws = lineRemaining.search(/\s/);
    //     if (ws < 0) {
    //       ws = lineRemaining.length - 1;
    //     }
    //     currentLength += (ws + 1);
    //     if (currentLength > limit) {
    //       break;
    //     }
    //     currentLine += lineRemaining.substring(0, ws + 1);
    //     lineRemaining = lineRemaining.substring(ws + 1);
    //   }
    //   resultLines.push(currentLine)
    //   resultLines.push.apply(resultLines, this.adjusted(lineRemaining, limit));
    // }
    // else {
    //   resultLines.push(line);
    // }
    // return resultLines;
  // },

};
