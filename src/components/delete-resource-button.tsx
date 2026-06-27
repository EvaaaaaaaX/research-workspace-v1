"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface DeleteResourceButtonProps {
  resourceId: string
}

export function DeleteResourceButton({ resourceId }: DeleteResourceButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/resources/delete?id=${resourceId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setOpen(false)
        // 刷新最近的路由缓存（列表页数据）
        router.refresh()
        // 返回上一页（保留浏览器历史记录中的滚动位置）
        router.back()
      }
    } catch (e) {
      console.error("Delete failed:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button variant="destructive" className="w-full" onClick={() => setOpen(true)}>
        Delete Resource
      </Button>
    </>
  )
}
