package com.example.jira.repository;

import com.example.jira.model.Notification;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, ObjectId> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserIdAndReadFalse(String userId);

    // Used for duplicate-suppression: has an identical notification already
    // been created for this user recently?
    List<Notification> findByUserIdAndTypeAndRelatedIssueIdAndCreatedAtAfter(
            String userId, String type, String relatedIssueId, Instant after);
}
