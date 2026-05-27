package com.rms.common.util;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class FCMUtil {

    private static final Logger log = LoggerFactory.getLogger(FCMUtil.class);

    public void sendNotification(String deviceToken, String title, String body) {
        if (deviceToken == null || deviceToken.isBlank()) return;
        try {
            Message message = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .build();
            FirebaseMessaging.getInstance().send(message);
        } catch (FirebaseMessagingException e) {
            log.warn("FCM send failed for token {}: {}", deviceToken.length() > 10 ? deviceToken.substring(0, 10) : deviceToken, e.getMessage());
        }
    }
}
