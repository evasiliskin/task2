import { Injectable, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { take } from 'rxjs/operators';
import { ImagePreviewTarget } from '../../domain/image-preview-target.model';

@Injectable({ providedIn: 'root' })
export class ImagePreviewDialogService {
  private readonly modalService = inject(NzModalService);

  async open(target: ImagePreviewTarget): Promise<void> {
    const triggerElement = document.activeElement as HTMLElement | null;

    try {
      const { ImagePreviewDialog } = await import('./image-preview-dialog.component');
      const modalRef = this.modalService.create({
        nzTitle: target.title,
        nzContent: ImagePreviewDialog,
        nzData: target,
        nzFooter: null,
        nzWidth: 'min(720px, calc(100vw - 32px))',
        nzCentered: true,
      });
      modalRef.afterClose.pipe(take(1)).subscribe(() => {
        triggerElement?.focus();
      });
    } catch {
      triggerElement?.focus();
    }
  }
}
