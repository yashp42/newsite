import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getPostBySlug, getAllPostSlugs, formatDisplayDate, type Category } from "@/lib/notion"
import type { Metadata } from "next"

// Generate static params for all published posts
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  
  if (!post) {
    return {
      title: "Post Not Found | yashkgp.me",
    }
  }

  return {
    title: `${post.title} | yashkgp.me`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedDate || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
}

const categoryStyles: Record<Category, string> = {
  Product: "text-accent border-accent",
  Strategy: "text-foreground border-foreground",
  Design: "text-muted-foreground border-muted-foreground",
  Teardown: "text-accent border-accent",
}

export default async function BlogPostPage({
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link 
            href="/#writing" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Writing
          </Link>
        </div>
      </nav>

      {/* Article */}
      <article className="pt-24 pb-20">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="w-full max-w-4xl mx-auto px-6 mb-12">
            <div className="aspect-[2/1] relative rounded-lg overflow-hidden bg-muted">
              <img
                src={post.coverImage}
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 mb-12">
          {/* Meta info */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${categoryStyles[post.category]}`}>
              {post.category}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatDisplayDate(post.publishedDate)}
            </span>
            {post.readTime && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-sm text-muted-foreground">
                  {post.readTime} min read
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight mb-6 text-balance">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Divider */}
          <div className="mt-10 border-b border-border" />
        </header>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6">
          <div 
            className="prose prose-lg prose-neutral dark:prose-invert
              prose-headings:font-serif prose-headings:text-foreground prose-headings:font-normal
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:pl-6
              prose-code:text-accent prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
              prose-img:rounded-lg
              prose-ul:text-muted-foreground prose-ol:text-muted-foreground
              prose-li:marker:text-muted-foreground/50
              max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
          />
        </div>

        {/* Footer */}
        <footer className="max-w-3xl mx-auto px-6 mt-16 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Last updated {formatDisplayDate(post.lastEditedAt)}
              </p>
            </div>
            <Link 
              href="/#writing" 
              className="text-sm text-accent hover:underline"
            >
              Read more articles
            </Link>
          </div>
        </footer>
      </article>
    </div>
  )
}

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')

  // Unordered lists
  html = html.replace(/^\s*[-*]\s(.*)$/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // Line breaks (double newline = paragraph)
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>\s*(<ul>)/g, '$1')
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>\s*(<blockquote>)/g, '$1')
  html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>\s*(<pre>)/g, '$1')
  html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1')

  return html
}
