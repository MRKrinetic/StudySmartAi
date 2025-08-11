import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const MarkdownRenderingTest: React.FC = () => {
  const testMarkdownContent = `# Markdown Rendering Test

This component demonstrates that **markdown rendering** is working correctly in AI chat responses.

## Features Tested:

### Text Formatting
- **Bold text** works correctly
- *Italic text* is rendered properly
- \`Inline code\` has proper styling
- ~~Strikethrough~~ text is supported

### Lists
1. Ordered lists work
2. With proper numbering
3. And indentation

- Unordered lists also work
- With bullet points
- And proper spacing

### Code Blocks

\`\`\`javascript
// JavaScript code with syntax highlighting
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}
\`\`\`

\`\`\`python
# Python code with syntax highlighting
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1
\`\`\`

### Blockquotes

> This is a blockquote that should be properly styled
> with the correct indentation and visual formatting.

### Symbols and Icons

✅ Checkmarks should display properly
❌ X marks should render correctly
⚠️ Warning symbols work
🚀 Emojis are supported
📊 Charts and graphs symbols
💡 Light bulb ideas
⏱️ Time symbols

### Links and References

[This is a link](https://example.com) that should be clickable.

---

If you can see all the above elements properly formatted (headings, bold text, code blocks with syntax highlighting, lists, blockquotes, and symbols), then the markdown rendering fix is working correctly!`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-muted p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-white">Markdown Rendering Test</h2>
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-em:text-white prose-code:text-white prose-pre:bg-black/20 prose-blockquote:text-white prose-li:text-white">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-md"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-black/20 px-1 py-0.5 rounded text-sm text-white" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {testMarkdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MarkdownRenderingTest;
