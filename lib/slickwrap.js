'use babel';

import { CompositeDisposable, Disposable, Point, Range } from 'atom';

export default {
  subscriptions: null,

  config: {
    autoHardWrap: {
      type: 'boolean',
      default: true
    },
    supportedFiles: {
      title: 'Supported File Extensions',
      description: 'separated by ,',
      type: 'array',
      default: ['md'],
      items: {
        type: 'string'
      }
    }
  },

  // FIXME: May not work for Windows.
  newline: /\n/,

  activate(state) {
    // Events subscribed to in atom's system can be
    // easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Using observeTextEditors can make sure all future
    // editors are getting this event subscription.
    atom.workspace.observeTextEditors((editor) => {
      // Register command that wraps the current buffer
      this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'slickwrap:wrap-buffer': () => this.wrapBuffer()
      }));

      var editorView = atom.views.getView(editor);
      this.subscribeEvent(editorView, 'keyup', (event) => {
        // keycode: 32 -> space, 13 -> enter, 9 -> tab
        var code = event.keyCode;
        var path = editor.getPath();
        var ext = path.substr((~-path.lastIndexOf(".") >>> 0) + 2);
        var supportedExts = atom.config.get('slickwrap.supportedFiles');
        var supported = (supportedExts.indexOf(ext) != -1);

        if ((code == 32 || code == 13 || code == 9) && supported) {
          if (atom.config.get('slickwrap.autoHardWrap')) {
            this.adjust(code);
          }
        }
      });
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

  wrapBuffer() {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    buffer.getLines().map((t, i) => this.adjustRow(i));
  },
    // var buffer = editor.getBuffer();
    // var cursorPosition = editor.getCursorBufferPosition();
    // var cursorIndex = buffer.characterIndexForPosition(cursorPosition);

  adjustRow(row) {
    var editor = atom.workspace.getActiveTextEditor();
    var buffer = editor.getBuffer();
    var maxLen = atom.config.get('editor.preferredLineLength');

    // if the line that contains cursor is longer than our limitation,
    // wrap the line at the closest whitespace before the limitation column.
    var text = buffer.lineForRow(row);

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
          return;
        }
        var ll = li;
        while (this.isWS(text[ll])) --ll;
        var lr = li;
        while (this.isWS(text[lr])) ++lr;
        this.setText(row, ll+1, lr);
      }
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
  },

  isWS(ch) {
    return ch == ' ' || ch == '\t';
  },

};
