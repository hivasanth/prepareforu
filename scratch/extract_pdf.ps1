try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $pdfPath = "C:\Users\Vasanth\Desktop\group 3.pdf"
    $txtPath = "C:\Users\Vasanth\Desktop\PrepareForU\scratch\group_3_text.txt"
    $doc = $word.Documents.Open($pdfPath)
    $doc.SaveAs([ref] $txtPath, [ref] 2) # wdFormatText = 2
    $doc.Close()
    $word.Quit()
    Write-Host "Success: Converted group 3.pdf"
} catch {
    Write-Error $_.Exception.Message
}
