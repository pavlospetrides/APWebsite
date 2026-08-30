'use client';
import { useEffect } from 'react';
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error(error); }, [error]); return <main className="not-found"><p>Σφάλμα / Error</p><h1>Κάτι δεν λειτούργησε σωστά.</h1><p>Something went wrong while loading this page.</p><button className="button button-primary" onClick={reset}>Δοκιμή ξανά / Try again</button></main>; }
