package com.example.jira.service;

import com.example.jira.exception.ApiException;
import com.example.jira.model.Issue;
import com.example.jira.repository.IssueRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Task 1: "the system must prevent circular dependencies."
 *
 * A dependency edge means "this issue cannot start until that issue is
 * done" (issue -> dependsOn -> blocker). Adding a new edge issueId -> depId
 * is rejected if depId can already (transitively) reach issueId - that
 * would close a cycle.
 */
@Service
public class DependencyValidationService {

    private final IssueRepository issueRepository;

    public DependencyValidationService(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    /**
     * Validates a proposed dependsOn list for {@code issueId} (which may be
     * null/blank for an issue that doesn't exist yet) within {@code projectId}.
     * Throws ApiException(400) with a clear message on any violation.
     */
    public void validate(String projectId, String issueId, List<String> proposedDependsOn) {
        if (proposedDependsOn == null || proposedDependsOn.isEmpty()) {
            return;
        }

        List<Issue> projectIssues = issueRepository.findByProjectId(projectId);
        Map<String, Issue> byId = new HashMap<>();
        for (Issue issue : projectIssues) {
            byId.put(issue.getId(), issue);
        }

        for (String depId : proposedDependsOn) {
            if (depId == null || depId.isBlank()) {
                throw ApiException.badRequest("Dependency id cannot be blank");
            }
            if (depId.equals(issueId)) {
                throw ApiException.badRequest("An issue cannot depend on itself");
            }
            if (!byId.containsKey(depId)) {
                throw ApiException.badRequest("Dependency issue " + depId + " was not found in this project");
            }
        }

        if (issueId == null) {
            // Brand-new issue: it can't be anyone's blocker yet, so no cycle
            // is possible beyond what's already checked above.
            return;
        }

        for (String depId : proposedDependsOn) {
            if (canReach(depId, issueId, byId, new HashSet<>())) {
                throw ApiException.badRequest(
                        "That dependency would create a circular chain (issue " + depId
                                + " already (transitively) depends on this issue)");
            }
        }
    }

    /** DFS: can we reach `target` starting from `start` by following dependsOn edges? */
    private boolean canReach(String start, String target, Map<String, Issue> byId, Set<String> visited) {
        if (start.equals(target)) {
            return true;
        }
        if (!visited.add(start)) {
            return false; // already explored this node on this search
        }
        Issue issue = byId.get(start);
        if (issue == null || issue.getDependsOn() == null) {
            return false;
        }
        for (String next : issue.getDependsOn()) {
            if (canReach(next, target, byId, visited)) {
                return true;
            }
        }
        return false;
    }
}
