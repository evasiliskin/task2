import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { ImagePreviewTarget } from '../../domain/image-preview-target.model';
import { NormalizedPoint } from '../../domain/normalized-point.model';
import { ImageEditorFacade } from '../../image-editor.facade';
import { PolygonCanvas } from '../polygon-canvas/polygon-canvas.component';

@Component({
  selector: 'app-image-preview-dialog',
  imports: [PolygonCanvas],
  templateUrl: './image-preview-dialog.component.html',
  styleUrl: './image-preview-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewDialog implements AfterViewInit {
  private readonly imageEditorFacade = inject(ImageEditorFacade);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  protected readonly target = inject<ImagePreviewTarget>(NZ_MODAL_DATA);

  protected readonly polygon = toSignal(this.imageEditorFacade.polygonFor$(this.target.imageId), {
    initialValue: null,
  });

  ngAfterViewInit(): void {
    const dialogEl = this.elementRef.nativeElement.closest('[role="dialog"]');
    const titleEl = dialogEl?.querySelector('.ant-modal-title');
    if (!dialogEl || !titleEl) {
      return;
    }

    if (!titleEl.id) {
      this.renderer.setAttribute(titleEl, 'id', 'image-preview-dialog-title');
    }
    this.renderer.setAttribute(dialogEl, 'aria-modal', 'true');
    this.renderer.setAttribute(dialogEl, 'aria-labelledby', titleEl.id);
  }

  protected onPolygonDrawn(points: readonly NormalizedPoint[]): void {
    this.imageEditorFacade.createPolygon(points, this.target.imageId);
  }

  protected onPolygonMoved(position: NormalizedPoint): void {
    this.imageEditorFacade.movePolygon(this.target.imageId, position);
  }

  protected onPolygonRotated(rotationRadians: number): void {
    this.imageEditorFacade.rotatePolygon(this.target.imageId, rotationRadians);
  }

  protected onPolygonDeleted(): void {
    this.imageEditorFacade.deletePolygon(this.target.imageId);
  }
}
