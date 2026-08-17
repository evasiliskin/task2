import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { APP_CONFIG } from '@core/config/app-config.token';
import { Seo } from '@core/seo/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly siteName = inject(APP_CONFIG).seo.siteName;

  constructor() {
    inject(Seo).apply();
  }
}
