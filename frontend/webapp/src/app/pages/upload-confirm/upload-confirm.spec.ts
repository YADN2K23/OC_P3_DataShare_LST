import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UploadConfirm } from './upload-confirm';
import { AuthService } from '../../core/services/auth.service';

describe('UploadConfirm (integration)', () => {
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasToken']);
    authService.hasToken.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [UploadConfirm],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('lit les donnees de navigation depuis history.state', () => {
    history.replaceState(
      {
        fileName: 'rapport.pdf',
        fileSizeLabel: '2.50 Mo',
        expirationLabel: 'un mois',
        shareUrl: 'http://x/y',
      },
      ''
    );

    const fixture = TestBed.createComponent(UploadConfirm);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.fileName).toBe('rapport.pdf');
    expect(component.fileSizeLabel).toBe('2.50 Mo');
    expect(component.expirationLabel).toBe('un mois');
    expect(component.shareUrl).toBe('http://x/y');
  });

  it('affiche Mon espace si utilisateur authentifie', () => {
    authService.hasToken.and.returnValue(true);

    const fixture = TestBed.createComponent(UploadConfirm);
    fixture.detectChanges();

    const navButton = fixture.nativeElement.querySelector('.btn-nav') as HTMLButtonElement;
    expect(navButton?.textContent?.trim()).toBe('Mon espace');
  });

  it('affiche Se connecter si utilisateur non authentifie', () => {
    authService.hasToken.and.returnValue(false);

    const fixture = TestBed.createComponent(UploadConfirm);
    fixture.detectChanges();

    const navButton = fixture.nativeElement.querySelector('.btn-nav') as HTMLButtonElement;
    expect(navButton?.textContent?.trim()).toBe('Se connecter');
  });
});

