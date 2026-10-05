package com.example.jira.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "worklogs")
public class WorkLog {

    @Id
    private ObjectId id;

    private String issueId;

    /** Who performed the work - set server-side from the JWT, never trusted from the client. */
    private String userId;

    private LocalDate date;

    /** Duration in minutes - kept as an integer to avoid float rounding issues in totals. */
    private int durationMinutes;

    private String description;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public String getId() { return id != null ? id.toHexString() : null; }
    public void setId(ObjectId id) { this.id = id; }

    public String getIssueId() { return issueId; }
    public void setIssueId(String issueId) { this.issueId = issueId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
