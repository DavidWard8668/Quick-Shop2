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
  const [isOpen, setIsOpen] = useState(false)
  const [issueType, setIssueType] = useState<'bug' | 'feature' | 'other'>('bug')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showCopyArea, setShowCopyArea] = useState(false)
  const [emailContent, setEmailContent] = useState('')

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      alert('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare email content
      const emailBody = `${description}

From: ${userEmail || 'Anonymous User'}
Type: ${issueType}
Time: ${new Date().toLocaleString()}`

      const emailSubject = `[CartPilot] ${subject}`
      const fullEmailContent = `To: exiledev8668@gmail.com
Subject: ${emailSubject}

${emailBody}`

      // Store email content for manual copy
      setEmailContent(fullEmailContent)

      console.log('🎯 BugReporter - Smart clipboard handling')

      // Store in database first
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
        console.log('✅ Saved to database')
      } catch (dbError) {
        console.error('Database save failed:', dbError)
      }

      // Smart clipboard handling with user interaction
      const copyToClipboard = async () => {
        try {
          // Check if we have secure context (HTTPS)
          if (!window.isSecureContext) {
            console.log('⚠️ Not in secure context (needs HTTPS for clipboard)')
            return false
          }

          // Check if clipboard API is available
          if (!navigator.clipboard) {
            console.log('⚠️ Clipboard API not available')
            return false
          }

          // Try to write to clipboard
          await navigator.clipboard.writeText(fullEmailContent)
          console.log('✅ Copied to clipboard')
          return true
        } catch (error) {
          console.log('❌ Clipboard access denied:', error)
          return false
        }
      }

      // Try clipboard first
      const clipboardSuccess = await copyToClipboard()

      // Prepare mailto URL
      const mailtoUrl = `mailto:exiledev8668@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

      // Try to open email client
      let emailOpened = false
      try {
        // Create a user-clickable link for better compatibility
        const link = document.createElement('a')
        link.href = mailtoUrl
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        emailOpened = true
        console.log('✅ Email client triggered')
      } catch (e) {
        console.log('❌ Email client failed:', e)
      }

      // Provide feedback based on what worked
      if (clipboardSuccess && emailOpened) {
        alert('✅ Success! Email client opened and content copied to clipboard.')
        setSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
          setSubmitted(false)
          setSubject('')
          setDescription('')
        }, 2000)
      } else if (emailOpened && !clipboardSuccess) {
        // Show manual copy area
        setShowCopyArea(true)
        alert('📧 Email client opened!\n\n⚠️ Clipboard blocked by browser.\n\nPlease copy the content from the text area below.')
      } else if (clipboardSuccess && !emailOpened) {
        alert('📋 Content copied to clipboard!\n\n📧 Please paste into your email client:\nexiledev8668@gmail.com')
        setShowCopyArea(true)
      } else {
        // Both failed - show manual copy area
        setShowCopyArea(true)
        alert('⚠️ Browser security restrictions detected.\n\nPlease copy the content below and send to:\nexiledev8668@gmail.com')
      }

    } catch (error) {
      console.error('Error submitting:', error)
      alert('Error submitting report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualCopy = async () => {
    const textarea = document.getElementById('emailContentArea') as HTMLTextAreaElement
    if (textarea) {
      textarea.select()
      try {
        // Try modern API first
        await navigator.clipboard.writeText(emailContent)
        alert('✅ Copied to clipboard!')
      } catch {
        // Fallback to execCommand
        try {
          document.execCommand('copy')
          alert('✅ Copied to clipboard!')
        } catch {
          alert('⚠️ Please manually select and copy the text (Ctrl+C or Cmd+C)')
        }
      }
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg z-50 transition-all"
        aria-label="Report an issue"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Report an Issue</span>
            <button
              onClick={() => {
                setIsOpen(false)
                setShowCopyArea(false)
                setEmailContent('')
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCopyArea ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Type</label>
                <div className="flex gap-2">
                  {(['bug', 'feature', 'other'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setIssueType(type)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        issueType === type
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'bug' ? '🐛 Bug' : type === 'feature' ? '✨ Feature' : '💭 Other'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of the issue"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about the issue..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !subject.trim() || !description.trim()}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>

              {submitted && (
                <div className="text-green-600 text-center">
                  ✅ Report submitted successfully!
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Copy the content below and send to: <strong>exiledev8668@gmail.com</strong>
              </p>
              <textarea
                id="emailContentArea"
                value={emailContent}
                readOnly
                className="w-full h-48 p-2 border rounded-md text-sm font-mono"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="flex gap-2">
                <Button onClick={handleManualCopy} className="flex-1">
                  📋 Copy to Clipboard
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = `mailto:exiledev8668@gmail.com`
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  📧 Open Email Client
                </Button>
              </div>
              <Button
                onClick={() => {
                  setIsOpen(false)
                  setShowCopyArea(false)
                  setEmailContent('')
                  setSubject('')
                  setDescription('')
                }}
                variant="outline"
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}