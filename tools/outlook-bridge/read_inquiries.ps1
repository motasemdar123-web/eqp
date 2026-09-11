param (
    [string]$AccountName = "",
    [string]$FolderName = "Parts Inquiries",
    [string]$OutputDir = "",
    [switch]$UnsyncedOnly = $false,
    [switch]$MarkSynced = $false,
    [int]$Limit = 50
)

$ErrorActionPreference = "Stop"

if (-not $OutputDir) {
    $OutputDir = Join-Path $PSScriptRoot "attachments"
}

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
    if ($AccountName) {
        foreach ($store in $namespace.Stores) {
            if ($store.DisplayName -like "*$AccountName*" -or $store.FilePath -like "*$AccountName*") {
                $targetStore = $store
                break
            }
        }
    }
    
    if (-not $targetStore) {
        # Check all stores for the Inbox\FolderName
        foreach ($store in $namespace.Stores) {
            try {
                $r = $store.GetRootFolder()
                foreach ($f in $r.Folders) {
                    if ($f.Name -eq "Inbox") {
                        foreach ($sub in $f.Folders) {
                            if ($sub.Name -eq $FolderName) {
                                $targetStore = $store
                                break
                            }
                        }
                    }
                }
                if ($targetStore) { break }
            } catch {}
        }
    }

    if (-not $targetStore) {
        # Fallback to daralhai store or default store
        foreach ($store in $namespace.Stores) {
            if ($store.DisplayName -like "*daralhai*" -or $store.DisplayName -like "*motasem*" -or $store.DisplayName -like "*mohammad*") {
                $targetStore = $store
                break
            }
        }
    }

    if (-not $targetStore) {
        $targetStore = $namespace.DefaultStore
    }
    
    if (-not $targetStore) {
        throw "Could not find an active Outlook mailbox store."
    }
    
    $root = $targetStore.GetRootFolder()
    $inbox = $null
    foreach ($f in $root.Folders) {
        if ($f.Name -eq "Inbox") { $inbox = $f; break }
    }

    if (-not $inbox) {
        throw "Could not find 'Inbox' folder in store '$($targetStore.DisplayName)'."
    }
    
    $inquiryFolder = $null
    foreach ($f in $inbox.Folders) {
        if ($f.Name -eq $FolderName) { $inquiryFolder = $f; break }
    }
    
    if (-not $inquiryFolder) {
        # Auto-create if not present
        try {
            $inquiryFolder = $inbox.Folders.Add($FolderName)
        } catch {
            $result = @{
                status = "OK"
                account = $targetStore.DisplayName
                message = "Folder '$FolderName' not found in Inbox."
                items = @()
                totalInFolder = 0
            }
            $result | ConvertTo-Json -Compress
            exit 0
        }
    }
    
    $items = $inquiryFolder.Items
    $items.Sort("[ReceivedTime]", $true)
    
    $extracted = @()
    $count = 0
    
    foreach ($mail in $items) {
        if ($count -ge $Limit) { break }
        
        # Only process mail items
        if ($mail.MessageClass -ne "IPM.Note" -and -not $mail.Subject) { continue }
        
        $categories = $mail.Categories
        $isSynced = $false
        if ($categories -and $categories -like "*EQP Synced*") {
            $isSynced = $true
        }
        
        if ($UnsyncedOnly -and $isSynced) {
            continue
        }
        
        $entryID = $mail.EntryID
        $conversationId = $mail.ConversationID
        $subject = $mail.Subject
        $body = $mail.Body
        $senderName = $mail.SenderName
        $senderEmail = Get-SmtpAddress($mail)
        $receivedAt = $mail.ReceivedTime.ToString("yyyy-MM-ddTHH:mm:ss.fffffff")
        
        $toRecipients = ""
        $ccRecipients = ""
        try {
            $toRecipients = $mail.To
            $ccRecipients = $mail.CC
        } catch {}

        $assignedToName = "Motasem Ghanem"
        $recipientEmail = "motasem.ghanem@daralhai.com"

        if ($toRecipients -like "*mohammad*" -or $ccRecipients -like "*mohammad*" -or $toRecipients -like "*qraein*" -or $mail.Body -like "*mohammad.qraein*" -or $mail.Body -like "*Dear Mohammad*") {
            $assignedToName = "Mohammad Qraein"
            $recipientEmail = "mohammad.qraein@daralhai.com"
        }

        $attachments = @()
        if ($mail.Attachments -and $mail.Attachments.Count -gt 0) {
            $safeId = $entryID.Substring(0, [Math]::Min(16, $entryID.Length))
            $msgFolder = Join-Path $OutputDir $safeId
            if (-not (Test-Path $msgFolder)) { New-Item -ItemType Directory -Path $msgFolder -Force | Out-Null }
            
            for ($i = 1; $i -le $mail.Attachments.Count; $i++) {
                $att = $mail.Attachments.Item($i)
                $fileName = $att.FileName
                $filePath = Join-Path $msgFolder $fileName
                try {
                    $att.SaveAsFile($filePath)
                    $attData = @{
                        fileName = $fileName
                        fileSize = $att.Size
                        filePath = $filePath
                        relativePath = "attachments/$safeId/$fileName"
                    }
                    if ($att.Size -gt 0 -and $att.Size -lt 4000000) {
                        try {
                            $bytes = [System.IO.File]::ReadAllBytes($filePath)
                            $attData["base64"] = [Convert]::ToBase64String($bytes)
                        } catch {}
                    }
                    $attachments += $attData
                } catch {}
            }
        }
        
        if ($MarkSynced -and -not $isSynced) {
            try {
                if ($categories) {
                    $mail.Categories = "$categories, EQP Synced"
                } else {
                    $mail.Categories = "EQP Synced"
                }
                $mail.Save()
            } catch {}
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
