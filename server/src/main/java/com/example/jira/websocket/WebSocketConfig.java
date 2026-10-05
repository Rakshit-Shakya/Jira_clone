package com.example.jira.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Task 4: STOMP-over-WebSocket real-time collaboration.
 *
 * Endpoint: /ws (SockJS fallback included, since some corporate networks
 * and older browsers block raw WebSocket upgrades - matters for Render,
 * whose proxy supports WebSocket but a demo/evaluation environment can't
 * always guarantee the client network does).
 *
 * Topics: /topic/project/{projectId} - issue create/update/delete and
 * comment events, broadcast to everyone subscribed to that project.
 * /topic/user/{userId}/notifications - live notification push (Task 5).
 *
 * Authentication happens in JwtHandshakeInterceptor (connection time) and
 * subscription authorization happens in ProjectSubscriptionInterceptor
 * (per-SUBSCRIBE-frame), so a user who isn't a member of a project cannot
 * subscribe to that project's topic even if they know its id.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final ProjectSubscriptionInterceptor projectSubscriptionInterceptor;

    public WebSocketConfig(
            JwtHandshakeInterceptor jwtHandshakeInterceptor,
            ProjectSubscriptionInterceptor projectSubscriptionInterceptor) {
        this.jwtHandshakeInterceptor = jwtHandshakeInterceptor;
        this.projectSubscriptionInterceptor = projectSubscriptionInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(jwtHandshakeInterceptor)
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        registration.interceptors(projectSubscriptionInterceptor);
    }
}
