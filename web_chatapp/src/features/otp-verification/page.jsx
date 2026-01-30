
import React, { useState, useEffect, useRef, Suspense } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageCircle, Loader2, CheckCircle } from "lucide-react"

function OTPForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const inputRefs = useRef([])
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code")
      setIsLoading(false)
      return
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Accept any 6-digit code for demo
    setIsSuccess(true)
    setIsLoading(false)

    // Redirect after success
    setTimeout(() => navigate("/login"), 2000)
  }

  const handleResendOtp = async () => {
    setTimeLeft(300)
    setError("")
    // Simulate resend API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white dark:bg-card dark:border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 dark:bg-primary/20">
                <CheckCircle className="h-6 w-6 text-accent dark:text-primary" />
              </div>
              <CardTitle className="dark:text-foreground">Verification Successful</CardTitle>
              <CardDescription className="dark:text-muted-foreground">Your account has been verified successfully</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Redirecting you to sign in...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Live flow</h1>
          </div>
          <h2 className="text-3xl font-bold text-foreground">Verify Your Email</h2>
          <p className="text-muted-foreground mt-2">Enter the 6-digit code sent to {email}</p>
        </div>

        <Card className="bg-white dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Enter Verification Code</CardTitle>
            <CardDescription className="dark:text-muted-foreground">We've sent a 6-digit code to your email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 dark:border-border dark:bg-card dark:text-foreground focus:border-blue-500 dark:focus:border-primary focus:ring-2 focus:ring-blue-200 dark:focus:ring-primary/50 rounded-md shadow-sm transition-colors" />
                ))}

              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Time remaining:{" "}
                <span className="font-semibold text-accent">{formatTime(timeLeft)}</span>
              </p>
              {timeLeft > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={handleResendOtp}>
                    Resend
                  </Button>
                </p>
              ) : (
                <Button variant="outline" onClick={handleResendOtp} className="w-full bg-transparent">
                  Resend Verification Code
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OTPVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OTPForm />
    </Suspense>
  )
}
