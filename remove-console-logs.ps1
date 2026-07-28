# Script to remove all console.log, console.warn, console.error statements from all TypeScript files
$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {
    $relativePath = Resolve-Path -Path $file -Relative
    Write-Host "Processing $relativePath..."
    $content = Get-Content $file -Raw
    
    # Remove single-line console statements (log, warn, error, info, debug)
    $content = $content -replace '(?m)^\s*console\.(log|warn|error|info|debug)\([^;]*\);\s*\r?\n', ''
    
    # Remove multi-line console statements
    $content = $content -replace '(?s)console\.(log|warn|error|info|debug)\([^)]*\);\s*', ''
    
    # Remove console statements that span multiple lines with braces
    $content = $content -replace '(?s)console\.(log|warn|error|info|debug)\([^}]*\}\);\s*', ''
    
    # Handle special case for console.error reassignment in authUtils.ts
    if ($file.Name -eq "authUtils.ts") {
        $content = $content -replace 'const originalError = console\.error;', ''
        $content = $content -replace 'console\.error = function\(.*?\).*?};', ''
        $content = $content -replace 'originalError\.apply\(console, args\);', ''
        $content = $content -replace 'console\.error = originalError;', ''
    }
    
    # Handle special case for console.log in ActiveBookingsList.tsx
    if ($file.Name -eq "ActiveBookingsList.tsx") {
        $content = $content -replace 'onViewDetails=\(\) => console\.log\([^)]*\)', 'onViewDetails={() => {}}'
    }
    
    # Handle special case for console.error in LocationPermissionRequest.tsx
    if ($file.Name -eq "LocationPermissionRequest.tsx") {
        $content = $content -replace '\}\)\.catch\(console\.error\);', '}).catch(() => {});'
    }
    
    # Handle special case for console.log capture in DataIsolationTest.tsx
    if ($file.Name -eq "DataIsolationTest.tsx") {
        $content = $content -replace 'const originalConsoleLog = console\.log;', 'const originalConsoleLog = () => {};'
        $content = $content -replace 'console\.log = \(\.\.\.args: any\[\]\) => {', 'console.log = (...args: any[]) => {};'
        $content = $content -replace 'originalConsoleLog\(\.\.\.args\);', ''
        $content = $content -replace 'console\.log = originalConsoleLog;', ''
    }
    
    Set-Content $file -Value $content -NoNewline
    Write-Host "Completed $relativePath"
}

Write-Host "Done! All console logs have been removed from TypeScript files."