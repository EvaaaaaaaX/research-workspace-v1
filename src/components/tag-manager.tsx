"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Tag {
  id: string
  name: string
}

interface ResourceTag {
  tag: Tag
  source: string
}

interface TagManagerProps {
  resourceId: string
  tags: ResourceTag[]
}

export function TagManager({ resourceId, tags }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAddTag() {
    if (!newTag.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/resources/${resourceId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tagName: newTag.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Tag added")
      setNewTag("")
      setIsAdding(false)
      router.refresh()
    } catch (e) {
      toast.error("Failed to add tag")
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      const res = await fetch(`/api/resources/${resourceId}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tagId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Tag removed")
      router.refresh()
    } catch (e) {
      toast.error("Failed to remove tag")
    }
  }

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/resources/${resourceId}/tags`, {
        method: "POST",
        body: JSON.stringify({ action: "REGENERATE" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Tags regenerated")
      router.refresh()
    } catch (e) {
      toast.error("Failed to regenerate tags")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tags.map((rt) => (
          <Badge
            key={rt.tag.id}
            variant={rt.source === "MANUAL" ? "default" : "secondary"}
            className="group py-1 pl-2 pr-1"
          >
            #{rt.tag.name}
            <button
              onClick={() => handleRemoveTag(rt.tag.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-1">
            <Input
              size={1}
              className="h-7 w-24 px-2 text-xs"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAddTag} disabled={loading}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsAdding(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Tag
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start text-xs text-muted-foreground hover:text-foreground"
        onClick={handleRegenerate}
        disabled={loading}
      >
        <RefreshCcw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        Regenerate Tags
      </Button>
    </div>
  )
}
