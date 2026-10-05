package com.example.jira.controller;

import com.example.jira.exception.ApiException;
import com.example.jira.model.Notification;
import com.example.jira.repository.NotificationRepository;
import com.example.jira.security.CurrentUser;
import com.example.jira.service.NotificationService;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Task 5: notification list, read/unread state, for the CURRENTLY
 * AUTHENTICATED user (derived from the JWT, never from a client-supplied
 * userId) - otherwise one user could read another user's notifications by
 * guessing an id.
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    public NotificationController(
            NotificationService notificationService,
            NotificationRepository notificationRepository) {
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }

    private String requireAuth() {
        String userId = CurrentUser.getUserId();
        if (userId == null) {
            throw ApiException.unauthorized("Login required");
        }
        return userId;
    }

    @GetMapping
    public List<Notification> list() {
        return notificationService.getForUser(requireAuth());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notificationService.unreadCount(requireAuth()));
    }

    @PutMapping("/{id}/read")
    public Notification markRead(@PathVariable String id) {
        String userId = requireAuth();

        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid notification id");
        }

        Notification notification = notificationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> ApiException.notFound("Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw ApiException.forbidden("This notification does not belong to you");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @PutMapping("/read-all")
    public Map<String, Integer> markAllRead() {
        String userId = requireAuth();
        List<Notification> unread = notificationService.getForUser(userId).stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return Map.of("updated", unread.size());
    }
}
