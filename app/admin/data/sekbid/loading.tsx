export default function LoadingSekbid() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Memuat data Sekbid...</p>
      </div>
    </div>
  );
}
