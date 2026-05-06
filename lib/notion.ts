import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"
import type { 
  PageObjectResponse, 
  QueryDatabaseResponse,
  RichTextItemResponse 
} from "@notionhq/client/build/src/api-endpoints"

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Initialize notion-to-md converter
const n2m = new NotionToMarkdown({ notionClient: notion })

// Database ID from the created database
const DATABASE_ID = process.env.NOTION_DATABASE_ID!

// Type definitions
export type Category = "Product" | "Strategy" | "Design" | "Teardown"
export type Status = "Draft" | "Published"

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: Category
  status: Status
  publishedDate: string | null
  coverImage: string | null
  readTime: number | null
  createdAt: string
  lastEditedAt: string
}

export interface BlogPostWithContent extends BlogPost {
  content: string
}

// Helper to extract text from rich text array
function getRichText(richText: RichTextItemResponse[]): string {
  return richText.map((item) => item.plain_text).join("")
}

// Helper to format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

// Parse a Notion page into a BlogPost
function parsePageToPost(page: PageObjectResponse): BlogPost {
  const properties = page.properties

  // Extract title
  const titleProp = properties["Title"]
  const title = titleProp?.type === "title" 
    ? getRichText(titleProp.title) 
    : "Untitled"

  // Extract slug
  const slugProp = properties["Slug"]
  const slug = slugProp?.type === "rich_text" 
    ? getRichText(slugProp.rich_text) || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    : title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  // Extract excerpt
  const excerptProp = properties["Excerpt"]
  const excerpt = excerptProp?.type === "rich_text" 
    ? getRichText(excerptProp.rich_text) 
    : ""

  // Extract category
  const categoryProp = properties["Category"]
  const category = (categoryProp?.type === "select" && categoryProp.select?.name
    ? categoryProp.select.name
    : "Product") as Category

  // Extract status
  const statusProp = properties["Status"]
  const status = (statusProp?.type === "select" && statusProp.select?.name
    ? statusProp.select.name
    : "Draft") as Status

  // Extract published date
  const dateProp = properties["Published Date"]
  const publishedDate = dateProp?.type === "date" && dateProp.date?.start
    ? dateProp.date.start
    : null

  // Extract cover image
  const coverProp = properties["Cover Image"]
  const coverImage = coverProp?.type === "url" ? coverProp.url : null

  // Extract read time
  const readTimeProp = properties["Read Time"]
  const readTime = readTimeProp?.type === "number" ? readTimeProp.number : null

  return {
    id: page.id,
    slug,
    title,
    excerpt,
    category,
    status,
    publishedDate,
    coverImage,
    readTime,
    createdAt: page.created_time,
    lastEditedAt: page.last_edited_time,
  }
}

// Fetch all published posts
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Status",
        select: {
          equals: "Published",
        },
      },
      sorts: [
        {
          property: "Published Date",
          direction: "descending",
        },
      ],
    })

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map(parsePageToPost)
  } catch (error) {
    console.error("Error fetching posts from Notion:", error)
    return []
  }
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  try {
    const response: QueryDatabaseResponse = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: "Slug",
            rich_text: {
              equals: slug,
            },
          },
          {
            property: "Status",
            select: {
              equals: "Published",
            },
          },
        ],
      },
    })

    if (response.results.length === 0) {
      return null
    }

    const page = response.results[0] as PageObjectResponse
    const post = parsePageToPost(page)

    // Convert page content to markdown
    const mdBlocks = await n2m.pageToMarkdown(page.id)
    const mdString = n2m.toMarkdownString(mdBlocks)

    return {
      ...post,
      content: mdString.parent,
    }
  } catch (error) {
    console.error("Error fetching post by slug:", error)
    return null
  }
}

// Get all post slugs for static generation
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts()
  return posts.map((post) => post.slug)
}

// Format date for display in the UI
export function formatDisplayDate(dateString: string | null): string {
  if (!dateString) return ""
  return formatDate(dateString)
}
