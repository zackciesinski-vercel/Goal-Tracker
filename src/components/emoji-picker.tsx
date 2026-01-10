'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMOJI_OPTIONS = [
  // Growth & Success
  '🎯', '🚀', '📈', '💰', '🏆', '⭐', '🌟', '💎',
  // Business
  '💼', '🤝', '📊', '📉', '💵', '🏦', '📋', '✅',
  // People & Teams
  '👥', '🙋', '💪', '🧠', '❤️', '🔥', '⚡', '🌱',
  // Products & Tech
  '🛠️', '⚙️', '💻', '📱', '🔒', '🔑', '📦', '🎨',
  // Communication
  '📣', '💬', '📧', '📞', '🔔', '📝', '✍️', '📚',
  // Time & Progress
  '⏰', '📅', '🗓️', '⏳', '🔄', '➡️', '🎉', '🥇',
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customEmoji, setCustomEmoji] = useState('')

  const handleCustomSubmit = () => {
    if (customEmoji.trim()) {
      onChange(customEmoji.trim())
      setCustomEmoji('')
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-16 h-16 text-3xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        {value}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border z-20 w-80">
            {/* Custom emoji input */}
            <div className="mb-3 pb-3 border-b">
              <p className="text-xs text-gray-500 mb-2">Custom icon</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Paste any emoji..."
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  className="flex-1 text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCustomSubmit()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={!customEmoji.trim()}
                >
                  Use
                </Button>
              </div>
            </div>

            {/* Preset emojis */}
            <p className="text-xs text-gray-500 mb-2">Or choose from presets</p>
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`w-8 h-8 text-xl rounded hover:bg-gray-100 transition-colors ${
                    value === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
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
        </>
      )}
    </div>
  )
}
