import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { VideoTutorial } from './VideoTutorial'

interface TutorialStep {
  id: number
  title: string
  description: string
  icon: string
  tips: string[]
  action?: string
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to CartPilot!",
    description: "Your intelligent shopping companion that helps you navigate UK grocery stores efficiently.",
    icon: "🛒",
    tips: [
      "Find products quickly with smart search",
      "Get optimal shopping routes",
      "Contribute to help other shoppers",
      "Earn points for your contributions"
    ]
  },
  {
    id: 2,
    title: "Find Partner Stores",
    description: "Discover CartPilot partner stores near you with precise location services.",
    icon: "📍",
    tips: [
      "Use GPS for automatic location detection",
      "Enter your postcode for precise results",
      "View store details and distances",
      "Save favorite stores for quick access"
    ],
    action: "Go to Stores tab → Use My Location"
  },
  {
    id: 3,
    title: "Smart Product Search",
    description: "Find products with intelligent fuzzy matching and real-time suggestions.",
    icon: "🔍",
    tips: [
      "Type partial product names (e.g., 'chees' for cheese)",
      "Get dropdown suggestions as you type",
      "See product locations and prices",
      "Click suggestions to add to cart"
    ],
    action: "Navigate tab → Type in search box"
  },
  {
    id: 4,
    title: "Build Your Shopping List",
    description: "Create smart shopping lists with AI-powered suggestions and organization.",
    icon: "📝",
    tips: [
      "Add items manually or from search",
      "Check off items as you shop",
      "Clear completed items easily",
      "Get smart product suggestions"
    ],
    action: "Cart tab → Add items → Check as you shop"
  },
  {
    id: 5,
    title: "Barcode Scanning",
    description: "Use your camera to scan product barcodes for precise identification.",
    icon: "📱",
    tips: [
      "Grant camera permission when prompted",
      "Position barcode in the frame",
      "Manual entry available as backup",
      "Works with any standard product barcode"
    ],
    action: "Add Product Location → Scan Barcode"
  },
  {
    id: 6,
    title: "Add Product Locations",
    description: "Help the community by adding product locations and earn points!",
    icon: "📍",
    tips: [
      "Follow the 4-step wizard",
      "Scan barcode for accuracy",
      "Take aisle photos to help others",
      "Earn 10 points per contribution!"
    ],
    action: "Cart tab → Add Product Location (+10 Points)"
  },
  {
    id: 7,
    title: "Plan Optimal Routes",
    description: "Get AI-optimized shopping routes to save time and energy.",
    icon: "🗺️",
    tips: [
      "Routes organized by aisle number",
      "Minimizes backtracking in store",
      "Works with any size shopping list",
      "Earn points for route planning"
    ],
    action: "Cart tab → Plan Optimal Route"
  },
  {
    id: 8,
    title: "Start Shopping Session",
    description: "Begin guided shopping with your optimized list and route.",
    icon: "🛒",
    tips: [
      "Interactive shopping checklist",
      "Mark items as found",
      "Track your progress",
      "Get help tips along the way"
    ],
    action: "Cart tab → Start Shopping At [Store]"
  },
  {
    id: 9,
    title: "CartPilot Premium",
    description: "Sign in to unlock premium features, points, and achievements.",
    icon: "👨‍✈️",
    tips: [
      "Track your points and level",
      "Unlock achievements",
      "View contribution statistics",
      "Access premium features"
    ],
    action: "Sign In → Pilot tab"
  },
  {
    id: 10,
    title: "Install as App",
    description: "Install CartPilot on your device for quick access and offline features.",
    icon: "📱",
    tips: [
      "iOS: Safari → Share → Add to Home Screen",
      "Android: Chrome → Install prompt",
      "Quick access from home screen",
      "Works offline for basic features"
    ],
    action: "Look for install prompt at bottom"
  }
]

interface UserTutorialProps {
  onComplete?: () => void
  onClose?: () => void
  isOpen: boolean
}

