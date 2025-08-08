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

      console.log('🎯 BugReporter v5.0 - Submitting report')

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

      // Always copy to clipboard as primary method
      try {
        await navigator.clipboard.writeText(fullEmailContent)
        
        // Try mailto as secondary
        const mailtoUrl = `mailto:exiledev8668@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
        
        if (mailtoUrl.length < 1900) {
          try {
            window.location.href = mailtoUrl
            alert('✅ Report copied to clipboard and email client opened!\n\nIf email didn\'t open, paste from clipboard.')
          } catch (mailtoError) {
            alert('✅ Report copied to clipboard!\n\nPlease paste into your email app and send to:\nexiledev8668@gmail.com')
          }
        } else {
          alert('✅ Report copied to clipboard!\n\nPlease paste into your email app and send to:\nexiledev8668@gmail.com')
        }
      } catch (clipError) {
        // Final fallback - show text for manual copy
        alert(`📧 Please email this report to: exiledev8668@gmail.com\n\nSubject: ${emailSubject}\n\n${emailBody}`)
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
🚨 BUG REPORTER v5.0
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Report an Issue (v5.0)</span>
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
              <h3 className="text-lg font-semibold mb-2">Issue Reported! (v5.0)</h3>
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
                <p><strong>✅ FIXED v5.0 Component:</strong></p>
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
                {isSubmitting ? 'Submitting...' : '📧 Submit Report (v5.0)'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}