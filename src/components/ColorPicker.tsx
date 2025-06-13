
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  label: string
  value: string | null
  onChange: (color: string) => void
  defaultColor: string
}

const PRESET_COLORS = [
  '#0f172a', '#1e293b', '#334155', '#475569',
  '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0',
  '#dc2626', '#ea580c', '#d97706', '#ca8a04',
  '#65a30d', '#16a34a', '#059669', '#0891b2',
  '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
  '#a855f7', '#c026d3', '#db2777', '#e11d48'
]

export function ColorPicker({ label, value, onChange, defaultColor }: ColorPickerProps) {
  const currentColor = value || defaultColor

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1 rounded cursor-pointer"
        />
        <Input
          type="text"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
      <div className="grid grid-cols-8 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
