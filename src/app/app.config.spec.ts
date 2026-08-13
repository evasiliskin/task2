import { TestBed } from '@angular/core/testing';
import { NzModalService } from 'ng-zorro-antd/modal';
import { appConfig } from './app.config';
import { ImageEditorFacade } from './features/image-editor/image-editor.facade';

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
  });

  it('should provide NzModalService, when bootstrapped with the real app providers', () => {
    expect(() => TestBed.inject(NzModalService)).not.toThrow();
  });

  it('should provide ImageEditorFacade with a working NzModalService dependency, when bootstrapped with the real app providers', () => {
    expect(() => TestBed.inject(ImageEditorFacade)).not.toThrow();
  });
});
