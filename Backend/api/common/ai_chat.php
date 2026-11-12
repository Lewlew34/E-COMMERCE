<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/config/cors.php';
require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/core/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Phương thức yêu cầu không hợp lệ.', 405);
}

/**
 * Lấy danh sách sản phẩm đang mở bán từ MySQL để làm ngữ cảnh cho Gemini.
 *
 * @return array{byId: array<int, array<string, mixed>>, promptText: string}
 */
function fetch_ai_catalog(PDO $conn): array
{
    $query = "
        SELECT 
            p.id, p.name, p.slug, p.description, p.specifications,
            b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug, b.logo AS brand_logo,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
            MIN(CASE
                WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     AND fsi.sold_count < fsi.stock_limit THEN fsi.flash_sale_price
                ELSE v.price
            END) AS price,
            MIN(CASE
                WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     AND fsi.sold_count < fsi.stock_limit THEN v.price
                ELSE v.compare_at_price
            END) AS compare_price,
            MAX(CASE
                WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     AND fsi.sold_count < fsi.stock_limit THEN 1
                ELSE 0
            END) AS is_flash_sale,
            MIN(CASE WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     THEN fs.start_time ELSE NULL END) AS flash_sale_start_time,
            MIN(CASE WHEN fsi.id IS NOT NULL AND NOW() BETWEEN fs.start_time AND fs.end_time
                     THEN fs.end_time ELSE NULL END) AS flash_sale_end_time,
            SUM(v.stock_quantity) AS total_stock,
            MIN(v.image) AS thumbnail,
            MIN(v.id) AS variant_id
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users seller ON seller.id = p.seller_id
        LEFT JOIN product_variants v ON p.id = v.product_id
        LEFT JOIN flash_sale_items fsi ON fsi.variant_id = v.id
        LEFT JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
        WHERE p.status = 'published'
          AND (p.seller_id IS NULL OR seller.status = 'active')
        GROUP BY p.id, p.name, p.slug, p.description, p.specifications,
                 b.id, b.name, b.slug, b.logo, c.id, c.name, c.slug
        ORDER BY is_flash_sale DESC, p.id DESC
        LIMIT 60
    ";

    $stmt = $conn->query($query);
    $byId = [];
    $lines = [];

    while ($row = $stmt->fetch()) {
        $specs = json_decode((string) ($row['specifications'] ?? '{}'), true);
        if (!is_array($specs)) {
            $specs = [];
        }
        $row['specifications'] = $specs;

        $productId = (int) $row['id'];
        $byId[$productId] = $row;

        $price = number_format((float) ($row['price'] ?? 0), 0, ',', '.');
        $comparePrice = (float) ($row['compare_price'] ?? 0);
        $stock = (int) ($row['total_stock'] ?? 0);
        $isFlashSale = (int) ($row['is_flash_sale'] ?? 0) === 1;

        $specParts = [];
        foreach (array_slice($specs, 0, 5, true) as $k => $v) {
            if (is_scalar($v) && (string) $v !== '') {
                $specParts[] = "$k: $v";
            }
        }
        $specSummary = $specParts !== [] ? implode('; ', $specParts) : 'Đang cập nhật';
        $saleTag = $isFlashSale
            ? ' | ĐANG FLASH SALE (giá gốc ' . number_format($comparePrice, 0, ',', '.') . 'đ)'
            : '';

        $lines[] = sprintf(
            '- [ID:%d] %s | Hãng: %s | Danh mục: %s | Giá: %sđ%s | Tồn kho: %d | Thông số: %s',
            $productId,
            (string) $row['name'],
            (string) ($row['brand_name'] ?? 'Chính hãng'),
            (string) ($row['category_name'] ?? 'Công nghệ'),
            $price,
            $saleTag,
            $stock,
            $specSummary
        );
    }

    return [
        'byId' => $byId,
        'promptText' => $lines !== [] ? implode("\n", $lines) : '(Hiện chưa có sản phẩm nào trong CSDL)',
    ];
}

/**
 * Chuẩn hóa lịch sử hội thoại theo định dạng contents của Gemini API.
 *
 * @param array<int, mixed> $rawHistory
 * @return array<int, array{role: string, parts: array<int, array{text: string}>}>
 */
