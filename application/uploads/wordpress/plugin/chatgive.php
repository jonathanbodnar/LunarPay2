<?php
/**
 * Plugin Name: Chatgive
 */
function load_chatgive_variables() {
    $string = file_get_contents(__DIR__."/chatgive.json");
    $json_chatgive = json_decode($string, true);
    echo '<script>var _chatgive_link = {"token": "'.$json_chatgive['token'].'", "connection": '.$json_chatgive['connection'].'}</script>';
}
add_action('wp_print_scripts', 'load_chatgive_variables');

function load_chatgive($hook) {
    wp_enqueue_script('chatgive_install', 'https://chatgive.me/assets/widget/chat-widget-install.js');
}
add_action('wp_enqueue_scripts', 'load_chatgive');