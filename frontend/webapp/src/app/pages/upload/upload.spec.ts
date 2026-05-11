import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Upload } from './upload';
import { FileService } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';

describe('Upload (integration)', () => {
  let fileService: jasmine.SpyObj<FileService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    fileService = jasmine.createSpyObj<FileService>('FileService', [
      'uploadFile',
      'createShareLink',
      'cacheUploadPreferences',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasToken']);
    authService.hasToken.and.returnValue(true);

    fileService.uploadFile.and.returnValue(
      of({
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        size: 5 * 1024 * 1024,
        contentType: 'text/plain',
      })
    );
    fileService.createShareLink.and.returnValue(
      of({
        token: 'abc',
        expiresAt: '2026-04-11T20:00:00Z',
        shareUrl: 'http://x/y',
        storedFileName: 'stored.txt',
      })
    );

    await TestBed.configureTestingModule({
      imports: [Upload],
      providers: [
        provideRouter([]),
        { provide: FileService, useValue: fileService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('refuse les fichiers au-dessus de la limite autorisée', () => {
    const fixture = TestBed.createComponent(Upload);
    const component = fixture.componentInstance;

    const tooBigFile = {
      name: 'big.bin',
      size: component.maxFileSizeBytes + 1,
      type: 'application/pdf',
    } as File;

    component.onFileSelected({ target: { files: [tooBigFile] } });

    expect(component.error).toContain('1 Go');
    expect(component.selectedFile).toBeNull();
  });

  it('refuse un type de fichier non autorise', () => {
    const fixture = TestBed.createComponent(Upload);
    const component = fixture.componentInstance;

    const badFile = new File(['x'], 'bad.exe', { type: 'application/octet-stream' });
    component.onFileSelected({ target: { files: [badFile] } });

    expect(component.error).toContain('Type non autorisé');
    expect(component.selectedFile).toBeNull();
  });

  it('accepte un fichier valide et nettoie l erreur', () => {
    const fixture = TestBed.createComponent(Upload);
    const component = fixture.componentInstance;
    component.error = 'ancienne erreur';

    const okFile = new File(['x'], 'ok.txt', { type: 'text/plain' });
    component.onFileSelected({ target: { files: [okFile] } });

    expect(component.selectedFile?.name).toBe('ok.txt');
    expect(component.error).toBe('');
  });

  it('initialise selectedFile depuis history.state', () => {
    history.replaceState({ pickedFile: new File(['hello'], 'hello.txt', { type: 'text/plain' }) }, '');

    const fixture = TestBed.createComponent(Upload);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedFile?.name).toBe('hello.txt');
  });

  it('refuse l upload sans fichier', () => {
    const fixture = TestBed.createComponent(Upload);
    const component = fixture.componentInstance;

    component.onUpload();

    expect(component.error).toContain('sélectionner un fichier');
    expect(fileService.uploadFile).not.toHaveBeenCalled();
  });

  it('upload + partage reussis redirigent vers /upload/confirm avec les infos UI', () => {
    const fixture = TestBed.createComponent(Upload);
    const component = fixture.componentInstance;
    component.selectedFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    component.expirationDays = '3';
    component.uploadPassword = 'mon-secret';

    component.onUpload();

    expect(fileService.uploadFile).toHaveBeenCalledWith(component.selectedFile!, 'mon-secret');
    expect(fileService.cacheUploadPreferences).toHaveBeenCalledWith('stored.txt', true);
    expect(fileService.createShareLink).toHaveBeenCalledWith('stored.txt', 3 * 86400);
    expect(router.navigate).toHaveBeenCalledWith(['/upload/confirm'], {
      state: {
        fileName: 'hello.txt',
        fileSizeLabel: '5.00 Mo',
        expirationLabel: '3 jours',
        shareUrl: 'http://x/y',
      },
    });
  });

  it('si la creation du lien echoue, redirige quand meme vers la confirmation', () => {
    fileService.createShareLink.and.returnValue(throwError(() => new Error('share failed')));

    const fixture = TestBed.createComponent(Upload);
    const component = fixture.componentInstance;
    component.selectedFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    component.onUpload();

    expect(router.navigate).toHaveBeenCalledWith(['/upload/confirm'], {
      state: jasmine.objectContaining({
        fileName: 'hello.txt',
        shareUrl: '',
      }),
    });
  });

  it('affiche Mon espace si authentifie', () => {
    authService.hasToken.and.returnValue(true);

    const fixture = TestBed.createComponent(Upload);
    fixture.detectChanges();

    const navButton = fixture.nativeElement.querySelector('.btn-nav') as HTMLButtonElement;
    expect(navButton?.textContent?.trim()).toBe('Mon espace');
  });

  it('affiche une erreur si upload echoue', () => {
    fileService.uploadFile.and.returnValue(throwError(() => new Error('upload failed')));

    const fixture = TestBed.createComponent(Upload);
    const component = fixture.componentInstance;
    component.selectedFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    component.onUpload();

    expect(component.error).toContain('téléversement');
    expect(component.isLoading).toBeFalse();
  });
});

