// ================================
// app/(crm)/feedback/page.tsx
// Converted to your ts-rest hook style; keeps client-side search/rating filter
// ================================
'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Star, Plus, Search, Filter, Eye, Edit, Trash2, Calendar, User as UserIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { FeedbackForm } from '@/components/feedback-form'
import { FeedbackDetail } from '@/components/feedback-detail'
import { FEEDBACK_QUERY_KEY } from '@/lib/api/queryKeys'
import { authClient } from '@/lib/api/publicClient'



export function FeedbackManagement() {
  const queryClient = authClient.useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // ——— Queries ———
  // Prefer ts-rest route if available; otherwise fall back to raw GET
  const { data: feedbackResp, isLoading } = authClient.crm.feedback.listFeedback.useQuery({
          queryKey: [...FEEDBACK_QUERY_KEY, ratingFilter, searchTerm],
        })


//   const { data: statsResp } = authClient.crm.feedback.getStats.useQuery({ queryKey: FEEDBACK_STATS_QK })


  const feedback = useMemo(() => {
    if (!feedbackResp) return []
    if (feedbackResp.status === 200) return feedbackResp.body
    return Array.isArray(feedbackResp) ? feedbackResp : []
  }, [feedbackResp])

  const stats =  { totalFeedback: 0, averageRating: 0, thisMonth: 0, positiveRating: 0 }

//   const stats = useMemo(() => {
//     if (!statsResp) return { totalFeedback: 0, averageRating: 0, thisMonth: 0, positiveRating: 0 }
//     if (statsResp.status === 200) return statsResp.body
//     return statsResp
//   }, [statsResp])



  // ——— Mutations ———
  const { mutate: createFeedback, isPending: isCreating } =
    (authClient as any).crm?.feedback?.createFeedback
      ? (authClient as any).crm.feedback.createFeedback.useMutation({
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            toast.success('Feedback saved')
            setIsFormOpen(false)
            setSelectedFeedback(null)
          },
          onError: (e: any) => toast.error(`Failed to save feedback: ${e?.message ?? 'Unknown error'}`),
        })
      : (authClient as any).mutation.useMutation({
          // raw fallback
          mutationFn: (data: any) => (authClient as any).post('/api/feedback', data),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            toast.success('Feedback saved')
            setIsFormOpen(false)
            setSelectedFeedback(null)
          },
          onError: () => toast.error('Failed to save feedback'),
        })

  const { mutate: updateFeedback, isPending: isUpdating } =
    (authClient as any).crm?.feedback?.updateFeedback
      ? (authClient as any).crm.feedback.updateFeedback.useMutation({
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            toast.success('Feedback updated')
            setIsFormOpen(false)
            setSelectedFeedback(null)
          },
          onError: (e: any) => toast.error(`Failed to update feedback: ${e?.message ?? 'Unknown error'}`),
        })
      : (authClient as any).mutation.useMutation({
          mutationFn: ({ id, ...data }: any) => (authClient as any).put(`/api/feedback/${id}`, data),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            toast.success('Feedback updated')
            setIsFormOpen(false)
            setSelectedFeedback(null)
          },
          onError: () => toast.error('Failed to update feedback'),
        })

  const { mutate: deleteFeedback, isPending: isDeleting } =
    (authClient as any).crm?.feedback?.deleteFeedback
      ? (authClient as any).crm.feedback.deleteFeedback.useMutation({
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            toast.success('Feedback deleted')
          },
          onError: (e: any) => toast.error(`Failed to delete feedback: ${e?.message ?? 'Unknown error'}`),
        })
      : (authClient as any).mutation.useMutation({
          mutationFn: (id: string) => (authClient as any).delete(`/api/feedback/${id}`),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY })
            toast.success('Feedback deleted')
          },
          onError: () => toast.error('Failed to delete feedback'),
        })

  // ——— Filtering ———
  const filteredFeedback = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return feedback.filter((item: any) => {
      const matchesSearch =
        !term ||
        item.clientName?.toLowerCase().includes(term) ||
        item.propertyTitle?.toLowerCase().includes(term) ||
        item.comments?.toLowerCase().includes(term)

      const matchesRating = ratingFilter === 'all' || String(item.rating) === ratingFilter
      return matchesSearch && matchesRating
    })
  }, [feedback, ratingFilter, searchTerm])

  // ——— Handlers ———
  const handleEdit = useCallback((fb: any) => {
    setSelectedFeedback(fb)
    setIsFormOpen(true)
  }, [])

  const handleView = useCallback((fb: any) => {
    setSelectedFeedback(fb)
    setIsDetailOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (!id) return
      if (confirm('Delete this feedback?')) {
        // ts-rest: { params: { id }, body: {} }
        if ((authClient as any).crm?.feedback?.deleteFeedback) {
          deleteFeedback({ params: { id }, body: {} } as any)
        } else {
          ;(deleteFeedback as any)(id)
        }
      }
    },
    [deleteFeedback]
  )

  // ——— UI helpers ———
  const ratingColor = (r: number) => (r >= 4 ? 'text-green-600' : r >= 3 ? 'text-yellow-600' : 'text-red-600')
  const ratingBadge = (r: number) => (r >= 4 ? 'bg-green-100 text-green-800' : r >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feedback Management</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                  <div className="h-8 w-1/2 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback Management</h1>
          <p className="text-sm text-muted-foreground">Manage client property feedback and ratings</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedFeedback(null)} disabled={isCreating || isUpdating}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating || isUpdating ? 'Saving…' : 'Add Feedback'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedFeedback ? 'Edit Feedback' : 'Add New Feedback'}</DialogTitle>
            </DialogHeader>
            <FeedbackForm
              feedback={selectedFeedback}
              onClose={() => {
                setIsFormOpen(false)
                setSelectedFeedback(null)
              }}
              // onSubmit implemented inside form; if you prefer external, pass onSubmit and call create/update here
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalFeedback ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.averageRating ?? 0}</div>
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(stats.averageRating ?? 0) ? 'fill-current' : ''}`} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.thisMonth ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Positive Rating</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.positiveRating ?? 0}%</div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <span className="font-bold text-green-600">+</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search feedback by client, property, or comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="grid gap-6">
        {filteredFeedback.map((item: any) => (
          <Card key={item.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{item.propertyTitle}</h3>
                    <Badge className={ratingBadge(item.rating)}>{item.rating} ★</Badge>
                  </div>
                  <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><UserIcon className="h-4 w-4" />{item.clientName}</div>
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(item.viewingDate).toLocaleDateString()}</div>
                  </div>
                  <div className="mb-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < item.rating ? 'fill-current text-yellow-400' : 'text-muted-foreground'} `} />
                    ))}
                    <span className={`ml-2 font-medium ${ratingColor(item.rating)}`}>{item.rating}/5</span>
                  </div>
                  <p className="line-clamp-2 text-foreground/90">{item.comments}</p>
                </div>
                <div className="ml-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)} disabled={isDeleting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No feedback found</h3>
            <p className="text-muted-foreground">
              {searchTerm || ratingFilter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Start by adding your first feedback entry.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feedback Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <FeedbackDetail
              feedback={selectedFeedback}
              onClose={() => {
                setIsDetailOpen(false)
                setSelectedFeedback(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