function normalize_gemini_contents(array $rawHistory, string $currentMessage): array
{
    $recentHistory = array_slice($rawHistory, -10);
    $contents = [];

    foreach ($recentHistory as $item) {
        if (!is_array($item)) {
            continue;
        }
        $text = trim((string) ($item['text'] ?? ''));
        if ($text === '') {
            continue;
        }
        $text = mb_substr($text, 0, 1500);
        $role = ($item['sender'] ?? '') === 'user' ? 'user' : 'model';

        // Gemini yêu cầu hội thoại bắt đầu từ lượt 'user'
        if ($contents === [] && $role === 'model') {
            continue;
        }

        // Gộp nếu có 2 tin nhắn liên tiếp cùng role
        $lastIdx = count($contents) - 1;
        if ($lastIdx >= 0 && $contents[$lastIdx]['role'] === $role) {
            $contents[$lastIdx]['parts'][0]['text'] .= "\n" . $text;
        } else {
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => $text]],
            ];
        }
    }

    $lastIdx = count($contents) - 1;
    if ($lastIdx >= 0 && $contents[$lastIdx]['role'] === 'user') {
        $contents[$lastIdx]['parts'][0]['text'] .= "\n" . $currentMessage;
    } else {
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $currentMessage]],
        ];
    }

    return $contents;
}

/**
 * Tạo system prompt chứa vai trò, chính sách shop và danh sách sản phẩm thật.
 */
function build_lhktech_system_prompt(string $catalogText): string
{
    return <<<PROMPT
Bạn là LHKTech AI Assistant — chuyên viên tư vấn thiết bị công nghệ của sàn thương mại điện tử LHKTech.

CHÍNH SÁCH CỦA LHKTECH:
- Hàng chính hãng 100%, đầy đủ VAT và thẻ bảo hành.
- Bảo hành chính hãng 24 tháng; hỗ trợ 1 đổi 1 trong 30 ngày nếu có lỗi từ nhà sản xuất.
- Hỗ trợ kỹ thuật 24/7 (tư vấn cấu hình, cài đặt phần mềm).
- Giao hàng hỏa tốc 2H nội thành; miễn phí giao hàng toàn quốc cho đơn hàng từ 500.000₫; đóng thùng chống sốc chuyên dụng.

QUY TẮC TRẢ LỜI BẮT BUỘC:
1. Trả lời bằng tiếng Việt tự nhiên, lịch sự, súc tích (dùng **in đậm** cho điểm nhấn quan trọng nếu cần).
2. CHỈ được tư vấn các sản phẩm có mặt trong [DANH SÁCH SẢN PHẨM HIỆN CÓ] bên dưới. Tuyệt đối KHÔNG tự bịa tên sản phẩm, cấu hình hoặc giá bán không có trong danh sách.
3. Khi khách hỏi theo ngân sách (ví dụ "dưới 40 triệu", "tầm 30tr"), hãy lọc và so sánh chính xác dựa trên giá bán thực tế trong danh sách.
4. Nếu không có sản phẩm nào khớp 100% yêu cầu, hãy nói rõ và đề xuất tối đa 2-3 lựa chọn gần nhất có trong danh sách (hoặc trả về product_ids rỗng nếu chỉ hỏi chính sách/chào hỏi).
5. Trả về JSON hợp lệ đúng schema:
   - "reply": câu trả lời tư vấn gửi khách hàng.
   - "product_ids": mảng các số nguyên ID sản phẩm phù hợp nhất muốn hiển thị thẻ sản phẩm (tối đa 4 ID).

[DANH SÁCH SẢN PHẨM HIỆN CÓ]
{$catalogText}
PROMPT;
}

/**
 * Giải mã JSON phản hồi từ Gemini (hỗ trợ trường hợp có bọc markdown code fence).
 *
 * @return array{reply: string, product_ids: array<int, int>}
 */
