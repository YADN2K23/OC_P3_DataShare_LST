import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Download } from './download';
import { FileService } from '../../core/services/file.service';

describe('Download (integration)', () => {
  let fileService: jasmine.SpyObj<FileService>;
  let routeStub: any;

  beforeEach(async () => {
    fileService = jasmine.createSpyObj<FileService>('FileService', ['downloadSharedFile']);
    routeStub = {
      snapshot: {
        paramMap: {
          get: (key: string) => (key === 'token' ? 'abc123' : null),
        },
        queryParamMap: {
          get: () => null,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [Download],
      providers: [
        provideRouter([]),
        { provide: FileService, useValue: fileService },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    spyOn(window.URL, 'createObjectURL').and.returnValue('blob://test');
    spyOn(window.URL, 'revokeObjectURL').and.callFake(() => {});
  });

  it('lit le token depuis la route au init', () => {
    const fixture = TestBed.createComponent(Download);
    fixture.detectChanges();

    expect(fixture.componentInstance.token).toBe('abc123');
  });

  it('prend en compte le state=warn depuis query params', () => {
    routeStub.snapshot.queryParamMap.get = (key: string) => (key === 'state' ? 'warn' : null);
    const fixture = TestBed.createComponent(Download);
    fixture.detectChanges();

    expect(fixture.componentInstance.state).toBe('warn');
    expect(fixture.componentInstance.canDownload).toBeTrue();
  });

  it('force l etat expired si token absent', () => {
    routeStub.snapshot.paramMap.get = () => null;
    const fixture = TestBed.createComponent(Download);
    fixture.detectChanges();

    expect(fixture.componentInstance.state).toBe('expired');
    expect(fixture.componentInstance.canDownload).toBeFalse();
  });

  it('declenche le download partagé', () => {
    fileService.downloadSharedFile.and.returnValue(of(new Blob(['ok'])));
    const fixture = TestBed.createComponent(Download);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.password = 'secret';

    component.onDownloadShared();

    expect(fileService.downloadSharedFile).toHaveBeenCalledWith('abc123', 'secret');
  });

  it('bloque le download si mot de passe vide en mode pwd', () => {
    const fixture = TestBed.createComponent(Download);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.password = '   ';
    component.onDownloadShared();

    expect(component.error).toContain('mot de passe');
    expect(fileService.downloadSharedFile).not.toHaveBeenCalled();
  });

  it('affiche une erreur si download partagé echoue', () => {
    fileService.downloadSharedFile.and.returnValue(throwError(() => new Error('expired')));
    const fixture = TestBed.createComponent(Download);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.password = 'secret';

    component.onDownloadShared();

    expect(component.error).toContain('expire');
    expect(component.state).toBe('expired');
    expect(component.isDownloading).toBeFalse();
  });
});


