<?php

defined('BASEPATH') or exit('No direct script access allowed');

function fuCountFunds($organization_id)
{
    $CI     = &get_instance();
    $result = $CI->db->select('count(f.id) count_donations')
        ->where('f.church_id', $organization_id)
        ->where('f.campus_id is null')
        ->get('funds f')->row();

    return $result->count_donations ? $result->count_donations : 0;
}

class Organization_model extends CI_Model
{

    private $table = 'church_detail';
    private $tableChild1 = 'campuses';

    public function __construct()
    {
        parent::__construct();
    }

    private function checkBelongsToUser($id, $user_id)
    {
        return checkBelongsToUser([
            ['church_detail.ch_id' => $id, 'client_id', 'users.id', $user_id]
        ]);
    }


    //xorgnx_id can be an organization or a suborganization, the response include a "type" for knowking which one is
    public function getUserOrganizationsTree()
    {
        $this->load->helper('fortis');
        $user_id = $this->session->userdata('user_id');

        $orgnx = $this->db->select('org.ch_id as org_id, org.church_name org_name, sorg.id as sorg_id, sorg.name sorg_name, org.fortis_template')
            ->where('org.client_id', $user_id)->where('trash', 0)
            ->join($this->tableChild1 . ' sorg', 'sorg.church_id = org.ch_id', 'LEFT')
            ->get($this->table . ' org')->result();

        $result = [];

        // ---- deliver a clean tree on $result
        foreach ($orgnx as $orgn) {
            if (!isset($result[$orgn->org_id])) {
                $result[$orgn->org_id]['xorgnx_id']        = $orgn->org_id;
                $result[$orgn->org_id]['org_name']         = $orgn->org_name;

                $result[$orgn->org_id]['fortis_template'] = $orgn->fortis_template ? getFortisTplParams($orgn->fortis_template) : null;

                $result[$orgn->org_id]['suborgs'] = [];
                if ($orgn->sorg_id) {
                    $result[$orgn->org_id]['suborgs'][$orgn->sorg_id] = ['sorg_id' => $orgn->sorg_id, 'sorg_name' => $orgn->sorg_name];
                }
            } else {
                $result[$orgn->org_id]['suborgs'][$orgn->sorg_id] = ['sorg_id' => $orgn->sorg_id, 'sorg_name' => $orgn->sorg_name];
                $result[$orgn->org_id]['fortis_template'] = $orgn->fortis_template ? getFortisTplParams($orgn->fortis_template) : null;
            }
        }

        $sessionData = $this->session->userdata();
        $selectedOrg = null;


        if (!isset($sessionData['currnt_org']) || !isset($sessionData['currnt_org']['orgName'])) { //
            return ['status' => false, 'message' => 'Applying updates, relogin required'];
        }

        $mainOrgnxId = $sessionData['currnt_org']['orgnx_id'];

        if ($sessionData['currnt_org']['type'] === 'org') {
            $selectedOrgId = $mainOrgnxId;
            $selectedOrg = $result[$selectedOrgId];
            unset($selectedOrg['suborgs']);

            if (empty($result[$selectedOrgId]['suborgs'])) {
                unset($result[$selectedOrgId]);
            }
        } elseif ($sessionData['currnt_org']['type'] === 'sub') {
            $selectedOrgId = $mainOrgnxId;
            $selectedSOrgId = $sessionData['currnt_org']['sorgnx_id'];
            $_selectedOrg = $result[$selectedOrgId]['suborgs'][$selectedSOrgId];
            $selectedOrg['xorgnx_id'] = $_selectedOrg['sorg_id'];
            $selectedOrg['org_name'] = $_selectedOrg['sorg_name'];
            //do not unset            
        }

        $selectedOrg['type'] = $sessionData['currnt_org']['type'];

        return ['status' => true, 'orgnx_tree' => ['tree' => $result, 'selected_org' => $selectedOrg]];
    }

