package com.example.jira.websocket;

import com.example.jira.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Authenticates the WebSocket handshake itself. Browsers can't set custom
 * headers on a WebSocket upgrade request, so the JWT is passed as a query
 * param: /ws?token=<jwt>. The validated userId is stashed in the WebSocket
 * session attributes, where ProjectSubscriptionInterceptor and any @MessageMapping
 * handler can read it back via SimpMessageHeaderAccessor.
 *
 * A connection with a missing/invalid token is rejected outright (handshake
 * returns false -> HTTP 403 before the socket upgrades), since every
 * real-time feature here requires knowing who the connection belongs to.
 */
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    public static final String USER_ID_ATTR = "userId";

    private final JwtService jwtService;

    public JwtHandshakeInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String token = extractToken(request);
        if (token == null) {
            return false;
        }

        Claims claims = jwtService.validateAndParse(token);
        if (claims == null) {
            return false;
        }

        attributes.put(USER_ID_ATTR, claims.getSubject());
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // no-op
    }

    private String extractToken(ServerHttpRequest request) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String token = servletRequest.getServletRequest().getParameter("token");
            if (token != null && !token.isBlank()) {
                return token;
            }
        }

        String query = request.getURI().getQuery();
        if (query == null) {
            return null;
        }
        for (String param : query.split("&")) {
            String[] kv = param.split("=", 2);
            if (kv.length == 2 && kv[0].equals("token")) {
                return kv[1];
            }
        }
        return null;
    }
}
