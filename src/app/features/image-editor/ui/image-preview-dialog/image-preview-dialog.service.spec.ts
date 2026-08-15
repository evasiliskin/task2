import { TestBed } from '@angular/core/testing';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of, Subject } from 'rxjs';
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
  let openModals: unknown[];
  let afterOpen: Subject<void>;
  let service: ImagePreviewDialogService;
  let modalElement: HTMLElement;

  beforeEach(() => {
    openModals = [];
    afterOpen = new Subject<void>();
    modalElement = document.createElement('div');
    modalElement.setAttribute('role', 'dialog');
    create = vi.fn().mockImplementation(() => {
      const modalRef = {
        afterOpen,
        afterClose: of(undefined),
        getElement: () => modalElement,
      };
      openModals.push(modalRef);
      return modalRef;
    });
    TestBed.configureTestingModule({
      providers: [
        ImagePreviewDialogService,
        {
          provide: NzModalService,
          useValue: {
            create,
            get openModals() {
              return openModals;
            },
          },
        },
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

  it('should reject and restore focus to the triggering element, when the modal cannot be created', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const focusSpy = vi.spyOn(trigger, 'focus');
    const error = new Error('chunk load failed');
    create.mockImplementation(() => {
      throw error;
    });

    await expect(service.open(target)).rejects.toThrow(error);

    expect(focusSpy).toHaveBeenCalled();
    trigger.remove();
  });

  it('should open a single modal, when open is called twice in a row', async () => {
    const service = TestBed.inject(ImagePreviewDialogService);

    await Promise.all([service.open(target), service.open(target)]);

    expect(TestBed.inject(NzModalService).openModals).toHaveLength(1);
  });

  it('sets aria-modal and aria-labelledby on the dialog container, referencing the ant-modal-title element', async () => {
    const titleEl = document.createElement('div');
    titleEl.className = 'ant-modal-title';
    modalElement.appendChild(titleEl);

    await service.open(target);
    afterOpen.next();

    expect(modalElement.getAttribute('aria-modal')).toBe('true');
    const labelledBy = modalElement.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(titleEl.id).toBe(labelledBy);
  });

  it('should log a diagnostic and leave the dialog usable, when the expected title element is missing', () => {
    const serviceWithPrivateAccess = service as unknown as {
      labelDialog(modalRef: { getElement(): HTMLElement }): void;
    };
    const emptyModalRef = { getElement: () => document.createElement('div') };
    const labelDialogWithMissingTitle = () => serviceWithPrivateAccess.labelDialog(emptyModalRef);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => labelDialogWithMissingTitle()).not.toThrow();
    expect(error).toHaveBeenCalled();
  });
});
