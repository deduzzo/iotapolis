import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const components = {
  h1: ({ children }) => (
    <h1
      className="text-2xl font-bold mb-3 mt-4"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="text-xl font-bold mb-2 mt-3"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="text-lg font-semibold mb-2 mt-3"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 leading-relaxed text-sm" style={{ color: 'var(--color-text)' }}>
      {children}
    </p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:opacity-80 transition-opacity"
      style={{ color: 'var(--color-primary)' }}
    >
      {children}
    </a>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded text-xs font-mono"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border)',
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre
      className="rounded-xl p-4 my-3 overflow-x-auto text-xs font-mono"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="border-l-4 pl-4 my-3 italic"
      style={{
        borderColor: 'var(--color-primary)',
        color: 'var(--color-text-muted)',
      }}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-2 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-2 space-y-1 text-sm" style={{ color: 'var(--color-text)' }}>
      {children}
    </ol>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table
        className="w-full text-sm border-collapse"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th
      className="px-3 py-2 text-left font-semibold text-xs border-b"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-muted)',
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="px-3 py-2 text-sm border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {children}
    </td>
  ),
  hr: () => (
    <hr className="my-4" style={{ borderColor: 'var(--color-border)' }} />
  ),
};

export default function MarkdownRender({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
