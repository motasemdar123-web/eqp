param (
    [string]$AccountName = "Motasem.Ghanem@daralhai.com",
    [string]$FolderName = "Parts Inquiries",
    [string]$OutputDir = "c:\Users\Motasem.ghanem\EQP-System\backend\data\inquiry_attachments",
    [switch]$UnsyncedOnly = $false,
    [switch]$MarkSynced = $false,
    [int]$Limit = 50
)

$ErrorActionPreference = "Stop"

function Get-SmtpAddress($item) {
    try {
        if ($item.SenderEmailType -eq "EX") {
            $sender = $item.Sender
            if ($sender) {
                $exUser = $sender.GetExchangeUser()
                if ($exUser -and $exUser.PrimarySmtpAddress) {
                    return $exUser.PrimarySmtpAddress
                }
            }
        }
        if ($item.SenderEmailAddress) {
            return $item.SenderEmailAddress
        }
    } catch {}
    return ""
}

try {
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    }

    $outlook = New-Object -ComObject Outlook.Application
    $namespace = $outlook.GetNamespace("MAPI")
    
    $targetStore = $null
    foreach ($store in $namespace.Stores) {
        if ($store.DisplayName -like "*$AccountName*" -or $store.FilePath -like "*$AccountName*") {
            $targetStore = $store
            break
        }
    }
    
    if (-not $targetStore) {
        throw "Could not find Outlook store matching '$AccountName'."
    }
    
    $root = $targetStore.GetRootFolder()
    $inbox = $null
    foreach ($f in $root.Folders) {
        if ($f.Name -eq "Inbox") { $inbox = $f; break }
    }
    
    $inquiryFolder = $null
    foreach ($f in $inbox.Folders) {
        if ($f.Name -eq $FolderName) { $inquiryFolder = $f; break }
    }
    
    if (-not $inquiryFolder) {
        $result = @{
            status = "OK"
            message = "Folder '$FolderName' not found or empty."
            items = @()
        }
        $result | ConvertTo-Json -Compress
        exit 0
    }
    
    $items = $inquiryFolder.Items
    $items.Sort("[ReceivedTime]", $true) # Sort descending
    
    $extracted = @()
    $count = 0
    
    foreach ($mail in $items) {
        if ($count -ge $Limit) { break }
        
        # Check if MailItem
        if ($mail.MessageClass -ne "IPM.Note") { continue }
        
        $categories = if ($mail.Categories) { $mail.Categories } else { "" }
        $isSynced = $categories -like "*EQP Synced*"
        
        if ($UnsyncedOnly -and $isSynced) {
            continue
        }
        
        $entryID = $mail.EntryID
        $subject = if ($mail.Subject) { $mail.Subject } else { "(No Subject)" }
        $senderName = if ($mail.SenderName) { $mail.SenderName } else { "" }
        $senderEmail = Get-SmtpAddress($mail)
        $receivedAt = if ($mail.ReceivedTime) { $mail.ReceivedTime.ToString("o") } else { "" }
        $body = if ($mail.Body) { $mail.Body } else { "" }
        $conversationId = if ($mail.ConversationID) { $mail.ConversationID } else { "" }
        
        $toRecipients = if ($mail.To) { $mail.To } else { "" }
        $ccRecipients = if ($mail.CC) { $mail.CC } else { "" }

        $assignedToName = "Motasem Ghanem"
        $recipientEmail = "motasem.ghanem@daralhai.com"

        if ($toRecipients -like "*mohammad*" -or $ccRecipients -like "*mohammad*" -or $toRecipients -like "*qraein*" -or $mail.Body -like "*mohammad.qraein*" -or $mail.Body -like "*Dear Mohammad*") {
            $assignedToName = "Mohammad Qraein"
            $recipientEmail = "mohammad.qraein@daralhai.com"
        }

        $attachments = @()
        if ($mail.Attachments -and $mail.Attachments.Count -gt 0) {
            $msgFolder = Join-Path $OutputDir ($entryID.Substring(0, [Math]::Min(16, $entryID.Length)))
            if (-not (Test-Path $msgFolder)) { New-Item -ItemType Directory -Path $msgFolder -Force | Out-Null }
            
            for ($i = 1; $i -le $mail.Attachments.Count; $i++) {
                $att = $mail.Attachments.Item($i)
                $fileName = $att.FileName
                # Skip embedded small icon images
                $filePath = Join-Path $msgFolder $fileName
                try {
                    $att.SaveAsFile($filePath)
                    $attachments += @{
                        fileName = $fileName
                        fileSize = $att.Size
                        filePath = $filePath
                        relativePath = $filePath.Replace("c:\Users\Motasem.ghanem\EQP-System\", "")
                    }
                } catch {}
            }
        }
        
        if ($MarkSynced -and -not $isSynced) {
            if ($categories) {
                $mail.Categories = "$categories, EQP Synced"
            } else {
                $mail.Categories = "EQP Synced"
            }
            $mail.Save()
        }
        
        $extracted += @{
            entryID = $entryID
            conversationID = $conversationId
            subject = $subject
            senderName = $senderName
            senderEmail = $senderEmail
            recipientEmail = $recipientEmail
            assignedToName = $assignedToName
            toRecipients = $toRecipients
            ccRecipients = $ccRecipients
            receivedAt = $receivedAt
            body = $body
            isSynced = $isSynced
            attachments = $attachments
        }
        
        $count++
    }
    
    $res = @{
        status = "OK"
        account = $targetStore.DisplayName
        folder = $inquiryFolder.FolderPath
        totalInFolder = $items.Count
        returned = $extracted.Count
        items = $extracted
    }
    
    $res | ConvertTo-Json -Depth 6 -Compress
} catch {
    $err = @{
        status = "ERROR"
        message = $_.Exception.Message
    }
    $err | ConvertTo-Json -Compress
}
