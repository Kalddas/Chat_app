import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MessageCircle, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <MessageCircle className="h-12 w-12 text-indigo-600 dark:text-primary" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Live Flow</h1>
                </div>
                <h2 className="text-6xl font-bold text-indigo-900 dark:text-foreground">404</h2>
                <h3 className="text-2xl font-semibold text-indigo-700 dark:text-muted-foreground">Page Not Found</h3>
                <p className="text-indigo-600 dark:text-muted-foreground">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/" className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Go Home
                    </Link>
                </Button>
            </div>
        </div>
    )
}
