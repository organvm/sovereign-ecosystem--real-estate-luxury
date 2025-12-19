import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Plus, X, Users, Mail, Crown, UserPlus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Team, TeamMember } from '../lib/team-performance-service'

const TEAM_COLORS = [
  { name: 'Rose Blush', value: 'oklch(0.65 0.15 340)', light: 'rgba(224, 136, 170, 0.15)' },
  { name: 'Lavender Mist', value: 'oklch(0.85 0.10 300)', light: 'rgba(186, 148, 218, 0.15)' },
  { name: 'Champagne', value: 'oklch(0.90 0.08 70)', light: 'rgba(247, 231, 206, 0.15)' },
  { name: 'Rose Gold', value: 'oklch(0.75 0.12 50)', light: 'rgba(219, 172, 152, 0.15)' },
  { name: 'Moonlit Violet', value: 'oklch(0.55 0.18 290)', light: 'rgba(162, 120, 200, 0.15)' },
  { name: 'Moonlit Lavender', value: 'oklch(0.70 0.15 285)', light: 'rgba(180, 155, 220, 0.15)' }
]

interface TeamCreationProps {
  onTeamCreated: (team: Team) => void
  onClose: () => void
}

export function TeamCreation({ onTeamCreated, onClose }: TeamCreationProps) {
  const [teams, setTeams] = useKV<Team[]>('teams', [])
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[0])
  const [members, setMembers] = useState<Omit<TeamMember, 'joinedAt'>[]>([])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'lead' | 'member'>('member')

  const addMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast.error('Please provide member name and email')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) {
      toast.error('Please provide a valid email address')
      return
    }

    const member: Omit<TeamMember, 'joinedAt'> = {
      id: `member-${Date.now()}-${Math.random()}`,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole
    }

    setMembers(prev => [...prev, member])
    setNewMemberName('')
    setNewMemberEmail('')
    setNewMemberRole('member')
    toast.success(`Added ${newMemberName} to team`)
  }

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const createTeam = () => {
    if (!teamName.trim()) {
      toast.error('Please provide a team name')
      return
    }

    if (members.length === 0) {
      toast.error('Please add at least one team member')
      return
    }

    const team: Team = {
      id: `team-${Date.now()}`,
      name: teamName,
      color: selectedColor.value,
      description: teamDescription,
      members: members.map(m => ({
        ...m,
        joinedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString()
    }

    setTeams(prev => [...(prev || []), team])
    toast.success(`${teamName} created with ${members.length} members!`)
    onTeamCreated(team)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto"
    >
      <Card className="border-2 border-rose-blush/30 dark:border-moonlit-lavender/30 shadow-xl bg-card/90 backdrop-blur-xl">
        <CardHeader className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-blush/5 via-transparent to-lavender-mist/5 dark:from-moonlit-violet/10 dark:via-transparent dark:to-moonlit-lavender/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle className="text-4xl font-serif flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-rose-blush dark:text-moonlit-lavender" />
                Create Your First Team
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Build high-performing teams and track their success
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-rose-blush/10 dark:hover:bg-moonlit-lavender/10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name" className="text-lg font-semibold">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Sales Champions, Development Squad"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="text-lg h-14 border-2 focus:border-rose-blush dark:focus:border-moonlit-lavender"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description" className="text-lg font-semibold">Description (Optional)</Label>
              <Input
                id="team-description"
                placeholder="What does this team do?"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Team Color</Label>
              <div className="grid grid-cols-3 gap-3">
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select ${color.name} color`}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedColor.name === color.name
                        ? 'border-rose-blush dark:border-moonlit-lavender shadow-lg scale-105'
                        : 'border-border hover:border-rose-blush/50 dark:hover:border-moonlit-lavender/50'
                    }`}
                    style={{ backgroundColor: color.light }}
                  >
                    <div
                      className="w-full h-12 rounded-xl shadow-md"
                      style={{ backgroundColor: color.value }}
                    />
                    <p className="text-sm font-medium mt-2 text-center">{color.name}</p>
                    {selectedColor.name === color.name && (
                      <motion.div
                        layoutId="color-selection"
                        className="absolute inset-0 rounded-2xl border-3 border-rose-blush dark:border-moonlit-lavender"
                        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t-2 border-border/50 pt-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-rose-blush dark:text-moonlit-lavender" />
              <h3 className="text-2xl font-serif font-semibold">Team Members</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member-name">Member Name</Label>
                <Input
                  id="member-name"
                  placeholder="John Doe"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMember()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-email">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="john@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMember()}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm">Role:</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={newMemberRole === 'member' ? 'default' : 'outline'}
                  onClick={() => setNewMemberRole('member')}
                  className={newMemberRole === 'member' ? 'bg-rose-blush hover:bg-rose-blush/90 dark:bg-moonlit-lavender dark:hover:bg-moonlit-lavender/90' : ''}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Member
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={newMemberRole === 'lead' ? 'default' : 'outline'}
                  onClick={() => setNewMemberRole('lead')}
                  className={newMemberRole === 'lead' ? 'bg-rose-blush hover:bg-rose-blush/90 dark:bg-moonlit-lavender dark:hover:bg-moonlit-lavender/90' : ''}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Lead
                </Button>
              </div>
              <Button
                onClick={addMember}
                size="sm"
                className="ml-auto bg-gradient-to-r from-rose-blush to-lavender-mist hover:shadow-lg dark:from-moonlit-violet dark:to-moonlit-lavender"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {members.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 max-h-64 overflow-y-auto p-4 bg-muted/30 rounded-xl"
                >
                  {members.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-rose-blush/50 dark:hover:border-moonlit-lavender/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-blush to-lavender-mist dark:from-moonlit-violet dark:to-moonlit-lavender flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </p>
                        </div>
                        <Badge
                          variant={member.role === 'lead' ? 'default' : 'secondary'}
                          className={member.role === 'lead' ? 'bg-rose-gold text-white' : ''}
                        >
                          {member.role === 'lead' && <Crown className="w-3 h-3 mr-1" />}
                          {member.role === 'lead' ? 'Team Lead' : 'Member'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(member.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${member.name}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {members.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-xl">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No members added yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first team member above</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6 border-t-2 border-border/50">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={createTeam}
              disabled={!teamName.trim() || members.length === 0}
              className="flex-1 bg-gradient-to-r from-rose-blush to-lavender-mist hover:shadow-xl dark:from-moonlit-violet dark:to-moonlit-lavender text-white font-semibold text-lg h-14"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Team
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
