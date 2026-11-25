// biome-ignore-all lint/suspicious/noArrayIndexKey: a parsed document is static (never reordered), its nodes have no ids.
import type { MarkdownBlock, MarkdownInline } from '@was/shared';
import { Fragment } from 'react';

/** Inline markdown nodes as React elements (text is escaped by React; links are already filtered by the parser). */
export function MarkdownInlines({ nodes }: { nodes: readonly MarkdownInline[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.kind) {
          case 'text':
            return <Fragment key={i}>{node.text}</Fragment>;
          case 'strong':
            return <strong key={i}>{node.text}</strong>;
          case 'em':
            return <em key={i}>{node.text}</em>;
          case 'code':
            return <code key={i}>{node.text}</code>;
          case 'link':
            return /^https?:/i.test(node.href) ? (
              <a key={i} href={node.href} rel="noopener noreferrer external">
                {node.text}
              </a>
            ) : (
              <a key={i} href={node.href}>
                {node.text}
              </a>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

interface MarkdownBlocksProps {
  blocks: readonly MarkdownBlock[];
  /** Accessible name of the tables (the section they belong to). */
  tableCaption: string;
}

/**
 * Sanitized markdown blocks (T4.2) with the long-form document styles (`doc-list`, `table`). Level-2 headings are the
 * section cards of the page, so only levels 3–4 reach this component.
 */
export function MarkdownBlocks({ blocks, tableCaption }: MarkdownBlocksProps) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'heading': {
            const H = block.level <= 3 ? 'h3' : 'h4';
            return (
              <H key={i} id={block.id}>
                <MarkdownInlines nodes={block.content} />
              </H>
            );
          }
          case 'paragraph':
            return (
              <p key={i}>
                <MarkdownInlines nodes={block.content} />
              </p>
            );
          case 'quote':
            return (
              <blockquote key={i} className="muted">
                <p>
                  <MarkdownInlines nodes={block.content} />
                </p>
              </blockquote>
            );
          case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
              <List key={i} className="doc-list">
                {block.items.map((item, j) => (
                  <li key={j}>
                    <MarkdownInlines nodes={item} />
                  </li>
                ))}
              </List>
            );
          }
          case 'table':
            return (
              <div key={i} className="table-wrap">
                <table className="table">
                  <caption className="sr-only">{tableCaption}</caption>
                  <thead>
                    <tr>
                      {block.header.map((cell, c) => (
                        <th key={c} scope="col">
                          <MarkdownInlines nodes={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c}>
                            <MarkdownInlines nodes={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'code':
            return (
              <pre key={i} className="table-wrap">
                <code>{block.text}</code>
              </pre>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
