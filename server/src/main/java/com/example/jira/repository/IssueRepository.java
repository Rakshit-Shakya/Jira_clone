package com.example.jira.repository;

import com.example.jira.model.Issue;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface IssueRepository extends MongoRepository<Issue, ObjectId> {

    List<Issue> findByProjectId(String projectId);

    List<Issue> findByParentId(String parentId);

    List<Issue> findByDependsOnContaining(String issueId);

    List<Issue> findByDueDateBetweenAndReminderSentFalse(java.time.Instant from, java.time.Instant to);
}
