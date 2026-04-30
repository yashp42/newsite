import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
          {/* Section Label */}
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] text-accent">
              Contact
            </h2>
          </div>
          
          {/* Content */}
          <div className="space-y-8">
            <p className="text-muted-foreground">
              Feel free to reach out for collaborations or just a chat.
            </p>
            
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:text-accent transition-colors underline underline-offset-4 decoration-border hover:decoration-accent"
              >
                Twitter
              </Link>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:text-accent transition-colors underline underline-offset-4 decoration-border hover:decoration-accent"
              >
                LinkedIn
              </Link>
              <Link
                href="mailto:hello@yashkgp.me"
                className="text-sm text-foreground hover:text-accent transition-colors underline underline-offset-4 decoration-border hover:decoration-accent"
              >
                Email
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground/60 pt-8">
              &copy; {new Date().getFullYear()} Yash. Built with intent.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
