package com.rms.controllers;

import com.rms.common.entities.MarqueeMessageEntity;
import com.rms.common.repositories.MarqueeMessageRepository;
import com.rms.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("api/global/marquee")
public class GlobalMarqueeController {

    @Autowired
    private MarqueeMessageRepository marqueeMessageRepository;

    @GetMapping("/getByRestId")
    public ResponseEntity<Object> getByRestId(@RequestParam Long restId) {
        try {
            List<MarqueeMessageEntity> messages =
                    marqueeMessageRepository.findLiveMessages(restId, LocalDateTime.now());
            return ApiResponse.responseBuilder(messages, "SUCCESS", HttpStatus.OK, "Marquee messages fetched");
        } catch (Exception e) {
            return ApiResponse.responseBuilder(null, "FAILURE", HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error fetching marquee: " + e.getMessage());
        }
    }
}
