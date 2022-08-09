import { Link } from './Link';

export function ExternalLink({
  url,
  children,
  className,
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <Link href={url} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  );
}
