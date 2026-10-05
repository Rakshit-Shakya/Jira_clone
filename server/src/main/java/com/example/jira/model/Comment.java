package com.example.jira.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Embedded (not a top-level @Document) comment on an Issue. Replaces the
 * previous `List<String> comments` so comments carry a real author and
 * timestamp - required for Task 4 (who posted a live comment event) and
 * Task 5 (notifying the right person, detecting @mentions).
 */
public class Comment {

    private String id = UUID.randomUUID().toString();
    private String authorId;
    private String text;
    private Instant createdAt = Instant.now();

    public Comment() {
    }

    public Comment(String authorId, String text) {
        this.authorId = authorId;
        this.text = text;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
