import type { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints"
import Link from "next/link"

interface NotionRendererProps {
  blocks: BlockObjectResponse[]
}

// Render rich text with formatting
function RichText({ richText }: { richText: RichTextItemResponse[] }) {
  return (
    <>
      {richText.map((text, index) => {
        if (text.type !== "text") return null

        let content: React.ReactNode = text.text.content

        // Apply annotations
        if (text.annotations.bold) {
          content = <strong key={index}>{content}</strong>
        }
        if (text.annotations.italic) {
          content = <em key={index}>{content}</em>
        }
        if (text.annotations.strikethrough) {
          content = <s key={index}>{content}</s>
        }
        if (text.annotations.underline) {
          content = <u key={index}>{content}</u>
        }
        if (text.annotations.code) {
          content = (
            <code key={index} className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
              {content}
            </code>
          )
        }

        // Handle links
        if (text.text.link) {
          content = (
            <Link
              key={index}
              href={text.text.link.url}
              className="text-accent hover:underline"
              target={text.text.link.url.startsWith("http") ? "_blank" : undefined}
              rel={text.text.link.url.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {content}
            </Link>
          )
        }

        return <span key={index}>{content}</span>
      })}
    </>
  )
}

// Render a single block
function Block({ block }: { block: BlockObjectResponse }) {
  switch (block.type) {
    case "paragraph":
      if (block.paragraph.rich_text.length === 0) {
        return <div className="h-4" />
      }
      return (
        <p className="text-foreground/90 leading-relaxed mb-4">
          <RichText richText={block.paragraph.rich_text} />
        </p>
      )

    case "heading_1":
      return (
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mt-12 mb-6">
          <RichText richText={block.heading_1.rich_text} />
        </h1>
      )

    case "heading_2":
      return (
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mt-10 mb-4">
          <RichText richText={block.heading_2.rich_text} />
        </h2>
      )

    case "heading_3":
      return (
        <h3 className="font-serif text-xl md:text-2xl text-foreground mt-8 mb-3">
          <RichText richText={block.heading_3.rich_text} />
        </h3>
      )

    case "bulleted_list_item":
      return (
        <li className="text-foreground/90 leading-relaxed ml-6 mb-2 list-disc">
          <RichText richText={block.bulleted_list_item.rich_text} />
        </li>
      )

    case "numbered_list_item":
      return (
        <li className="text-foreground/90 leading-relaxed ml-6 mb-2 list-decimal">
          <RichText richText={block.numbered_list_item.rich_text} />
        </li>
      )

    case "quote":
      return (
        <blockquote className="border-l-2 border-accent pl-6 py-2 my-6 italic text-muted-foreground">
          <RichText richText={block.quote.rich_text} />
        </blockquote>
      )

    case "code":
      return (
        <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-6">
          <code className="text-sm font-mono text-foreground">
            {block.code.rich_text.map((t) => t.plain_text).join("")}
          </code>
        </pre>
      )

    case "divider":
      return <hr className="border-border my-8" />

    case "callout":
      return (
        <div className="bg-muted/50 border border-border rounded-lg p-4 my-6 flex gap-3">
          {block.callout.icon?.type === "emoji" && (
            <span className="text-xl">{block.callout.icon.emoji}</span>
          )}
          <div className="text-foreground/90">
            <RichText richText={block.callout.rich_text} />
          </div>
        </div>
      )

    case "toggle":
      return (
        <details className="my-4">
          <summary className="cursor-pointer text-foreground font-medium">
            <RichText richText={block.toggle.rich_text} />
          </summary>
        </details>
      )

    case "image":
      const imageUrl =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url
      const caption =
        block.image.caption.length > 0
          ? block.image.caption.map((c) => c.plain_text).join("")
          : ""
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={caption || "Blog image"}
            className="rounded-lg w-full"
          />
          {caption && (
            <figcaption className="text-center text-sm text-muted-foreground mt-3">
              {caption}
            </figcaption>
          )}
        </figure>
      )

    case "bookmark":
      return (
        <a
          href={block.bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block my-6 p-4 border border-border rounded-lg hover:border-accent transition-colors"
        >
          <span className="text-accent text-sm">{block.bookmark.url}</span>
        </a>
      )

    default:
      return null
  }
}

export function NotionRenderer({ blocks }: NotionRendererProps) {
  // Group list items together
  const groupedBlocks: (BlockObjectResponse | BlockObjectResponse[])[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    if (block.type === "bulleted_list_item") {
      const listItems: BlockObjectResponse[] = [block]
      while (
        i + 1 < blocks.length &&
        blocks[i + 1].type === "bulleted_list_item"
      ) {
        i++
        listItems.push(blocks[i])
      }
      groupedBlocks.push(listItems)
    } else if (block.type === "numbered_list_item") {
      const listItems: BlockObjectResponse[] = [block]
      while (
        i + 1 < blocks.length &&
        blocks[i + 1].type === "numbered_list_item"
      ) {
        i++
        listItems.push(blocks[i])
      }
      groupedBlocks.push(listItems)
    } else {
      groupedBlocks.push(block)
    }
  }

  return (
    <div className="prose-custom">
      {groupedBlocks.map((item, index) => {
        if (Array.isArray(item)) {
          const listType = item[0].type === "bulleted_list_item" ? "ul" : "ol"
          const ListTag = listType
          return (
            <ListTag key={index} className="my-4">
              {item.map((block) => (
                <Block key={block.id} block={block} />
              ))}
            </ListTag>
          )
        }
        return <Block key={item.id} block={item} />
      })}
    </div>
  )
}
