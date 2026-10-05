package com.example.jira.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads the "Authorization: Bearer <token>" header (if present), validates
 * it, and populates {@link CurrentUser} for the rest of the request.
 *
 * This is intentionally NOT a Spring Security filter chain: it never blocks
 * a request on its own. Endpoints that need the caller to actually be
 * authenticated call CurrentUser.getUserId() themselves and reject (401) if
 * it's null, or compare it against a target user id (403) for ownership
 * checks. This keeps every existing public GET endpoint working exactly as
 * before while giving controllers a real, server-verified identity to check
 * against wherever that identity actually matters (profile edits, password
 * changes, worklog ownership, WebSocket subscriptions, notification
 * targeting).
 *
 * Registered automatically by Spring Boot because it's a @Component
 * implementing jakarta.servlet.Filter (via OncePerRequestFilter) — no
 * FilterRegistrationBean needed, and no spring-boot-starter-security either.
 */
@Component
@Order(1)
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String header = request.getHeader(HEADER);

            if (header != null && header.startsWith(PREFIX)) {
                String token = header.substring(PREFIX.length());
                Claims claims = jwtService.validateAndParse(token);

                if (claims != null) {
                    String userId = claims.getSubject();
                    String role = claims.get("role", String.class);
                    CurrentUser.set(userId, role);
                }
                // An invalid/expired token is simply treated as "not logged
                // in" here; the endpoint's own requireAuth() check (if any)
                // is what turns that into a 401 response.
            }

            filterChain.doFilter(request, response);
        } finally {
            // Thread-locals must never leak into the next request served by
            // a pooled Tomcat thread.
            CurrentUser.clear();
        }
    }
}
