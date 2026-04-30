import Link from "next/link"

// Post categories that align with your interests
type Category = "Product" | "Strategy" | "Design" | "Teardown"

interface Post {
  slug: string
  title: string
  excerpt: string
  category: Category
  date: string // Format: "Apr 2026"
}

// Add your posts here - structure is ready
const posts: Post[] = [
  // Example post structure (uncomment and modify when ready):
  // {
  //   slug: "notion-product-teardown",
  //   title: "How Notion Built a Product That Builds Products",
  //   excerpt: "Analyzing the primitives-first approach and why flexibility won.",
  //   category: "Teardown",
  //   date: "Apr 2026",
  // },
]

const categoryStyles: Record<Category, string> = {
  Product: "text-accent",
  Strategy: "text-foreground",
  Design: "text-muted-foreground",
  Teardown: "text-accent",
}

export function Writing() {
  const hasContent = posts.length > 0

  return (
    <section id="writing" className="py-20 md:py-28 border-t border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-8 md:gap-16">
          {/* Section Label */}
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] text-accent">
              Writing
            </h2>
            {hasContent && (
              <p className="mt-4 text-xs text-muted-foreground hidden md:block">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <p className="text-muted-foreground mb-10">
              Thinking through products, markets, and the craft of building.
            </p>

            {hasContent ? (
              <div className="space-y-0 divide-y divide-border">
                {posts.map((post) => (
                  <article key={post.slug} className="group py-6 first:pt-0">
                    <Link href={`/writing/${post.slug}`} className="block">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs uppercase tracking-wider ${categoryStyles[post.category]}`}>
                              {post.category}
                            </span>
                            <span className="text-xs text-muted-foreground/50">
                              {post.date}
                            </span>
                          </div>
                          <h3 className="font-serif text-lg md:text-xl text-foreground group-hover:text-accent transition-colors leading-snug">
                            {post.title}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                        <span className="text-muted-foreground/30 group-hover:text-accent transition-colors mt-1">
                          &rarr;
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-16 border-t border-border">
                <p className="text-sm text-muted-foreground/50 italic">
                  Writing in progress.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
