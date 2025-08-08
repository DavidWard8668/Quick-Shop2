import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { supabase } from '../supabaseClient'

interface ReportIssueProps {
  userEmail?: string
  userId?: string
}

export const ReportIssue: React.FC<ReportIssueProps> = ({ userEmail, userId }) => {
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
      // Capture current page info
      const pageInfo = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        platform: navigator.platform
      }

      // Store issue in Supabase for tracking
      const { error } = await supabase
        .from('issue_reports')
        .insert({
          user_id: userId,
          user_email: userEmail,
          issue_type: issueType,
          subject: subject,
          description: description,
          page_info: pageInfo,
          status: 'new'
        })

      if (error) throw error

      // Create email body
      const emailBody = `
Issue Type: ${issueType}
Subject: ${subject}
Description: ${description}

User Info:
- Email: ${userEmail || 'Not logged in'}
- User ID: ${userId || 'Not logged in'}

Page Info:
- URL: ${pageInfo.url}
- Timestamp: ${pageInfo.timestamp}
- Screen: ${pageInfo.screenWidth}x${pageInfo.screenHeight}
- Platform: ${pageInfo.platform}
- User Agent: ${pageInfo.userAgent}
      `

      // Open email client
      const mailtoLink = `mailto:exiledev8668@gmail.com?subject=[CartPilot Issue] ${subject}&body=${encodeURIComponent(emailBody)}`
      window.open(mailtoLink)

      setSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setSubject('')
        setDescription('')
      }, 3000)

    } catch (error) {
      console.error('Error submitting issue:', error)
      alert('Failed to submit issue. Please try again.')
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
        🐛 Report Issue
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Report an Issue</span>
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
              <h3 className="text-lg font-semibold mb-2">Issue Reported!</h3>
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

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p>📧 This will open your email client to send the report to our support team.</p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Issue Report'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}