# One-shot: detect device, (re)install APK, ensure LAUNCHER icon, launch app
function Fail($m){ Write-Host "ERROR: $m"; exit 1 }

# Find adb.exe without PATH
function Find-Adb {
  $c=@("$Env:LOCALAPPDATA\Android\Sdk","C:\Android\Sdk")
  foreach($r in $c){ if(Test-Path $r){
    $hit=Get-ChildItem -Path $r -Recurse -Filter adb.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if($hit){ return $hit.FullName }
  }}
  return $null
}
$adb=Find-Adb
if(!$adb){ Fail "Android SDK Platform-Tools not found. Install via Android Studio → SDK Manager → Platform-Tools." }

# Require authorized device
& $adb kill-server | Out-Null; & $adb start-server | Out-Null
$devs = & $adb devices
if(($devs -join "`n") -notmatch "device$"){ Fail "No authorized device. On your Razr: enable USB debugging, accept RSA prompt, set USB to File Transfer, then re-run." }

# Read package from manifest
$manifest = "android\app\src\main\AndroidManifest.xml"
if(!(Test-Path $manifest)){ Fail "AndroidManifest.xml missing. Run: npx expo prebuild --platform android" }
$pkg = (Select-String -Path $manifest -Pattern 'package="([^"]+)"').Matches.Groups[1].Value
if(!$pkg){ Fail "Could not read package name from AndroidManifest.xml" }

# Ensure MAIN/LAUNCHER exists; if missing, inject one for .MainActivity
$man = Get-Content $manifest -Raw
$addedLauncher = $false
if($man -notmatch 'android.intent.category.LAUNCHER'){
  $addedLauncher = $true
  $activityBlock = @"
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
"@
  $man = $man -replace '(</application>)', "$activityBlock`n`$1"
  Set-Content $manifest $man -NoNewline
}

# If we added a launcher OR APK missing, build a debug APK
$apkRel = "android\app\build\outputs\apk\debug\app-debug.apk"
$needBuild = $addedLauncher -or -not (Test-Path $apkRel)
if($needBuild){
  if(!(Test-Path android)){ Fail "Missing ./android. Run: npx expo prebuild --platform android" }
  Push-Location android
  if(!(Test-Path .\gradlew.bat)){ Fail "Gradle wrapper missing. Run: npx expo prebuild --platform android" }
  .\gradlew.bat clean
  if($LASTEXITCODE -ne 0){ Pop-Location; Fail "Gradle clean failed (see first red line above)." }
  .\gradlew.bat assembleDebug
  if($LASTEXITCODE -ne 0){ Pop-Location; Fail "Gradle build failed (see first red line above)." }
  Pop-Location
}
if(!(Test-Path $apkRel)){ Fail "Build said OK but APK not found at $apkRel" }
$apkAbs=(Resolve-Path $apkRel).Path

# Reinstall (handles signature mismatch by uninstalling first)
& $adb reverse tcp:8081 tcp:8081 | Out-Null
& $adb install -r $apkAbs
if($LASTEXITCODE -ne 0){
  & $adb uninstall $pkg | Out-Null
  & $adb install $apkAbs
  if($LASTEXITCODE -ne 0){ Fail "Install failed even after uninstall. Check device storage/permissions (allow installs from this source)." }
}

# Try launching .MainActivity; fallback to resolved launcher
$try1 = "$pkg/.MainActivity"
$launch = & $adb shell am start -n $try1 2>&1
if($launch -match "Error:" -or $launch -match "does not exist"){
  $resolve = & $adb shell cmd package resolve-activity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -p $pkg 2>&1
  $comp = (($resolve -split "`n") | ?{$_ -match "name="} | Select-Object -First 1) -replace '.*name=',''
  if($comp){ & $adb shell am start -n $comp | Out-Null } else {
    & $adb shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d "package:$pkg" | Out-Null
    Fail "App installed, but launcher component couldn't be resolved. App Info opened—tap **Open**."
  }
}

Write-Host "DONE_APP_VISIBLE"
Write-Host ("PACKAGE="+$pkg)
Write-Host ("APK_PATH="+$apkAbs)
Write-Host "NEXT=Check your app drawer. If a red screen appears, wait ~10s for Metro; tap Reload."