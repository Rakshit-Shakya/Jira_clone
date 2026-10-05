package com.example.jira.service;

import com.example.jira.model.Notification;
import com.example.jira.repository.NotificationRepository;
import com.example.jira.repository.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Single creation point for every in-app notification (Task 5). Also pushes
 * the notification over WebSocket to /topic/user/{userId}/notifications so
 * the bell icon updates live (Task 4 + Task 5 overlap), and fires a
 * best-effort email through EmailService if the recipient has email
 * notifications enabled.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            EmailService emailService,
            SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Creates a notification for {@code userId}, unless an identical one
     * (same user, type, related issue) was already created in the last 5
     * minutes - this is the duplicate-suppression requirement (e.g. two
     * rapid status-change events on the same issue shouldn't spam two
     * near-identical notifications).
     *
     * Never notifies a user about their own action (actorId == userId is
     * skipped silently) and never fails the caller's transaction - any
     * downstream error (mail, websocket) is caught and logged by the
     * services it delegates to.
     */
    public void notify(String userId, String actorId, String type, String message,
                        String relatedIssueId, String relatedProjectId) {
        if (userId == null || userId.equals(actorId)) {
            return;
        }

        Instant window = Instant.now().minus(5, ChronoUnit.MINUTES);
        boolean duplicate = !notificationRepository
                .findByUserIdAndTypeAndRelatedIssueIdAndCreatedAtAfter(userId, type, relatedIssueId, window)
                .isEmpty();
        if (duplicate) {
            return;
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setActorId(actorId);
        notification.setType(type);
        notification.setMessage(message);
        notification.setRelatedIssueId(relatedIssueId);
        notification.setRelatedProjectId(relatedProjectId);

        Notification saved = notificationRepository.save(notification);

        // Live push for the notification bell - best effort, never blocks.
        try {
            messagingTemplate.convertAndSend("/topic/user/" + userId + "/notifications", saved);
        } catch (Exception ignored) {
            // WebSocket broker not reachable for some reason - the user will
            // still see it on next poll/login via GET /api/notifications.
        }

        // Email - best effort, respects the user's preference.
        if (ObjectId.isValid(userId)) {
            userRepository.findById(new ObjectId(userId)).ifPresent(user -> {
                if (user.isEmailNotificationsEnabled() && user.isActive()) {
                    emailService.send(user.getEmail(), "Jira Clone: " + humanize(type), message);
                }
            });
        }
    }

    private String humanize(String type) {
        return switch (type) {
            case "ASSIGNED" -> "You were assigned an issue";
            case "STATUS_CHANGED" -> "Issue status changed";
            case "COMMENT" -> "New comment on your issue";
            case "MENTION" -> "You were mentioned";
            case "DUE_SOON" -> "Issue due soon";
            case "BLOCKING_TASK_DONE" -> "Blocking task completed";
            case "SPRINT_STARTED" -> "Sprint started";
            case "SPRINT_COMPLETED" -> "Sprint completed";
            default -> "Notification";
        };
    }

    public List<Notification> getForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }
}