export const UserTutorial: React.FC<UserTutorialProps> = ({ 
  onComplete, 
  onClose, 
  isOpen 
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [showQuickStart, setShowQuickStart] = useState(true)
  const [showVideo, setShowVideo] = useState(false)

  // Add keyboard escape handler for better accessibility
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleSkip()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    try {
      localStorage.setItem('cartpilot-tutorial-completed', 'true')
    } catch (error) {
      console.warn('Could not save tutorial completion state:', error)
    }
    if (onComplete) {
      onComplete()
    } else {
      // Fallback: force close by hiding the modal
      const modal = document.querySelector('[data-tutorial-modal]')
      if (modal) {
        (modal as HTMLElement).style.display = 'none'
      }
    }
  }

  const handleSkip = () => {
    try {
      localStorage.setItem('cartpilot-tutorial-skipped', 'true')
    } catch (error) {
      console.warn('Could not save tutorial skip state:', error)
    }
    if (onClose) {
      onClose()
    } else {
      // Fallback: force close by hiding the modal
      const modal = document.querySelector('[data-tutorial-modal]')
      if (modal) {
        (modal as HTMLElement).style.display = 'none'
      }
    }
  }

  if (!isOpen) return null

  // Show video tutorial if requested
  if (showVideo) {
    return (
      <>
        <VideoTutorial 
          isOpen={showVideo} 
          onClose={() => setShowVideo(false)} 
        />
      </>
    )
  }

  if (showQuickStart) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
        data-testid="user-tutorial"
        data-tutorial-modal="true"
        onClick={(e) => {
          // Close if clicking the backdrop
          if (e.target === e.currentTarget) {
            handleSkip()
          }
        }}
        onTouchEnd={(e) => {
          // Ensure touch events work on mobile
          if (e.target === e.currentTarget) {
            handleSkip()
          }
        }}
      >
        <div className="w-full max-w-2xl my-8">
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-xl sm:text-2xl">
                <span>🛒 Welcome to CartPilot!</span>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  onClick={handleSkip}
                  className="text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close tutorial"
                  title="Close tutorial (Escape key also works)"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold mb-2">Your guide to stress free shopping</h2>
              <p className="text-gray-600">
                CartPilot helps you navigate UK grocery stores efficiently with smart search, 
                route planning, and community-powered product locations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">📍</div>
                <h3 className="font-semibold mb-1">Find Stores</h3>
                <p className="text-sm text-gray-600">Locate partner stores near you</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-semibold mb-1">Smart Search</h3>
                <p className="text-sm text-gray-600">Find products with AI matching</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">🗺️</div>
                <h3 className="font-semibold mb-1">Route Planning</h3>
                <p className="text-sm text-gray-600">Optimize your shopping path</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">📱</div>
                <h3 className="font-semibold mb-1">Barcode Scanner</h3>
                <p className="text-sm text-gray-600">Camera-powered product ID</p>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-emerald-800">🎁 Quick Start Tips:</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Use GPS or enter postcode to find nearby stores</li>
                <li>• Type product names to see smart suggestions</li>
                <li>• Add items to cart and plan optimal routes</li>
                <li>• Earn points by contributing product locations!</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setShowVideo(true)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white min-h-[48px] text-lg"
              >
                🎬 Watch Video Tutorial
              </Button>
              <Button 
                onClick={() => setShowQuickStart(false)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white min-h-[48px] text-lg"
              >
                📚 Interactive Tutorial
              </Button>
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="flex-1 min-h-[48px] text-lg font-medium"
              >
                🚀 Start Shopping
              </Button>
            </div>

            {/* Mobile-friendly tap to dismiss */}
            <div className="text-center text-sm text-gray-500 mt-2">
              Tap outside to close or use ✕ button above
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  const step = TUTORIAL_STEPS[currentStep - 1]

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto"
      data-testid="user-tutorial"
      data-tutorial-modal="true"
      onClick={(e) => {
        // Close if clicking the backdrop
        if (e.target === e.currentTarget) {
          handleSkip()
        }
      }}
      onTouchEnd={(e) => {
        // Ensure touch events work on mobile
        if (e.target === e.currentTarget) {
          handleSkip()
        }
      }}
    >
      <div className="w-full max-w-2xl my-8">
        <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-2xl">{step.icon}</span>
              {step.title}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Step {currentStep} of {TUTORIAL_STEPS.length}
              </Badge>
              <Button 
                size="lg" 
                variant="ghost" 
                onClick={handleSkip}
                className="text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close tutorial"
                title="Close tutorial (Escape key also works)"
              >
                ✕
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">{step.icon}</div>
            <p className="text-gray-600 text-lg">{step.description}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-blue-800">💡 Pro Tips:</h3>
            <ul className="space-y-2">
              {step.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-blue-700">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {step.action && (
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-emerald-800">🎯 Try it now:</h3>
              <p className="text-emerald-700 text-sm font-medium">{step.action}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button 
              onClick={handlePrevious}
              variant="outline"
              disabled={currentStep === 1}
              className="w-full sm:w-auto min-h-[44px]"
            >
              ← Previous
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleSkip}
                variant="ghost"
                className="w-full sm:w-auto min-h-[44px]"
              >
                Skip Tutorial
              </Button>
              <Button 
                onClick={handleNext}
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto min-h-[44px]"
              >
                {currentStep === TUTORIAL_STEPS.length ? '🎉 Complete' : 'Next →'}
              </Button>
            </div>
          </div>

          {/* Mobile-friendly tap to dismiss */}
          <div className="text-center text-sm text-gray-500 mt-2 sm:hidden">
            Tap outside to close or use ✕ button above
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}