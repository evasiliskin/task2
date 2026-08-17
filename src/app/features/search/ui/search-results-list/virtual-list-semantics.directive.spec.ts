import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VirtualListSemantics } from './virtual-list-semantics.directive';

@Component({
  selector: 'app-virtual-list-semantics-host',
  imports: [VirtualListSemantics],
  template: `
    <div appVirtualListSemantics>
      @if (hasContentWrapper) {
        <div class="cdk-virtual-scroll-content-wrapper">
          <div class="item">row</div>
        </div>
      }
    </div>
  `,
})
class HostComponent {
  hasContentWrapper = true;
}

describe('VirtualListSemantics', () => {
  async function render(hasContentWrapper = true): Promise<ComponentFixture<HostComponent>> {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.hasContentWrapper = hasContentWrapper;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return fixture;
  }

  it('should mark the cdk content wrapper as presentational, when the host renders', async () => {
    const fixture = await render();

    const wrapper = fixture.nativeElement.querySelector('.cdk-virtual-scroll-content-wrapper');
    expect(wrapper.getAttribute('role')).toBe('none');
  });

  it('should not add a role to the host element, when the host renders', async () => {
    const fixture = await render();

    const host = fixture.nativeElement.querySelector('[appVirtualListSemantics]');
    expect(host.getAttribute('role')).toBeNull();
  });

  it('should leave the host untouched, when there is no cdk content wrapper', async () => {
    const fixture = await render(false);

    const host = fixture.nativeElement.querySelector('[appVirtualListSemantics]');
    expect(host.children).toHaveLength(0);
  });
});
