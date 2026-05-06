import { notFound } from "next/navigation"
import Link from "next/link"
import { getPostBySlug, getAllPostSlugs, type Category } from "@/lib/notion"
import { NotionRenderer } from "@/components/notion-renderer"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const categoryStyles: Record<Category, string> = {
  Product: "text-accent",
  Strategy: "text-foreground",
  Design: "text-muted-foreground",
  Teardown: "text-accent",
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  return {
    title: `${post.title} | Writing`,
    description: post.excerpt,
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="py-20 md:py-28">
        <article className="max-w-3xl mx-auto px-6">
          {/* Back link */}
          <Link
            href="/#writing"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-12"
          >
            <span>&larr;</span>
            <span>Back to writing</span>
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-xs uppercase tracking-wider ${categoryStyles[post.category]}`}
              >
                {post.category}
              </span>
              <span className="text-xs text-muted-foreground/50">
                {post.date}
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Divider */}
          <hr className="border-border mb-12" />

          {/* Content */}
          <NotionRenderer blocks={post.blocks} />

          {/* Footer nav */}
          <div className="mt-16 pt-8 border-t border-border">
            <Link
              href="/#writing"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              <span>&larr;</span>
              <span>Back to all posts</span>
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
