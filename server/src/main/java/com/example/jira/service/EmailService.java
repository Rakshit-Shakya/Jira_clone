package com.example.jira.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper around JavaMailSender.
 *
 * Email credentials are supplied entirely through environment variables
 * (see application.properties: MAIL_HOST / MAIL_PORT / MAIL_USERNAME /
 * MAIL_PASSWORD), never hardcoded. If those aren't set, Spring Boot still
 * creates a JavaMailSender bean (pointed at nothing useful), so every send
 * here is wrapped in a try/catch: a missing/broken mail config degrades to
 * "email silently not sent, logged" rather than breaking the API request
 * that triggered the notification. In-app notifications (Task 5) do not
 * depend on this and always work regardless of SMTP configuration.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final boolean enabled;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String fromAddress,
            @Value("${app.mail.enabled:true}") boolean enabled) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.enabled = enabled;
    }

    public void send(String to, String subject, String body) {
        if (!enabled || to == null || to.isBlank()) {
            return;
        }
        if (fromAddress == null || fromAddress.isBlank()) {
            log.info("Email not sent (no MAIL_USERNAME configured). Would have sent to={} subject={}", to, subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (MailException e) {
            log.warn("Failed to send email to {} (subject: {}): {}", to, subject, e.getMessage());
        }
    }
}
