package com.rms.common.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

@Service
public class FileUploadService {

    @Autowired
    private LocalFileStorage localFileStorage;

    //@Autowired
    //private DriveAsyncUploader driveAsyncUploader;

    /**
     * Upload MultipartFile: saves locally (sync) + fires Drive upload (async).
     * Returns local relative path like "/uploads/Menu_items/menu_item_123.jpg"
     */
    public String uploadFile(MultipartFile file, String baseFileName, String folderName,
                             DriveUrlCallback callback) throws IOException {
        // Step 1: Save locally (synchronous) - returns relative path
        String localPath = localFileStorage.saveImages(file, folderName, baseFileName);

        // Step 2: Get the saved local file for async Drive upload
        String localFilePath = localFileStorage.getBasePath() + localPath.replaceFirst("/uploads", "");
        File localFile = new File(localFilePath);

        // Step 3: Fire async Drive upload (background) - called on SEPARATE bean so @Async works
        //driveAsyncUploader.uploadToDriveAsync(localFile, baseFileName, folderName, callback);

        return localPath;
    }

    /**
     * Upload java.io.File: saves locally (sync) + fires Drive upload (async).
     * Returns local relative path like "/uploads/kyc_document/pan_file.pdf"
     */
    public String uploadFile(File file, String baseFileName, String folderName,
                             DriveUrlCallback callback) throws IOException {
        // Step 1: Save locally (synchronous) - returns relative path
        String localPath = localFileStorage.saveFile(file, folderName, baseFileName);

        // Step 2: Get the saved local file for async Drive upload
        String localFilePath = localFileStorage.getBasePath() + localPath.replaceFirst("/uploads", "");
        File localFile = new File(localFilePath);

        // Step 3: Fire async Drive upload (background) - called on SEPARATE bean so @Async works
        //driveAsyncUploader.uploadToDriveAsync(localFile, baseFileName, folderName, callback);

        return localPath;
    }

    public boolean deleteLocalFile(String relativePath) {
        return localFileStorage.deleteByRelativePath(relativePath);
    }

    /**
     * Callback interface for async Drive upload completion.
     */
    @FunctionalInterface
    public interface DriveUrlCallback {
        void onSuccess(String driveUrl);
    }
}
