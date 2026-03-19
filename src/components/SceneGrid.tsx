import type { SceneCard } from '../scenes/cards'

interface SceneGridProps {
  scenes: SceneCard[]
  onSelect: (scene: SceneCard) => void
}

export function SceneGrid({ scenes, onSelect }: SceneGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {scenes.map((scene) => (
        <button
          key={scene.id}
          onClick={() => onSelect(scene)}
          className="flex flex-col items-start gap-1 p-3 text-left rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
        >
          <span className="text-xl">{scene.icon}</span>
          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{scene.name}</span>
          <span className="text-xs text-gray-400 line-clamp-2">{scene.description}</span>
        </button>
      ))}
    </div>
  )
}
