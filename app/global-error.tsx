"use client"

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-lg text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground">
              The app hit an unexpected error. Please refresh the page.
            </p>
          </div>
        </main>
      </body>
    </html>
  )
}
