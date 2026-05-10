import { Users } from "lucide-react";

export function DirectorioPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Users size={64} className="text-[#d4a843] mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Compañeros</h1>
      <p className="text-lg text-gray-500 mb-2">Directorio</p>
      <p className="text-gray-400 max-w-md">
        Esta sección está en construcción. Pronto podrás buscar y
        conectar con otros compañeros de la universidad.
      </p>
    </div>
  );
}