    public function getDt()
    {
        $user_id = $this->session->userdata('user_id');
        $this->load->library("Datatables");
        $this->datatables->where('client_id', $user_id)
            ->where('trash', 0)
            ->from($this->table);
        $this->datatables->add_column('count_funds', '$1', 'fuCountFunds(ch_id)');

        if ($this->session->userdata('payment_processor_short') === PROVIDER_PAYMENT_PAYSAFE_SHORT) {
            $this->datatables->join('church_onboard_paysafe as cp', 'ch_id = cp.church_id');
            $this->datatables->select("ch_id, church_name, phone_no, website, street_address, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status, twilio_phoneno, UPPER(cp.bank_status) as bank_status, cp.account_status, cp.account_status2");
        } elseif ($this->session->userdata('payment_processor_short') === PROVIDER_PAYMENT_FORTIS_SHORT) {
            $this->datatables->join('church_onboard_fortis as cp', 'ch_id = cp.church_id');
            $this->datatables->select("ch_id, church_name, phone_no, website, street_address, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status, twilio_phoneno, 
                cp.app_status, cp.account_number_last4");
        } else {
            $this->datatables->select("ch_id, church_name, phone_no, website, street_address, city, state, postal, tax_id, giving_type, epicpay_template, paysafe_template, epicpay_verification_status, twilio_phoneno");
        }

        $data    = $this->datatables->generate();
        return $data;
    }

    public function getList($select = false, $orderBy = false)
    {
        $user_id = $this->session->userdata('user_id');

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select("ch_id, if(church_name is null OR church_name like '', 'No name provided', church_name) as church_name");
        }

        if ($orderBy) {
            $this->db->order_by($orderBy);
        }

        $result = $this->db->from($this->table)
            ->where('client_id', $user_id)
            ->where('trash', 0)
            ->get()->result_array();
        return $result;
    }

