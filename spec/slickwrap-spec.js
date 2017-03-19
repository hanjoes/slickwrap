'use babel';

import Slickwrap from '../lib/slickwrap';

describe('Slickwrap', () => {
  let workspaceElement;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('slickwrap');
  });

  describe('when the slickwrap:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.slickwrap')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'slickwrap:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.slickwrap')).toExist();

        let slickwrapElement = workspaceElement.querySelector('.slickwrap');
        expect(slickwrapElement).toExist();

        let slickwrapPanel = atom.workspace.panelForItem(slickwrapElement);
        expect(slickwrapPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'slickwrap:toggle');
        expect(slickwrapPanel.isVisible()).toBe(false);
      });
    });
  });
});
