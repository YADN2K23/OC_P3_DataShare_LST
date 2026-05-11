import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-upload-confirm',
  imports: [RouterLink],
  templateUrl: './upload-confirm.html',
  styleUrl: './upload-confirm.scss',
})
export class UploadConfirm implements OnInit {
  fileName = 'Fichier';
  fileSizeLabel = '-';
  expirationLabel = 'une semaine';
  shareUrl = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const state = history.state ?? {};

    if (state.fileName) {
      this.fileName = state.fileName;
    }

    if (state.fileSizeLabel) {
      this.fileSizeLabel = state.fileSizeLabel;
    }

    if (state.expirationLabel) {
      this.expirationLabel = state.expirationLabel;
    }

    if (state.shareUrl) {
      this.shareUrl = state.shareUrl;
    }
  }

  copyLink() {
    if (!this.shareUrl) {
      return;
    }

    navigator.clipboard?.writeText(this.shareUrl);
  }

  get isAuthenticated(): boolean {
    return this.authService.hasToken();
  }
}

