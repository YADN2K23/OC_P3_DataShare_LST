package com.youssefdev.user.exception;

public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String login) {
        super("Un utilisateur avec le login '%s' existe deja.".formatted(login));
    }
}

