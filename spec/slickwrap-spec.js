'use babel';

import Slickwrap from '../lib/slickwrap';

describe('Slickwrap', () => {
  let workspaceElement;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('slickwrap');
  });

  describe('When wrapText is called on some text.', () => {
    it('has no effect on empty text', () => {
      expect(Slickwrap.wrapText('', 80)).toEqual({
        increment: 0,
        text: ''
      });
    });

    it('does not wrap when guide is longer', () => {
      var text = 'Hello World!\n';
      expect(Slickwrap.wrapText(text, 80)).toEqual({
        increment: 0,
        text: text
      });
    });

    it('can correctly insert newline on the left of the guide', () => {
      var text = 'Hello World !\n';
      expect(Slickwrap.wrapText(text, 10)).toEqual({
        increment: 1,
        text: 'Hello\nWorld !\n'
      });
    });

    it('can correctly insert newline on the right of the guide', () => {
      var text = 'Hello Hello\n';
      expect(Slickwrap.wrapText(text, 4)).toEqual({
        increment: 1,
        text: 'Hello\nHello\n'
      });
    });

    it('can correctly insert newline when guide is on WS', () => {
      var text = 'Hello   Hello ';
      expect(Slickwrap.wrapText(text, 7)).toEqual({
        increment: 1,
        text: 'Hello\nHello '
      });
    });

    it('has no effect when there is only one long word', () => {
      var text = 'HelloHello';
      expect(Slickwrap.wrapText(text, 4)).toEqual({
        increment: 0,
        text: text
      });
    });

    it('has no effect when there is only one word to the left', () => {
      var text = '        HelloHello';
      expect(Slickwrap.wrapText(text, 5)).toEqual({
        increment: 0,
        text: text
      });
    });

    it('can correctly insert wrap when 2 words are to the left', () => {
      var text = '        Hello  Hello';
      expect(Slickwrap.wrapText(text, 5)).toEqual({
        increment: 1,
        text: '        Hello\nHello'
      });
    });

    it('will not insert wrap when the last letter is not exceeding', () => {
      var text = 'Hello  Hello\n';
      expect(Slickwrap.wrapText(text, 12)).toEqual({
        increment: 0,
        text: text
      });
    });

    it('can wrap long rows to multiple lines', () => {
      var text = 'Hello  Hello  Hello  Hello  Hello  Hello\n';
      expect(Slickwrap.wrapText(text, 3)).toEqual({
        increment: 5,
        text: 'Hello\nHello\nHello\nHello\nHello\nHello\n'
      });
    });
  });
});
