package com.rms.common.util;

import org.springframework.stereotype.Component;

@Component
public class GoogleDriveUtil {
    public static String extractFileId(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        int idx = url.lastIndexOf('/');
        return idx >= 0 ? url.substring(idx + 1) : url;
    }

    public byte[] downloadFile(String fileId) {
        return null;
    }
}
