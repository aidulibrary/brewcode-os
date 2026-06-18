# ================================================================
# BrewCode OS — 301 重定向：礼字号.中国 → brewcode.礼字号.中国
# 目标窗口：已有 Cloudflare API Token 授权的 TRAE 对话
# ================================================================

# ⚠️ 执行前确认：你的 API Token 已在环境变量或 wrangler 中可用
# 如果 Token 在 wrangler.toml 中，跳过 $TOKEN 赋值，直接使用 wrangler

$TOKEN = "YOUR_CLOUDFLARE_API_TOKEN"
$ZONE  = "0d3e654c3781bc66d48468568b6ca35d"
$ACCT  = "069b4b27c46072cd26d43332ea283c70"
$H     = @{ "Authorization" = "Bearer $TOKEN"; "Content-Type" = "application/json" }

# ═══════════════════════════════════════════════════════════════
# 步骤 1：查看当前 apex 记录
# ═══════════════════════════════════════════════════════════════
Write-Host "`n[1/3] 查询当前 Apex 记录..." -ForegroundColor Cyan
$dns = Invoke-RestMethod `
  -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records?type=CNAME&name=礼字号.中国" `
  -Headers $H -Method Get

if ($dns.result.Count -gt 0) {
    $record = $dns.result[0]
    Write-Host "  当前记录: $($record.name) → $($record.content) (ID: $($record.id))" -ForegroundColor Yellow
    Write-Host "  建议保留此 CNAME（Cloudflare 会 CNAME flatten），叠加 Redirect Rule" -ForegroundColor Gray
} else {
    Write-Host "  未找到 CNAME 记录，将仅创建 Redirect Rule" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════
# 步骤 2：获取 http_request_redirect ruleset
# ═══════════════════════════════════════════════════════════════
Write-Host "`n[2/3] 获取 Redirect Ruleset..." -ForegroundColor Cyan
$rulesets = Invoke-RestMethod `
  -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE/rulesets" `
  -Headers $H -Method Get

$redirectRuleset = $rulesets.result | Where-Object { $_.phase -eq "http_request_redirect" }

if (-not $redirectRuleset) {
    Write-Host "  ❌ 未找到 http_request_redirect ruleset，Zone 可能未启用 Redirect Rules" -ForegroundColor Red
    Write-Host "  备选方案：使用 Page Rules (老方式)" -ForegroundColor Yellow
    # Page Rules 备选
    $pageRuleBody = @{
        targets = @(@{ target = "url"; constraint = @{ operator = "matches"; value = "礼字号.中国/*" } })
        actions = @(@{ id = "forwarding_url"; value = @{ url = "https://brewcode.礼字号.中国/$1"; status_code = 301 } })
        status = "active"
    } | ConvertTo-Json -Depth 4
    $pr = Invoke-RestMethod `
      -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE/pagerules" `
      -Method Post -Headers $H -Body $pageRuleBody
    Write-Host "  Page Rule 结果: $($pr.success)" -ForegroundColor $(if($pr.success){'Green'}else{'Red'})
    exit
}

Write-Host "  Ruleset ID: $($redirectRuleset.id)" -ForegroundColor Gray
Write-Host "  现有规则数: $($redirectRuleset.rules.Count)" -ForegroundColor Gray

# 检查是否已有同名规则
$existingRule = $redirectRuleset.rules | Where-Object { $_.description -eq "portal-redirect" }
if ($existingRule) {
    Write-Host "  ⚠ 已存在 portal-redirect 规则，将更新" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════
# 步骤 3：创建/更新 301 重定向规则
# ═══════════════════════════════════════════════════════════════
Write-Host "`n[3/3] 创建 301 重定向规则..." -ForegroundColor Cyan

# 保留现有规则，追加新规则
$newRules = @()
foreach ($r in $redirectRuleset.rules) {
    if ($r.description -ne "portal-redirect") {
        $newRules += $r
    }
}
$newRules += @{
    expression    = '(http.host eq "礼字号.中国")'
    description   = "portal-redirect"
    action        = "redirect"
    action_parameters = @{
        from_value = @{
            target_url           = @{ value = "https://brewcode.礼字号.中国" }
            status_code          = 301
            preserve_query_string = $true
        }
    }
}

$updateBody = @{ rules = $newRules } | ConvertTo-Json -Depth 6
$result = Invoke-RestMethod `
  -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE/rulesets/$($redirectRuleset.id)" `
  -Method Put -Headers $H -Body $updateBody

if ($result.success) {
    Write-Host "  ✅ 301 重定向规则已生效" -ForegroundColor Green
    Write-Host "  礼字号.中国 → https://brewcode.礼字号.中国" -ForegroundColor Cyan
} else {
    Write-Host "  ❌ 失败: $($result.errors[0].message)" -ForegroundColor Red
}

# ═══════════════════════════════════════════════════════════════
# 验证
# ═══════════════════════════════════════════════════════════════
Write-Host "`n验证中..." -ForegroundColor Cyan
try {
    $verify = Invoke-WebRequest -Uri "https://礼字号.中国" -TimeoutSec 10 -MaximumRedirection 0 -ErrorAction Stop
    # 如果没有重定向但返回 200，说明 CNAME 还在直接服务
    Write-Host "  ⚠ 返回 HTTP $($verify.StatusCode)，可能 CNAME 仍在直接服务（Redirect Rule 优先级高于 CNAME）" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 'Moved' -or $_.Exception.Response.StatusCode -eq 'Found') {
        $location = $_.Exception.Response.Headers.Location
        Write-Host "  ✅ 重定向到: $location" -ForegroundColor Green
    } else {
        Write-Host "  ℹ 响应: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  完成。回复此窗口：「已执行，结果: [成功/失败]」" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan