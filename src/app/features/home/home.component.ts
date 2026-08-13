import { Component } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-home',
  imports: [NzCardModule, NzAlertModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class Home {}
