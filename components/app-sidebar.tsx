"use client"

import {
  Trophy,
  Target,
  Plus,
  Home,
  Leaf,
  Users,
  LogOut,
  AlertTriangle,
  Scan,
  Bot,
  ShoppingCart,
  Gift,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { signOut } from "@/lib/auth"
import type { User } from "@supabase/supabase-js"

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    id: "dashboard",
  },
  {
    title: "Track Activities",
    icon: Plus,
    id: "activities",
  },
  {
    title: "Green Scanner",
    icon: Scan,
    id: "scanner",
  },
  {
    title: "AI Coach",
    icon: Bot,
    id: "ai-coach",
  },
  {
    title: "Social Challenges",
    icon: Users,
    id: "challenges",
  },
  {
    title: "Carbon Marketplace",
    icon: ShoppingCart,
    id: "marketplace",
  },
  {
    title: "Leaderboard",
    icon: Trophy,
    id: "leaderboard",
  },
  {
    title: "Rewards",
    icon: Gift,
    id: "rewards",
  },
  {
    title: "Goals",
    icon: Target,
    id: "goals",
  },
]

interface AppSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  user: User
  demoMode?: boolean
}

export function AppSidebar({ activeSection, setActiveSection, user, demoMode = false }: AppSidebarProps) {
  const handleSignOut = async () => {
    if (demoMode) {
      // In demo mode, just reload the page
      window.location.reload()
    } else {
      await signOut()
    }
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <Sidebar className="border-r border-green-200 dark:border-green-800">
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-green-800 dark:text-green-200">EcoTracker</h1>
              <p className="text-sm text-green-600 dark:text-green-400">Carbon Footprint Monitor</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        {demoMode && (
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-800 border-orange-300 mt-2 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Demo Mode
          </Badge>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-700 dark:text-green-300">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    isActive={activeSection === item.id}
                    className="data-[active=true]:bg-green-100 data-[active=true]:text-green-800 dark:data-[active=true]:bg-green-900 dark:data-[active=true]:text-green-200"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/50">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-green-600 text-white text-xs">
              {getUserInitials(user.email || "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 truncate">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-800"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
