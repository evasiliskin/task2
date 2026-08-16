import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

const CONTENT_WRAPPER_SELECTOR = '.cdk-virtual-scroll-content-wrapper';

@Directive({ selector: '[appVirtualListSemantics]' })
export class VirtualListSemantics {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      this.host.nativeElement.querySelector(CONTENT_WRAPPER_SELECTOR)?.setAttribute('role', 'none');
    });
  }
}
