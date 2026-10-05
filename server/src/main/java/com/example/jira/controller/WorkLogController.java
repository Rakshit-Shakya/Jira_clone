package com.example.jira.controller;

import com.example.jira.exception.ApiException;
import com.example.jira.model.AuditLogEntry;
import com.example.jira.model.Issue;
import com.example.jira.model.Project;
import com.example.jira.model.WorkLog;
import com.example.jira.repository.AuditLogRepository;
import com.example.jira.repository.IssueRepository;
import com.example.jira.repository.WorkLogRepository;
import com.example.jira.security.CurrentUser;
import com.example.jira.service.ProjectAccessService;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Task 2: time tracking / work logs.
 *
 * Create: any member of the issue's project may log time, always against
 * themselves (userId is taken from the JWT, never from the request body).
 * Edit/delete: restricted to the issue's assignee or the project owner
 * (stand-in for "Project Manager" - see ProjectAccessService), per the task
 * brief. Every edit/delete is recorded in the audit log.
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class WorkLogController {

    private final WorkLogRepository workLogRepository;
    private final IssueRepository issueRepository;
    private final ProjectAccessService projectAccessService;
    private final AuditLogRepository auditLogRepository;

    public WorkLogController(
            WorkLogRepository workLogRepository,
            IssueRepository issueRepository,
            ProjectAccessService projectAccessService,
            AuditLogRepository auditLogRepository) {
        this.workLogRepository = workLogRepository;
        this.issueRepository = issueRepository;
        this.projectAccessService = projectAccessService;
        this.auditLogRepository = auditLogRepository;
    }

    private String requireAuth() {
        String userId = CurrentUser.getUserId();
        if (userId == null) {
            throw ApiException.unauthorized("Login required");
        }
        return userId;
    }

    private Issue requireIssue(String issueId) {
        if (!ObjectId.isValid(issueId)) {
            throw ApiException.badRequest("Invalid issue id");
        }
        return issueRepository.findById(new ObjectId(issueId))
                .orElseThrow(() -> ApiException.notFound("Issue not found"));
    }

    private void audit(String action, String workLogId, String performedBy, String details) {
        AuditLogEntry entry = new AuditLogEntry();
        entry.setEntityType("WorkLog");
        entry.setEntityId(workLogId);
        entry.setAction(action);
        entry.setPerformedBy(performedBy);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    private void requireCanModify(Issue issue, String userId) {
        Project project = projectAccessService.requireProject(issue.getProjectId());
        boolean isAssignee = userId.equals(issue.getAssigneeId());
        boolean isOwner = userId.equals(project.getOwnerId());
        if (!isAssignee && !isOwner) {
            throw ApiException.forbidden(
                    "Only the task assignee or the project owner can modify time entries");
        }
    }

    @PostMapping("/issues/{issueId}/worklogs")
    public WorkLog create(@PathVariable String issueId, @RequestBody WorkLog input) {
        String userId = requireAuth();
        Issue issue = requireIssue(issueId);
        projectAccessService.requireMember(issue.getProjectId(), userId);

        if (input.getDurationMinutes() <= 0) {
            throw ApiException.badRequest("Duration must be a positive number of minutes");
        }
        if (input.getDate() == null) {
            throw ApiException.badRequest("Date is required");
        }
        if (input.getDate().isAfter(LocalDate.now())) {
            throw ApiException.badRequest("Cannot log work for a future date");
        }

        WorkLog workLog = new WorkLog();
        workLog.setIssueId(issueId);
        workLog.setUserId(userId);
        workLog.setDate(input.getDate());
        workLog.setDurationMinutes(input.getDurationMinutes());
        workLog.setDescription(input.getDescription());

        WorkLog saved = workLogRepository.save(workLog);
        audit("CREATE", saved.getId(), userId, "Logged " + saved.getDurationMinutes() + " minutes on " + saved.getDate());
        return saved;
    }

    @GetMapping("/issues/{issueId}/worklogs")
    public List<WorkLog> listForIssue(@PathVariable String issueId) {
        String userId = requireAuth();
        Issue issue = requireIssue(issueId);
        projectAccessService.requireMember(issue.getProjectId(), userId);
        return workLogRepository.findByIssueId(issueId);
    }

    @GetMapping("/issues/{issueId}/worklogs/total")
    public Map<String, Integer> totalForIssue(@PathVariable String issueId) {
        String userId = requireAuth();
        Issue issue = requireIssue(issueId);
        projectAccessService.requireMember(issue.getProjectId(), userId);

        int total = workLogRepository.findByIssueId(issueId).stream()
                .mapToInt(WorkLog::getDurationMinutes)
                .sum();
        return Map.of("totalMinutes", total);
    }

    @GetMapping("/sprints/{sprintId}/worklogs/total")
    public Map<String, Integer> totalForSprint(@PathVariable String sprintId) {
        requireAuth();

        List<String> issueIds = issueRepository.findAll().stream()
                .filter(i -> sprintId.equals(i.getSprintId()))
                .map(Issue::getId)
                .toList();

        int total = workLogRepository.findByIssueIdIn(issueIds).stream()
                .mapToInt(WorkLog::getDurationMinutes)
                .sum();
        return Map.of("totalMinutes", total);
    }

    @PutMapping("/worklogs/{id}")
    public WorkLog update(@PathVariable String id, @RequestBody WorkLog input) {
        String userId = requireAuth();

        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid work log id");
        }
        WorkLog workLog = workLogRepository.findById(new ObjectId(id))
                .orElseThrow(() -> ApiException.notFound("Work log not found"));

        Issue issue = requireIssue(workLog.getIssueId());
        requireCanModify(issue, userId);

        if (input.getDurationMinutes() <= 0) {
            throw ApiException.badRequest("Duration must be a positive number of minutes");
        }
        if (input.getDate() == null || input.getDate().isAfter(LocalDate.now())) {
            throw ApiException.badRequest("Date must be set and cannot be in the future");
        }

        workLog.setDate(input.getDate());
        workLog.setDurationMinutes(input.getDurationMinutes());
        workLog.setDescription(input.getDescription());
        workLog.setUpdatedAt(Instant.now());

        WorkLog saved = workLogRepository.save(workLog);
        audit("UPDATE", saved.getId(), userId, "Updated to " + saved.getDurationMinutes() + " minutes on " + saved.getDate());
        return saved;
    }

    @DeleteMapping("/worklogs/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        String userId = requireAuth();

        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid work log id");
        }
        WorkLog workLog = workLogRepository.findById(new ObjectId(id))
                .orElseThrow(() -> ApiException.notFound("Work log not found"));

        Issue issue = requireIssue(workLog.getIssueId());
        requireCanModify(issue, userId);

        workLogRepository.deleteById(new ObjectId(id));
        audit("DELETE", id, userId, "Deleted " + workLog.getDurationMinutes() + " minute entry on " + workLog.getDate());
        return Map.of("deleted", true);
    }
}
