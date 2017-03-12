'use babel';

import { CompositeDisposable } from 'atom';

export default {
  subscriptions: null,

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'slickwrap:toggle': () => this.toggle()
    }));
    // var editor = atom.workspace.getActiveTextEditor();
    // var editorView = atom.views.getView(editor);
    // this.subscriptions.add(
    //   editorView.addEventListener('', function(event) {
    //     console.log(event.key);
    //   }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    var editor = atom.workspace.getActiveTextEditor();
    var text = editor.getText();
    var lines = text.split(/\r?\n/);
    var endColumn = 80

    var resultLines = [];
    lines.map(function(line) {
      resultLines.push.apply(resultLines, adjusted(line, endColumn));
    });

    var newText = resultLines.join('\n');
    editor.setText(newText);
  },

};

function adjusted(line, limit) {
  var resultLines = [];
  if (line && line.length > limit) {
    var currentLength = 0;
    var currentLine = "";
    var lineRemaining = line;
    while (true) {
      var ws = lineRemaining.search(/\s/);
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
  return resultLines;
}
