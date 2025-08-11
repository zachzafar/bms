"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  User,
  MessageSquare,
} from "lucide-react"
import { CommunicationForm } from "./communication-form"
import { CommunicationDetail } from "./communication-detail"

// Mock data - in real app this would come from your database
const mockCommunications = [
  {
    id: 1,
    clientId: 1,
    clientName: "John Smith",
    clientEmail: "john.smith@email.com",
    userId: 1,
    userName: "Sarah Wilson",
    date: "2024-01-22",
    time: "10:30 AM",
    type: "Phone Call",
    summary:
      "Discussed property viewing schedule for downtown apartment. Client confirmed availability for Saturday morning.",
    duration: 15,
    outcome: "Positive",
    followUpRequired: true,
    followUpDate: "2024-01-25",
    tags: ["Property Viewing", "Follow-up Required"],
  },
  {
    id: 2,
    clientId: 2,
    clientName: "Sarah Johnson",
    clientEmail: "sarah.johnson@email.com",
    userId: 2,
    userName: "Mike Davis",
    date: "2024-01-21",
    time: "2:15 PM",
    type: "Email",
    summary:
      "Sent detailed property brochure and neighborhood information for Family House listing. Included school district details as requested.",
    duration: null,
    outcome: "Neutral",
    followUpRequired: true,
    followUpDate: "2024-01-24",
    tags: ["Property Information", "Documentation"],
  },
  {
    id: 3,
    clientId: 3,
    clientName: "Michael Brown",
    clientEmail: "michael.brown@email.com",
    userId: 1,
    userName: "Sarah Wilson",
    date: "2024-01-20",
    time: "11:00 AM",
    type: "Meeting",
    summary:
      "In-person meeting to finalize lease agreement for Studio Loft. Reviewed terms and conditions, collected security deposit.",
    duration: 45,
    outcome: "Positive",
    followUpRequired: false,
    followUpDate: null,
    tags: ["Contract Signing", "Lease Agreement"],
  },
  {
    id: 4,
    clientId: 4,
    clientName: "Emma Davis",
    clientEmail: "emma.davis@email.com",
    userId: 3,
    userName: "Lisa Chen",
    date: "2024-01-19",
    time: "4:30 PM",
    type: "Phone Call",
    summary:
      "Initial consultation call for Luxury Penthouse inquiry. Discussed client requirements, budget, and timeline.",
    duration: 30,
    outcome: "Positive",
    followUpRequired: true,
    followUpDate: "2024-01-22",
    tags: ["Initial Consultation", "High Value Client"],
  },
  {
    id: 5,
    clientId: 1,
    clientName: "John Smith",
    clientEmail: "john.smith@email.com",
    userId: 1,
    userName: "Sarah Wilson",
    date: "2024-01-18",
    time: "9:15 AM",
    type: "Email",
    summary: "Follow-up email after initial inquiry. Provided additional property photos and virtual tour link.",
    duration: null,
    outcome: "Neutral",
    followUpRequired: false,
    followUpDate: null,
    tags: ["Follow-up", "Property Photos"],
  },
]

const mockUsers = [
  { id: 1, name: "Sarah Wilson" },
  { id: 2, name: "Mike Davis" },
  { id: 3, name: "Lisa Chen" },
]

export function CommunicationManagement() {
  const [communications, setCommunications] = useState(mockCommunications)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [outcomeFilter, setOutcomeFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [selectedCommunication, setSelectedCommunication] = useState<(typeof mockCommunications)[0] | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      comm.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = typeFilter === "all" || comm.type === typeFilter
    const matchesOutcome = outcomeFilter === "all" || comm.outcome === outcomeFilter
    const matchesUser = userFilter === "all" || comm.userId.toString() === userFilter

    return matchesSearch && matchesType && matchesOutcome && matchesUser
  })

  const handleAddCommunication = (commData: any) => {
    const newCommunication = {
      id: Math.max(...communications.map((c) => c.id)) + 1,
      ...commData,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }
    setCommunications([...communications, newCommunication])
    setIsAddDialogOpen(false)
  }

  const handleEditCommunication = (commData: any) => {
    setCommunications(
      communications.map((comm) => (comm.id === selectedCommunication?.id ? { ...comm, ...commData } : comm)),
    )
    setIsEditDialogOpen(false)
    setSelectedCommunication(null)
  }

  const handleDeleteCommunication = (commId: number) => {
    setCommunications(communications.filter((comm) => comm.id !== commId))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Phone Call":
        return <Phone className="h-4 w-4" />
      case "Email":
        return <Mail className="h-4 w-4" />
      case "Meeting":
        return <Calendar className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      "Phone Call": "bg-blue-100 text-blue-800",
      Email: "bg-green-100 text-green-800",
      Meeting: "bg-purple-100 text-purple-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getOutcomeBadge = (outcome: string) => {
    const colors = {
      Positive: "bg-green-100 text-green-800",
      Neutral: "bg-yellow-100 text-yellow-800",
      Negative: "bg-red-100 text-red-800",
    }
    return colors[outcome as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Management</h1>
          <p className="text-sm text-gray-600">Track all client interactions and communication history</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Communication</DialogTitle>
              <DialogDescription>Record a new client interaction or communication.</DialogDescription>
            </DialogHeader>
            <CommunicationForm
              onSubmit={handleAddCommunication}
              onCancel={() => setIsAddDialogOpen(false)}
              users={mockUsers}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Follow-ups Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {communications.filter((c) => c.followUpRequired && c.followUpDate).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search communications by client, user, summary, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
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
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
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
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommunications.map((comm) => (
                <TableRow key={comm.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{comm.clientName}</div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        {getTypeIcon(comm.type)}
                        <span className="ml-1">{comm.type}</span>
                        {comm.duration && <span className="ml-2">({comm.duration}min)</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm line-clamp-2">{comm.summary}</p>
                      {comm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {comm.tags.slice(0, 2).map((tag) => (
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
                      <User className="h-3 w-3 mr-2 text-gray-400" />
                      {comm.userName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{comm.date}</div>
                      <div className="text-gray-500">{comm.time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={getOutcomeBadge(comm.outcome)}>{comm.outcome}</Badge>
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
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedCommunication(comm)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteCommunication(comm.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
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
              users={mockUsers}
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
