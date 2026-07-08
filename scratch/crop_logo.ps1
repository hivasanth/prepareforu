Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Vasanth\.gemini\antigravity\brain\45759fef-24b5-4c0a-a655-334332baeaa3\media__1780113196130.jpg"
$destPath = "C:\Users\Vasanth\Desktop\PrepareForU\src\assets\logo.png"

# Ensure the destination folder exists
$destDir = Split-Path $destPath
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

$srcBitmap = New-Object System.Drawing.Bitmap($srcPath)
$srcWidth = $srcBitmap.Width
$srcHeight = $srcBitmap.Height

Write-Output "Original Dimensions: $srcWidth x $srcHeight"

# Define the target size
$targetSize = 512

# Create a new blank bitmap at 512x512 with transparent background
$destBitmap = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
$g = [System.Drawing.Graphics]::FromImage($destBitmap)

# Set highest quality options for scaling and rendering
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Clear with transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Define the circle bounds inside the 512x512 target
# Keep a tiny padding of 1.5% to avoid any white edge artifacts
$padding = [int]($targetSize * 0.015) 
$circleSize = $targetSize - ($padding * 2)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse($padding, $padding, $circleSize, $circleSize)

# Set clip to the circular path
$g.SetClip($path)

# Draw and scale the original image onto the 512x512 destination bitmap
$g.DrawImage($srcBitmap, 0, 0, $targetSize, $targetSize)

# Clean up graphics
$g.Dispose()

# Save the new compressed image as PNG (supports transparency)
$destBitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Clean up resources
$srcBitmap.Dispose()
$destBitmap.Dispose()

Write-Output "Successfully cropped and optimized logo (512x512) and saved to $destPath"
