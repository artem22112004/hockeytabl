import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default function PlayerPage({ params }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-4xl">
        🏒
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">Player #{params.id}</h1>
        <p className="mt-2 text-muted">
          Detailed player stats coming soon. Player ID: {params.id}
        </p>
      </div>
      <Link
        href="/skaters"
        className="rounded border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-white"
      >
        ← Back to Skaters
      </Link>
    </div>
  );
}
