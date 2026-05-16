package com.rms.common.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class CCAvenueCrypto {
    private CCAvenueCrypto() {
    }

    public static String encrypt(String plainText, String workingKey) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(buildKey(workingKey), "AES"));
        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        return toHex(encrypted);
    }

    public static String decrypt(String encryptedHex, String workingKey) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(buildKey(workingKey), "AES"));
        byte[] decrypted = cipher.doFinal(fromHex(encryptedHex));
        return new String(decrypted, StandardCharsets.UTF_8);
    }

    private static byte[] buildKey(String workingKey) throws Exception {
        MessageDigest md5 = MessageDigest.getInstance("MD5");
        return md5.digest((workingKey == null ? "" : workingKey).getBytes(StandardCharsets.UTF_8));
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static byte[] fromHex(String hex) {
        if (hex == null || (hex.length() % 2) != 0) {
            throw new IllegalArgumentException("Invalid encrypted payload");
        }
        byte[] data = new byte[hex.length() / 2];
        for (int i = 0; i < hex.length(); i += 2) {
            data[i / 2] = (byte) Integer.parseInt(hex.substring(i, i + 2), 16);
        }
        return data;
    }
}
