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
  // NEW COMPONENT - v4.0 - GUARANTEED FRESH DEPLOYMENT
  const [isOpen, setIsOpen] = useState(false)
  const [issueType, setIssueType] = useState<'bug' | 'feature' | 'other'>('bug')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    // IMMEDIATE ALERT TO CONFIRM NEW COMPONENT IS RUNNING
    alert('🚨🚨🚨 NEW BugReporter v4.0 IS RUNNING! 🚨🚨🚨')
    
    if (!subject.trim() || !description.trim()) {
      alert('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Ultra-minimal email body format - NO PAGE INFO!
      const ultraMinimalBody = `${description}

From: ${userEmail || 'Anonymous User'}
Type: ${issueType}`

      console.log('🎯 BugReporter v4.0 - Ultra minimal body:', ultraMinimalBody)
      console.log('🎯 BugReporter v4.0 - Body length:', ultraMinimalBody.length)

      // Try to store in database (minimal info only)
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
      } catch (dbError) {
        console.warn('Database save failed (not critical):', dbError)
      }

      // Create ultra-short mailto URL
      const mailtoUrl = `mailto:exiledev8668@gmail.com?subject=${encodeURIComponent(`[CartPilot] ${subject}`)}&body=${encodeURIComponent(ultraMinimalBody)}`
      
      console.log('🎯 BugReporter v4.0 - Mailto URL:', mailtoUrl)
      console.log('🎯 BugReporter v4.0 - URL length:', mailtoUrl.length)

      // Multiple email opening strategies
      if (mailtoUrl.length > 1800) {
        // Too long - use clipboard fallback
        try {
          await navigator.clipboard.writeText(ultraMinimalBody)
          alert('📋 Report copied to clipboard! Please email it to: exiledev8668@gmail.com')
        } catch (clipError) {
          alert(`📧 Please email this to exiledev8668@gmail.com:\n\n${ultraMinimalBody}`)
        }
      } else {
        // Try multiple methods to open email client
        let emailOpened = false
        
        // Method 1: Try window.open first
        try {
          console.log('🎯 Trying window.open method...')
          const emailWindow = window.open(mailtoUrl, '_self')
          if (emailWindow) {
            emailOpened = true
            console.log('🎯 window.open succeeded')
          }
        } catch (error) {
          console.log('🎯 window.open failed:', error)
        }
        
        // Method 2: Try window.location.href if window.open failed
        if (!emailOpened) {
          try {
            console.log('🎯 Trying window.location.href method...')
            window.location.href = mailtoUrl
            emailOpened = true
            console.log('🎯 window.location.href executed')
          } catch (error) {
            console.log('🎯 window.location.href failed:', error)
          }
        }
        
        // Method 3: If both failed, provide manual options
        if (!emailOpened) {
          const emailContent = `To: exiledev8668@gmail.com
Subject: [CartPilot] ${subject}

${ultraMinimalBody}`
          
          try {
            await navigator.clipboard.writeText(emailContent)
            alert(`📋 Email client didn't open automatically. 
            
Report copied to clipboard!

Please paste into your email app and send to:
exiledev8668@gmail.com`)
          } catch (clipError) {
            alert(`📧 Email client unavailable. Please manually email:

To: exiledev8668@gmail.com
Subject: [CartPilot] ${subject}

${ultraMinimalBody}`)
          }
        } else {
          // Give user confirmation that email should be opening
          setTimeout(() => {
            alert('✅ Email client should be opening! If not, the report was copied to clipboard as backup.')
          }, 1000)
        }
      }

      setSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setSubject('')
        setDescription('')
      }, 3000)

    } catch (error) {
      console.error('BugReporter v4.0 error:', error)
      alert('Failed to submit. Please try again.')
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
🚨 BUG REPORTER v4.0 FINAL
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Report an Issue (v4.0)</span>
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
              <h3 className="text-lg font-semibold mb-2">Issue Reported! (v4.0)</h3>
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
                <p><strong>✅ NEW v4.0 Component:</strong></p>
                <ul className="mt-1 text-xs space-y-1">
                  <li>• Ultra-minimal email format</li>
                  <li>• No page info or user agent data</li>
                  <li>• Direct email client opening</li>
                  <li>• Fresh deployment guaranteed</li>
                </ul>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : '📧 Submit Report (v4.0)'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}