package com.example.jira.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${SPRING_MONGODB_URI:}")
    private String mongodbUri;

    @GetMapping("/status")
    public Map<String, Object> status() {

        boolean mongoUriSet =
                mongodbUri != null &&
                !mongodbUri.isBlank();

        boolean usingAtlas =
                mongoUriSet &&
                mongodbUri.startsWith("mongodb+srv://");

        return Map.of(
                "mongoUriSet", mongoUriSet,
                "usingAtlas", usingAtlas
        );
    }
}