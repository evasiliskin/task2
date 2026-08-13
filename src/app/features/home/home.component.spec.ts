import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home.component';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should render the screening assignment heading, when the component is initialized', () => {
    const heading = element.querySelector('h1');
    expect(heading?.textContent).toContain('Frontend Team Lead Screening');
  });

  it('should show a foundation-ready status message via NG-ZORRO alert, when the component is initialized', () => {
    const alert = element.querySelector('nz-alert');
    expect(alert?.textContent).toContain('Foundation ready');
  });
});
