package com.rms.common.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class LocalFileStorage {

    @Value("${local.storage.base-path}")
    private String basePath;

    @Value("${local.storage.base-url}")
    private String baseUrl;

    public String getBasePath() {
        return basePath;
    }

    // Allowed extensions and MIME types
    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(
    	    Arrays.asList("jpg", "jpeg", "png", "heic", "heif", "svg", "txt", "pdf", "mp4", "mov")
    	);

    	private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(
    	    Arrays.asList(
    	        "image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif", "image/svg+xml",
    	        "text/plain", "application/pdf",
    	        "video/mp4", "video/quicktime"
    	    )
    	);


    // ==============================
    // 🔹 MultipartFile Upload
    // ==============================
    public String saveImages(MultipartFile file, String folderName, String fileName) throws IOException {
        System.out.println("⚡ [saveImages] Start upload process...");

        if (file == null) {
            System.out.println("❌ [saveImages] MultipartFile is null!");
           throw new RuntimeException("File is null");
        }

        System.out.println("📄 [saveImages] Original filename: " + file.getOriginalFilename());
        validateFile(file);

        String safeFolder = sanitizeFolderPath(folderName);
        System.out.println("📂 [saveImages] Sanitized folder name: " + safeFolder);

        // Create directory
        File dir = Paths.get(basePath).resolve(safeFolder).toFile();
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            System.out.println(created ? "✅ Directory created: " + dir.getAbsolutePath()
                    : "❌ Failed to create directory: " + dir.getAbsolutePath());
            if (!created)throw new RuntimeException("Failed to create directory");
        }

        // Get extensions
        String extensionFromFile = getFileExtension(file); // original file extension
        String extensionFromPassedName = getFileExtension(fileName);

        System.out.println("🔹 Extension from MultipartFile: " + extensionFromFile);
        System.out.println("🔹 Extension from passed fileName: " + extensionFromPassedName);

        // Decide final file name
        String finalFileName;
        if (fileName != null && !fileName.isEmpty()) {
            finalFileName = extensionFromPassedName.isEmpty()
                    ? fileName + "." + extensionFromFile
                    : fileName;
        } else {
            finalFileName = "file_" + System.currentTimeMillis() + "." + extensionFromFile;
        }

        finalFileName = sanitizeFileName(finalFileName); // sanitize final name
        System.out.println("📝 [saveImages] Final filename: " + finalFileName);

        File destination = new File(dir, finalFileName);

        // Delete old files
        deleteExistingFiles(dir, finalFileName);

        // Save file
        System.out.println("💾 [saveImages] Saving file to: " + destination.getAbsolutePath());
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            System.out.println("❌ [saveImages] Error saving file: " + e.getMessage());
           throw new RuntimeException("Failed to save file", e);
        }

        System.out.println("✅ [saveImages] File saved successfully!");
        String fileUrl = baseUrl + "/" + safeFolder + "/" + finalFileName;
        System.out.println("🌐 [saveImages] Accessible URL: " + fileUrl);

        return fileUrl;
    }

    // ==============================
    // 🔹 Regular File Upload
    // ==============================
    public String saveFile(File file, String folderName, String fileName) throws IOException {
        System.out.println("⚡ [saveFile] Start file save process...");

        if (file == null || !file.exists()) {
            System.out.println("❌ [saveFile] File is null or does not exist!");
           throw new RuntimeException("File is null or missing");
        }

        String extensionFromFile = getFileExtension(file.getName());
        String extensionFromPassedName = getFileExtension(fileName);

        System.out.println("📄 [saveFile] File name: " + file.getName());
        System.out.println("🔹 Extension from File: " + extensionFromFile);
        System.out.println("🔹 Extension from passed fileName: " + extensionFromPassedName);

        if (!ALLOWED_EXTENSIONS.contains(extensionFromFile.toLowerCase())) {
           throw new RuntimeException("❌ File type not allowed: " + extensionFromFile);
        }

        String safeFolder = sanitizeFolderPath(folderName);
        File dir = Paths.get(basePath).resolve(safeFolder).toFile();
        if (!dir.exists() && !dir.mkdirs()) {
           throw new RuntimeException("❌ Failed to create directory: " + dir.getAbsolutePath());
        }

        String finalFileName;
        if (fileName != null && !fileName.isEmpty()) {
            finalFileName = extensionFromPassedName.isEmpty()
                    ? fileName + "." + extensionFromFile
                    : fileName;
        } else {
            finalFileName = file.getName();
        }

        finalFileName = sanitizeFileName(finalFileName);
        System.out.println("📝 [saveFile] Final filename: " + finalFileName);

        File destination = new File(dir, finalFileName);

        deleteExistingFiles(dir, finalFileName);

        try {
            Files.copy(file.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            System.out.println("❌ [saveFile] Error saving file: " + e.getMessage());
           throw new RuntimeException("Failed to save file", e);
        }

        System.out.println("✅ [saveFile] File saved successfully at: " + destination.getAbsolutePath());
        String fileUrl = baseUrl + "/" + safeFolder + "/" + finalFileName;
        System.out.println("🌐 [saveFile] Accessible URL: " + fileUrl);

        return fileUrl;
    }

    // ==============================
    // 🔹 Delete File
    // ==============================
    public boolean deleteFile(String folderName, String fileName) {
        try {
            String safeFolder = sanitizeFolderPath(folderName);
            String safeFile = sanitizeFileName(fileName);
            File file = Paths.get(basePath).resolve(safeFolder).resolve(safeFile).toFile();

            System.out.println("🗑 [deleteFile] Attempting to delete file: " + file.getAbsolutePath());
            if (file.exists()) {
                boolean deleted = file.delete();
                System.out.println(deleted ? "✅ File deleted successfully" : "❌ File deletion failed");
                return deleted;
            } else {
                System.out.println("⚠ File does not exist");
                return false;
            }
        } catch (Exception e) {
            System.out.println("❌ Error while deleting file: " + e.getMessage());
            return false;
        }
    }

    public boolean deleteByRelativePath(String relativePath) {
        try {
            if (relativePath == null || relativePath.isBlank()) {
                return false;
            }

            String normalized = relativePath.replace('\\', '/');
            if (normalized.startsWith("/uploads/")) {
                normalized = normalized.substring("/uploads/".length());
            } else if (normalized.startsWith("uploads/")) {
                normalized = normalized.substring("uploads/".length());
            }

            Path root = Paths.get(basePath).toAbsolutePath().normalize();
            Path filePath = root.resolve(normalized).normalize();
            if (!filePath.startsWith(root)) {
                System.out.println("⚠ [deleteByRelativePath] Refusing to delete path outside upload root: " + relativePath);
                return false;
            }

            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                cleanupEmptyDirectories(filePath.getParent(), root);
            }
            return deleted;
        } catch (Exception e) {
            System.out.println("❌ Error while deleting file by path: " + e.getMessage());
            return false;
        }
    }

    // ==============================
    // 🔒 Utility + Validation Methods
    // ==============================
    private void validateFile(MultipartFile file) throws IOException {
        System.out.println("🔒 [validateFile] Validating file...");

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or missing");
        }

        String contentType = file.getContentType();
        String extension = getFileExtension(file);

        System.out.println("📌 Content type: " + contentType);
        System.out.println("📌 Extension: " + extension);

        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
           throw new RuntimeException("Unsupported MIME type: " + contentType);
        }

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
           throw new RuntimeException("Unsupported file extension: " + extension);
        }
    }

    private String getFileExtension(MultipartFile file) {
        return getFileExtension(file.getOriginalFilename());
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    private String sanitizeFolderPath(String folderName) {
        if (folderName == null || folderName.isBlank()) {
            return "misc";
        }

        String normalized = folderName.replace('\\', '/').trim();
        String[] rawSegments = normalized.split("/+");
        List<String> safeSegments = new ArrayList<>();

        for (String segment : rawSegments) {
            if (segment == null || segment.isBlank() || ".".equals(segment) || "..".equals(segment)) {
                continue;
            }
            safeSegments.add(segment.replaceAll("[^a-zA-Z0-9._-]", "_"));
        }

        return safeSegments.isEmpty() ? "misc" : String.join("/", safeSegments);
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private void deleteExistingFiles(File dir, String finalFileName) {
        String baseName = finalFileName.contains(".")
                ? finalFileName.substring(0, finalFileName.lastIndexOf('.'))
                : finalFileName;

        File[] existingFiles = dir.listFiles((d, name) -> name.startsWith(baseName + "."));
        if (existingFiles != null) {
            for (File f : existingFiles) {
                System.out.println("🗑 Removing old file: " + f.getAbsolutePath());
                boolean deleted = f.delete();
                if (!deleted) System.out.println("⚠ Could not delete: " + f.getAbsolutePath());
            }
        }
    }

    private void cleanupEmptyDirectories(Path current, Path root) {
        try {
            while (current != null && !current.equals(root) && current.startsWith(root)) {
                try (DirectoryStream<Path> stream = Files.newDirectoryStream(current)) {
                    if (stream.iterator().hasNext()) {
                        break;
                    }
                }
                Files.deleteIfExists(current);
                current = current.getParent();
            }
        } catch (Exception e) {
            System.out.println("⚠ [cleanupEmptyDirectories] " + e.getMessage());
        }
    }
}
