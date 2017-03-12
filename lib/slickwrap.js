'use babel';

import { CompositeDisposable } from 'atom';

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

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'slickwrap:toggle': () => this.toggle()
    }));
    var editor = atom.workspace.getActiveTextEditor();
    var editorView = atom.views.getView(editor);
    editorView.addEventListener('keyup', function(event) {
      // keycode: 32 -> space, 13 -> enter, 9 -> tab
      var code = event.keyCode;
      if (code == 32 || code == 13 || code == 9) {
        if (atom.config.get('slickwrap.autoHardWrap')) {
          adjust();
        }
      }
    });
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    adjust();
  },

};

function adjust() {
  var editor = atom.workspace.getActiveTextEditor();
  var endColumn = atom.config.get('slickwrap.columnGuide');
  var cursorPos = editor.getCursorBufferPosition();
  if (cursorPos.column <= endColumn) {
    return;
  }

  var text = editor.getText();
  var lines = text.split(/\r?\n/);
  var resultLines = [];
  lines.map(function(line) {
    resultLines.push.apply(resultLines, adjusted(line, endColumn));
  });

  var len = resultLines.length;
  if (len > 0) {
    var newText = resultLines.join('\n');
    editor.setText(newText);
    var lastRow = len - 1;
    var lastCol = resultLines[len - 1].length - 1;
    editor.setCursorBufferPosition([lastRow, lastCol]);
  }
}

function adjusted(line, limit) {
  // console.log('-------input');
  // console.log(line);
  var resultLines = [];
  if (line && line.length > limit) {
    var currentLength = 0;
    var currentLine = "";
    var lineRemaining = line;
    while (true) {
      var ws = lineRemaining.search(/\s/);
      if (ws < 0) {
        ws = lineRemaining.length - 1;
      }
      currentLength += (ws + 1);
      if (currentLength > limit) {
        break;
      }
      currentLine += lineRemaining.substring(0, ws + 1);
      lineRemaining = lineRemaining.substring(ws + 1);
    }
    resultLines.push(currentLine)
    resultLines.push.apply(resultLines, adjusted(lineRemaining, limit));
  }
  else {
    resultLines.push(line);
  }
  // console.log('-------output');
  // console.log(resultLines);
  return resultLines;
}
