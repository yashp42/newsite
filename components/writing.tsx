import Link from "next/link"
import { getPosts, type Post, type PostCategory } from "@/lib/notion"

const categoryStyles: Record<PostCategory, string> = {
  Product: "text-accent",
  Strategy: "text-foreground",
  Design: "text-muted-foreground",
  Teardown: "text-accent",
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export async function Writing() {
  const posts = await getPosts()
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
                  <article key={post.id} className="group py-6 first:pt-0">
                    <Link href={`/writing/${post.slug}`} className="block">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs uppercase tracking-wider ${categoryStyles[post.category]}`}>
                              {post.category}
                            </span>
                            <span className="text-xs text-muted-foreground/50">
                              {formatDate(post.date)}
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
