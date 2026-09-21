# Script de Sincronizacao Automatica com o GitHub
# Monitora alteracoes na pasta e realiza commit + push automaticamente

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Catalisa41 - Auto Sync GitHub"

$projectPath = $PSScriptRoot
if (-not $projectPath) {
    $projectPath = (Get-Location).Path
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CATALISA41 - SINCRONIZADOR AUTOMATICO GITHUB ATIVO" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Pasta: $projectPath" -ForegroundColor Yellow
Write-Host "GitHub: https://github.com/israelhespanhol-lang/Catalisa41.git" -ForegroundColor Yellow
Write-Host "Branch: main" -ForegroundColor Yellow
Write-Host "Status: Monitorando alteracoes continuamente (Ctrl+C para parar)...`n" -ForegroundColor Gray

while ($true) {
    try {
        $status = & git -C "$projectPath" status --porcelain 2>$null
        if ($status) {
            # Detectou alteracao. Aguarda 4 segundos para garantir que a gravacao terminou (debounce)
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Alteracao detectada nos arquivos. Preparando sincronizacao..." -ForegroundColor Yellow
            Start-Sleep -Seconds 4
            
            # Sincroniza
            & git -C "$projectPath" add -A
            $timestamp = (Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
            $commitMsg = "Auto-update: $timestamp"
            
            & git -C "$projectPath" commit -m "$commitMsg" 2>&1 | Out-Null
            
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Enviando alteracoes para o GitHub..." -ForegroundColor Cyan
            $pushResult = & git -C "$projectPath" push origin main 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] SUCESSO! Alteracoes enviadas para o GitHub." -ForegroundColor Green
            } else {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Falha temporaria ao enviar: $pushResult" -ForegroundColor Red
            }
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Aguardando proximas alteracoes...`n" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Erro durante a verificacao: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 3
}
