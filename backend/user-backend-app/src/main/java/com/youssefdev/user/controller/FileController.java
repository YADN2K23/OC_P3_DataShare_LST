package com.youssefdev.user.controller;

import com.youssefdev.user.dto.FileHistoryResponse;
import com.youssefdev.user.dto.PageResponse;
import com.youssefdev.user.dto.ShareLinkResponse;
import com.youssefdev.user.dto.FileInfoResponse;
import com.youssefdev.user.dto.UploadResponse;
import com.youssefdev.user.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private static final Logger SECURITY_LOG = LoggerFactory.getLogger("security.audit");

    private final FileStorageService fileStorageService;

    @Value("${app.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    @GetMapping
    public ResponseEntity<PageResponse<FileInfoResponse>> list(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(fileStorageService.listOwnedFiles(authentication.getName(), pageable)));
    }

    @GetMapping("/history")
    public ResponseEntity<PageResponse<FileHistoryResponse>> history(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "occurredAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(fileStorageService.listOwnedHistory(authentication.getName(), pageable)));
    }

    @PostMapping
    public ResponseEntity<UploadResponse> upload(@RequestParam("file") MultipartFile file,
                                                 @RequestParam(value = "password", required = false) String password,
                                                 Authentication authentication) {
        return ResponseEntity.ok(fileStorageService.store(file, authentication.getName(), password));
    }

    @GetMapping("/{storedFileName:.+}")
    public ResponseEntity<Resource> download(@PathVariable String storedFileName,
                                             Authentication authentication) {
        return buildDownloadResponse(fileStorageService.loadOwnedFile(storedFileName, authentication.getName()));
    }

    @DeleteMapping("/{storedFileName:.+}")
    public ResponseEntity<Void> delete(@PathVariable String storedFileName,
                                       Authentication authentication) {
        fileStorageService.deleteOwnedFile(storedFileName, authentication.getName());
        SECURITY_LOG.info("file_delete owner={} storedFileName={}", authentication.getName(), storedFileName);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{storedFileName:.+}/shares")
    public ResponseEntity<ShareLinkResponse> createShareLink(@PathVariable String storedFileName,
                                                             @RequestParam(defaultValue = "3600") long expiresInSeconds,
                                                             Authentication authentication) {
        ShareLinkResponse response = fileStorageService.createShareLink(storedFileName, authentication.getName(), expiresInSeconds, frontendBaseUrl);
        SECURITY_LOG.info("share_link_created owner={} storedFileName={} expiresAt={}",
                authentication.getName(), storedFileName, response.expiresAt());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/shared/{token}")
    public ResponseEntity<Resource> downloadSharedFile(@PathVariable String token,
                                                       @RequestParam(value = "password", required = false) String password) {
        return buildDownloadResponse(fileStorageService.loadSharedFile(token, password));
    }

    private ResponseEntity<Resource> buildDownloadResponse(FileStorageService.DownloadedFile downloadedFile) {
        FileSystemResource resource = new FileSystemResource(downloadedFile.filePath());
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

        if (downloadedFile.contentType() != null && !downloadedFile.contentType().isBlank()) {
            mediaType = MediaType.parseMediaType(downloadedFile.contentType());
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(downloadedFile.size())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(downloadedFile.originalFileName())
                                .build()
                                .toString())
                .body(resource);
    }
}
