import Image from "next/image"

export function Hero() {
  return (
    <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          {/* Text Content */}
          <div className="flex-1 max-w-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Product <span className="text-accent">/</span> Strategy <span className="text-accent">/</span> Design
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-foreground text-balance">
              Yash Patil
            </h1>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Pre-final year at <span className="text-foreground">IIT Kharagpur</span>. Curious about how products work, why users behave the way they do, and the systems behind scale.
            </p>
            
            {/* Quick Links */}
            <div className="mt-10 flex flex-wrap gap-6">
              <a 
                href="#about" 
                className="text-sm text-accent hover:text-foreground transition-colors underline underline-offset-4 decoration-accent/50"
              >
                About me
              </a>
              <a 
                href="#writing" 
                className="text-sm text-accent hover:text-foreground transition-colors underline underline-offset-4 decoration-accent/50"
              >
                Read my writing
              </a>
            </div>
          </div>
          
          {/* Photo */}
          <div className="shrink-0">
            <div className="relative group">
              {/* Accent glow effect */}
              <div className="absolute -inset-1 bg-accent/20 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              
              {/* Photo container */}
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden ring-1 ring-accent/30">
                <Image
                  src="/photo.jpg"
                  alt="Yash"
                  fill
                  className="object-cover grayscale-[30%] contrast-[1.1] brightness-[0.95] hover:grayscale-0 hover:contrast-100 hover:brightness-100 transition-all duration-500"
                  priority
                />
                {/* Subtle color overlay for cohesion */}
                <div className="absolute inset-0 bg-accent/10 mix-blend-overlay pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
