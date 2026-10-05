package com.example.jira.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Central error -> HTTP response mapping, added so that new endpoints
 * (auth, subtasks/dependencies, worklogs, attachments, notifications) return
 * the correct status code with a {"message": "..."} body instead of a bare
 * 500. Pre-existing endpoints that throw a plain RuntimeException (e.g.
 * "Project not found") are unaffected in behavior other than now getting a
 * 400 with a real message instead of a 500 with Spring's default empty
 * error body — strictly an improvement, not a behavior change the frontend
 * depends on.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, String>> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage() != null ? ex.getMessage() : "Request failed"));
    }
}
