$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$html = "c:\Users\GURU\Downloads\artelio-marketplace\artelio-marketplace\public\architecture_doc.html"
$pdf1 = "c:\Users\GURU\Downloads\Artelio_Technical_Architecture.pdf"
$pdf2 = "c:\Users\GURU\Downloads\artelio-marketplace\artelio-marketplace\public\Artelio_Technical_Architecture.pdf"

Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf=`"$pdf1`"", "`"$html`"" -Wait
Copy-Item $pdf1 $pdf2 -Force
Get-Item $pdf1 | Select-Object FullName, Length, LastWriteTime
