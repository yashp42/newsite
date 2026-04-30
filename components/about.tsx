export function About() {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
          {/* Section Label */}
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] text-accent">
              About
            </h2>
          </div>
          
          {/* Content */}
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="text-foreground text-lg md:text-xl">
              I&apos;m a pre-final year undergraduate at <span className="text-accent">IIT Kharagpur</span>, interested in product management and building systems that scale.
            </p>
            <p>
              I spend my time analyzing products across market dynamics, monetization, and user behavior to understand what drives real impact.
            </p>
            <p>
              I&apos;ve worked on building and evaluating product ideas, focusing on solving real-world operational problems through structured, data driven approaches.
            </p>
            <p>
              I&apos;m also interested in <span className="text-foreground">design and design philosophy</span>, particularly how simplicity and intent shape effective user experiences.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