function parse_gemini_json_payload(string $rawText): array
{
    $cleaned = trim($rawText);
    if (preg_match('/^```(?:json)?\s*(.*?)\s*```$/is', $cleaned, $matches)) {
        $cleaned = trim($matches[1]);
    }

    $decoded = json_decode($cleaned, true);
    if (is_array($decoded) && isset($decoded['reply'])) {
        $ids = [];
        if (isset($decoded['product_ids']) && is_array($decoded['product_ids'])) {
            foreach ($decoded['product_ids'] as $id) {
                $intId = filter_var($id, FILTER_VALIDATE_INT);
                if ($intId !== false && $intId > 0) {
                    $ids[] = (int) $intId;
                }
            }
        }
        return [
            'reply' => trim((string) $decoded['reply']),
            'product_ids' => array_values(array_unique($ids)),
        ];
    }

    return [
        'reply' => $cleaned !== '' ? $cleaned : 'Em chưa thể tạo câu trả lời lúc này, bạn thử hỏi lại giúp em nhé!',
        'product_ids' => [],
    ];
}

/**
 * Thực hiện HTTP POST JSON với 3 tầng fallback để tương thích cả XAMPP Windows mặc định.
 *
 * @param array<int, string> $headers
 * @return array{status: int, body: string}
 */
function http_post_json(string $url, array $headers, string $jsonBody): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('Không thể khởi tạo phiên cURL.');
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $jsonBody,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 25,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $responseBody = curl_exec($ch);
        $curlErrNo = curl_errno($ch);
        $curlError = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($responseBody === false || $curlErrNo !== 0) {
            throw new RuntimeException('Lỗi kết nối tới Gemini API: ' . $curlError, 502);
        }

        return ['status' => $httpCode, 'body' => (string) $responseBody];
    }

    if (in_array('https', stream_get_wrappers(), true) && filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers),
                'content' => $jsonBody,
                'timeout' => 25,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $responseBody = @file_get_contents($url, false, $context);
        if ($responseBody !== false) {
            $httpCode = 0;
            if (isset($http_response_header) && is_array($http_response_header)) {
                foreach ($http_response_header as $headerLine) {
                    if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $headerLine, $matches)) {
                        $httpCode = (int) $matches[1];
                    }
                }
            }
            return ['status' => $httpCode, 'body' => $responseBody];
        }
    }

    if (PHP_OS_FAMILY === 'Windows' && function_exists('proc_open')) {
        $curlExe = is_file('C:\\Windows\\System32\\curl.exe') ? 'C:\\Windows\\System32\\curl.exe' : 'curl.exe';
        $cmd = [$curlExe, '-sS', '-X', 'POST', '--connect-timeout', '8', '--max-time', '12'];
        foreach ($headers as $h) {
            $cmd[] = '-H';
            $cmd[] = $h;
        }
        $cmd[] = '--data-binary';
        $cmd[] = '@-';
        $cmd[] = '-w';
        $cmd[] = "\n%{http_code}";
        $cmd[] = $url;

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $process = @proc_open($cmd, $descriptors, $pipes);
        if (is_resource($process)) {
            fwrite($pipes[0], $jsonBody);
            fclose($pipes[0]);

            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            $exitCode = proc_close($process);

            if ($exitCode === 0 && is_string($stdout)) {
                $pos = strrpos($stdout, "\n");
                if ($pos !== false) {
                    $statusStr = trim(substr($stdout, $pos + 1));
                    $bodyStr = substr($stdout, 0, $pos);
                    return [
                        'status' => ctype_digit($statusStr) ? (int) $statusStr : 200,
                        'body' => $bodyStr,
                    ];
                }
            }

            $errMsg = trim((string) $stderr) !== '' ? trim((string) $stderr) : "curl.exe exit code $exitCode";
            throw new RuntimeException('Lỗi kết nối tới Gemini API: ' . $errMsg, 502);
        }
    }

    throw new RuntimeException('Máy chủ PHP chưa có cURL/OpenSSL để gọi HTTPS ra ngoài.', 500);
}

/**
 * Gọi Google Gemini generateContent REST API.
 *
 * @param array<int, array{role: string, parts: array<int, array{text: string}>}> $contents
 * @return array{reply: string, product_ids: array<int, int>}
 */
