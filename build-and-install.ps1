# Build a local Android APK ONLY (no Expo Go, no dev server, no QR)
function Fail($m){ Write-Host "ERROR: $m"; exit 1 }

Write-Host "== 0) In project root? =="
if (!(Test-Path package.json)) { Fail "Open the folder that contains package.json and run again." }

Write-Host "== 1) Install deps if needed =="
if (!(Test-Path node_modules)) { npm install || Fail "npm install failed." }

Write-Host "== 2) Ensure native /android exists (prebuild) =="
if (!(Test-Path android)) {
  npx expo prebuild --platform android --clean
  if ($LASTEXITCODE -ne 0) { Fail "expo prebuild failed. Fix app.json/plugins and re-run." }
}

Write-Host "== 3) Build debug APK with Gradle =="
Push-Location android
if (!(Test-Path .\gradlew.bat)) { Fail "Gradle wrapper missing after prebuild." }
.\gradlew.bat clean
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Gradle clean failed—see errors above." }
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Gradle build failed—see errors above." }

$apkRel = "app\build\outputs\apk\debug\app-debug.apk"
if (!(Test-Path $apkRel)) { Pop-Location; Fail "APK not found at $apkRel after build." }
$apkAbs = (Resolve-Path $apkRel).Path
Pop-Location

Write-Host "BUILD_OK"
Write-Host ("APK_PATH="+$apkAbs)
Write-Host "NEXT=Copy that APK to your phone (USB File Transfer) and tap to install. Do NOT use Expo Go."