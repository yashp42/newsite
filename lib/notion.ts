import { Client } from "@notionhq/client"
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints"

// Initialize the Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Database ID from user - can be either a database ID or a page ID containing a database
const NOTION_ID = "f4fe9e28-956d-4a11-999f-edddaf3b4a07"

// Types
export type Category = "Product" | "Strategy" | "Design" | "Teardown"

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  category: Category
  date: string
  published: boolean
}

export interface PostWithContent extends Post {
  blocks: BlockObjectResponse[]
}

// Helper to extract plain text from rich text
function getPlainText(richText: RichTextItemResponse[]): string {
  return richText.map((item) => item.plain_text).join("")
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

// Helper to create slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// Parse a Notion page into our Post type
function parsePost(page: PageObjectResponse): Post | null {
  try {
    const properties = page.properties

    // Get title - try common property names
    let title = ""
    const titleProps = ["Name", "Title", "title", "name"]
    for (const propName of titleProps) {
      const prop = properties[propName]
      if (prop && prop.type === "title" && prop.title.length > 0) {
        title = getPlainText(prop.title)
        break
      }
    }
    if (!title) return null

    // Get excerpt/description
    let excerpt = ""
    const excerptProps = ["Excerpt", "Description", "excerpt", "description", "Summary", "summary"]
    for (const propName of excerptProps) {
      const prop = properties[propName]
      if (prop && prop.type === "rich_text" && prop.rich_text.length > 0) {
        excerpt = getPlainText(prop.rich_text)
        break
      }
    }

    // Get category
    let category: Category = "Product"
    const categoryProps = ["Category", "category", "Tags", "tags", "Type", "type"]
    for (const propName of categoryProps) {
      const prop = properties[propName]
      if (prop) {
        if (prop.type === "select" && prop.select) {
          const catName = prop.select.name as Category
          if (["Product", "Strategy", "Design", "Teardown"].includes(catName)) {
            category = catName
            break
          }
        } else if (prop.type === "multi_select" && prop.multi_select.length > 0) {
          const catName = prop.multi_select[0].name as Category
          if (["Product", "Strategy", "Design", "Teardown"].includes(catName)) {
            category = catName
            break
          }
        }
      }
    }

    // Get date
    let date = formatDate(page.created_time)
    const dateProps = ["Date", "date", "Published", "published", "Created", "created"]
    for (const propName of dateProps) {
      const prop = properties[propName]
      if (prop && prop.type === "date" && prop.date) {
        date = formatDate(prop.date.start)
        break
      }
    }

    // Get slug
    let slug = createSlug(title)
    const slugProps = ["Slug", "slug", "URL", "url"]
    for (const propName of slugProps) {
      const prop = properties[propName]
      if (prop && prop.type === "rich_text" && prop.rich_text.length > 0) {
        slug = getPlainText(prop.rich_text)
        break
      }
    }

    // Check if published (default to true if no status property)
    let published = true
    const publishedProps = ["Published", "Status", "published", "status"]
    for (const propName of publishedProps) {
      const prop = properties[propName]
      if (prop) {
        if (prop.type === "checkbox") {
          published = prop.checkbox
          break
        } else if (prop.type === "select" && prop.select) {
          const status = prop.select.name.toLowerCase()
          published = status === "published" || status === "live" || status === "done"
          break
        }
      }
    }

    return {
      id: page.id,
      slug,
      title,
      excerpt,
      category,
      date,
      published,
    }
  } catch (error) {
    console.error("Error parsing post:", error)
    return null
  }
}

// Try to find a database - first try the specific ID, then search for any accessible databases
async function findDatabaseId(): Promise<string | null> {
  // First, try to access the specific ID as a database directly
  try {
    await notion.databases.retrieve({ database_id: NOTION_ID })
    console.log("[v0] Found database with specified ID:", NOTION_ID)
    return NOTION_ID
  } catch {
    console.log("[v0] Specified ID not accessible as database, searching for databases...")
  }

  // Try to find a child database in the page
  try {
    const response = await notion.blocks.children.list({
      block_id: NOTION_ID,
      page_size: 100,
    })

    for (const block of response.results) {
      if ("type" in block && block.type === "child_database") {
        console.log("[v0] Found child database:", block.id)
        return block.id
      }
    }
  } catch {
    console.log("[v0] Could not access specified ID as page either")
  }

  // Last resort: Search for any accessible databases in the workspace
  try {
    console.log("[v0] Searching for any accessible databases in workspace...")
    const searchResponse = await notion.search({
      filter: { property: "object", value: "database" },
      page_size: 10,
    })

    if (searchResponse.results.length > 0) {
      // Find a database that looks like a blog/posts database
      for (const result of searchResponse.results) {
        if (result.object === "database" && "title" in result) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = result as any
          const title = db.title?.[0]?.plain_text?.toLowerCase() || ""
          console.log("[v0] Found database:", db.id, "titled:", title)
          
          // Prefer databases with blog-related names
          if (title.includes("blog") || title.includes("post") || title.includes("writing") || title.includes("article")) {
            console.log("[v0] Using blog-related database:", db.id)
            return db.id
          }
        }
      }
      
      // If no blog-specific database found, use the first one
      const firstDb = searchResponse.results[0]
      if ("id" in firstDb) {
        console.log("[v0] Using first available database:", firstDb.id)
        return firstDb.id
      }
    }
  } catch (error) {
    console.error("[v0] Error searching for databases:", error)
  }

  return null
}

