import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app.component';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app, when instantiated', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render a router outlet, when the app is rendered', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('should render the app title in the header', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-shell__title')?.textContent).toContain(
      'Image Search',
    );
  });

  it('should render a skip link targeting the main region, when the shell renders', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a.skip-link');

    expect(link?.getAttribute('href')).toBe('#main-content');
  });
});
