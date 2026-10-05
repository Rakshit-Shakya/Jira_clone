package com.example.jira.service;

import com.example.jira.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Local-disk file storage behind a small interface-shaped service, used by
 * Task 6 (issue attachments) and Task 3 (avatar uploads).
 *
 * IMPORTANT - PRODUCTION CAVEAT: Render's filesystem for a free/starter web
 * service is EPHEMERAL. Anything written to disk (the directory configured
 * by app.upload-dir) is wiped on every redeploy and on most restarts
 * (dyno/container recycling). This implementation is fully functional for
 * local development and for a demo session, but files uploaded in
 * production will NOT survive a redeploy.
 *
 * To make this durable in production without changing the calling code,
 * swap this class's two methods (store/load) for a client of an
 * S3-compatible bucket (Cloudflare R2, Backblaze B2, AWS S3) or Cloudinary:
 * store() would upload the bytes and return the object's key/URL instead of
 * a local path, and load() would stream it back from that bucket. Every
 * caller (AttachmentController, Usercontroller's avatar endpoint) only
 * depends on this class's two methods, not on "it's a local file", so that
 * swap is isolated to this one file.
 */
@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + root, e);
        }
    }

    /**
     * Saves the file under a generated unique name (never the user-supplied
     * filename, to avoid path traversal / collisions) and returns that
     * stored filename (NOT a full path) for persisting in Mongo.
     */
    public String store(MultipartFile file) {
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            extension = original.substring(dot); // includes the dot
        }
        String storedName = UUID.randomUUID() + extension;

        try {
            Path target = root.resolve(storedName).normalize();
            if (!target.startsWith(root)) {
                throw ApiException.badRequest("Invalid file name");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return storedName;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }
    }

    public InputStream load(String storedName) {
        try {
            Path target = root.resolve(storedName).normalize();
            if (!target.startsWith(root)) {
                throw ApiException.badRequest("Invalid file name");
            }
            if (!Files.exists(target)) {
                throw ApiException.notFound("File not found on server");
            }
            return Files.newInputStream(target);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read file", e);
        }
    }

    public void delete(String storedName) {
        try {
            Path target = root.resolve(storedName).normalize();
            if (target.startsWith(root)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException ignored) {
            // Best-effort cleanup; a failed delete here shouldn't fail the
            // caller's request (e.g. deleting an Issue should still succeed
            // even if one attachment file is already gone).
        }
    }
}
