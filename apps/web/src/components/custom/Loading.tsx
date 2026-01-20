export default function Loading() {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin text-muted-foreground dark:text-muted-foreground" />
          <p className="text-muted-foreground dark:text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }