package com.example.jira.service;

import com.example.jira.exception.ApiException;
import com.example.jira.model.Project;
import com.example.jira.repository.Projectrepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

/**
 * Shared "is this user allowed to touch this project's data" checks, used by
 * IssueController (subtasks/dependencies), WorkLogController, and
 * AttachmentController so the rule is defined once.
 */
@Service
public class ProjectAccessService {

    private final Projectrepository projectRepository;

    public ProjectAccessService(Projectrepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public Project requireProject(String projectId) {
        if (!ObjectId.isValid(projectId)) {
            throw ApiException.badRequest("Invalid project id");
        }
        return projectRepository.findById(new ObjectId(projectId))
                .orElseThrow(() -> ApiException.notFound("Project not found"));
    }

    public boolean isMember(Project project, String userId) {
        if (userId == null || project == null) {
            return false;
        }
        return userId.equals(project.getOwnerId())
                || (project.getMemberIds() != null && project.getMemberIds().contains(userId));
    }

    /** Throws 403 if userId is not a member (or owner) of the given project. */
    public void requireMember(String projectId, String userId) {
        Project project = requireProject(projectId);
        if (!isMember(project, userId)) {
            throw ApiException.forbidden("You are not a member of this project");
        }
    }

    /**
     * Stand-in for "Project Manager" (the task briefs refer to a PM role the
     * current data model doesn't have) - the project owner is treated as
     * the PM for worklog edit/delete permission purposes.
     */
    public boolean isOwnerOrSelf(Project project, String userId, String otherUserId) {
        return userId.equals(project.getOwnerId()) || userId.equals(otherUserId);
    }
}
