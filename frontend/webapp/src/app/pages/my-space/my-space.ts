import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FileService } from '../../core/services/file.service';
import { FileInfo, FileHistoryEvent } from '../../core/models/file.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-my-space',
  imports: [RouterLink],
  templateUrl: './my-space.html',
  styleUrl: './my-space.scss',
})
export class MySpace implements OnInit {
  activeTab: 'all' | 'active' | 'expired' = 'all';
  isDrawerOpen = false;
  openedActionsFor = '';
  userName = '';
  files: FileInfo[] = [];
  history: FileHistoryEvent[] = [];
  isLoadingFiles = true;
  isLoadingHistory = true;
  filesError = '';
  historyError = '';

  constructor(
    private authService: AuthService,
    private fileService: FileService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getMe().subscribe({
      next: (user) => {
        this.userName = user.login;
        this.loadFiles();
        this.loadHistory();
      },
      error: (error: HttpErrorResponse) => {
        this.userName = 'Utilisateur';

        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
          return;
        } else {
          this.filesError = 'Impossible de vérifier votre session pour le moment.';
        }

        this.loadFiles();
        this.loadHistory();
      },
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onDeleteFile(storedFileName: string) {
    this.fileService.deleteFile(storedFileName).subscribe({
      next: () => {
        this.files = this.files.filter((f) => f.storedFileName !== storedFileName);
        this.fileService.clearCachedPreferences(storedFileName);
        this.loadHistory();
      },
      error: () => {
        this.filesError = 'Suppression impossible pour le moment.';
      },
    });
  }

  onDownloadFile(storedFileName: string) {
    this.fileService.downloadFile(storedFileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = storedFileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.filesError = 'Telechargement impossible pour le moment.';
      },
    });
  }

  private loadFiles() {
    this.isLoadingFiles = true;
    this.filesError = '';
    this.fileService.listFiles().subscribe({
      next: (files) => {
        this.files = this.fileService.mergeWithCachedPreferences(files);
        this.isLoadingFiles = false;
      },
      error: () => {
        this.filesError = 'Impossible de charger vos fichiers.';
        this.isLoadingFiles = false;
      },
    });
  }

  private loadHistory() {
    this.isLoadingHistory = true;
    this.historyError = '';

    this.fileService.listHistory().subscribe({
      next: (events) => {
        this.history = events;
        this.isLoadingHistory = false;
      },
      error: () => {
        this.historyError = 'Impossible de charger l\'historique pour le moment.';
        this.isLoadingHistory = false;
      },
    });
  }

  historyTone(action: string): string {
    switch ((action || '').toUpperCase()) {
      case 'UPLOAD':
        return 'tone-upload';
      case 'DELETE':
        return 'tone-delete';
      case 'SHARE':
        return 'tone-share';
      case 'SHARED_DOWNLOAD':
        return 'tone-shared-download';
      default:
        return '';
    }
  }

  setFilter(filter: 'all' | 'active' | 'expired') {
    this.activeTab = filter;
  }

  toggleDrawer(force?: boolean) {
    if (typeof force === 'boolean') {
      this.isDrawerOpen = force;
      return;
    }

    this.isDrawerOpen = !this.isDrawerOpen;
  }

  toggleActions(storedFileName: string) {
    this.openedActionsFor = this.openedActionsFor === storedFileName ? '' : storedFileName;
  }

  closeActions() {
    this.openedActionsFor = '';
  }

  isExpired(file: FileInfo): boolean {
    const expiresAt = this.resolveExpiresAt(file);
    if (expiresAt === null) {
      return false;
    }
    return Date.now() >= expiresAt;
  }

  expirationLabel(file: FileInfo): string {
    if (this.isExpired(file)) {
      return 'Expire';
    }

    const expiresAt = this.resolveExpiresAt(file);
    if (expiresAt === null) {
      return 'Actif';
    }
    const remainingDays = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

    if (remainingDays <= 1) {
      return 'Expire demain';
    }

    return `Expire dans ${remainingDays} jours`;
  }

  fileIcon(file: FileInfo): string {
    const contentType = (file.contentType || '').toLowerCase();
    const fileName = (file.originalFileName || '').toLowerCase();

    if (contentType.includes('pdf') || fileName.endsWith('.pdf')) {
      return 'PDF';
    }

    if (contentType.includes('png') || contentType.includes('jpeg') || contentType.includes('jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      return 'IMG';
    }

    if (contentType.includes('text') || fileName.endsWith('.txt')) {
      return 'TXT';
    }

    return 'FILE';
  }

  isProtected(file: FileInfo): boolean {
    return file.passwordProtected === true;
  }

  private resolveExpiresAt(file: FileInfo): number | null {
    if (file.expiresAt) {
      const parsed = new Date(file.expiresAt).getTime();
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  get filteredFiles(): FileInfo[] {
    if (this.activeTab === 'all') {
      return this.files;
    }

    return this.files.filter((file) => {
      const status = this.isExpired(file) ? 'expired' : 'active';
      return status === this.activeTab;
    });
  }
}
