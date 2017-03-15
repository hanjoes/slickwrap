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
          this.adjust();
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

  // Adjust the current line and set cursor to the end.
  // mimicing the emacs behavior.
  adjust() {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    var cursor = editor.getCursorBufferPosition();
    var maxLen = atom.config.get('slickwrap.columnGuide');

    // if the line that contains cursor is longer than our limitation,
    // wrap the line at the closest whitespace before the limitation column.
    var begin = new Point(cursor.row, 0);
    var text = editor.getTextInBufferRange(new Range(begin, cursor));
    console.log(begin);
    console.log(cursor);
    // console.log(text);

    // text is longer than our column guide
    // adjust the currentline by inserting newline character(s).
    if (text.length > maxLen) {
      // find the most recent whitespace character (' ' or '\t')
      // ignore the leading spaces
      var l = 0;
      while (this.isWhiteSpace(text[l]) && l < cursor.column) {
        l += 1;
      }

      var r = cursor.column - 2 > maxLen ? maxLen : cursor.column - 2;
      while (!this.isWhiteSpace(text[r]) && r > l) {
        r -= 1;
      }

      var wrap = r;
      while (wrap > l && this.isWhiteSpace(text[wrap - 1])) {
        wrap -= 1;
      }

      if (wrap > l && wrap <= r) {
        var left = new Point(cursor.row, wrap);
        var right = new Point(cursor.row, r + 1);
        buffer.setTextInRange(new Range(left, right), '\n');
      }

      // we wrap right after the character before ws
    }

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

  isWhiteSpace(ch) {
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
