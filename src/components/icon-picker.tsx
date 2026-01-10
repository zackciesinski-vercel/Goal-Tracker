'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMOJI_OPTIONS = [
  '🎯', '🚀', '📈', '💰', '🏆', '⭐', '🌟', '💎',
  '💼', '🤝', '📊', '📉', '💵', '🏦', '📋', '✅',
  '👥', '🙋', '💪', '🧠', '❤️', '🔥', '⚡', '🌱',
  '🛠️', '⚙️', '💻', '📱', '🔒', '🔑', '📦', '🎨',
  '📣', '💬', '📧', '📞', '🔔', '📝', '✍️', '📚',
  '⏰', '📅', '🗓️', '⏳', '🔄', '➡️', '🎉', '🥇',
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

type Tab = 'emoji' | 'upload' | 'url'

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('emoji')
  const [customEmoji, setCustomEmoji] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const isImageUrl = value?.startsWith('http')

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      onChange(customEmoji.trim())
      setCustomEmoji('')
      setIsOpen(false)
    }
  }

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onChange(imageUrl.trim())
      setImageUrl('')
      setIsOpen(false)
      setError(null)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('icons')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('icons')
        .getPublicUrl(fileName)

      onChange(publicUrl)
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const tabs = [
    { id: 'emoji' as Tab, label: 'Emoji' },
    { id: 'upload' as Tab, label: 'Upload' },
    { id: 'url' as Tab, label: 'URL' },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center bg-card overflow-hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isImageUrl ? (
          <img src={value} alt="Icon" className="w-12 h-12 object-cover rounded" />
        ) : (
          <span className="text-3xl">{value || '🎯'}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-popover rounded-lg shadow-lg border border-border z-20 w-80">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setError(null)
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-3">
              {error && (
                <p className="text-sm text-red-600 mb-2">{error}</p>
              )}

              {/* Emoji Tab */}
              {activeTab === 'emoji' && (
                <div>
                  <div className="mb-3">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Paste custom emoji..."
                        value={customEmoji}
                        onChange={(e) => setCustomEmoji(e.target.value)}
                        className="flex-1 text-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCustomEmojiSubmit()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCustomEmojiSubmit}
                        disabled={!customEmoji.trim()}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`w-8 h-8 text-xl rounded hover:bg-secondary transition-colors ${
                          value === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          onChange(emoji)
                          setIsOpen(false)
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>
              )}

              {/* URL Tab */}
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <Input
                    type="url"
                    placeholder="https://example.com/icon.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleUrlSubmit()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl.trim()}
                  >
                    Use URL
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Paste a direct link to an image
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