function call_gemini_api(string $apiKey, string $model, string $systemPrompt, array $contents): array
{
    $endpoint = sprintf(
        'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
        rawurlencode($model)
    );

    $payload = [
        'system_instruction' => [
            'parts' => [['text' => $systemPrompt]],
        ],
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => 0.4,
            'maxOutputTokens' => 1024,
            'responseMimeType' => 'application/json',
            'responseSchema' => [
                'type' => 'OBJECT',
                'properties' => [
                    'reply' => ['type' => 'STRING'],
                    'product_ids' => [
                        'type' => 'ARRAY',
                        'items' => ['type' => 'INTEGER'],
                    ],
                ],
                'required' => ['reply', 'product_ids'],
            ],
        ],
    ];

    $encodedPayload = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($encodedPayload === false) {
        throw new RuntimeException('Không thể mã hóa dữ liệu gửi sang Gemini API.', 500);
    }

    $result = http_post_json(
        $endpoint,
        [
            'Content-Type: application/json',
            'x-goog-api-key: ' . $apiKey,
        ],
        $encodedPayload
    );

    $httpCode = $result['status'];
    $responseBody = $result['body'];

    $data = json_decode($responseBody, true);
    if ($httpCode < 200 || $httpCode >= 300 || !is_array($data)) {
        $apiMsg = is_array($data) && isset($data['error']['message'])
            ? (string) $data['error']['message']
            : "HTTP $httpCode";
        throw new RuntimeException('Gemini API trả về lỗi: ' . $apiMsg, $httpCode >= 400 ? $httpCode : 502);
    }

    $parts = $data['candidates'][0]['content']['parts'] ?? [];
    $textChunks = [];
    if (is_array($parts)) {
        foreach ($parts as $part) {
            if (is_array($part) && isset($part['text'])) {
                $textChunks[] = (string) $part['text'];
            }
        }
    }

    $rawText = trim(implode("\n", $textChunks));
    if ($rawText === '') {
        throw new RuntimeException('Gemini không trả về nội dung phản hồi.', 502);
    }

    return parse_gemini_json_payload($rawText);
}

$body = get_json_body();
$message = mb_substr(trim((string) ($body['message'] ?? '')), 0, 1000);
if ($message === '') {
    json_error('Vui lòng nhập nội dung câu hỏi.', 422);
}

$history = isset($body['history']) && is_array($body['history']) ? $body['history'] : [];

$apiKey = trim((string) ($_ENV['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: ''));
if ($apiKey === '') {
    json_error('Chưa cấu hình GEMINI_API_KEY trong file .env.', 503);
}

$model = trim((string) ($_ENV['GEMINI_MODEL'] ?? getenv('GEMINI_MODEL') ?: 'gemini-3.5-flash-lite'));
if ($model === '') {
    $model = 'gemini-3.5-flash-lite';
}

try {
    $catalog = ['byId' => [], 'promptText' => '(Không thể tải danh mục sản phẩm từ CSDL)'];
    try {
        $conn = get_db_connection();
        $catalog = fetch_ai_catalog($conn);
    } catch (PDOException $dbException) {
        error_log('AI Chat catalog fallback (DB unavailable): ' . $dbException->getMessage());
    }

    $systemPrompt = build_lhktech_system_prompt($catalog['promptText']);
    $contents = normalize_gemini_contents($history, $message);

    $candidateModels = array_values(array_unique([
        $model,
        'gemini-flash-lite-latest',
        'gemini-3.8-flash',
    ]));

    $aiResult = null;
    $usedModel = $model;
    $lastException = null;

    foreach ($candidateModels as $candidateModel) {
        try {
            $aiResult = call_gemini_api($apiKey, $candidateModel, $systemPrompt, $contents);
            $usedModel = $candidateModel;
            break;
        } catch (RuntimeException $err) {
            $lastException = $err;
            // Thử model dự phòng nếu model hiện tại quá tải (503), hết hạn mức (429) hoặc không khả dụng (404)
            if (!in_array($err->getCode(), [404, 429, 503], true)) {
                throw $err;
            }
        }
    }

    if ($aiResult === null) {
        throw $lastException ?? new RuntimeException('Không thể kết nối tới Gemini API.', 502);
    }

    $matchedProducts = [];
    foreach ($aiResult['product_ids'] as $pid) {
        if (isset($catalog['byId'][$pid])) {
            $matchedProducts[] = $catalog['byId'][$pid];
            if (count($matchedProducts) >= 4) {
                break;
            }
        }
    }

    json_success([
        'reply' => $aiResult['reply'],
        'products' => $matchedProducts,
        'source' => 'gemini',
        'model' => $usedModel,
    ]);
} catch (RuntimeException $e) {
    $code = $e->getCode();
    $status = ($code >= 400 && $code < 600) ? $code : 502;
    json_error($e->getMessage(), $status);
}
