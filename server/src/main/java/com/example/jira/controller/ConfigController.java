package com.example.jira.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${SPRING_DATA_MONGODB_URI:}")
    private String mongodbUri;

    @GetMapping("/status")
    public java.util.Map<String, Object> status() {
        boolean mongoUriSet =
                mongodbUri != null &&
                !mongodbUri.isBlank();

        boolean usingAtlas =
                mongoUriSet &&
                mongodbUri.startsWith("mongodb+srv://");

        return java.util.Map.of(
                "mongoUriSet", mongoUriSet,
                "usingAtlas", usingAtlas
        );
    }
}