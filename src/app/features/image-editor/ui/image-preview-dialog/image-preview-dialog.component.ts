import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  protected readonly polygons = this.imageEditorFacade.polygonsFor(this.target.imageId);
  protected readonly selectedPolygon = this.imageEditorFacade.selectedPolygonFor(
    this.target.imageId,
  );

  protected onPolygonDrawn(points: readonly NormalizedPoint[]): void {
    this.imageEditorFacade.createPolygon(points, this.target.imageId);
  }

  protected onPolygonMoved(event: { polygonId: string; position: NormalizedPoint }): void {
    this.imageEditorFacade.movePolygon(event.polygonId, event.position);
  }

  protected onPolygonRotated(event: { polygonId: string; rotationRadians: number }): void {
    this.imageEditorFacade.rotatePolygon(event.polygonId, event.rotationRadians);
  }

  protected onPolygonScaled(event: { polygonId: string; scale: number }): void {
    this.imageEditorFacade.scalePolygon(event.polygonId, event.scale);
  }

  protected onPolygonDeleted(polygonId: string): void {
    this.imageEditorFacade.deletePolygon(polygonId);
  }

  protected onPolygonSelected(polygonId: string | null): void {
    this.imageEditorFacade.selectPolygon(polygonId);
  }
}
