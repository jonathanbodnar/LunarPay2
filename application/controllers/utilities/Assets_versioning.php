<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Assets_versioning extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
    }

    public function run()
    {
        $assetsBasePath = FCPATH . 'assets';

        $directories = [
            'js',
            'js/general',
            'js/products',
            'css',
            'customer',
            'customer-portal',
            'argon-dashboard-pro-v1.2.0/assets/css',
            'admin/js'
        ];

        $directories = array_combine($directories, array_map(fn($dir) => "{$assetsBasePath}/$dir", $directories));

        $versionFile = FCPATH . 'application/assets-versioning/file.json'; // Path to the version file

        // If the version file exists, read the existing versions
        $existingVersions = [];
        if (file_exists($versionFile)) {
            $existingVersions = json_decode(file_get_contents($versionFile), true);
        }

        $versions = []; // Prepare the versions array
        $newFiles = [];  // Track new files
        $updatedFiles = [];  // Track updated files
        $deletedFiles = [];  // Track deleted files

        // Loop through each directory type (JS, CSS, etc.)
        foreach ($directories as $type => $directory) {
            // Check if the directory exists
            if (!is_dir($directory)) {
                echo "Directory '$directory' does not exist!";
                continue; // Skip if directory does not exist
            }

            // Scan js and css
            $files = glob($directory . '/*.{js,css}', GLOB_BRACE); // Dynamically check for files based on type

            // Process each file and generate version
            foreach ($files as $file) {
                $fileKey = $type . '/' . basename($file);
                $newVersion = md5_file($file);

                // Check if the file already exists in the existing versions
                if (!isset($existingVersions[$fileKey])) {
                    // New file: does not exist in the old version file
                    $newFiles[] = $fileKey;
                } elseif ($existingVersions[$fileKey] !== $newVersion) {
                    // Updated file: version has changed
                    $updatedFiles[] = $fileKey;
                }

                // Update the versions array with the new version
                $versions[$fileKey] = $newVersion;
            }
        }

        // Check for deleted files (files that were in the old version but are missing now)
        foreach ($existingVersions as $fileKey => $version) {
            if (!isset($versions[$fileKey])) {
                // File has been deleted
                $deletedFiles[] = $fileKey;
            }
        }

        // Save the versions to the JSON file
        if (file_put_contents($versionFile, json_encode($versions, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES))) {
            // Successfully saved, you can log or process the new/updated/deleted files here
        } else {
            echo "Failed to write version file to $versionFile\n";
            die;
        }

        // Prepare the response data with the categorized files
        $response = [
            'new_files' => $newFiles,
            'updated_files' => $updatedFiles,
            'deleted_files' => $deletedFiles,
            'versions' => $versions
        ];

        // Send the response as JSON
        header('Content-Type: application/json');
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
}
