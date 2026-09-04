package com.example.jira.controller;

import com.example.jira.model.Issue;
import com.example.jira.model.Project;
import com.example.jira.repository.IssueRepository;
import com.example.jira.repository.Projectrepository;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueRepository issueRepository;
    private final Projectrepository projectRepository;

    public IssueController(
            IssueRepository issueRepository,
            Projectrepository projectRepository) {

        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
    }

    // CREATE
    @PostMapping
    public Issue createIssue(@RequestBody Issue issue) {

        if (issue.getProjectId() == null ||
                !ObjectId.isValid(issue.getProjectId())) {

            throw new RuntimeException("Valid projectId is required");
        }

        Project project = projectRepository
                .findById(new ObjectId(issue.getProjectId()))
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (issue.getTitle() == null || issue.getTitle().isBlank()) {
            throw new RuntimeException("Issue title is required");
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

        issue.setUpdatedAt(Instant.now());

        return issueRepository.save(issue);
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
            throw new RuntimeException("Invalid issue id");
        }

        return issueRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Issue not found"));
    }

    // UPDATE
    @PutMapping("/{id}")
    public Issue updateIssue(
            @PathVariable String id,
            @RequestBody Issue updated) {

        if (!ObjectId.isValid(id)) {
            throw new RuntimeException("Invalid issue id");
        }

        Issue issue = issueRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        issue.setTitle(updated.getTitle());
        issue.setDescription(updated.getDescription());
        issue.setStatus(updated.getStatus());
        issue.setPriority(updated.getPriority());
        issue.setAssigneeId(updated.getAssigneeId());
        issue.setSprintId(updated.getSprintId());
        issue.setOrder(updated.getOrder());

        issue.setComments(
                updated.getComments() == null
                        ? new java.util.ArrayList<>()
                        : updated.getComments()
        );

        issue.setUpdatedAt(Instant.now());

        return issueRepository.save(issue);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void deleteIssue(@PathVariable String id) {

        if (!ObjectId.isValid(id)) {
            throw new RuntimeException("Invalid issue id");
        }

        issueRepository.deleteById(new ObjectId(id));
    }
}