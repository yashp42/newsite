import { Client } from "@notionhq/client"

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const databaseId = process.env.NOTION_DATABASE_ID!

export type PostCategory = "Product" | "Strategy" | "Design" | "Teardown"

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  category: PostCategory
  date: string
  published: boolean
}

export async function getPosts(): Promise<Post[]> {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
    })

    return response.results.map((page: any) => {
      const properties = page.properties
      
      return {
        id: page.id,
        slug: properties.Slug?.rich_text?.[0]?.plain_text || "",
        title: properties.Title?.title?.[0]?.plain_text || "Untitled",
        excerpt: properties.Excerpt?.rich_text?.[0]?.plain_text || "",
        category: (properties.Category?.select?.name as PostCategory) || "Product",
        date: properties.Date?.date?.start || new Date().toISOString().split("T")[0],
        published: properties.Published?.checkbox || false,
      }
    })
  } catch (error) {
    console.error("Error fetching posts from Notion:", error)
    return []
  }
}
