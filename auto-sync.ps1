# Script de Sincronizacao Automatica com o GitHub
# Monitora alteracoes na pasta e realiza commit + push automaticamente

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Catalisa41 - Auto Sync GitHub"

$projectPath = $PSScriptRoot
if (-not $projectPath) {
    $projectPath = (Get-Location).Path
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CATALISA41 - AUTO-SYNC GITHUB ATIVADO" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Diretorio monitorado: $projectPath" -ForegroundColor Yellow
Write-Host "Repositorio remoto: https://github.com/israelhespanhol-lang/Catalisa41.git" -ForegroundColor Yellow
Write-Host "Pressione Ctrl+C para encerrar o monitoramento a qualquer momento.`n" -ForegroundColor Gray

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::DirectoryName

$global:hasChanges = $false
$global:lastChangeTime = [DateTime]::MinValue

$action = {
    param($source, $eventArgs)
    $path = $eventArgs.FullPath
    
    # Ignora mudancas dentro da pasta .git
    if ($path -match "\\\.git(\\|$)" -or $path -match "/\.git(/|$)") {
        return
    }

    $global:hasChanges = $true
    $global:lastChangeTime = [DateTime]::Now
}

$createdEvent = Register-ObjectEvent $watcher "Created" -Action $action
$changedEvent = Register-ObjectEvent $watcher "Changed" -Action $action
$deletedEvent = Register-ObjectEvent $watcher "Deleted" -Action $action
$renamedEvent = Register-ObjectEvent $watcher "Renamed" -Action $action

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Monitorando alteracoes em tempo real..." -ForegroundColor Green

try {
    while ($true) {
        Start-Sleep -Seconds 2

        if ($global:hasChanges) {
            # Debounce: aguarda 5 segundos sem novas alteracoes para agrupar as mudancas
            $elapsed = ([DateTime]::Now - $global:lastChangeTime).TotalSeconds
            if ($elapsed -ge 5) {
                $global:hasChanges = $false

                # Verifica se realmente ha diferencas no git
                $status = & git -C "$projectPath" status --porcelain
                if ($status) {
                    $timestamp = (Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
                    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Alteracoes detectadas! Iniciando sincronizacao..." -ForegroundColor Cyan
                    
                    & git -C "$projectPath" add -A
                    & git -C "$projectPath" commit -m "Auto-update: $timestamp"
                    
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Enviando para o GitHub..." -ForegroundColor Cyan
                    $pushOutput = & git -C "$projectPath" push origin main 2>&1
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Sucesso! Mudancas sincronizadas com o GitHub." -ForegroundColor Green
                    } else {
                        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Aviso ao enviar: $pushOutput" -ForegroundColor Red
                    }
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Aguardando proximas alteracoes..." -ForegroundColor Gray
                }
            }
        }
    }
}
finally {
    # Limpa os eventos registrados ao sair
    Unregister-Event -SourceIdentifier $createdEvent.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $changedEvent.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $deletedEvent.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $renamedEvent.Name -ErrorAction SilentlyContinue
    $watcher.Dispose()
    Write-Host "`nMonitoramento encerrado." -ForegroundColor Yellow
}
