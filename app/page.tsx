export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI API</h1>
        <p className="text-lg text-gray-600 mb-8">
          Built with Next.js, TypeScript, OpenSpec, and TDD
        </p>
        <div className="space-y-2">
          <p className="text-sm">
            <a href="/api/health" className="text-blue-600 hover:underline">
              Health Check API
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
