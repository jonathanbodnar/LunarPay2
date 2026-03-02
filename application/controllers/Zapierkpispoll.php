<?php

defined('BASEPATH') OR exit('No direct script access allowed');

//zapier poll for kpi data, not a service for users
//------------
//we create the google sheet from here using a google service account, then we share that sheet with the main google account, zapier can read that sheet


class Zapierkpispoll extends My_Controller {

    //>>> config ---
    private $shareWith           = 'thegrowthteam@apollo.inc';
    private $secondRangeCol      = null;
    private $sheet_headers       = [
        'id',
        'update_ctrl', //used for helping zapier to update sheet rows
        'email',
        'names',
        'status',
        'organization',
        'user_created_on',
    ];
    private $sheet_id_column     = 0;
    private $sheet_status_column = 4;

    //<<< config ---

    public function __construct() {
        parent::__construct();
    }

    public function auth($default = 'login_only') {

        $headers = get_headers_safe();

        if (!isset($headers['authorization']) || strpos($headers['authorization'], 'Basic ') !== 0) {
            output_json(['status' => false, 'code' => '401']);
            http_response_code(401);
            return false;
        }

        $authSplit = explode(':', base64_decode(explode(' ', $headers['authorization'])[1]), 2);

        if (count($authSplit) != 2) {
            output_json(['status' => false, 'code' => '401']);
            http_response_code(401);
            return false;
        }

        $user = $authSplit[0];
        $pass = $authSplit[1];
        if ($user == ZAPIER_POLLING_KPIS_USER && $pass == ZAPIER_POLLING_KPIS_PASS) {
            if ($default == 'login_only') {
                output_json(['status' => true, 'code' => '200']);
                http_response_code(200);
                return true;
            } else {
                // ===== continue with the script

                return true;
            }
        }

        http_response_code(401);
        return false;
    }

    private function initialize_google() {
        set_time_limit(0);
        ini_set('max_execution_time', 0);

        $this->shareWith = 'thegrowthteam@apollo.inc';

        $client = new Google_Client();
        $client->setApplicationName('GSheets from PHP');
        $client->setScopes([Google_Service_Sheets::SPREADSHEETS, Google_Service_Sheets::DRIVE_FILE]);
        $client->setAuthConfig(APPPATH . 'xcredentials' . DIRECTORY_SEPARATOR . 'chatgive-srv-acc-1.json');

        $this->gclient = $client;
    }

    private function createFolderIfExists($new_folder_name) {

        $client = $this->gclient;

        $drive_service = new \Google_Service_Drive($client);

        $param['q'] = "mimeType='application/vnd.google-apps.folder'";
        $folders    = $drive_service->files->listFiles($param);

        $folderFound = null;
        $found       = false;

        foreach ($folders->files as $folder) {
            if ($folder->name == $new_folder_name) {
                $found       = true;
                $folderFound = $folder;
                break;
            }
        }

        $permissionParams = [
            'type'         => 'user',
            'role'         => 'writer',
            'emailAddress' => $this->shareWith
        ];

        if (!$found) {
            $file = new \Google_Service_Drive_DriveFile();
            $file->setName($new_folder_name);
            $file->setMimeType('application/vnd.google-apps.folder');

            $folder = $drive_service->files->create($file);

            $newPermission = new Google_Service_Drive_Permission($permissionParams);
            $drive_service->permissions->create($folder->id, $newPermission, ['fields' => 'id']);
        }

        return $found ? $folderFound : $folder;
    }

    private function createSheetFileIfExists($folder, $sheet_name) {

        $client = $this->gclient;

        $drive_service = new \Google_Service_Drive($client);

        $param['q'] = "'" . $folder->id . "' in parents";

        $files = $drive_service->files->listFiles($param);

        $service   = new \Google_Service_Drive($client);
        $DriveFile = new \Google_Service_Drive_DriveFile();

        $sheetFile = null;
        $found     = false;

        foreach ($files->files as $file) {

            if (strpos($file->name, $sheet_name) !== false) {
                $found     = true;
                $sheetFile = $file;
                break;
            }
        }

        $sheet_data[] = $this->sheet_headers;

        $alpha = range('A', 'Z');
        $ncols = count($sheet_data[0]);
        $nrows = count($sheet_data);

        $this->secondRangeCol = $alpha[$ncols - 1];

        if (!$found) {
            $DriveFile->setMimeType('application/vnd.google-apps.spreadsheet');
            $DriveFile->setName($sheet_name);
            $DriveFile->setParents([$folder->id]);
            $sheetFile = $service->files->create($DriveFile);

            $service_sheet = new Google_Service_Sheets($client);
            $spreadsheetId = $sheetFile->id;

            $range = "Sheet1!A1:" . $this->secondRangeCol . $nrows;

            $body   = new Google_Service_Sheets_ValueRange(array(
                'values' => $sheet_data
            ));
            $params = array(
                'valueInputOption' => 'USER_ENTERED' //https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
            );

            $service_sheet->spreadsheets_values->update($spreadsheetId, $range, $body, $params);
        }

        return $sheetFile;
    }

