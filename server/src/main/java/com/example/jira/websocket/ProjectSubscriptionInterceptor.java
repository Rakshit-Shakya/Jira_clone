package com.example.jira.websocket;

import com.example.jira.repository.Projectrepository;
import org.bson.types.ObjectId;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Enforces "only users who are part of a specific project should receive
 * its real-time updates" (Task 4 requirement) at SUBSCRIBE time: a client
 * can only subscribe to /topic/project/{projectId} if the authenticated
 * user (from the handshake, see JwtHandshakeInterceptor) is that project's
 * owner or a member. A client can only subscribe to its OWN
 * /topic/user/{userId}/notifications topic, never someone else's.
 *
 * Broadcasting itself (convertAndSend calls from IssueController etc.) is
 * unaffected by this - this only gates who is allowed to *listen*.
 */
@Component
public class ProjectSubscriptionInterceptor implements ChannelInterceptor {

    private final Projectrepository projectRepository;

    public ProjectSubscriptionInterceptor(Projectrepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            String userId = extractUserId(accessor);

            if (destination != null && destination.startsWith("/topic/project/")) {
                String projectId = destination.substring("/topic/project/".length());
                if (!isProjectMember(projectId, userId)) {
                    // Returning null drops the frame silently; the client
                    // simply never receives events for a project it has no
                    // access to.
                    return null;
                }
            }

            if (destination != null && destination.startsWith("/topic/user/")) {
                // Expected shape: /topic/user/{userId}/notifications
                String rest = destination.substring("/topic/user/".length());
                String targetUserId = rest.contains("/") ? rest.substring(0, rest.indexOf('/')) : rest;
                if (userId == null || !userId.equals(targetUserId)) {
                    return null;
                }
            }
        }

        return message;
    }

    @SuppressWarnings("unchecked")
    private String extractUserId(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return null;
        }
        Object userId = sessionAttributes.get(JwtHandshakeInterceptor.USER_ID_ATTR);
        return userId != null ? userId.toString() : null;
    }

    private boolean isProjectMember(String projectId, String userId) {
        if (userId == null || !ObjectId.isValid(projectId)) {
            return false;
        }
        return projectRepository.findById(new ObjectId(projectId))
                .map(project -> userId.equals(project.getOwnerId())
                        || (project.getMemberIds() != null && project.getMemberIds().contains(userId)))
                .orElse(false);
    }
}
