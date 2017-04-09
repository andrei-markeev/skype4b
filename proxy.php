<?php
if ($_SERVER['HTTP_REFERER'] != "http://markeev.com/posts/skype4b/"
    && $_SERVER['HTTP_REFERER'] != "https://andrei-markeev.github.io/skype4b/"
    || !preg_match("/^https:\/\/[^\/]*\.lync\.com\//i", $GET["url"]))) {
  header('HTTP/1.0 403 Forbidden');
  die();
}

$ch = curl_init($_GET["url"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$headers = array(
    'Authorization: Bearer '.$_GET["access_token"],
    'Accept: application/json'
);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
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
header("Access-Control-Allow-Origin: ".$_SERVER['HTTP_REFERER'], true);
header("Access-Control-Allow-Credentials: true", true);
header("Access-Control-Allow-Methods: GET, POST, OPTIONS", true);
echo $responseBody;
?>