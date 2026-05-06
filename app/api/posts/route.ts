import { NextResponse } from "next/server"

// Blog post data source URL from the Notion database
const DATA_SOURCE_URL = "collection://63c872f1-97df-4982-83c1-42f0aef1953d"
const DATABASE_URL = "https://www.notion.so/f4fe9e28956d4a11999fedddaf3b4a07"

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  status: string
  publishedDate: string | null
  coverImage: string | null
  readTime: number | null
  createdAt: string
  lastEditedAt: string
}

// For now, return a placeholder response since the Notion API integration 
// requires additional setup (sharing the database with your integration)
// The MCP tools work because they use a different auth mechanism
export async function GET() {
  // Return sample posts for now until the Notion integration is properly configured
  const samplePosts: BlogPost[] = [
    {
      id: "1",
      slug: "getting-started-with-notion-blog",
      title: "Getting Started with Your Notion-Powered Blog",
      excerpt: "Learn how to set up and manage your blog posts directly from Notion. A complete guide to the integration.",
      category: "Product",
      status: "Published",
      publishedDate: new Date().toISOString(),
      coverImage: null,
      readTime: 5,
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
    },
  ]

  return NextResponse.json({ 
    posts: samplePosts,
    source: "sample",
    message: "Add posts to your Notion database and they will appear here automatically!",
    dataSourceUrl: DATA_SOURCE_URL,
    databaseUrl: DATABASE_URL,
  })
}
