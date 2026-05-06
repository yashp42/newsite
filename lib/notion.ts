import { Client } from "@notionhq/client"
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints"

// Initialize the Notion client (SDK v5 uses 2025-09-03 API version by default)
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Hardcoded database ID (provided by user)
// TODO: Once NOTION_DATABASE_ID env var is updated to the correct value, 
// this can be changed back to: process.env.NOTION_DATABASE_ID
const databaseId = "f4fe9e28-956d-4a11-999f-edddaf3b4a07"

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

    // Get title
    const titleProp = properties.Name || properties.Title || properties.title
    if (!titleProp || titleProp.type !== "title") return null
    const title = getPlainText(titleProp.title)
    if (!title) return null

    // Get excerpt/description
    let excerpt = ""
    const excerptProp = properties.Excerpt || properties.Description || properties.excerpt || properties.description
    if (excerptProp && excerptProp.type === "rich_text") {
      excerpt = getPlainText(excerptProp.rich_text)
    }

    // Get category
    let category: Category = "Product"
    const categoryProp = properties.Category || properties.category || properties.Tags || properties.tags
    if (categoryProp) {
      if (categoryProp.type === "select" && categoryProp.select) {
        const catName = categoryProp.select.name as Category
        if (["Product", "Strategy", "Design", "Teardown"].includes(catName)) {
          category = catName
        }
      } else if (categoryProp.type === "multi_select" && categoryProp.multi_select.length > 0) {
        const catName = categoryProp.multi_select[0].name as Category
        if (["Product", "Strategy", "Design", "Teardown"].includes(catName)) {
          category = catName
        }
      }
    }

    // Get date
    let date = formatDate(page.created_time)
    const dateProp = properties.Date || properties.date || properties.Published || properties.published
    if (dateProp && dateProp.type === "date" && dateProp.date) {
      date = formatDate(dateProp.date.start)
    }

    // Get slug
    let slug = createSlug(title)
    const slugProp = properties.Slug || properties.slug
    if (slugProp && slugProp.type === "rich_text" && slugProp.rich_text.length > 0) {
      slug = getPlainText(slugProp.rich_text)
    }

    // Check if published
    let published = true
    const publishedProp = properties.Published || properties.Status || properties.published || properties.status
    if (publishedProp) {
      if (publishedProp.type === "checkbox") {
        published = publishedProp.checkbox
      } else if (publishedProp.type === "select" && publishedProp.select) {
        published = publishedProp.select.name.toLowerCase() === "published"
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

// Get the data source ID from the database
async function getDataSourceId(): Promise<string | null> {
  if (!databaseId) {
    console.error("NOTION_DATABASE_ID is not set or invalid")
    return null
  }
  
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    })
    
    // In SDK v5, databases have a data_sources array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = database as any
    if (db.data_sources && Array.isArray(db.data_sources) && db.data_sources.length > 0) {
      return db.data_sources[0].id
    }
    
    // Fallback: if no data_sources, return the database ID (for older API versions)
    return databaseId
  } catch (error) {
    console.error("Error fetching database:", error)
    return null
  }
}

// Fetch all published posts from the database
export async function getPosts(): Promise<Post[]> {
  try {
    // First get the data source ID
    const dataSourceId = await getDataSourceId()
    
    if (!dataSourceId) {
      console.error("Could not find data source ID")
      return []
    }
    
    // Query the data source using SDK v5's dataSources.query
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    })

    const posts: Post[] = []

    for (const page of response.results) {
      if (page.object === "page" && "properties" in page) {
        const post = parsePost(page as PageObjectResponse)
        if (post && post.published) {
          posts.push(post)
        }
      }
    }

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