    public function getWhere($select = false, $where = false, $include_trash = false, $orderBy = false)
    {

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                . 'legal_name, email, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status');
        }

        if ($where) {
            $this->db->where($where);
        }

        if (!$include_trash) {
            $this->db->where('trash', 0);
        }

        if ($orderBy) {
            $this->db->order_by($orderBy);
        }

        $result = $this->db->get($this->table)->result();
        return $result;
    }

    //===== get the first orgnx created
    public function getMain($select, $user_id)
    {

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                . 'legal_name, email, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status');
        }

        $this->db->where('client_id', $user_id);
        $this->db->where('trash', 0);

        $this->db->order_by('ch_id asc');
        $this->db->limit(1);

        $result = $this->db->get($this->table)->row();
        return $result;
    }

    public function get($id, $select = false, $include_trash = false, $user_id = false)
    {
        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                . 'legal_name, email, country, city, state, postal, tax_id, giving_type, epicpay_template, paysafe_template, fortis_template, epicpay_verification_status');
        }

        if (!$include_trash) {
            $this->db->where('trash', 0);
        }

        if ($user_id) { //===== secure calls
            $this->db->where('client_id', $user_id);
        }

        $row = $this->db->where('ch_id', $id)->from($this->table)->get()->row();
        return $row;
    }

    public function getFirst($user_id, $select = false)
    {

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                . 'legal_name, email, country, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status, token');
        }

        $orgnx = $this->db->from($this->table)->where('trash', 0)->where('client_id', $user_id)->order_by('ch_id asc')->limit(1)->get()->row();

        return $orgnx;
    }

    public function getByToken($token)
    {
        $this->db->select('ch_id, church_name,client_id');
        $row = $this->db->where('token', $token)->where('trash', 0)->from($this->table)->get()->row();
        return $row;
    }

    public function getBySlug($slug)
    {
        $this->db->select('ch_id, church_name,token');
        $row = $this->db->where('slug', $slug)->from($this->table)->get()->row();
        return $row;
    }

    private function beforeSave($data)
    {
        if (isset($data['church_name']))
            $data['church_name']          = trim(ucfirst($data['church_name']));
        if (isset($data['legal_name']))
            $data['legal_name']           = trim(ucfirst($data['legal_name']));
        if (isset($data['street_address']))
            $data['street_address']       = trim(ucfirst($data['street_address']));
        if (isset($data['street_address_suite']))
            $data['street_address_suite'] = trim(ucfirst($data['street_address_suite']));
        if (isset($data['city']))
            $data['city']                 = trim(ucfirst($data['city']));
        if (isset($data['state']))
            $data['state']                = ucfirst($data['state']);
        if (isset($data['website'])) {
            $disallowed = ['http://', 'https://']; //remove http:// or https:// from website
            foreach ($disallowed as $d) {
                if (strpos($data['website'], $d) === 0) {
                    $data['website'] = str_replace($d, '', $data['website']);
                }
            }

            $data['website'] = strtolower($data['website']);
        }

        return $data;
    }

    private function createFortisOnboardingReg($user_id, $organization_id)
    {
        $this->load->model('user_model');
        $client = $this->user_model->get($user_id, ['first_name', 'last_name', 'email', 'phone']);

        $this->load->model('orgnx_onboard_fts_model');
        $this->orgnx_onboard_fts_model->register([
            "church_id" => $organization_id,
            "sign_first_name" => $client->first_name,
            "sign_last_name" => $client->last_name,
            "sign_phone_number" => $client->phone,
            "email" => $client->email,
        ]);
    }

    public function register($data, $userId = false)
    {
        unset($data['ch_id']);

        $user_id           = $userId ? $userId : $this->session->userdata('user_id');
        $data['client_id'] = $user_id;

        $user = $this->db->select('payment_processor')->where('id', $user_id)->get('users')->row();

        //Setting Token
        $bytes                    = openssl_random_pseudo_bytes(16, $cstrong);
        $token                    = bin2hex($bytes);
        $data['token']            = $token;

        if ($user->payment_processor == PROVIDER_PAYMENT_EPICPAY_SHORT) {
            $data['epicpay_template'] = EPICPAY_TPL_DEFAULT;
        } elseif ($user->payment_processor == PROVIDER_PAYMENT_PAYSAFE_SHORT) {
            //templates assigned when onboarding, templates can be more than one
        } elseif ($user->payment_processor == PROVIDER_PAYMENT_FORTIS_SHORT) {
            //---
        }

        $data['created_at']       = date('Y-m-d H:i:s');

        $data = $this->beforeSave($data);

        $this->db->insert($this->table, $data);

        $organization_id = $this->db->insert_id();

        if ($user->payment_processor == PROVIDER_PAYMENT_FORTIS_SHORT) {
            $this->createFortisOnboardingReg($user_id, $organization_id);
        }

        return $organization_id;
    }

    public function update($data, $user_id = false)
    {
        $id      = $data['ch_id'];
        $user_id = $user_id ? $user_id : $this->session->userdata('user_id');
        $result  = $this->checkBelongsToUser($id, $user_id);
        if ($result !== true) {
            return $result;
        }

        $data = $this->beforeSave($data);

        $this->db->where('ch_id', $id);
        $this->db->update($this->table, $data);
        return true;
    }

    //it does not set a new slug if there is an existing one
    //we expect the church has alrady a name set for creating the slug
    //if there is no church name it does no create the slug, we expect always there is a church name when calling this method
    public function setSlug($church_id)
    {
        $church_detail = $this->db->where('ch_id', $church_id)->select('ch_id, church_name, slug')->get($this->table)->row();

        if ($church_detail->slug) {
            //do not set the slug if it is already created
            return false;
        }

        if (empty($church_detail->church_name)) {
            //do no set the slug if there is no church_name (there would not a base for creating the slug
            return false;
        }

        $slug  = strtolower(str_replace(' ', '-', trim($church_detail->church_name)));

        $orgSlugExist = $this->getBySlug($slug);
        if ($orgSlugExist) {
            if ($orgSlugExist->ch_id == $church_id) {
                //if the slug already exists but it is from the church we are working with it means that the slug is already set, we do nothing
                return false;
            }
            //if the slug already exists but it is not from the church we are working with, proceed to concatemate the church_id string to make it unique            
            $slug .= '-' . $church_id;
        }

        $this->db->where('ch_id', $church_id)->update($this->table, ['slug' => $slug]);
        return true;
    }

    public function update_twilio($church_id, $twilio_data)
    {
        $user_id = $this->session->userdata('user_id');

        $this->db->where('ch_id', $church_id);
        $this->db->where('client_id', $user_id); //secure query

        $this->db->update($this->table, $twilio_data);
        return true;
    }

    public function remove($id, $user_id)
    {
        //it does not remove, it only hides
        $orgnx = $this->get($id);

        if (!$orgnx) {
            return ['status' => false, 'message' => ''];
        }

        if ($orgnx->epicpay_verification_status == 'N') {
            $this->db->where('client_id', $user_id)->where('ch_id', $id)->update($this->table, ['trash' => 1]);
            return ['status' => true, 'message' => 'Company removed'];
        } else {
            return ['status' => false, 'message' => $orgnx->church_name . ' can not be removed'];
        }
    }
}