    //zapier poll gathers data from our endpoint, zapier consider only new records based on deduplicate field, in this case, update_ctrl it that field
    //so, the zapier flow is configured to read those new records, if the id sent does not exist in the googlesheet it creates a new row
    ///// if the id sent does exist in the googlesheet it does not create a new row but updates the related row.

    public function get_orgnx_status_t1() {

        $response = $this->auth('resource');
        if ($response === false) {
            output_json(['status' => false, 'code' => '401']);
            return $response;
        }

        $this->initialize_google();

        $folder = $this->createFolderIfExists('chatgive-org-status');

        $sheet_name = 'chatgive-org-status-data1.1'; //chatgive-org-status-service-account
        $sheetFile  = $this->createSheetFileIfExists($folder, $sheet_name);

        $spreadsheetId = $sheetFile->id;

        $client        = $this->gclient;
        $service_sheet = new Google_Service_Sheets($client);

        $result = $this->db->query("select max(ch_id) as max_church_id from church_detail")->row();

        $rows_to_read            = $result->max_church_id + 5; //adding 5 more, it's better to overestimate than underestimate
        $max_column_letter_range = $this->secondRangeCol;

        $range    = "Sheet1!A2:$max_column_letter_range$rows_to_read";
        $response = $service_sheet->spreadsheets_values->get($spreadsheetId, $range);

        if ($response->values) {
            $sheet_data = $response->values;
        } else {
            $sheet_data = [];
        }


        $this->load->model('orgnx_onboard_psf_model');

        $orgs = $this->orgnx_onboard_psf_model->getZappierPollingData();

        $key_ids    = array_column($orgs, 'id');
        $orgs_items = array_combine($key_ids, $orgs);

        foreach ($sheet_data as $sheet_item) {
            if (isset($sheet_item[$this->sheet_id_column]) && isset($orgs_items[$sheet_item[$this->sheet_id_column]])) {
                if (strtolower($sheet_item[$this->sheet_status_column]) !== strtolower($orgs_items[$sheet_item[$this->sheet_id_column]]['status'])) {
                    $orgs_items[$sheet_item[$this->sheet_id_column]]['update_ctrl'] = $orgs_items[$sheet_item[$this->sheet_id_column]]['update_ctrl'] . '-' . date('Y-md-His');
                }
            }
        }

        //remove ch_id indexes
        $data = [];

        foreach ($orgs_items as $org) {
            $data [] = $org;
        }

        $test_data_only = 0; //for zapier testing step only
        if ($test_data_only) {
            $test_data = [];

            $test_data[0]['id']              = 0;
            $test_data[0]['update_ctrl']     = 0;
            $test_data[0]['email']           = 'testzapier@chatgive.com';
            $test_data[0]['names']           = 'john doe';
            $test_data[0]['organization']    = 'org-name';
            $test_data[0]['status']          = 'registered';
            $test_data[0]['user_created_on'] = '2021-07-27';

            $data = $test_data;
        }

        http_response_code(200);
        output_json($data);
    }

    public function read() {

        $this->initialize_google();

        $client = $this->gclient;

        $service = new \Google_Service_Drive($client);

        $param['q'] = "mimeType='application/vnd.google-apps.folder'";

        //$folderId = "1H5Y07RPFBQ8fC0jOOGW4V6sK0bwg2rNd";
        //$folderId = "1WNFKS61xG9wMRPgzdiyFTsDFZR8O8ev7"; //service call log
        //$folderId = "1MFSlyA2Pxga5_Y_yRjH5EYrz3p8NxGlN";
        //$param['q'] = "'" . $folderId . "' in parents";
        //$param = [];

        $folders = $service->files->listFiles($param);

        //d($folders);
        //DELETE ALL FOLDERS !!

        $delete = 0;

        foreach ($folders->files as $folder) {
            d($folder->id . ' ' . $folder->name, false);
            if ($delete) {
                $service->files->delete($folder->id);
            }
        }
    }

}
