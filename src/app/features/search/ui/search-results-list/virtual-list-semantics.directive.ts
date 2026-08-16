import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

const CONTENT_WRAPPER_SELECTOR = '.cdk-virtual-scroll-content-wrapper';

/**
 * `cdk-virtual-scroll-viewport` renders projected rows inside its own content wrapper, which has
 * no role — that breaks `list` -> `listitem` ownership for assistive technology. Marking the
 * wrapper presentational removes it from the accessibility tree so the rows re-parent to the list.
 */
@Directive({ selector: '[appVirtualListSemantics]' })
export class VirtualListSemantics {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      this.host.nativeElement.querySelector(CONTENT_WRAPPER_SELECTOR)?.setAttribute('role', 'none');
    });
  }
}
