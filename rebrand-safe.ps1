# Safe rebranding script
# Run from project root: .\rebrand-safe.ps1

Write-Host "Starting safe rebrand process..." -ForegroundColor Cyan

# Step 1: Create backup
Write-Host ""
Write-Host "Creating backup..." -ForegroundColor Yellow
$backupPath = "..\backup-before-rebrand-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Compress-Archive -Path * -DestinationPath $backupPath -Force
Write-Host "Backup created: $backupPath" -ForegroundColor Green

# Files to update (carefully selected)
$filesToUpdate = @(
    "app.json",
    "app/legal/terms.tsx",
    "app/legal/privacy.tsx",
    "android/app/src/main/AndroidManifest.xml",
    "android/app/build.gradle",
    "README.md",
    "TESTFLIGHT_SETUP.md",
    "eas.json"
)

# Step 2: Replace "Overdose Tracker" with "Compassionate LOG"
Write-Host ""
Write-Host "Replacing 'Overdose Tracker' with 'Compassionate LOG'..." -ForegroundColor Yellow
$count1 = 0
foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content -replace 'Overdose Tracker', 'Compassionate LOG'
        if ($content -ne $newContent) {
            Set-Content $file -Value $newContent -NoNewline
            $count1++
            Write-Host "  Updated: $file" -ForegroundColor Gray
        }
    }
}
Write-Host "Updated $count1 files" -ForegroundColor Green

# Step 3: Replace "ODC" with "Compassionate LOG" (word boundary)
Write-Host ""
Write-Host "Replacing 'ODC' with 'Compassionate LOG'..." -ForegroundColor Yellow
$count2 = 0
foreach ($file in $filesToUpdate) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content -replace '\bODC\b', 'Compassionate LOG'
        if ($content -ne $newContent) {
            Set-Content $file -Value $newContent -NoNewline
            $count2++
            Write-Host "  Updated: $file" -ForegroundColor Gray
        }
    }
}
Write-Host "Updated $count2 files" -ForegroundColor Green

Write-Host ""
Write-Host "Rebrand complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes: git diff" -ForegroundColor White
Write-Host "  2. Test the app: npm start" -ForegroundColor White
Write-Host "  3. Run brand scan: npm run scan:brand" -ForegroundColor White
Write-Host "  4. If good, commit changes" -ForegroundColor White
Write-Host "  5. If bad, restore: git reset --hard HEAD" -ForegroundColor White
Write-Host ""
Write-Host "Backup saved to: $backupPath" -ForegroundColor Yellow
