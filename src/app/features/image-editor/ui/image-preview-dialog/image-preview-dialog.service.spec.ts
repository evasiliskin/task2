import { TestBed } from '@angular/core/testing';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import { ImagePreviewTarget } from '../../domain/image-preview-target.model';
import { ImagePreviewDialogService } from './image-preview-dialog.service';

const target: ImagePreviewTarget = {
  imageId: 'image-1',
  imageUrl: 'https://example.test/full.jpg',
  title: 'A mountain',
  width: 1600,
  height: 900,
};

describe('ImagePreviewDialogService', () => {
  let create: ReturnType<typeof vi.fn>;
  let service: ImagePreviewDialogService;

  beforeEach(() => {
    create = vi.fn().mockReturnValue({ afterClose: of(undefined) });
    TestBed.configureTestingModule({
      providers: [
        ImagePreviewDialogService,
        { provide: NzModalService, useValue: { create } },
      ],
    });
    service = TestBed.inject(ImagePreviewDialogService);
  });

  it('should open a modal titled with the target and carrying the target as data', async () => {
    await service.open(target);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].nzTitle).toBe('A mountain');
    expect(create.mock.calls[0][0].nzData).toEqual(target);
  });

  it('should restore focus to the triggering element, when the modal closes', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const focusSpy = vi.spyOn(trigger, 'focus');

    await service.open(target);

    expect(focusSpy).toHaveBeenCalled();
    trigger.remove();
  });

  it('should resolve without throwing, when the modal cannot be created', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    create.mockImplementation(() => {
      throw new Error('chunk load failed');
    });

    await expect(service.open(target)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to open the image preview dialog',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});
