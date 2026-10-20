$bat = @"
@echo off
cd /d "%~dp0"
git add .
git commit -m aggiornamento
git push
echo Fatto! Sito live in 60 secondi.
pause
"@
[System.IO.File]::WriteAllText("C:\Users\mirco\Desktop\repository\Jekyll + GitHub\2-PUBBLICA.bat", $bat, [System.Text.Encoding]::ASCII)
Write-Host OK
