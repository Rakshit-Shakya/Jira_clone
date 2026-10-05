package com.example.jira.repository;

import com.example.jira.model.AuditLogEntry;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AuditLogRepository extends MongoRepository<AuditLogEntry, ObjectId> {
}
