package com.example.jira.controller;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.jira.dto.ProjectResponse;
import com.example.jira.model.Project;
import com.example.jira.model.User;
import com.example.jira.repository.Projectrepository;
import com.example.jira.repository.UserRepository;

/**
 * Projectcontroller
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/projects")
public class Projectcontroller {

    private final Projectrepository projectrepository;
    private final UserRepository userRepository;

    public Projectcontroller(Projectrepository projectrepository, UserRepository userRepository) {
        this.projectrepository = projectrepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public Project createProject(@RequestBody Project project) {

        if (project.getOwnerId() == null || project.getOwnerId().isBlank()) {
            throw new RuntimeException("Project owner is required");
        }

        if (project.getMemberIds() == null) {
            project.setMemberIds(new java.util.ArrayList<>());
        }

        if (!project.getMemberIds().contains(project.getOwnerId())) {
            project.getMemberIds().add(project.getOwnerId());
        }

        return projectrepository.save(project);
    }

    @GetMapping
    public List<Project> getAllProjects() {
        return projectrepository.findAll();
    }

    @GetMapping("/{id}")
    public ProjectResponse getProjectById(@PathVariable String id) {
        Project project = projectrepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Fetch owner
        User owner = userRepository.findById(new ObjectId(project.getOwnerId()))
                .orElse(null);

        // Fetch members
        List<ObjectId> memberObjectIds =
        (project.getMemberIds() == null
                ? java.util.Collections.<String>emptyList()
                : project.getMemberIds())
                .stream()
                .filter(memberId -> memberId != null && ObjectId.isValid(memberId))
                .map(ObjectId::new)
                .toList();

        List<User> members = userRepository.findByIdIn(memberObjectIds);

        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                owner,
                members);
    }

    @PutMapping("/{id}")
public Project updaProject(
        @PathVariable String id,
        @RequestBody Project updated) {

    if (!ObjectId.isValid(id)) {
        throw new RuntimeException("Invalid project id");
    }

    Project project = projectrepository.findById(new ObjectId(id))
            .orElseThrow(() -> new RuntimeException("Project not found"));

    project.setName(updated.getName());
    project.setDescription(updated.getDescription());

    List<String> memberIds = updated.getMemberIds() == null
            ? new java.util.ArrayList<>()
            : new java.util.ArrayList<>(updated.getMemberIds());

    if (project.getOwnerId() != null && !memberIds.contains(project.getOwnerId())) {
        memberIds.add(project.getOwnerId());
    }

    project.setMemberIds(memberIds);

    return projectrepository.save(project);
}
}
