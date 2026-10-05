package com.example.jira.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Task 5: in-app notification. Always created regardless of whether email
 * sending succeeds - email is a secondary, best-effort delivery channel on
 * top of this record (see EmailService / NotificationService).
 */
@Document(collection = "notifications")
public class Notification {

    @Id
    private ObjectId id;

    /** The user this notification is FOR. */
    private String userId;

    /** The user whose action caused it (may be null for system events like due-date reminders). */
    private String actorId;

    /**
     * One of: ASSIGNED, STATUS_CHANGED, COMMENT, MENTION, DUE_SOON,
     * BLOCKING_TASK_DONE, SPRINT_STARTED, SPRINT_COMPLETED.
     */
    private String type;

    private String message;

    private String relatedIssueId;
    private String relatedProjectId;

    private boolean read = false;

    private Instant createdAt = Instant.now();

    public String getId() {
        return id != null ? id.toHexString() : null;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getRelatedIssueId() { return relatedIssueId; }
    public void setRelatedIssueId(String relatedIssueId) { this.relatedIssueId = relatedIssueId; }

    public String getRelatedProjectId() { return relatedProjectId; }
    public void setRelatedProjectId(String relatedProjectId) { this.relatedProjectId = relatedProjectId; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
