package com.lpu.gateattendance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Stores uploaded files on disk and returns the public path used to serve them.
 * Files land under {app.upload.dir}/students and are exposed at /uploads/students/**.
 */
@Service
public class FileStorageService {

    // Public URL prefix (see WebConfig resource handler).
    public static final String PUBLIC_PREFIX = "/uploads/students/";

    private final Path studentDir;

    public FileStorageService(@Value("${app.upload.dir:data/uploads}") String uploadDir) {
        this.studentDir = Paths.get(uploadDir, "students").toAbsolutePath().normalize();
        try {
            Files.createDirectories(studentDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create upload directory: " + studentDir, e);
        }
    }

    /**
     * Persists the given image and returns its public path (e.g. /uploads/students/<uuid>.jpg),
     * or null if no file was supplied.
     */
    public String storeStudentPhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        Path target = studentDir.resolve(filename).normalize();

        if (!target.startsWith(studentDir)) {
            throw new IllegalArgumentException("Invalid file path.");
        }

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded photo.", e);
        }

        return PUBLIC_PREFIX + filename;
    }

    private String getExtension(String originalFilename) {
        String ext = StringUtils.getFilenameExtension(originalFilename);
        if (ext == null) {
            return "";
        }
        // Keep it to a safe, lowercase, alphanumeric extension.
        return ext.toLowerCase().replaceAll("[^a-z0-9]", "");
    }
}
