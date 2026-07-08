try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $pdfPath = "C:\Users\Vasanth\Desktop\appsc total topics.pdf"
    $txtPath = "C:\Users\Vasanth\Desktop\PrepareForU\scratch\appsc_total_topics_text.txt"
    $doc = $word.Documents.Open($pdfPath)
    $doc.SaveAs([ref] $txtPath, [ref] 2) # wdFormatText = 2
    $doc.Close()
    $word.Quit()
    "Success" | Out-File "C:\Users\Vasanth\Desktop\PrepareForU\scratch\status.txt"
} catch {
    $_.Exception.Message | Out-File "C:\Users\Vasanth\Desktop\PrepareForU\scratch\error.txt"
    if ($word) { $word.Quit() }
}
