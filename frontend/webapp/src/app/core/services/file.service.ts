import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UploadResponse, ShareLinkResponse, FileInfo, FileHistoryEvent, PageResponse } from '../models/file.models';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private apiUrl = environment.apiUrl;
  private prefsKey = 'file_prefs_v1';

  constructor(private http: HttpClient) {}

  uploadFile(file: File, password?: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    if (password && password.trim()) {
      formData.append('password', password.trim());
    }

    return this.http.post<UploadResponse>(`${this.apiUrl}/files`, formData);
  }

  listFiles(): Observable<FileInfo[]> {
    return this.http.get<PageResponse<FileInfo>>(`${this.apiUrl}/files`).pipe(map((page) => page.content));
  }

  cacheUploadPreferences(storedFileName: string, passwordProtected: boolean): void {
    if (!storedFileName) {
      return;
    }

    const prefs = this.readPrefs();

    prefs[storedFileName] = { passwordProtected };
    this.writePrefs(prefs);
  }

  mergeWithCachedPreferences(files: FileInfo[]): FileInfo[] {
    const prefs = this.readPrefs();

    return files.map((file) => {
      const cached = prefs[file.storedFileName];
      return {
        ...file,
        passwordProtected: file.passwordProtected ?? cached?.passwordProtected ?? false,
      };
    });
  }

  listHistory(): Observable<FileHistoryEvent[]> {
    return this.http.get<PageResponse<FileHistoryEvent>>(`${this.apiUrl}/files/history`).pipe(map((page) => page.content));
  }

  downloadFile(storedFileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${encodeURIComponent(storedFileName)}`, {
      responseType: 'blob',
    });
  }

  deleteFile(storedFileName: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/${encodeURIComponent(storedFileName)}`);
  }

  clearCachedPreferences(storedFileName: string): void {
    const prefs = this.readPrefs();
    if (prefs[storedFileName]) {
      delete prefs[storedFileName];
      this.writePrefs(prefs);
    }
  }

  createShareLink(storedFileName: string, expiresInSeconds?: number): Observable<ShareLinkResponse> {
    let params = new HttpParams();
    if (expiresInSeconds) {
      params = params.set('expiresInSeconds', expiresInSeconds.toString());
    }
    return this.http.post<ShareLinkResponse>(
      `${this.apiUrl}/files/${encodeURIComponent(storedFileName)}/shares`,
      {},
      { params }
    );
  }

  downloadSharedFile(token: string, password?: string): Observable<Blob> {
    let params = new HttpParams();
    if (password && password.trim()) {
      params = params.set('password', password.trim());
    }

    return this.http.get(`${this.apiUrl}/files/shared/${encodeURIComponent(token)}`, {
      params,
      responseType: 'blob',
    });
  }

  private readPrefs(): Record<string, { passwordProtected: boolean; expiresAt?: string }> {
    try {
      const raw = localStorage.getItem(this.prefsKey);
      if (!raw) {
        return {};
      }
      return JSON.parse(raw) as Record<string, { passwordProtected: boolean; expiresAt?: string }>;
    } catch {
      return {};
    }
  }

  private writePrefs(prefs: Record<string, { passwordProtected: boolean; expiresAt?: string }>): void {
    localStorage.setItem(this.prefsKey, JSON.stringify(prefs));
  }
}




