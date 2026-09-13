// components/form-builder/file-upload-config.tsx

'use client'

import { ConfigPanelProps } from '././config-panel-props'

export function FileUploadConfig({ config, element, onUpdate }: ConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Tipe File yang Diizinkan</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'image/*', label: 'Gambar (JPG, PNG)' },
            { value: 'application/pdf', label: 'PDF' },
            { value: '.doc,.docx', label: 'Word (DOC, DOCX)' },
            { value: '.xls,.xlsx', label: 'Excel (XLS, XLSX)' },
            { value: '.ppt,.pptx', label: 'PowerPoint' },
            { value: '.txt', label: 'Text (TXT)' },
          ].map((fileType) => (
            <label key={fileType.value} className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
              <input
                type="checkbox"
                checked={(config.fileTypes || []).includes(fileType.value)}
                onChange={(e) => {
                  const currentTypes = config.fileTypes || []
                  let newTypes: string[]
                  if (e.target.checked) {
                    newTypes = [...currentTypes, fileType.value]
                  } else {
                    newTypes = currentTypes.filter((t: string) => t !== fileType.value)
                  }
                  onUpdate({
                    ...element,
                    config: { ...config, fileTypes: newTypes }
                  })
                }}
                className="accent-cyan-400 w-3.5 h-3.5 cursor-pointer"
              />
              {fileType.label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider">Ukuran Maksimal File (MB)</label>
        <input
          type="number"
          value={config.maxFileSize || 5}
          onChange={(e) => onUpdate({
            ...element,
            config: { ...config, maxFileSize: parseInt(e.target.value) || 5 }
          })}
          min={1}
          max={25}
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none"
        />
      </div>
    </div>
  )
}
