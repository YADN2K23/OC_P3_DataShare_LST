package com.youssefdev.user.exception;

public class StoredFileNotFoundException extends RuntimeException {
    public StoredFileNotFoundException(String message) {
        super(message);
    }
}

