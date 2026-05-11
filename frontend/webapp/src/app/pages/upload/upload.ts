import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FileService } from '../../core/services/file.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-upload',
  imports: [RouterLink, FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload implements OnInit {
  readonly acceptedMimeTypes = ['text/plain', 'image/png', 'image/jpeg', 'application/pdf'];
  readonly maxFileSizeBytes = 1024 * 1024 * 1024 - 1;

  selectedFile: File | null = null;
  expirationDays = '7';
  uploadPassword = '';
  isLoading = false;
  error = '';
  uploadResponse: any = null;
  shareUrl = '';

  constructor(
    private fileService: FileService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const pickedFile = history.state?.pickedFile as File | undefined;
    if (pickedFile) {
      this.selectedFile = pickedFile;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.error = `La taille des fichiers doit etre strictement inferieure a 1 Go. Fichier selectionne : ${(file.size / 1048576).toFixed(2)} Mo`;
      this.selectedFile = null;
      return;
    }

    if (file.type && !this.acceptedMimeTypes.includes(file.type)) {
      this.error = `Type non autorisé. Types acceptés : ${this.acceptedFileTypesLabel}.`;
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.error = '';
  }

  onUpload() {
    if (!this.selectedFile) {
      this.error = 'Veuillez sélectionner un fichier';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.fileService.uploadFile(this.selectedFile, this.uploadPassword).subscribe({
      next: (response) => {
        this.uploadResponse = response;
        this.fileService.cacheUploadPreferences(
          response.storedFileName,
          !!this.uploadPassword.trim()
        );
        const expiresInSeconds = parseInt(this.expirationDays) * 86400;
        this.fileService.createShareLink(response.storedFileName, expiresInSeconds).subscribe({
          next: (share) => {
            this.shareUrl = share.shareUrl;
            this.isLoading = false;
            this.router.navigate(['/upload/confirm'], {
              state: {
                fileName: response.originalFileName,
                fileSizeLabel: `${(response.size / 1048576).toFixed(2)} Mo`,
                expirationLabel: this.expirationLabel,
                shareUrl: share.shareUrl,
              },
            });
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/upload/confirm'], {
              state: {
                fileName: response.originalFileName,
                fileSizeLabel: `${(response.size / 1048576).toFixed(2)} Mo`,
                expirationLabel: this.expirationLabel,
                shareUrl: '',
              },
            });
          }
        });
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.error = 'Erreur lors du téléversement du fichier';
        this.isLoading = false;
      },
    });
  }

  get acceptedFileTypesLabel(): string {
    return this.acceptedMimeTypes
      .map((mime) => {
        switch (mime) {
          case 'text/plain':
            return 'TXT';
          case 'image/png':
            return 'PNG';
          case 'image/jpeg':
            return 'JPG/JPEG';
          case 'application/pdf':
            return 'PDF';
          default:
            return mime;
        }
      })
      .join(', ');
  }

  get expirationLabel(): string {
    switch (this.expirationDays) {
      case '1':
        return 'une journee';
      case '3':
        return '3 jours';
      case '30':
        return 'un mois';
      default:
        return 'une semaine';
    }
  }

  get isAuthenticated(): boolean {
    return this.authService.hasToken();
  }
}
