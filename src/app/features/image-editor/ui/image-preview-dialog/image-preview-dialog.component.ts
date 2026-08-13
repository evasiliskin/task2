import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
export class ImagePreviewDialog {
  private readonly imageEditorFacade = inject(ImageEditorFacade);
  protected readonly target = inject<ImagePreviewTarget>(NZ_MODAL_DATA);

  protected readonly polygon = toSignal(this.imageEditorFacade.polygonFor$(this.target.imageId), {
    initialValue: null,
  });

  protected onPolygonDrawn(points: readonly NormalizedPoint[]): void {
    this.imageEditorFacade.createPolygon(points, this.target.imageId);
  }

  protected onPolygonMoved(position: NormalizedPoint): void {
    this.imageEditorFacade.movePolygon(this.target.imageId, position);
  }

  protected onPolygonRotated(rotationRadians: number): void {
    this.imageEditorFacade.rotatePolygon(this.target.imageId, rotationRadians);
  }
}
