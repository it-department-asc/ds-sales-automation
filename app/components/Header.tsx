'use client';

import { useState } from 'react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { Menu, Store } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AuthButtons } from './AuthButtons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
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
                <li><a href="/" className="text-foreground hover:text-primary">Home</a></li>
                <li><a href="/upload/excel-view" className="text-foreground hover:text-primary">Upload</a></li>
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
      )}
      <header className="sticky top-0 z-50 w-full flex justify-between items-center p-2 sm:p-4 bg-background shadow-sm">
        <div className="flex items-center">
          {isAdmin && <Menu onClick={() => setOpen(true)} className="cursor-pointer h-6 w-6 mr-2 text-foreground" />}
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DS</span>
          </div>        
        </div>
        <div className="flex items-center">
          <SignedOut>
            <AuthButtons />
          </SignedOut>
          <SignedIn>
            <div className="flex items-center mr-3">
              {/* <div className="text-right mr-3">
                <div className="text-sm font-medium text-gray-900">
                  {user?.firstName || user?.username || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.primaryEmailAddress?.emailAddress}
                </div>
              </div> */}
              <div className="flex items-center gap-4">
                {/* Store/Branch Info */}
                {currentUser?.storeId && currentUser?.branch && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-accent rounded-lg border">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium text-foreground">{currentUser.storeId}{" "}</span>

                      <span className="text-muted-foreground">{currentUser.branch}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <UserButton />
          </SignedIn>
        </div>
      </header>
    </>
  );
}