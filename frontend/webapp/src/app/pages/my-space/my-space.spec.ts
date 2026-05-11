import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { MySpace } from './my-space';
import { AuthService } from '../../core/services/auth.service';
import { FileService } from '../../core/services/file.service';

describe('MySpace (integration)', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let fileService: jasmine.SpyObj<FileService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getMe', 'logout']);
    fileService = jasmine.createSpyObj<FileService>('FileService', ['listFiles', 'listHistory', 'deleteFile', 'downloadFile', 'mergeWithCachedPreferences', 'clearCachedPreferences']);
    fileService.listFiles.and.returnValue(of([]));
    fileService.listHistory.and.returnValue(of([]));
    fileService.mergeWithCachedPreferences.and.callFake((files) => files);

    await TestBed.configureTestingModule({
      imports: [MySpace],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: FileService, useValue: fileService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('charge le username au init', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));

    const fixture = TestBed.createComponent(MySpace);
    fixture.detectChanges();

    expect(fixture.componentInstance.userName).toBe('john@doe.fr');
    expect(fileService.listFiles).toHaveBeenCalled();
  });

  it('redirige vers /login si getMe echoue', () => {
    authService.getMe.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    const fixture = TestBed.createComponent(MySpace);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(authService.logout).toHaveBeenCalled();
  });

  it('affiche une erreur de session pour un autre code HTTP que 401', () => {
    authService.getMe.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const fixture = TestBed.createComponent(MySpace);
    fixture.detectChanges();

    expect(fileService.listFiles).toHaveBeenCalled();
    expect(fileService.listHistory).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalledWith(['/login']);
  });

  it('logout deconnecte puis redirige vers /', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));

    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;

    component.onLogout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('charge les fichiers dans la liste', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    fileService.listFiles.and.returnValue(
      of([
        {
          storedFileName: 'stored.txt',
          originalFileName: 'hello.txt',
          contentType: 'text/plain',
          size: 5,
          createdAt: '2026-04-11T00:00:00Z',
          passwordProtected: false,
        },
      ])
    );

    const fixture = TestBed.createComponent(MySpace);
    fixture.detectChanges();

    expect(fixture.componentInstance.files.length).toBe(1);
    expect(fixture.componentInstance.files[0].originalFileName).toBe('hello.txt');
  });

  it('utilise le cache local pour enrichir les fichiers listes', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    fileService.listFiles.and.returnValue(
      of([
        {
          storedFileName: 'stored.txt',
          originalFileName: 'hello.pdf',
          contentType: 'application/pdf',
          size: 5,
          createdAt: '2026-04-11T00:00:00Z',
        },
      ])
    );

    fileService.mergeWithCachedPreferences.and.callFake((files) => [
      {
        ...files[0],
        passwordProtected: true,
        expiresAt: '2026-04-18T00:00:00Z',
      },
    ]);

    const fixture = TestBed.createComponent(MySpace);
    fixture.detectChanges();

    expect(fileService.mergeWithCachedPreferences).toHaveBeenCalled();
    expect(fixture.componentInstance.files[0].passwordProtected).toBeTrue();
  });

  it('onDeleteFile supprime localement l item après succès API', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    fileService.deleteFile.and.returnValue(of(void 0));

    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;
    component.files = [
      {
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        contentType: 'text/plain',
        size: 5,
        createdAt: '2026-04-11T00:00:00Z',
        passwordProtected: true,
        expiresAt: '2026-04-18T00:00:00Z',
      },
    ];

    component.onDeleteFile('stored.txt');

    expect(fileService.deleteFile).toHaveBeenCalledWith('stored.txt');
    expect(fileService.clearCachedPreferences).toHaveBeenCalledWith('stored.txt');
    expect(component.files.length).toBe(0);
  });

  it('gere une erreur de suppression', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    fileService.deleteFile.and.returnValue(throwError(() => new Error('delete failed')));

    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;
    component.onDeleteFile('stored.txt');

    expect(component.filesError).toContain('Suppression');
  });

  it('gere une erreur de telechargement', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    fileService.downloadFile.and.returnValue(throwError(() => new Error('download failed')));

    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;
    component.onDownloadFile('stored.txt');

    expect(component.filesError).toContain('Telechargement');
  });

  it('retourne une icone et detecte la protection mot de passe', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;

    const file = {
      storedFileName: 'image.png',
      originalFileName: 'image.png',
      contentType: 'image/png',
      size: 12,
      createdAt: '2026-04-11T00:00:00Z',
      passwordProtected: true,
      expiresAt: '2026-04-18T00:00:00Z',
    };

    expect(component.fileIcon(file)).toBe('IMG');
    expect(component.isProtected(file)).toBeTrue();
  });

  it('couvre les autres icones et branches de date', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;

    spyOn(Date, 'now').and.returnValue(new Date('2026-04-17T00:00:00Z').getTime());

    expect(component.fileIcon({ storedFileName: 'a', originalFileName: 'a.txt', contentType: 'text/plain', size: 1, createdAt: '2026-04-10T00:00:00Z' } as any)).toBe('TXT');
    expect(component.fileIcon({ storedFileName: 'b', originalFileName: 'b.bin', contentType: 'application/octet-stream', size: 1, createdAt: '2026-04-10T00:00:00Z' } as any)).toBe('FILE');
    expect(component.fileIcon({ storedFileName: 'c', originalFileName: 'c.pdf', contentType: 'application/pdf', size: 1, createdAt: '2026-04-10T00:00:00Z' } as any)).toBe('PDF');
    expect(component.isExpired({ storedFileName: 'd', originalFileName: 'd.txt', contentType: 'text/plain', size: 1, createdAt: '2026-04-10T00:00:00Z', expiresAt: '2026-04-16T00:00:00Z' } as any)).toBeTrue();
    expect(component.expirationLabel({ storedFileName: 'e', originalFileName: 'e.txt', contentType: 'text/plain', size: 1, createdAt: '2026-04-10T00:00:00Z', expiresAt: '2026-04-18T00:00:00Z' } as any)).toContain('Expire demain');
    expect(component.expirationLabel({ storedFileName: 'f', originalFileName: 'f.txt', contentType: 'text/plain', size: 1, createdAt: 'bad-date' } as any)).toBe('Actif');
  });

  it('couvre les filtres et toggles UI', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;

    spyOn(Date, 'now').and.returnValue(new Date('2026-05-10T00:00:00Z').getTime());

    component.files = [
      { storedFileName: 'a', originalFileName: 'a.txt', contentType: 'text/plain', size: 1, createdAt: '2026-05-01T00:00:00Z', expiresAt: '2026-05-20T00:00:00Z' } as any,
      { storedFileName: 'b', originalFileName: 'b.txt', contentType: 'text/plain', size: 1, createdAt: '2026-05-01T00:00:00Z', expiresAt: '2026-05-08T00:00:00Z' } as any,
    ];

    component.setFilter('expired');
    expect(component.filteredFiles.length).toBe(1);
    component.setFilter('active');
    expect(component.filteredFiles.length).toBe(1);
    component.setFilter('all');
    expect(component.filteredFiles.length).toBe(2);

    component.toggleDrawer(true);
    expect(component.isDrawerOpen).toBeTrue();
    component.toggleDrawer();
    expect(component.isDrawerOpen).toBeFalse();

    component.toggleActions('a');
    expect(component.openedActionsFor).toBe('a');
    component.toggleActions('a');
    expect(component.openedActionsFor).toBe('');
  });

  it('couvre toutes les actions de l historique', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;

    expect(component.historyTone('UPLOAD')).toBe('tone-upload');
    expect(component.historyTone('DELETE')).toBe('tone-delete');
    expect(component.historyTone('SHARE')).toBe('tone-share');
    expect(component.historyTone('SHARED_DOWNLOAD')).toBe('tone-shared-download');
    expect(component.historyTone('OTHER')).toBe('');
  });

  it('utilise expiresAt pour calculer le libelle d expiration', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;

    const now = new Date('2026-04-17T00:00:00Z').getTime();
    spyOn(Date, 'now').and.returnValue(now);

    const file = {
      storedFileName: 'doc.pdf',
      originalFileName: 'doc.pdf',
      contentType: 'application/pdf',
      size: 100,
      createdAt: '2026-04-11T00:00:00Z',
      expiresAt: '2026-04-18T00:00:00Z',
    };

    expect(component.expirationLabel(file as any)).toBe('Expire demain');
    expect(component.isExpired(file as any)).toBeFalse();
  });

  it('considere non protege si passwordProtected absent', () => {
    authService.getMe.and.returnValue(of({ login: 'john@doe.fr' }));
    const fixture = TestBed.createComponent(MySpace);
    const component = fixture.componentInstance;

    const file = {
      storedFileName: 'plain.txt',
      originalFileName: 'plain.txt',
      contentType: 'text/plain',
      size: 10,
      createdAt: '2026-04-11T00:00:00Z',
    };

    expect(component.isProtected(file as any)).toBeFalse();
  });
});

