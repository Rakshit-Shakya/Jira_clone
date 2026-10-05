package com.example.jira.model;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Minimal audit trail, currently used for WorkLog edits/deletes (Task 2
 * requires edits/deletes to be "recorded in the audit log"). Kept
 * deliberately generic (entityType/entityId/action) so it can be reused for
 * other sensitive mutations later without a schema change.
 */
@Document(collection = "audit_log")
public class AuditLogEntry {

    @Id
    private ObjectId id;

    private String entityType; // e.g. "WorkLog"
    private String entityId;
    private String action;     // "CREATE" | "UPDATE" | "DELETE"
    private String performedBy;
    private String details;
    private Instant timestamp = Instant.now();

    public String getId() { return id != null ? id.toHexString() : null; }
    public void setId(ObjectId id) { this.id = id; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
