$ErrorActionPreference = "Stop"
$outputDirectory = Join-Path $PSScriptRoot "../public/sounds"
$voice = New-Object -ComObject SAPI.SpVoice
$english = $voice.GetVoices("Language=409").Item(0)
$voice.Voice = $english
$voice.Rate = 0
$voice.Volume = 100
$announcements = @(
    @{ File = "timer-60.wav"; Text = "One minute remaining." },
    @{ File = "timer-45.wav"; Text = "Forty five seconds remaining." },
    @{ File = "timer-30.wav"; Text = "Thirty seconds remaining." },
    @{ File = "elapsed-60.wav"; Text = "One minute elapsed." },
    @{ File = "elapsed-45.wav"; Text = "Forty five seconds elapsed." },
    @{ File = "elapsed-30.wav"; Text = "Thirty seconds elapsed." }
)
foreach ($announcement in $announcements) {
    $stream = New-Object -ComObject SAPI.SpFileStream
    $stream.Format.Type = 22
    $path = Join-Path $outputDirectory $announcement.File
    try {
        $stream.Open($path, 3, $false)
        $voice.AudioOutputStream = $stream
        [void]$voice.Speak($announcement.Text)
    } finally {
        $stream.Close()
    }
    Write-Output ("Generated " + $announcement.File + " with " + $english.GetDescription())
}
