import { DOCUMENT, Injectable, inject, isDevMode } from '@angular/core';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { take } from 'rxjs/operators';
import { ImagePreviewTarget } from '../../domain/image-preview-target.model';

const DIALOG_TITLE_ID = 'image-preview-dialog-title';

@Injectable({ providedIn: 'root' })
export class ImagePreviewDialogService {
  private readonly modalService = inject(NzModalService);
  private readonly document = inject(DOCUMENT);
  private activeModal: NzModalRef<unknown> | null = null;
  private opening = false;

  async open(target: ImagePreviewTarget): Promise<void> {
    if (this.opening || this.activeModal) {
      return;
    }
    this.opening = true;

    const trigger = this.document.activeElement;

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

      this.opening = false;
      this.activeModal = modalRef;
      modalRef.afterOpen.pipe(take(1)).subscribe(() => this.labelDialog(modalRef));
      modalRef.afterClose.pipe(take(1)).subscribe(() => {
        this.activeModal = null;
        if (trigger instanceof HTMLElement) {
          trigger.focus();
        }
      });
    } catch (error) {
      this.opening = false;
      if (trigger instanceof HTMLElement) {
        trigger.focus();
      }
      throw error;
    }
  }

  private labelDialog(modalRef: NzModalRef<unknown>): void {
    const dialogEl = modalRef.getElement();
    const titleEl = dialogEl.querySelector('.ant-modal-title');

    if (!titleEl) {
      if (isDevMode()) {
        throw new Error(
          'Image preview dialog markup changed: expected [role="dialog"] with .ant-modal-title.',
        );
      }
      return;
    }

    if (!titleEl.id) {
      titleEl.id = DIALOG_TITLE_ID;
    }
    dialogEl.setAttribute('aria-modal', 'true');
    dialogEl.setAttribute('aria-labelledby', titleEl.id);
  }
}
