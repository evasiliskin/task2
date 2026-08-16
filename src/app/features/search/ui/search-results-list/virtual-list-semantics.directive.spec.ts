import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VirtualListSemantics } from './virtual-list-semantics.directive';

@Component({
  selector: 'app-virtual-list-semantics-host',
  imports: [VirtualListSemantics],
  template: `
    <div appVirtualListSemantics>
      <div class="cdk-virtual-scroll-content-wrapper">
        <div class="item">row</div>
      </div>
    </div>
  `,
})
class HostComponent {}

describe('VirtualListSemantics', () => {
  it('should mark the cdk content wrapper as presentational, when the host renders', async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.cdk-virtual-scroll-content-wrapper');
    expect(wrapper.getAttribute('role')).toBe('none');
  });

  it('should not add a role to the host element, when the host renders', async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('[appVirtualListSemantics]');
    expect(host.getAttribute('role')).toBeNull();
  });
});
