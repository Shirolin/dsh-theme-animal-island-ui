param([string]$Variant = '', [string]$Audio = 'check\mix-e-final-lower.wav')

$ErrorActionPreference = 'Stop'

$work = $PSScriptRoot
$suffix = if ($Variant) { "-$Variant" } else { '' }
$frames = Join-Path $work "frames-vertical$suffix"
$audio = Join-Path $work $Audio
$output = Join-Path $work "animal-island-promo-vertical$suffix.mp4"
$cover = Join-Path $work "animal-island-promo-cover-3x4$suffix.png"
$poster = Join-Path $work "animal-island-promo-vertical-poster$suffix.webp"

if (-not (Test-Path -LiteralPath (Join-Path $frames '00899.jpg'))) {
  throw "The vertical frame set is incomplete; run node capture-vertical.mjs --fps=30 --force first."
}
if (-not (Test-Path -LiteralPath $audio)) {
  throw 'Missing the final audio mix.'
}

& ffmpeg `
  -hide_banner `
  -loglevel warning `
  -y `
  -framerate 30 `
  -i (Join-Path $frames '%05d.jpg') `
  -i $audio `
  -vf "scale=1080:1440:flags=lanczos:in_range=pc:in_color_matrix=bt470bg:out_range=tv:out_color_matrix=bt709,format=yuv420p" `
  -c:v libx264 `
  -preset slow `
  -crf 18 `
  -pix_fmt yuv420p `
  -profile:v high `
  -level 4.1 `
  -color_range tv `
  -colorspace bt709 `
  -color_primaries bt709 `
  -color_trc bt709 `
  -r 30 `
  -c:a aac `
  -b:a 192k `
  -ar 48000 `
  -ac 2 `
  -shortest `
  -movflags +faststart `
  $output

# 小红书封面：封面卡静止帧，3:4，另存无损 PNG 与网页用 WebP。
& ffmpeg -hide_banner -loglevel error -y -ss 0.2 -i $output -frames:v 1 $cover
& ffmpeg -hide_banner -loglevel error -y -i $cover -c:v libwebp -quality 90 $poster

Get-Item $output, $cover, $poster | Select-Object FullName, Length, LastWriteTime
