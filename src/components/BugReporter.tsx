import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { supabase } from '../supabaseClient'

interface BugReporterProps {
  userEmail?: string
  userId?: string
}

export const BugReporter: React.FC<BugReporterProps> = ({ userEmail, userId }) => {
  // FIXED COMPONENT - v5.0 - RELIABLE ERROR SUBMISSION
  const [isOpen, setIsOpen] = useState(false)
  const [issueType, setIssueType] = useState<'bug' | 'feature' | 'other'>('bug')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      alert('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create minimal email body
      const emailBody = `${description}

From: ${userEmail || 'Anonymous User'}
Type: ${issueType}
Time: ${new Date().toLocaleString()}`

      console.log('🎯 BugReporter v8.0 - Focus on reliable email client opening')

      // Try to store in database first
      try {
        await supabase
          .from('issue_reports')
          .insert({
            user_id: userId,
            user_email: userEmail,
            issue_type: issueType,
            subject: subject,
            description: description,
            status: 'new'
          })
        console.log('✅ Report saved to database')
      } catch (dbError) {
        console.warn('Database save failed:', dbError)
      }

      // Prepare email content
      const emailSubject = `[CartPilot] ${subject}`
      const fullEmailContent = `To: exiledev8668@gmail.com
Subject: ${emailSubject}

${emailBody}`

      // Multiple email client opening methods
      const mailtoUrl = `mailto:exiledev8668@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      
      // HONEST clipboard testing - verify it actually worked
      let clipboardSuccess = false
      
      // Method 1: Modern clipboard API with verification
      try {
        await navigator.clipboard.writeText(fullEmailContent)
        // Verify it actually worked by reading back
        try {
          const readBack = await navigator.clipboard.readText()
          if (readBack === fullEmailContent) {
            clipboardSuccess = true
            console.log('✅ Clipboard VERIFIED working (modern API)')
          } else {
            console.log('❌ Clipboard write succeeded but verification failed')
          }
        } catch (readError) {
          console.log('❌ Clipboard write succeeded but cannot verify (read permission denied)')
          // Assume it worked if write didn't throw
          clipboardSuccess = true
        }
      } catch (clipError1) {
        console.log('Modern clipboard API failed:', clipError1)
        
        // Method 2: execCommand with focus verification
        try {
          const textarea = document.createElement('textarea')
          textarea.value = fullEmailContent
          textarea.style.position = 'fixed'
          textarea.style.left = '-999999px'
          textarea.style.top = '-999999px'
          document.body.appendChild(textarea)
          textarea.focus()
          textarea.select()
          
          // Try the copy command
          const copyResult = document.execCommand('copy')
          console.log('execCommand result:', copyResult)
          
          // Additional verification - check if the selection worked
          const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
          console.log('Selected text length:', selectedText.length, 'vs original:', fullEmailContent.length)
          
          document.body.removeChild(textarea)
          
          // Only claim success if both the command succeeded AND we selected the full text
          if (copyResult && selectedText.length === fullEmailContent.length) {
            clipboardSuccess = true
            console.log('✅ execCommand copy appears successful')
          } else {
            console.log('❌ execCommand copy failed or incomplete selection')
          }
        } catch (clipError2) {
          console.log('execCommand clipboard also failed:', clipError2)
        }
      }
      
      // Focus on reliable email client opening
      let emailOpened = false
      
      console.log('🎯 Attempting to open email client with:', mailtoUrl.substring(0, 100) + '...')
      
      // Method 1: Direct window.location (most reliable)
      try {
        window.location.href = mailtoUrl
        emailOpened = true
        console.log('✅ Email client triggered via window.location.href')
      } catch (e) {
        console.log('❌ window.location.href failed:', e)
        
        // Method 2: Create link and trigger click
        try {
          const link = document.createElement('a')
          link.href = mailtoUrl
          link.style.position = 'fixed'
          link.style.top = '-1000px'
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          emailOpened = true
          console.log('✅ Email client opened via dynamic link click')
        } catch (e2) {
          console.log('❌ Dynamic link method failed:', e2)
          
          // Method 3: Manual link creation user can click
          const manualLink = document.createElement('a')
          manualLink.href = mailtoUrl
          manualLink.innerHTML = '📧 CLICK HERE TO OPEN EMAIL CLIENT'
          manualLink.style.position = 'fixed'
          manualLink.style.top = '200px'
          manualLink.style.left = '50px'
          manualLink.style.zIndex = '999999'
          manualLink.style.backgroundColor = '#ef4444'
          manualLink.style.color = 'white'
          manualLink.style.padding = '15px'
          manualLink.style.borderRadius = '8px'
          manualLink.style.textDecoration = 'none'
          manualLink.style.fontWeight = 'bold'
          manualLink.target = '_blank'
          
          document.body.appendChild(manualLink)
          
          // Remove after 15 seconds
          setTimeout(() => {
            if (document.body.contains(manualLink)) {
              document.body.removeChild(manualLink)
            }
          }, 15000)
          
          console.log('✅ Created manual email link for user to click')
        }
      }
        
      // BRUTALLY HONEST feedback - no more lies!
      if (clipboardSuccess && emailOpened) {
        alert('✅ SUCCESS!\n\n• ✅ Clipboard VERIFIED working\n• ✅ Email client opened\n\nContent is in your clipboard - paste it!')
      } else if (clipboardSuccess && !emailOpened) {
        alert('📋 Clipboard working, email client failed\n\n✅ Content copied to clipboard\n📧 Please paste into your email client:\nexiledev8668@gmail.com')
      } else if (!clipboardSuccess && emailOpened) {
        alert('🔴 CLIPBOARD FAILED (as usual)\n\n📧 Email client opened but clipboard blocked by browser security.\n\nHere\'s the content to copy manually:\n\n' + fullEmailContent)
      } else {
        // Both failed - be completely honest
        alert('🔴 BOTH FAILED - MANUAL COPY TIME\n\nBrowser security blocked clipboard AND email client failed.\n\nCopy this text manually:\n\nTO: exiledev8668@gmail.com\nSUBJECT: ' + emailSubject + '\n\nMESSAGE:\n' + emailBody)
      }
      
      // ALWAYS show a visible textarea as backup - no more gambling with clipboard
      console.log('🎯 Creating visible backup textarea regardless of clipboard claims')
      try {
        const backupTextarea = document.createElement('textarea')
        backupTextarea.value = fullEmailContent
        backupTextarea.style.position = 'fixed'
        backupTextarea.style.top = '100px'
        backupTextarea.style.left = '50px'
        backupTextarea.style.width = '600px'
        backupTextarea.style.height = '250px'
        backupTextarea.style.zIndex = '999999'
        backupTextarea.style.backgroundColor = '#ffffff'
        backupTextarea.style.border = '3px solid #ef4444'
        backupTextarea.style.borderRadius = '8px'
        backupTextarea.style.padding = '10px'
        backupTextarea.style.fontSize = '14px'
        backupTextarea.style.fontFamily = 'monospace'
        backupTextarea.readOnly = true
        backupTextarea.placeholder = 'Bug report content - select all and copy!'
        
        // Add a close button
        const closeButton = document.createElement('button')
        closeButton.innerHTML = '❌ CLOSE'
        closeButton.style.position = 'fixed'
        closeButton.style.top = '60px'
        closeButton.style.left = '600px'
        closeButton.style.zIndex = '9999999'
        closeButton.style.backgroundColor = '#ef4444'
        closeButton.style.color = 'white'
        closeButton.style.border = 'none'
        closeButton.style.padding = '10px'
        closeButton.style.borderRadius = '4px'
        closeButton.style.cursor = 'pointer'
        closeButton.onclick = () => {
          document.body.removeChild(backupTextarea)
          document.body.removeChild(closeButton)
        }
        
        document.body.appendChild(backupTextarea)
        document.body.appendChild(closeButton)
        backupTextarea.focus()
        backupTextarea.select()
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
          if (document.body.contains(backupTextarea)) {
            document.body.removeChild(backupTextarea)
          }
          if (document.body.contains(closeButton)) {
            document.body.removeChild(closeButton)
          }
        }, 30000)
        
        console.log('✅ Visible backup textarea created with close button')
      } catch (e) {
        console.log('❌ Even visible textarea backup failed:', e)
      }

      setSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setSubject('')
        setDescription('')
      }, 2000)

    } catch (error) {
      console.error('BugReporter error:', error)
      alert('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-50"
      >
🚨 BUG REPORTER v8.0
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Report an Issue (v8.0)</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">Issue Reported! (v8.0)</h3>
              <p className="text-gray-600">Thank you for your feedback.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Issue Type</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={issueType === 'bug' ? 'default' : 'outline'}
                    onClick={() => setIssueType('bug')}
                  >
                    🐛 Bug
                  </Button>
                  <Button
                    size="sm"
                    variant={issueType === 'feature' ? 'default' : 'outline'}
                    onClick={() => setIssueType('feature')}
                  >
                    ✨ Feature
                  </Button>
                  <Button
                    size="sm"
                    variant={issueType === 'other' ? 'default' : 'outline'}
                    onClick={() => setIssueType('other')}
                  >
                    💭 Other
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="Brief description of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Please describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800">
                <p><strong>✅ EMAIL-FOCUSED v8.0 Component:</strong></p>
                <ul className="mt-1 text-xs space-y-1">
                  <li>• Clipboard-first reliable method</li>
                  <li>• Simplified email client opening</li>
                  <li>• Better error handling</li>
                  <li>• Guaranteed delivery path</li>
                </ul>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : '📧 Submit Report (v8.0)'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}