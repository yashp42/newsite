export function Writing() {
  return (
    <section id="writing" className="py-20 md:py-28 border-t border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
          {/* Section Label */}
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] text-accent">
              Writing
            </h2>
          </div>
          
          {/* Content */}
          <div>
            <p className="text-muted-foreground mb-8">
              Thoughts on products, strategy, and design.
            </p>
            
            <div className="py-12 border-t border-border">
              <p className="text-muted-foreground/60 italic">
                Coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
