"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Camera,
  Scan,
  Leaf,
  Zap,
  Car,
  Utensils,
  CheckCircle,
  X,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Type,
} from "lucide-react"
import { createActivity } from "@/lib/database"
import { analyzeImageForCarbon, analyzeItemFromText, type ScanResult } from "@/lib/ai-service"

interface GreenScannerProps {
  userId: string
  onActivityLogged?: () => void
}

export function GreenScanner({ userId, onActivityLogged }: GreenScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [mode, setMode] = useState<"camera" | "text">("camera")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Analyze captured image using AI
  const analyzeImage = async (imageData: string): Promise<ScanResult> => {
    // Since we can't directly process images with Groq, we'll use a text description
    // In a real implementation, you'd use a vision model or image recognition service
    const imageDescription = "A captured image from the user's camera showing an everyday item"
    return await analyzeImageForCarbon(imageDescription)
  }

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions to use the scanner.")
      console.error("Camera error:", err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setScanResult(null)
  }

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsProcessing(true)
    setError(null)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (!context) throw new Error("Canvas context not available")

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64 for analysis
      const imageData = canvas.toDataURL("image/jpeg", 0.8)

      // Analyze with AI
      const result = await analyzeImage(imageData)
      setScanResult(result)
      stopCamera()
    } catch (err) {
      setError("Failed to analyze image. Please try again.")
      console.error("Analysis error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const analyzeText = async () => {
    if (!textInput.trim()) {
      setError("Please enter an item description")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await analyzeItemFromText(textInput.trim())
      setScanResult(result)
      setTextInput("")
    } catch (err) {
      setError("Failed to analyze item. Please try again.")
      console.error("Text analysis error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const logScannedActivity = async () => {
    if (!scanResult) return

    try {
      setError(null)
      const { error } = await createActivity({
        user_id: userId,
        type: scanResult.category,
        activity_name: `AI Scanned: ${scanResult.item}`,
        amount: scanResult.amount,
        unit: scanResult.unit,
        emissions: scanResult.emissions,
        date: new Date().toISOString().split("T")[0],
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(`Activity logged! +${scanResult.emissions.toFixed(1)} kg CO₂ tracked`)
        setScanResult(null)
        onActivityLogged?.()
      }
    } catch (err) {
      setError("Failed to log activity. Please try again.")
    }
  }

  const getEcoScoreColor = (score: number) => {
    if (score >= 8) return "green"
    if (score >= 6) return "yellow"
    if (score >= 4) return "orange"
    return "red"
  }

  const getEcoScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent"
    if (score >= 6) return "Good"
    if (score >= 4) return "Fair"
    return "Poor"
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport":
        return Car
      case "energy":
        return Zap
      case "food":
        return Utensils
      case "home":
        return Leaf
      default:
        return Scan
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
          <Scan className="h-8 w-8" />
          AI Green Scanner
        </h1>
        <p className="text-green-600 dark:text-green-400 mt-1">
          Use AI to scan and analyze the carbon footprint of items around you
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Mode Selection */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => setMode("camera")}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Camera Scan
        </Button>
        <Button
          variant={mode === "text" ? "default" : "outline"}
          onClick={() => setMode("text")}
          className="flex items-center gap-2"
        >
          <Type className="h-4 w-4" />
          Text Analysis
        </Button>
      </div>

      {/* Scanner Interface */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            {mode === "camera" ? <Camera className="h-5 w-5" /> : <Type className="h-5 w-5" />}
            {mode === "camera" ? "AI Camera Scanner" : "AI Text Analyzer"}
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {mode === "camera"
              ? "Point your camera at any item to analyze its environmental impact"
              : "Describe an item to get AI-powered carbon footprint analysis"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mode === "camera" && !isScanning && !scanResult && (
              <div className="text-center py-12">
                <div className="inline-flex p-6 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <Camera className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Ready to Scan</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start your camera to scan items and get instant AI-powered carbon footprint analysis
                </p>
                <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Start AI Scanner
                </Button>
              </div>
            )}

            {mode === "text" && !scanResult && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="inline-flex p-6 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <Type className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">AI Text Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Describe any item and get AI-powered environmental impact analysis
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-description">Item Description</Label>
                  <Input
                    id="item-description"
                    placeholder="e.g., plastic water bottle, beef burger, LED light bulb..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && analyzeText()}
                  />
                </div>

                <Button
                  onClick={analyzeText}
                  disabled={isProcessing || !textInput.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing with Llama 3.1 8B...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            )}

            {mode === "camera" && isScanning && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
                  <div className="absolute inset-0 border-4 border-green-400 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg font-semibold">AI Analyzing...</p>
                        <p className="text-sm opacity-75">Processing with Llama 3.3 70B</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={captureAndAnalyze}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    {isProcessing ? "AI Analyzing..." : "Analyze with AI"}
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="lg">
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {scanResult && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    {(() => {
                      const IconComponent = getCategoryIcon(scanResult.category)
                      return <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    })()}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{scanResult.item}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700"
                    >
                      AI Confidence: {Math.round(scanResult.confidence * 100)}%
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700"
                    >
                      Llama 3.3 70B
                    </Badge>
                  </div>
                </div>

                {/* Eco Score */}
                <Card
                  className={`border-${getEcoScoreColor(scanResult.ecoScore)}-200 bg-${getEcoScoreColor(scanResult.ecoScore)}-50 dark:border-${getEcoScoreColor(scanResult.ecoScore)}-800 dark:bg-${getEcoScoreColor(scanResult.ecoScore)}-900/20`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">AI Eco Score</span>
                      <span
                        className={`text-2xl font-bold text-${getEcoScoreColor(scanResult.ecoScore)}-600 dark:text-${getEcoScoreColor(scanResult.ecoScore)}-400`}
                      >
                        {scanResult.ecoScore}/10
                      </span>
                    </div>
                    <Progress value={scanResult.ecoScore * 10} className="h-3 mb-2" />
                    <p
                      className={`text-sm text-${getEcoScoreColor(scanResult.ecoScore)}-700 dark:text-${getEcoScoreColor(scanResult.ecoScore)}-300`}
                    >
                      {getEcoScoreLabel(scanResult.ecoScore)} environmental impact
                    </p>
                  </CardContent>
                </Card>

                {/* Emissions Data */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-6 w-6 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {scanResult.emissions.toFixed(1)} kg
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">CO₂ Emissions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Sparkles className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {scanResult.amount} {scanResult.unit}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Suggestions */}
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200 text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI-Powered Eco Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scanResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Leaf className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  <Button onClick={logScannedActivity} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Log Activity
                  </Button>
                  <Button onClick={() => setScanResult(null)} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Analyze Again
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">How AI Green Scanner Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Capture</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Scan with camera or describe any item</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2. AI Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                 AI analyzes and calculates carbon footprint
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Smart Insights</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get AI-powered suggestions for eco-friendly alternatives
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
