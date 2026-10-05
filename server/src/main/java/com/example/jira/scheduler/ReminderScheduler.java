package com.example.jira.scheduler;

import com.example.jira.model.Issue;
import com.example.jira.repository.IssueRepository;
import com.example.jira.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class ReminderScheduler {

    private final IssueRepository issueRepository;
    private final NotificationService notificationService;

    public ReminderScheduler(
            IssueRepository issueRepository,
            NotificationService notificationService) {
        this.issueRepository = issueRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 3600000) // Every hour
    public void checkDueDates() {
        Instant now = Instant.now();
        Instant in24Hours = now.plus(24, ChronoUnit.HOURS);

        List<Issue> issuesDue = issueRepository.findByDueDateBetweenAndReminderSentFalse(now, in24Hours);
        for (Issue issue : issuesDue) {
            if (issue.getAssigneeId() != null && !issue.getAssigneeId().isBlank()) {
                notificationService.notify(
                        issue.getAssigneeId(),
                        null,
                        "DUE_SOON",
                        "Issue " + issue.getKey() + " (" + issue.getTitle() + ") is due within 24 hours.",
                        issue.getId(),
                        issue.getProjectId()
                );
            }
            issue.setReminderSent(true);
            issueRepository.save(issue);
        }
    }
}
