package com.example.jira.controller;

import com.example.jira.exception.ApiException;
import com.example.jira.model.Issue;
import com.example.jira.model.Project;
import com.example.jira.repository.IssueRepository;
import com.example.jira.repository.Projectrepository;
import com.example.jira.security.CurrentUser;
import com.example.jira.service.DependencyValidationService;
import com.example.jira.service.NotificationService;
import org.bson.types.ObjectId;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueRepository issueRepository;
    private final Projectrepository projectRepository;
    private final DependencyValidationService dependencyValidationService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public IssueController(
            IssueRepository issueRepository,
            Projectrepository projectRepository,
            DependencyValidationService dependencyValidationService,
            NotificationService notificationService,
            SimpMessagingTemplate messagingTemplate) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.dependencyValidationService = dependencyValidationService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    // CREATE
    @PostMapping
    public Issue createIssue(@RequestBody Issue issue) {
        if (issue.getProjectId() == null ||
                !ObjectId.isValid(issue.getProjectId())) {
            throw ApiException.badRequest("Valid projectId is required");
        }

        Project project = projectRepository
                .findById(new ObjectId(issue.getProjectId()))
                .orElseThrow(() -> ApiException.notFound("Project not found"));

        if (issue.getTitle() == null || issue.getTitle().isBlank()) {
            throw ApiException.badRequest("Issue title is required");
        }

        // Validate parentId if provided (Subtasks)
        if (issue.getParentId() != null && !issue.getParentId().isBlank()) {
            if (!ObjectId.isValid(issue.getParentId())) {
                throw ApiException.badRequest("Invalid parent issue id");
            }
            Issue parent = issueRepository.findById(new ObjectId(issue.getParentId()))
                    .orElseThrow(() -> ApiException.notFound("Parent issue not found"));
            if (!parent.getProjectId().equals(issue.getProjectId())) {
                throw ApiException.badRequest("Parent issue must belong to the same project");
            }
            if (parent.getParentId() != null && !parent.getParentId().isBlank()) {
                throw ApiException.badRequest("Subtasks cannot have subtasks (one level deep only)");
            }
        }

        // Validate dependsOn if provided (Dependencies + circular check)
        if (issue.getDependsOn() != null && !issue.getDependsOn().isEmpty()) {
            dependencyValidationService.validate(issue.getProjectId(), null, issue.getDependsOn());
        }

        List<Issue> projectIssues =
                issueRepository.findByProjectId(issue.getProjectId());

        int nextNumber = projectIssues.stream()
                .map(Issue::getKey)
                .filter(key -> key != null)
                .map(key -> {
                    try {
                        int dashIndex = key.lastIndexOf("-");
                        return Integer.parseInt(key.substring(dashIndex + 1));
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .max(Integer::compareTo)
                .orElse(0) + 1;

        issue.setKey(project.getKey() + "-" + nextNumber);

        if (issue.getStatus() == null) {
            issue.setStatus("TODO");
        }

        if (issue.getPriority() == null) {
            issue.setPriority("MEDIUM");
        }

        if (issue.getType() == null) {
            issue.setType("TASK");
        }

        if (issue.getComments() == null) {
            issue.setComments(new java.util.ArrayList<>());
        }
        if (issue.getDependsOn() == null) {
            issue.setDependsOn(new java.util.ArrayList<>());
        }

        issue.setUpdatedAt(Instant.now());

        Issue saved = issueRepository.save(issue);
        if (saved.getAssigneeId() != null && !saved.getAssigneeId().isBlank()) {
            notificationService.notify(
                    saved.getAssigneeId(),
                    CurrentUser.getUserId(),
                    "ASSIGNED",
                    "You were assigned to issue " + saved.getKey() + ": " + saved.getTitle(),
                    saved.getId(),
                    saved.getProjectId()
            );
        }
        try {
            messagingTemplate.convertAndSend("/topic/project/" + saved.getProjectId(), (Object) Map.of("type", "ISSUE_CREATED", "issueId", saved.getId()));
        } catch (Exception ignored) {}

        return saved;
    }

    // GET BY PROJECT
    @GetMapping("/project/{projectId}")
    public List<Issue> getIssuesByProject(
            @PathVariable String projectId) {
        return issueRepository.findByProjectId(projectId);
    }

    // GET BY ID
    @GetMapping("/{id}")
    public Issue getIssueById(@PathVariable String id) {
        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid issue id");
        }

        return issueRepository.findById(new ObjectId(id))
                .orElseThrow(() -> ApiException.notFound("Issue not found"));
    }

    // GET SUBTASKS
    @GetMapping("/{id}/subtasks")
    public List<Issue> getSubtasks(@PathVariable String id) {
        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid issue id");
        }
        return issueRepository.findByParentId(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Issue updateIssue(
            @PathVariable String id,
            @RequestBody Issue updated) {
        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid issue id");
        }

        Issue issue = issueRepository.findById(new ObjectId(id))
                .orElseThrow(() -> ApiException.notFound("Issue not found"));

        String oldAssignee = issue.getAssigneeId();
        String oldStatus = issue.getStatus();
        int oldCommentsSize = issue.getComments() != null ? issue.getComments().size() : 0;

        issue.setTitle(updated.getTitle());
        issue.setDescription(updated.getDescription());
        issue.setStatus(updated.getStatus());
        issue.setPriority(updated.getPriority());
        issue.setAssigneeId(updated.getAssigneeId());
        issue.setSprintId(updated.getSprintId());
        issue.setOrder(updated.getOrder());

        if (updated.getComments() != null) {
            issue.setComments(updated.getComments());
        }

        // Validate and update parentId
        if (updated.getParentId() != null) {
            if (!updated.getParentId().isBlank()) {
                if (!ObjectId.isValid(updated.getParentId())) {
                    throw ApiException.badRequest("Invalid parent issue id");
                }
                if (updated.getParentId().equals(id)) {
                    throw ApiException.badRequest("An issue cannot be its own parent");
                }
                Issue parent = issueRepository.findById(new ObjectId(updated.getParentId()))
                        .orElseThrow(() -> ApiException.notFound("Parent issue not found"));
                if (!parent.getProjectId().equals(issue.getProjectId())) {
                    throw ApiException.badRequest("Parent issue must belong to the same project");
                }
                if (parent.getParentId() != null && !parent.getParentId().isBlank()) {
                    throw ApiException.badRequest("Subtasks cannot have subtasks (one level deep only)");
                }
            }
            issue.setParentId(updated.getParentId().isBlank() ? null : updated.getParentId());
        }

        // Validate and update dependsOn
        if (updated.getDependsOn() != null) {
            dependencyValidationService.validate(issue.getProjectId(), id, updated.getDependsOn());
            issue.setDependsOn(updated.getDependsOn());
        }

        issue.setUpdatedAt(Instant.now());

        Issue saved = issueRepository.save(issue);

        if (saved.getAssigneeId() != null && !saved.getAssigneeId().isBlank() && !Objects.equals(oldAssignee, saved.getAssigneeId())) {
            notificationService.notify(
                    saved.getAssigneeId(),
                    CurrentUser.getUserId(),
                    "ASSIGNED",
                    "You were assigned to issue " + saved.getKey() + ": " + saved.getTitle(),
                    saved.getId(),
                    saved.getProjectId()
            );
        }

        if (saved.getStatus() != null && !Objects.equals(oldStatus, saved.getStatus())) {
            if (saved.getAssigneeId() != null && !saved.getAssigneeId().isBlank()) {
                notificationService.notify(
                        saved.getAssigneeId(),
                        CurrentUser.getUserId(),
                        "STATUS_CHANGED",
                        "Issue " + saved.getKey() + " status changed to " + saved.getStatus(),
                        saved.getId(),
                        saved.getProjectId()
                );
            }
        }

        int newCommentsSize = saved.getComments() != null ? saved.getComments().size() : 0;
        if (newCommentsSize > oldCommentsSize) {
            String targetUser = saved.getAssigneeId();
            if (targetUser != null && !targetUser.isBlank() && !targetUser.equals(CurrentUser.getUserId())) {
                notificationService.notify(
                        targetUser,
                        CurrentUser.getUserId(),
                        "COMMENT",
                        "New comment on issue " + saved.getKey(),
                        saved.getId(),
                        saved.getProjectId()
                );
            }
        }

        try {
            messagingTemplate.convertAndSend("/topic/project/" + saved.getProjectId(), (Object) Map.of("type", "ISSUE_UPDATED", "issueId", saved.getId()));
        } catch (Exception ignored) {}

        return saved;
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteIssue(@PathVariable String id) {
        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid issue id");
        }

        Issue issue = issueRepository.findById(new ObjectId(id)).orElse(null);
        if (issue != null) {
            String projectId = issue.getProjectId();
            issueRepository.deleteById(new ObjectId(id));
            try {
                messagingTemplate.convertAndSend("/topic/project/" + projectId, (Object) Map.of("type", "ISSUE_DELETED", "issueId", id));
            } catch (Exception ignored) {}
        } else {
            issueRepository.deleteById(new ObjectId(id));
        }
    }
}
