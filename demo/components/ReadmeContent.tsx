import { useMemo } from 'react';
import { InteractiveDemo } from '../sections/InteractiveDemo';
import { parseReadme } from '../utils/readmeParser';
import { ReadmeMarkdown } from './ReadmeMarkdown';
import { ThemePlayground } from './ThemePlayground';

const interactiveComponents: Record<string, React.FC> = {
  demo: InteractiveDemo,
  playground: ThemePlayground,
};

export function ReadmeContent() {
  const segments = useMemo(() => parseReadme(), []);

  return (
    <>
      {segments.map((segment) => {
        const key = `${segment.type}-${segment.content.slice(0, 40)}`;
        if (segment.type === 'interactive') {
          const Component = interactiveComponents[segment.content];
          if (!Component) return null;
          return <Component key={key} />;
        }
        return <ReadmeMarkdown key={key} content={segment.content} />;
      })}
    </>
  );
}
