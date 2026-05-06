import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"
import type { 
  PageObjectResponse, 
  RichTextItemResponse 
} from "@notionhq/client/build/src/api-endpoints"

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

// Lazy initialization to ensure env vars are available at runtime
let _notion: Client | null = null
let _n2m: NotionToMarkdown | null = null
let _dataSourceId: string | null = null

function getNotionClient(): Client {
  if (!_notion) {
    const apiKey = process.env.NOTION_API_KEY
    if (!apiKey) {
      throw new Error("NOTION_API_KEY environment variable is not set")
    }
    _notion = new Client({ auth: apiKey })
  }
  return _notion
}

function getN2M(): NotionToMarkdown {
  if (!_n2m) {
    _n2m = new NotionToMarkdown({ notionClient: getNotionClient() })
  }
  return _n2m
}

function getDatabaseId(): string {
  const dbId = process.env.NOTION_DATABASE_ID
  if (!dbId) {
    throw new Error("NOTION_DATABASE_ID environment variable is not set")
  }
  return dbId
}

// Get the data source ID from the database (Notion SDK v5 uses dataSources.query)
async function getDataSourceId(): Promise<string> {
  if (_dataSourceId) {
    return _dataSourceId
  }
  
  const notion = getNotionClient()
  const databaseId = getDatabaseId()
  
  // Retrieve the database to get its data sources
  const database = await notion.databases.retrieve({
    database_id: databaseId,
  })
  
  // Get the first data source ID from the database
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataSources = (database as any).data_sources
  if (!dataSources || dataSources.length === 0) {
    throw new Error("No data sources found in database. The database may need to be shared with your Notion integration.")
  }
  
  _dataSourceId = dataSources[0].id
  return _dataSourceId
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

// Fetch all published posts using Notion SDK v5 dataSources.query API
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const notion = getNotionClient()
    const dataSourceId = await getDataSourceId()
    
    // Use the new dataSources.query endpoint (Notion SDK v5)
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
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
    // Log helpful error information
    if (error instanceof Error) {
      if (error.message.includes("object_not_found")) {
        console.error(
          "[Notion Integration] Database not found. Please ensure:\n" +
          "1. The NOTION_DATABASE_ID environment variable is correct\n" +
          "2. The database is shared with your Notion integration\n" +
          "   - Go to the database in Notion\n" +
          "   - Click '...' menu → 'Add connections'\n" +
          "   - Select your integration\n" +
          `Database ID being used: ${process.env.NOTION_DATABASE_ID || "NOT SET"}`
        )
      } else {
        console.error("Error fetching posts from Notion:", error.message)
      }
    }
    return []
  }
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  try {
    const notion = getNotionClient()
    const dataSourceId = await getDataSourceId()
    const n2m = getN2M()
    
    // Use the new dataSources.query endpoint (Notion SDK v5)
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
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
