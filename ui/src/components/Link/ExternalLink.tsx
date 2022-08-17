import { Link } from './Link';

export function ExternalLink({
  url,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & {
  url: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Link {...rest} href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  );
}
