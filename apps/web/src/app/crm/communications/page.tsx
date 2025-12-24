'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
  Calendar,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { CommunicationForm } from '@/components/crm/communication-form'
import { CommunicationDetail } from '@/components/crm/communication-detail'

import { authClient } from '@/lib/api/publicClient'
import { COMMUNICATIONS_QUERY_KEY, CONTACTS_QUERY_KEY, USERS_QUERY_KEY } from '@/lib/api/queryKeys'

export default function CommunicationManagement() {
  const queryClient = authClient.useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Email' | 'Phone Call' | 'Meeting'>('all')
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'Positive' | 'Neutral' | 'Negative'>('all')
  const [userFilter, setUserFilter] = useState<'all' | string>('all')

  const [selectedCommunication, setSelectedCommunication] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // ——— Queries (ts-rest style) ———
  // Build server-side query params from filters that aren't 'all'
  const serverQuery = useMemo(
    () => ({
      type: typeFilter === 'all' ? undefined : typeFilter,
      userId: userFilter === 'all' ? undefined : userFilter,
    }),
    [typeFilter, userFilter]
  )

  const { data: commsResp, isLoading: communicationsLoading } =
    authClient.crm.communications.listComms.useQuery({
      queryKey: [...COMMUNICATIONS_QUERY_KEY, serverQuery, searchTerm],
      queryData: { query: serverQuery },
    })

  const { data: clientsData } = authClient.crm.contacts.listContacts.useQuery({
    queryKey: CONTACTS_QUERY_KEY,
  })
  const { data: usersResp } = authClient.users.getUsers.useQuery({
    queryKey: USERS_QUERY_KEY,
  })

  const communications = useMemo(() => (commsResp?.status === 200 ? commsResp.body : []), [commsResp])
  const contacts = useMemo(() => (clientsData?.status === 200 ? clientsData.body : []), [clientsData])
  const users = useMemo(() => (usersResp?.status === 200 ? usersResp.body : []), [usersResp])

  // ——— Mutations (ts-rest style) ———
  const { mutate: createComm, isPending: isCreating } = authClient.crm.communications.createComm.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNICATIONS_QUERY_KEY })
      setIsAddDialogOpen(false)
      toast.success('Communication logged successfully')
    },
    onError: (e) => toast.error(`Failed to log communication: ${e instanceof Error ? e.message : 'Unknown error'}`),
  })

  const { mutate: updateComm, isPending: isUpdating } = authClient.crm.communications.updateComm.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNICATIONS_QUERY_KEY })
      setIsEditDialogOpen(false)
      setSelectedCommunication(null)
      toast.success('Communication updated successfully')
    },
    onError: (e) => toast.error(`Failed to update communication: ${e instanceof Error ? e.message : 'Unknown error'}`),
  })

  const { mutate: deleteComm, isPending: isDeleting } = authClient.crm.communications.deleteComm.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNICATIONS_QUERY_KEY })
      toast.success('Communication deleted successfully')
    },
    onError: (e) => toast.error(`Failed to delete communication: ${e instanceof Error ? e.message : 'Unknown error'}`),
  })

  // ——— Client-side filter (search + outcome) ———
  const filteredCommunications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return communications.filter((comm: any) => {
      const clientName = `${comm?.contact?.firstName ?? ''} ${comm?.contact?.lastName ?? ''}`.trim().toLowerCase()
      const userName = `${comm?.user?.firstName ?? ''} ${comm?.user?.lastName ?? ''}`.trim().toLowerCase()
      const matchesSearch = !term
        ? true
        : clientName.includes(term) ||
          userName.includes(term) ||
          comm.summary?.toLowerCase().includes(term)

      const matchesOutcome = true // outcome not in schema; keep filter neutral
      return matchesSearch && matchesOutcome
    })
  }, [communications, outcomeFilter, searchTerm])

  // ——— Handlers ———
  const handleAddCommunication = useCallback((commData: any) => createComm({ body: commData }), [createComm])

  const handleEditCommunication = useCallback(
    (commData: any) => {
      if (!selectedCommunication?.id) return
      updateComm({ params: { id: String(selectedCommunication.id) }, body: commData })
    },
    [selectedCommunication?.id, updateComm]
  )

  const handleDeleteCommunication = useCallback((commId: number) => deleteComm({ params: { id: String(commId) }, body: {} }), [deleteComm])

  // ——— UI helpers ———
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Phone Call':
        return <Phone className="h-4 w-4" />
      case 'Email':
        return <Mail className="h-4 w-4" />
      case 'Meeting':
        return <Calendar className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const typeBadge = (type: string) => {
    const m: Record<string, string> = {
      'Phone Call': 'bg-blue-100 text-blue-800',
      Email: 'bg-green-100 text-green-800',
      Meeting: 'bg-purple-100 text-purple-800',
    }
    return m[type] ?? 'bg-gray-100 text-gray-800'
  }

  const outcomeBadge = (outcome: string) => {
    const m: Record<string, string> = {
      Positive: 'bg-green-100 text-green-800',
      Neutral: 'bg-yellow-100 text-yellow-800',
      Negative: 'bg-red-100 text-red-800',
    }
    return m[outcome] ?? 'bg-gray-100 text-gray-800'
  }

  if (communicationsLoading) return <div>Loading communications…</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication Management</h1>
          <p className="text-sm text-muted-foreground">Track all client interactions and communication history</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? 'Logging…' : 'Log Communication'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Communication</DialogTitle>
              <DialogDescription>Record a new client interaction or communication.</DialogDescription>
            </DialogHeader>
            <CommunicationForm onSubmit={handleAddCommunication} onCancel={() => setIsAddDialogOpen(false)} users={users} contacts={contacts} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follow-ups Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communications.filter((c: any) => c.followUpRequired && c.followUpDate).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search communications by client, user, summary, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={outcomeFilter} onValueChange={(v) => setOutcomeFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Neutral">Neutral</SelectItem>
                  <SelectItem value="Negative">Negative</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={(v) => setUserFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client & Type</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommunications.map((comm: any) => (
                <TableRow key={comm.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {comm?.contact ? `${comm.contact.firstName} ${comm.contact.lastName}` : 'Unknown Contact'}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-muted-foreground">
                        {getTypeIcon(comm.type)}
                        <span className="ml-1">{comm.type}</span>
                        {comm.duration && <span className="ml-2">({comm.duration}min)</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="line-clamp-2 text-sm">{comm.summary}</p>
                      {Array.isArray(comm.tags) && comm.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {comm.tags.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {comm.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{comm.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <UserIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                      {comm?.user ? `${comm.user.firstName} ${comm.user.lastName}` : 'Unknown User'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(comm.date).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">{new Date(comm.date).toLocaleTimeString()}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={outcomeBadge(comm.outcome ?? 'Neutral')}>{comm.outcome ?? 'Neutral'}</Badge>
                      {comm.followUpRequired && (
                        <div className="text-xs text-orange-600">Follow-up: {comm.followUpDate}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCommunication(comm)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCommunication(comm)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteCommunication(comm.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Communication</DialogTitle>
            <DialogDescription>Update the communication details below.</DialogDescription>
          </DialogHeader>
          {selectedCommunication && (
            <CommunicationForm
              initialData={selectedCommunication}
              onSubmit={handleEditCommunication}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedCommunication(null)
              }}
              users={users}
              contacts={contacts}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Communication Details</DialogTitle>
          </DialogHeader>
          {selectedCommunication && (
            <CommunicationDetail
              communication={selectedCommunication}
              onClose={() => {
                setIsDetailDialogOpen(false)
                setSelectedCommunication(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

