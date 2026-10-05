package com.example.jira.controller;

import com.example.jira.exception.ApiException;
import com.example.jira.model.Attachment;
import com.example.jira.model.Issue;
import com.example.jira.repository.AttachmentRepository;
import com.example.jira.repository.IssueRepository;
import com.example.jira.security.CurrentUser;
import com.example.jira.service.FileStorageService;
import com.example.jira.service.ProjectAccessService;
import org.bson.types.ObjectId;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Task 6: file attachments on issues, with server-side size/type
 * enforcement. Browser-side `accept=` filtering is NOT trusted - every
 * constraint here is re-checked on the server because that's the only copy
 * of the validation that actually matters.
 */
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class AttachmentController {

    private static final long MAX_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".png", ".jpg", ".jpeg", ".docx");

    private final AttachmentRepository attachmentRepository;
    private final IssueRepository issueRepository;
    private final FileStorageService fileStorageService;
    private final ProjectAccessService projectAccessService;

    public AttachmentController(
            AttachmentRepository attachmentRepository,
            IssueRepository issueRepository,
            FileStorageService fileStorageService,
            ProjectAccessService projectAccessService) {
        this.attachmentRepository = attachmentRepository;
        this.issueRepository = issueRepository;
        this.fileStorageService = fileStorageService;
        this.projectAccessService = projectAccessService;
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

    @PostMapping("/issues/{issueId}/attachments")
    public Attachment upload(@PathVariable String issueId, @RequestParam("file") MultipartFile file) {
        String userId = requireAuth();
        Issue issue = requireIssue(issueId);
        projectAccessService.requireMember(issue.getProjectId(), userId);

        if (file.isEmpty()) {
            throw ApiException.badRequest("File is empty");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw ApiException.badRequest("File exceeds the 10MB size limit");
        }

        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        boolean typeOk = (contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType))
                && ALLOWED_EXTENSIONS.stream().anyMatch(originalName::endsWith);

        if (!typeOk) {
            throw ApiException.badRequest(
                    "Unsupported file type. Allowed: PDF, PNG, JPG/JPEG, DOCX");
        }

        String storedName = fileStorageService.store(file);

        Attachment attachment = new Attachment();
        attachment.setIssueId(issueId);
        attachment.setUploadedBy(userId);
        attachment.setOriginalFilename(file.getOriginalFilename());
        attachment.setStoredFilename(storedName);
        attachment.setContentType(contentType);
        attachment.setSizeBytes(file.getSize());

        return attachmentRepository.save(attachment);
    }

    @GetMapping("/issues/{issueId}/attachments")
    public List<Attachment> list(@PathVariable String issueId) {
        String userId = requireAuth();
        Issue issue = requireIssue(issueId);
        projectAccessService.requireMember(issue.getProjectId(), userId);
        return attachmentRepository.findByIssueId(issueId);
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable String id) {
        String userId = requireAuth();

        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid attachment id");
        }
        Attachment attachment = attachmentRepository.findById(new ObjectId(id))
                .orElseThrow(() -> ApiException.notFound("Attachment not found"));

        Issue issue = requireIssue(attachment.getIssueId());
        projectAccessService.requireMember(issue.getProjectId(), userId);

        InputStreamResource resource = new InputStreamResource(
                fileStorageService.load(attachment.getStoredFilename()));

        return ResponseEntity.ok()
                .contentType(attachment.getContentType() != null
                        ? MediaType.parseMediaType(attachment.getContentType())
                        : MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(attachment.getOriginalFilename() != null
                                        ? attachment.getOriginalFilename() : "download")
                                .build().toString())
                .body(resource);
    }

    @DeleteMapping("/attachments/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        String userId = requireAuth();

        if (!ObjectId.isValid(id)) {
            throw ApiException.badRequest("Invalid attachment id");
        }
        Attachment attachment = attachmentRepository.findById(new ObjectId(id))
                .orElseThrow(() -> ApiException.notFound("Attachment not found"));

        Issue issue = requireIssue(attachment.getIssueId());
        projectAccessService.requireMember(issue.getProjectId(), userId);

        fileStorageService.delete(attachment.getStoredFilename());
        attachmentRepository.deleteById(new ObjectId(id));

        return Map.of("deleted", true);
    }
}
