import { ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
export default function NotFound() { return <main className="not-found"><Zap /><p>404</p><h1>Η σελίδα δεν βρέθηκε</h1><p>The page could not be found.</p><Link className="button button-primary" href="/el"><ArrowLeft />Επιστροφή / Back home</Link></main>; }
