'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs';
import { Menu, Store, Home, FileText, BarChart3, LogOut, ChevronDown } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthButtons } from './AuthButtons';
import { useCurrentUser } from '@/hooks/use-firebase';

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {isAdmin && (
        <Drawer direction="left" open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <ul className="space-y-2">
                <li>
                  <a href="/" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors p-3 rounded-lg hover:bg-accent">
                    <Home className="h-5 w-5" />
                    Home
                  </a>
                </li>
                <li>
                  <a href="/upload/excel-view" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors p-3 rounded-lg hover:bg-accent">
                    <FileText className="h-5 w-5" />
                    Upload
                  </a>
                </li>
                <li>
                  <a href="/generate/report" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors p-3 rounded-lg hover:bg-accent">
                    <BarChart3 className="h-5 w-5" />
                    Generate
                  </a>
                </li>
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
      )}
      <header className="sticky top-0 z-50 w-full flex justify-between items-center p-2 sm:p-4 bg-background shadow-sm">
        <div className="flex items-center">
          {isAdmin && <Menu onClick={() => setOpen(true)} className="cursor-pointer h-6 w-6 mr-2 text-foreground" />}
          <Link href="/" className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity">
            <span className="text-white font-bold text-sm">DS</span>
          </Link>
        </div>
        <div className="flex items-center">
          <SignedOut>
            <AuthButtons />
          </SignedOut>
          <SignedIn>
            <div className="flex items-center">
              <div className="flex items-center sm:gap-2">
                {/* Store/Branch Info */}
                {currentUser?.storeId && currentUser?.branch && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg border">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium text-foreground">{currentUser.storeId}{" "}</span>
                      <span className="text-muted-foreground">{currentUser.branch}</span>
                    </div>
                  </div>
                )}

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imageUrl} alt={user?.firstName || 'User'} />
                      <AvatarFallback>
                        {user?.firstName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-foreground">
                        {user?.firstName || user?.username || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.imageUrl} alt={user?.firstName || 'User'} />
                          <AvatarFallback className="text-sm">
                            {user?.firstName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {user?.firstName || user?.username || 'User'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user?.primaryEmailAddress?.emailAddress}
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SignedIn>
        </div>
      </header>
    </>
  );
}