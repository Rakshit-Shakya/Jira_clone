package com.example.jira.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Issues and validates the app's JWTs.
 *
 * The signing secret MUST come from the JWT_SECRET environment variable in
 * any deployed environment (Render). The default below only exists so local
 * development works out of the box without extra setup; it is intentionally
 * long, but it is still a well-known public value once this repo is public,
 * so it must never be relied on outside local dev.
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(
            @Value("${jwt.secret:dev-only-insecure-default-secret-change-me-please-this-must-be-at-least-256-bits-long}") String secret,
            @Value("${jwt.expiration-ms:86400000}") long expirationMillis) {
        // HS256 requires a key of at least 256 bits (32 bytes).
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(
                keyBytes.length >= 32 ? keyBytes : pad(keyBytes));
        this.expirationMillis = expirationMillis;
    }

    private static byte[] pad(byte[] input) {
        byte[] padded = new byte[32];
        System.arraycopy(input, 0, padded, 0, Math.min(input.length, 32));
        return padded;
    }

    public String generateToken(String userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMillis)))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Returns the validated claims, or null if the token is missing, malformed,
     * expired, or signed with a different key.
     */
    public Claims validateAndParse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
