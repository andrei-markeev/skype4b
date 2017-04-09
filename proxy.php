<?php
    $origin = empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_ORIGIN'] : $_SERVER['HTTP_REFERER'];
    if (!preg_match("/^(http:\/\/markeev\.com|https:\/\/andrei\-markeev\.github\.io)/", $origin)
        || !preg_match("/^https:\/\/[^\/]*\.lync\.com\//i", $_GET["url"]))
    {
        header('HTTP/1.0 403 Forbidden');
        echo "Requests from origin " . $origin . " are not allowed.";
        return;
    }

    if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
        header("Access-Control-Allow-Origin: ". $origin, true);
        header("Access-Control-Allow-Credentials: true", true);
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS", true);
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        return;
    }

    $ch = curl_init($_GET["url"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $headers = array(
        'Authorization: Bearer '.$_GET["access_token"],
        'Accept: application/json',
        'Content-Type: application/json'
    );
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents("php://input"));
    }

    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    $response = curl_exec($ch);
    $responseInfo = curl_getinfo($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $responseHeaders = substr($response, 0, $headerSize);
    $responseBody = substr($response, $headerSize);
    curl_close($ch);

    foreach (explode("\r\n", $responseHeaders) as $header) {
        header(trim($header), false);
    }

    header("Access-Control-Allow-Origin: ". $origin, true);
    header("Access-Control-Allow-Credentials: true", true);
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS", true);
    
    echo $responseBody;
?>