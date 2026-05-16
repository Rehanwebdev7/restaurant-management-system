package com.rms.common.apis;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class GoogleMapsService {
    public Map<String, Object> getRoadDistanceAndTime(Double originLat, Double originLng, Double destLat, Double destLng) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("distance_km", 0.0);
        response.put("time_minutes", 0);
        response.put("time_text", "0 min");
        return response;
    }
}
