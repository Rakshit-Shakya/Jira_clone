package com.example.jira.security;

/**
 * Holds the authenticated user's identity for the duration of one request.
 *
 * Populated by {@link JwtAuthFilter} after it validates the Authorization
 * header, and cleared at the end of every request (including on exceptions).
 * Controllers read from here instead of trusting a userId supplied by the
 * client in the request body/path.
 */
public final class CurrentUser {

    private static final ThreadLocal<String> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    private CurrentUser() {
    }

    public static void set(String userId, String role) {
        USER_ID.set(userId);
        ROLE.set(role);
    }

    public static String getUserId() {
        return USER_ID.get();
    }

    public static String getRole() {
        return ROLE.get();
    }

    public static boolean isAuthenticated() {
        return USER_ID.get() != null;
    }

    public static void clear() {
        USER_ID.remove();
        ROLE.remove();
    }
}