// Query the database for pages
async function queryDatabase(dbId: string): Promise<PageObjectResponse[]> {
  try {
    // Try the new SDK v5 dataSources.query first
    try {
      const db = await notion.databases.retrieve({ database_id: dbId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbAny = db as any
      if (dbAny.data_sources && Array.isArray(dbAny.data_sources) && dbAny.data_sources.length > 0) {
        const dataSourceId = dbAny.data_sources[0].id
        const response = await notion.dataSources.query({
          data_source_id: dataSourceId,
          sorts: [{ timestamp: "created_time", direction: "descending" }],
        })
        return response.results.filter(
          (page): page is PageObjectResponse => page.object === "page" && "properties" in page
        )
      }
    } catch {
      // dataSources.query not available, fall through to regular query
    }

    // Fallback: Use search API to find pages in this database
    const response = await notion.search({
      filter: { property: "object", value: "page" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
    })

    // Filter pages that belong to this database
    const pages: PageObjectResponse[] = []
    for (const result of response.results) {
      if (result.object === "page" && "properties" in result && "parent" in result) {
        const parent = result.parent
        if (parent.type === "database_id" && parent.database_id === dbId) {
          pages.push(result as PageObjectResponse)
        }
      }
    }
    return pages
  } catch (error) {
    console.error("Error querying database:", error)
    return []
  }
}

// Fetch all published posts from the database
export async function getPosts(): Promise<Post[]> {
  try {
    const dbId = await findDatabaseId()
    
    if (!dbId) {
      console.error("Could not find a valid Notion database. Make sure:")
      console.error("1. The database is shared with your Notion integration")
      console.error("2. The NOTION_ID is correct (either a database ID or page containing a database)")
      return []
    }

    const pages = await queryDatabase(dbId)
    const posts: Post[] = []

    for (const page of pages) {
      const post = parsePost(page)
      if (post && post.published) {
        posts.push(post)
      }
    }

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return posts
  } catch (error) {
    console.error("Error fetching posts from Notion:", error)
    return []
  }
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<PostWithContent | null> {
  try {
    const posts = await getPosts()
    const post = posts.find((p) => p.slug === slug)

    if (!post) return null

    // Fetch page blocks
    const blocks = await getPageBlocks(post.id)

    return {
      ...post,
      blocks,
    }
  } catch (error) {
    console.error("Error fetching post by slug:", error)
    return null
  }
}

// Fetch all blocks for a page
async function getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = []

  let cursor: string | undefined
  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    })

    for (const block of response.results) {
      if ("type" in block) {
        blocks.push(block as BlockObjectResponse)
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined
  } while (cursor)

  return blocks
}

// Get all post slugs for static generation
export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getPosts()
  return posts.map((post) => post.slug)
}
