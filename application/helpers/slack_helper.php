<?php
function sendSlackMessage($user_oauth_token, $channel, $text) {
    $string_body = [
        'channel' => $channel, // Channel de slack
        'text'    => $text
    ];

    $ch              = curl_init();
    $request_headers = [
        'Authorization: Bearer ' . $user_oauth_token,
        'Content-Type:application/json',
    ];
    curl_setopt($ch, CURLOPT_URL, 'https://slack.com/api/chat.postMessage');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($string_body));
    curl_setopt($ch, CURLOPT_HEADER, FALSE);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $result          = curl_exec($ch);
    curl_close($ch);
    $response        = json_decode($result, true);
    $estatemessage   = $response["ok"];
    if ($estatemessage == true) {
        $dataresponse = [
            'estatus'  => true,
            'message' => "Message successfully sent",            
        ];
    } else if ($estatemessage == false) {
        $dataresponse = [
            'estatus'  => false,
            'message' => ucfirst(str_replace('_', ' ',$response["error"]))            
        ];
    }
    return $dataresponse;
}
