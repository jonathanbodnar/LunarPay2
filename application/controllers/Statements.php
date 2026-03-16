<?php

defined('BASEPATH') OR exit('No direct script access allowed');

use Dompdf\Dompdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class Statements extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);
    }

    public function index() {
        $this->load->model('organization_model');
        $this->template_data['title']         = langx("statements");
        $this->template_data['organizations'] = $this->organization_model->getList(['ch_id', 'church_name'], 'ch_id ASC');
        $view                                 = $this->load->view('statement/statement', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }

    public function get_dt() {
        $this->load->model('statement_model');
        output_json($this->statement_model->getDt(), true);
    }

    public function get() {
        $this->load->model('statement_model');
        output_json($this->statement_model->get($this->input->post('id'), $this->session->userdata('user_id')));
    }

    public function generate() {

        $folder_category = 'statmnts_admin/';
        $files_location  = 'application/uploads/' . $folder_category;

        $user_id       = $this->session->userdata('user_id');
        $admin_email   = $this->session->userdata('email');
        $church_id     = $this->input->post('church_id');
        $fund_id       = $this->input->post('fund_id');
        $donor_ids     = $this->input->post('donor_ids');
        $pFrom         = $this->input->post('from_date');
        $pTo           = $this->input->post('to_date');
        $export_option = $this->input->post('export_option');
        $message       = nl2br($this->input->post('message'));

        require_once 'application/libraries/email/EmailProvider.php';
        
        $this->load->model('organization_model');
        $this->load->model('donor_model');
        $this->load->model('donation_model');
        $this->load->model('statement_model');
        $this->load->model('statement_donor_model');

        $left        = 'stmt_' . date('Ymdhis') . '_A' . $user_id;
        $zipFileName = $left . '_all.zip';
        $statementId = $this->statement_model->register([
            'type'       => 'EPIC',
            'client_id'  => $user_id,
            'created_by' => 'A', //>>>> Admin. It can be a donor (D)
            'date_from'  => $pFrom,
            'date_to'    => $pTo,
            'church_id'  => $church_id,
            'file_name'  => $zipFileName,
            'created_at' => date('Y-m-d H:i:s')
                ]
        );

        $emails_not_sent  = 0;
        $files            = [];
        $transactions_all = [];
        foreach ($donor_ids as $donorId) {
            $donor = $this->donor_model->get($donorId, ['id', 'email', 'id_church', 'first_name', 'last_name']);

            $transactions = $this->donation_model->getStatement($donorId, $church_id, $pFrom, $pTo, $fund_id);
            $last_trxn    = $transactions[0];
            $orgnx        = $this->organization_model->get($last_trxn->church_id);

            $transactions_all[] = $transactions;

            $page_data = [
                'date_range'   => date('m/d/Y', strtotime($pFrom)) . ' to ' . date('m/d/Y', strtotime($pTo)),
                'date_title'   => date('Y') . ' Statement',
                'donor_name'   => $last_trxn->first_name . ' ' . $last_trxn->last_name,
                'donor_email'  => $last_trxn->email,
                'donor_anon'   => $last_trxn->account_donor_id ? false : true,
                'church_data'  => $orgnx,
                'transactions' => $transactions
            ];

            $this->statement_donor_model->register([
                'statement_id' => $statementId,
                'church_id'    => $last_trxn->church_id,
                'donor_email'  => $last_trxn->email,
                'donor_name'   => $last_trxn->first_name . ' ' . $last_trxn->last_name,
                'created_at'   => date('Y-m-d H:i:s')
                    ]
            );

            //====== create pdf
            $pdf  = new Dompdf();
            $html = $this->load->view('donation/statement_template', $page_data, true);
            $pdf->setPaper("Letter", "portrait");
            $pdf->loadHtml($html);
            $pdf->render();

            $fileNamePdf = 'stmt_' . date('Ymdhis') . '_A' . $user_id . '_D' . $donorId . '_' . md5(microtime(true)) . '.pdf';
            file_put_contents($files_location . $fileNamePdf, $pdf->output(['compress' => 0]));
            array_push($files, $fileNamePdf);

            if ($export_option == 'email') {
                $from    = $admin_email;
                $emailTo = $donor->email; //'juan@apolloapps.com';
                if ($emailTo) {
                    $resp = EmailProvider::getInstance()->sendEmail($from, $orgnx->church_name, $emailTo, $orgnx->church_name . ' | Statement ' . $page_data['date_range'], $message, [$files_location . $fileNamePdf]);
                    if (!$resp['status']) {
                        $emails_not_sent++;
                    }
                }
            }
        }

        //====== create xlsx
        $fileNameExcel = 'stmt_' . date('Ymdhis') . '_A' . $user_id . '.xlsx';
        $spreadsheet   = new Spreadsheet();
        $sheet         = $spreadsheet->getActiveSheet();

        $this->printExcel($sheet, $transactions_all);

        $writer = new Xlsx($spreadsheet);
        $writer->save($files_location . $fileNameExcel);
        array_push($files, $fileNameExcel);
        //====== end create xlsx

        $this->load->library('zip');

        foreach ($files as $file) {
            $this->zip->read_file($files_location . $file, $file);
            $this->zip->archive($files_location . $zipFileName);
            if (file_exists($files_location . $file)) {
                unlink($files_location . $file);
            }
        }

        output_json([
            'status'          => true,
            'data'            => FILES_URL . $folder_category . $zipFileName,
            'message'         => 'Statement created',
            'emails_not_sent' => $emails_not_sent
        ]);
    }

    private function printExcel(&$sheet, $transactions_all) {

        $sheet->setCellValue('A1', 'Id');
        $sheet->setCellValue('B1', 'Name');
        $sheet->setCellValue('C1', 'Email');
        $sheet->setCellValue('D1', 'Church');
        $sheet->setCellValue('E1', 'Campus');
        $sheet->setCellValue('F1', 'Date');
        $sheet->setCellValue('G1', 'Amount');
        $sheet->setCellValue('H1', 'Method');
        $sheet->setCellValue('I1', 'Funds');

        $i = 2;
        foreach ($transactions_all as $transactions) {
            foreach ($transactions as $row) {
                $sheet->setCellValue('A' . $i, $row->id);
                $sheet->setCellValue('B' . $i, $row->first_name . ' ' . $row->last_name);
                $sheet->setCellValue('C' . $i, $row->email);
                $sheet->setCellValue('D' . $i, $row->church_name);
                $sheet->setCellValue('E' . $i, $row->campus_name ? $row->campus_name : '-');
                $sheet->setCellValue('F' . $i, $row->created_at);
                $sheet->setCellValue('G' . $i, $row->total_amount);

                $source = '-';
                if ($row->source_type) {
                    $source = $row->source_type == 'card' || $row->source_type == 'bank' ? ucfirst($row->source_type) . ' ... ' . $row->last_digits : '...';
                } elseif ($row->src) {
                    $source = ($row->src == 'CC' ? 'Card' : 'Bank') . ($row->last_digits ? $row->last_digits . ' ... ' : '');
                } elseif ($row->batch_method) {
                    $source = ucfirst(strtolower($row->batch_method));
                }
                $sheet->setCellValue('H' . $i, $source);

                $sheet->setCellValue('I' . $i, $row->funds_name);
                $i++;
            }
        }
    }

}
