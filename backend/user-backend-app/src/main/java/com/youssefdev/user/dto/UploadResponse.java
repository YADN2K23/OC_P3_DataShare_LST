package com.youssefdev.user.dto;

public record UploadResponse(
        String storedFileName,
        String originalFileName,
        String contentType,
        long size
) {
}
