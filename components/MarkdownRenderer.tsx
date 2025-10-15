import * as React from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [html, setHtml] = React.useState('');

  React.useEffect(() => {
    if (content) {
        // Use an async function to handle the promise from marked.parse
        const parseMarkdown = async () => {
            const parsedHtml = await marked.parse(content);
            setHtml(parsedHtml);
        };
        parseMarkdown();
    } else {
        setHtml('');
    }
  }, [content]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MarkdownRenderer;
