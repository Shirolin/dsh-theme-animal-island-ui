#requires -Version 5.1
<#
.SYNOPSIS
  Capture a top-level window through the Desktop Window Manager (DWM).

.DESCRIPTION
  Registers the target window as a DWM thumbnail on an offscreen host window and
  captures the host. DWM composites GPU text/filters, so this works while the
  target is covered by other windows (it may freeze/blank when minimized).
  Intended as the no-restart fallback for scripts/capture-desktop.ps1.

  Run with Windows PowerShell 5.1 (powershell.exe), not pwsh 7: the .NET 10
  WinForms/GDI+ reference graph in pwsh 7 is not worth the trouble.
#>
param(
  [Parameter(Mandatory = $true)][string]$OutFile,
  [string]$TitleLike = 'DeepSeek Harness',
  [int]$TargetProcessId = 0,
  [int]$X = -4000,
  [int]$Y = -4000
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class DwmWindowCapture
{
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    public struct DWM_THUMBNAIL_PROPERTIES
    {
        public int dwFlags;
        public RECT rcDestination;
        public RECT rcSource;
        public byte opacity;
        public bool fVisible;
        public bool fSourceClientAreaOnly;
    }

    [DllImport("dwmapi.dll")]
    public static extern int DwmRegisterThumbnail(IntPtr dest, IntPtr src, out IntPtr thumb);
    [DllImport("dwmapi.dll")]
    public static extern int DwmUpdateThumbnailProperties(IntPtr thumb, ref DWM_THUMBNAIL_PROPERTIES props);
    [DllImport("dwmapi.dll")]
    public static extern int DwmUnregisterThumbnail(IntPtr thumb);
    [DllImport("dwmapi.dll")]
    public static extern int DwmFlush();
    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdc, uint flags);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);

    public static string Capture(IntPtr target, string path, int x, int y)
    {
        RECT wr;
        if (!GetWindowRect(target, out wr)) return "GetWindowRect failed";
        int w = wr.Right - wr.Left;
        int h = wr.Bottom - wr.Top;
        if (w <= 0 || h <= 0) return "target has no size";

        var form = new Form
        {
            FormBorderStyle = FormBorderStyle.None,
            ShowInTaskbar = false,
            StartPosition = FormStartPosition.Manual,
            Location = new Point(x, y),
            ClientSize = new Size(w, h),
            BackColor = Color.Black,
            Text = "dwm-capture-host"
        };
        form.Show();
        Application.DoEvents();

        IntPtr thumb;
        int hr = DwmRegisterThumbnail(form.Handle, target, out thumb);
        if (hr != 0)
        {
            form.Close();
            return "DwmRegisterThumbnail hr=" + hr;
        }

        var props = new DWM_THUMBNAIL_PROPERTIES
        {
            // DESTINATION | OPACITY | VISIBLE; source is the whole window,
            // including the native caption, so shell chrome is captured too.
            dwFlags = 0x1 | 0x4 | 0x8,
            rcDestination = new RECT { Left = 0, Top = 0, Right = w, Bottom = h },
            opacity = 255,
            fVisible = true,
            fSourceClientAreaOnly = false
        };
        hr = DwmUpdateThumbnailProperties(thumb, ref props);

        for (int i = 0; i < 12; i++)
        {
            Application.DoEvents();
            DwmFlush();
            System.Threading.Thread.Sleep(100);
        }

        using (var bmp = new Bitmap(w, h))
        using (var g = Graphics.FromImage(bmp))
        {
            IntPtr hdc = g.GetHdc();
            bool ok = PrintWindow(form.Handle, hdc, 2);
            g.ReleaseHdc(hdc);
            bmp.Save(path, ImageFormat.Png);
            if (!ok) { /* keep the bitmap; PrintWindow can report false on layered hosts */ }
        }

        DwmUnregisterThumbnail(thumb);
        form.Close();
        return "ok " + w + "x" + h + " hr=" + hr;
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Windows.Forms, System.Drawing

if ($TargetProcessId -gt 0) {
  $proc = Get-Process -Id $TargetProcessId -ErrorAction Stop
} else {
  $candidates = Get-Process |
    Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like "*$TitleLike*" } |
    Sort-Object StartTime -Descending
  $proc = $candidates | Select-Object -First 1
}
if (-not $proc) { throw "no visible window matching '$TitleLike' (pass -TargetProcessId)" }
if ($proc.MainWindowHandle -eq 0) { throw "process $($proc.Id) has no main window handle" }

$out = [System.IO.Path]::GetFullPath($OutFile)
$dir = [System.IO.Path]::GetDirectoryName($out)
if ($dir -and -not (Test-Path -LiteralPath $dir)) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$result = [DwmWindowCapture]::Capture([IntPtr]$proc.MainWindowHandle, $out, $X, $Y)
if (-not (Test-Path -LiteralPath $out)) { throw "capture failed: $result" }
Write-Output ("{0} | pid={1} hwnd={2} | {3}" -f $out, $proc.Id, $proc.MainWindowHandle, $result)
